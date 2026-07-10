import asyncio
import httpx
import base64
import json

async def test_vision():
    # Attempting the openai compatible endpoint
    url = "https://text.pollinations.ai/openai/chat/completions"
    
    # create a dummy 1x1 black image in b64
    b64_img = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    
    payload = {
        "model": "chatgpt-4o",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What color is this image? Reply in JSON format like {\"color\": \"<color>\"}"},
                    {"type": "image_url", "image_url": {"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/1200px-Red_Apple.jpg"}}
                ]
            }
        ],
        "response_format": {"type": "json_object"}
    }
    
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "MediCastSurgical/1.0"
    }
    
    print(f"Sending to {url}...")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(url, json=payload, headers=headers)
        print(f"Status: {res.status_code}")
        try:
            print(res.json())
        except Exception as e:
            print("Error parsing json:", e)
            print(res.text)

if __name__ == "__main__":
    asyncio.run(test_vision())
