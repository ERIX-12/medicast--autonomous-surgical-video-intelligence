# =============================================================================
# MediCast Frontend — Multi-Stage Docker Build
#
# Stage 1: Node build environment
# Stage 2: Nginx production serving
# =============================================================================

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (leveraging Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build static production bundle
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Security: drop root, run as nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

USER nginx

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

ENTRYPOINT ["nginx", "-g", "daemon off;"]