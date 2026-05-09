# ds4.c Pinokio Launcher

This launcher installs and runs [`antirez/ds4`](https://github.com/antirez/ds4), a narrow Metal-only inference engine for DeepSeek V4 Flash. It exposes a local HTTP server compatible with OpenAI chat/completions and Anthropic messages APIs.

## Requirements

- Apple Silicon macOS with Metal support.
- Enough unified memory for the selected model:
  - q2: about 81 GB on disk, intended for 128 GB RAM machines.
  - q4: about 153 GB on disk, intended for 256 GB RAM or larger machines.
- Xcode Command Line Tools or equivalent `cc` and `make` support.

## Use

1. Click **Install** to clone `antirez/ds4` into `app/` and build `ds4` plus `ds4-server`.
2. Open **Download Models** and choose either **q2** or **q4**. The launcher uses Pinokio's Hugging Face download API and stores files under `app/gguf/`.
3. Click **Start Server**. The launcher binds to `127.0.0.1` on an available port and enables disk KV cache under `cache/kv`.
4. When the server is ready, open **Models API** to verify `/v1/models`.

The **MTP optional draft model** download adds the speculative decoding GGUF. Once downloaded, MTP start actions become available for the main models you have locally.

## Maintenance

- **Update** pulls the launcher if it has a configured Git remote, pulls the upstream `app/` repo, then rebuilds.
- **Rebuild** reruns `make` without deleting downloaded models.
- **Clear KV Cache** removes only the local disk KV cache in `cache/`.
- **Factory Reset** removes `app/` and `cache/`, including downloaded GGUF files.

## API

The server supports:

- `GET /v1/models`
- `GET /v1/models/deepseek-v4-flash`
- `POST /v1/chat/completions`
- `POST /v1/completions`
- `POST /v1/messages`

Replace `PORT` below with the port shown by the running Pinokio tab.

### Curl

```sh
curl http://127.0.0.1:PORT/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [
      { "role": "user", "content": "List three Redis design principles." }
    ],
    "stream": true
  }'
```

### JavaScript

```javascript
const res = await fetch("http://127.0.0.1:PORT/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "deepseek-v4-flash",
    messages: [{ role: "user", content: "Explain Redis streams briefly." }],
    max_tokens: 256
  })
})

console.log(await res.json())
```

### Python

```python
import requests

res = requests.post(
    "http://127.0.0.1:PORT/v1/chat/completions",
    json={
        "model": "deepseek-v4-flash",
        "messages": [
            {"role": "user", "content": "Explain Redis streams briefly."}
        ],
        "max_tokens": 256,
    },
    timeout=600,
)

print(res.json())
```
