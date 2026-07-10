import urllib.request
import json
import urllib.error

url = "https://api.fireworks.ai/inference/v1/chat/completions"
headers = {
    "Authorization": "Bearer fw_QdWMoKVjY8xeicpioEtMSx",
    "Content-Type": "application/json"
}
payload = {
    "model": "accounts/fireworks/models/llama-v3p1-70b-instruct",
    "messages": [{"role": "user", "content": "hello"}],
}
data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"Error: {e.code} - {e.read().decode('utf-8')}")
