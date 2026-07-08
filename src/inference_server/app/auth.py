"""Authentication module for the MediCast inference server.

Provides:
- POST /api/auth/signup  — Register a new user
- POST /api/auth/login   — Authenticate and return JWT
- GET  /api/auth/me      — Get current user info from token

Uses PyJWT for token generation and SHA-256 with salt for password hashing.
"""

from __future__ import annotations

import hashlib
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel

from . import database as db

# ─── JWT Configuration ────────────────────────────────────────────────────────

JWT_SECRET = os.environ.get("JWT_SECRET", "medicast-dev-jwt-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72

router = APIRouter(prefix="/api/auth")


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

class UserInfo(BaseModel):
    id: str
    email: str


# ─── Password Hashing ─────────────────────────────────────────────────────────

def _hash_password(password: str) -> str:
    """Hash a password with a random salt (SHA-256)."""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
    return f"{salt}:{pwd_hash}"


def _verify_password(password: str, stored: str) -> bool:
    """Verify a password against a stored salt:hash string."""
    try:
        salt, pwd_hash = stored.split(":", 1)
        return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest() == pwd_hash
    except (ValueError, AttributeError):
        return False


# ─── JWT Helpers ──────────────────────────────────────────────────────────────

def _create_token(user_id: str, email: str) -> str:
    """Create a signed JWT token for the given user."""
    expires = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": expires,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    """Decode and validate a JWT token. Returns the payload or raises."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─── Auth Dependency ──────────────────────────────────────────────────────────

async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> dict:
    """FastAPI dependency: extract and validate the current user from the
    Authorization header (Bearer token). Raises 401 if missing or invalid.

    Usage in routes:
        async def my_route(user: dict = Depends(get_current_user)):
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    payload = _decode_token(token)
    return {"id": payload["sub"], "email": payload["email"]}


async def get_optional_user(
    authorization: Optional[str] = Header(None),
) -> Optional[dict]:
    """FastAPI dependency: extract user if a valid token is provided,
    but return None if no token is present (never raises on missing auth).

    Usage in routes:
        async def my_route(user: Optional[dict] = Depends(get_optional_user)):
    """
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    try:
        payload = _decode_token(token)
        return {"id": payload["sub"], "email": payload["email"]}
    except HTTPException:
        return None


# ─── Auth Endpoints ───────────────────────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """Register a new user account.

    Returns a JWT token and user info on success.
    """
    email = request.email.strip().lower()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")

    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Check if user already exists
    existing = await db.get_user_by_email(email)
    if existing is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    # Create user
    user_id = str(uuid.uuid4())
    password_hash = _hash_password(request.password)

    created = await db.create_user(user_id, email, password_hash)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create user")

    # Generate token
    token = _create_token(user_id, email)

    return AuthResponse(
        token=token,
        user={"id": user_id, "email": email},
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Authenticate with email and password.

    Returns a JWT token and user info on success.
    """
    email = request.email.strip().lower()

    user = await db.get_user_by_email(email)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not _verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Generate token
    token = _create_token(user["id"], user["email"])

    return AuthResponse(
        token=token,
        user={"id": user["id"], "email": user["email"]},
    )


@router.get("/me", response_model=UserInfo)
async def get_me(user: dict = Depends(get_current_user)):
    """Get the current authenticated user's info.

    Requires a valid Bearer token in the Authorization header.
    """
    return UserInfo(id=user["id"], email=user["email"])