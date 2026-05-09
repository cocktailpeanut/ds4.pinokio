# ds4-webui

`ds4-webui` is a Pinokio launcher and standalone browser UI for
[`antirez/ds4`](https://github.com/antirez/ds4), a narrow Metal-only inference
engine for DeepSeek V4 Flash. It runs `ds4-server`, then serves a small local
Node Web UI/proxy so the browser can chat against the OpenAI-compatible API.

The Pinokio launcher is the easiest path, but the repo can also be installed
and run manually without Pinokio.

## Requirements

- Apple Silicon macOS with Metal support.
- Enough unified memory and disk for the selected model:
  - q2: about 81 GB on disk, intended for 128 GB RAM machines.
  - q4: about 153 GB on disk, intended for 256 GB RAM or larger machines.
- Xcode Command Line Tools or equivalent `cc` and `make` support.
- Node.js 18 or newer when running the Web UI manually.
- Git, curl, and enough free disk for the upstream source plus model files.

## Quick Start With Pinokio

1-click install & launch availaboe on https://pinokio.co

1. Click **Install** to clone `antirez/ds4` into `app/` and build `ds4` plus
   `ds4-server`.
2. Open **Download Models** and choose either **q2** or **q4**. The launcher
   uses Pinokio's Hugging Face download API and stores files under `app/gguf/`.
3. Click a **Start** action. The launcher binds ds4 to `127.0.0.1` on an
   available port, enables disk KV cache under `cache/kv`, then starts the
   local Web UI/proxy.
4. When the server is ready, open **Open Chat** for the built-in Web UI or
   **Models API** to verify `/v1/models`.

The **MTP optional draft model** download adds the speculative decoding GGUF.
Once downloaded, MTP start actions become available for the main models you
have locally.

## Manual Install And Run

These steps do not use Pinokio. Run them from the root of this repo.

### 1. Clone And Build ds4

```sh
git clone https://github.com/antirez/ds4 app
cd app
make
```

If `app/` already exists, update and rebuild instead:

```sh
git -C app pull --ff-only
make -C app
```

### 2. Download A Model

The upstream downloader is the simplest manual option:

```sh
cd app
./download_model.sh q2   # 128 GB RAM machines
# ./download_model.sh q4 # 256 GB RAM or larger machines
# ./download_model.sh mtp # optional speculative decoding draft model
cd ..
```

That script downloads from `antirez/deepseek-v4-gguf` into `app/gguf/` and
updates `app/ds4flash.gguf` to point at the selected main model.

You can also download directly with Hugging Face tooling:

```sh
mkdir -p app/gguf
huggingface-cli download antirez/deepseek-v4-gguf \
  DeepSeek-V4-Flash-IQ2XXS-w2Q2K-AProjQ8-SExpQ8-OutQ8-chat-v2.gguf \
  --local-dir app/gguf
```

For q4, replace the filename with:

```text
DeepSeek-V4-Flash-Q4KExperts-F16HC-F16Compressor-F16Indexer-Q8Attn-Q8Shared-Q8Out-chat-v2.gguf
```

For optional MTP, download:

```text
DeepSeek-V4-Flash-MTP-Q4K-Q8_0-F32.gguf
```

### 3. Start The ds4 API Server

Terminal 1:

```sh
mkdir -p cache/kv
cd app
./ds4-server \
  --model ds4flash.gguf \
  --host 127.0.0.1 \
  --port 8000 \
  --ctx 100000 \
  --kv-disk-dir ../cache/kv \
  --kv-disk-space-mb 8192
```

If you downloaded a GGUF directly and did not create `ds4flash.gguf`, pass the
model path explicitly:

```sh
./ds4-server --model gguf/DeepSeek-V4-Flash-IQ2XXS-w2Q2K-AProjQ8-SExpQ8-OutQ8-chat-v2.gguf --host 127.0.0.1 --port 8000
```

For MTP, add:

```sh
--mtp gguf/DeepSeek-V4-Flash-MTP-Q4K-Q8_0-F32.gguf --mtp-draft 2
```

### 4. Start The Web UI

Terminal 2:

```sh
node webui/server.js \
  --host 127.0.0.1 \
  --port 4173 \
  --target http://127.0.0.1:8000
```

Open:

```text
http://127.0.0.1:4173
```

The Web UI server has no npm dependencies. It serves the static UI and proxies
`/v1/*` requests to the ds4 API server so browser requests stay on one local
origin.

If you edit files under `webui/` while the manual server is running, restart
the Node Web UI server so it loads the updated code.

## Web UI

The built-in Web UI is a lightweight ds4-specific chat surface inspired by the
llama.cpp server UI layout. It provides:

- A left conversation rail with browser-local chat history.
- Streaming chat against `POST /v1/chat/completions`.
- A collapsible reasoning section for streamed reasoning output.
- A compact settings drawer for system prompt, max tokens, temperature, top-p,
  top-k, and min-p.
- A local Node proxy so the browser calls the same Web UI origin while the
  proxy forwards to the ds4 API server.

The UI stores conversations in the browser's `localStorage`. Clearing browser
site data removes the chat history but does not affect downloaded GGUF files or
the ds4 KV cache.

## Maintenance

With Pinokio:

- **Update** pulls the launcher if it has a configured Git remote, pulls the
  upstream `app/` repo, then rebuilds.
- **Rebuild** reruns `make` without deleting downloaded models.
- **Clear KV Cache** removes only the local disk KV cache in `cache/`.
- **Factory Reset** removes `app/` and `cache/`, including downloaded GGUF
  files.

Manual equivalents:

```sh
git pull --ff-only
git -C app pull --ff-only
make -C app clean
make -C app
```

Clear only the local KV cache:

```sh
rm -rf cache/kv
```

## API

The ds4 API server supports:

- `GET /v1/models`
- `GET /v1/models/deepseek-v4-flash`
- `POST /v1/chat/completions`
- `POST /v1/completions`
- `POST /v1/messages`

When using Pinokio, replace `PORT` with the port shown by the running tab. When
using the manual instructions above, use `8000` for direct ds4 API access or
`4173` through the Web UI proxy.

### Curl

```sh
curl http://127.0.0.1:8000/v1/chat/completions \
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
const res = await fetch("http://127.0.0.1:8000/v1/chat/completions", {
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
    "http://127.0.0.1:8000/v1/chat/completions",
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

## Notes

- `ds4.c` is not a general GGUF runner. It expects the specific DeepSeek V4
  Flash GGUF files published for this engine.
- `ds4-webui` does not vendor llama.cpp's Web UI. It provides a smaller local
  Web UI/proxy built around ds4's OpenAI-compatible endpoints.
- The inference engine is Metal-only. The Web UI can run anywhere Node runs,
  but it needs a reachable ds4 API server to be useful.
