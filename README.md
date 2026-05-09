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
3. Click **Start Server**. The launcher binds ds4 to `127.0.0.1` on an available port, enables disk KV cache under `cache/kv`, then starts a small local chat UI with an API proxy.
4. When the server is ready, open **Open Chat** for the built-in Web UI or **Models API** to verify `/v1/models`.

The **MTP optional draft model** download adds the speculative decoding GGUF. Once downloaded, MTP start actions become available for the main models you have locally.

## Web UI

The built-in Web UI is a lightweight ds4-specific chat surface inspired by the llama.cpp server UI layout. It provides:

- A left conversation rail with browser-local chat history.
- Streaming chat against `POST /v1/chat/completions`.
- A compact settings drawer for system prompt, max tokens, temperature, top-p, top-k, and min-p.
- A local Node proxy so the browser calls the same Web UI origin while the proxy forwards to the ds4 API server.

The UI stores conversations in the browser's `localStorage`. Clearing browser site data removes the chat history but does not affect downloaded GGUF files or the ds4 KV cache.

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
