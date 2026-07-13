import asyncio
import httpx
import base64
import json

async def test_fireworks():
    url = "https://api.fireworks.ai/inference/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer fw_QdWMoKVjY8xeicpioEtMSx",
        "Content-Type": "application/json"
    }
    # create a dummy 1x1 black image in b64
    b64_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    payload = {
        "model": "accounts/fireworks/models/gemma2-9b-it",
        "messages": [
            {
                "role": "user",
                "content": "Hello!"
            }
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1
    }
    
    print(f"Sending to {url}...")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(url, headers=headers, json=payload)
        print(f"Status: {res.status_code}")
        try:
            print(res.json())
        except Exception as e:
            print("Error parsing json:", e)
            print(res.text)

if __name__ == "__main__":
    asyncio.run(test_fireworks())
