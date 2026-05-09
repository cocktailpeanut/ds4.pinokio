const path = require("path")

const q2 = "DeepSeek-V4-Flash-IQ2XXS-w2Q2K-AProjQ8-SExpQ8-OutQ8-chat-v2.gguf"
const q4 = "DeepSeek-V4-Flash-Q4KExperts-F16HC-F16Compressor-F16Indexer-Q8Attn-Q8Shared-Q8Out-chat-v2.gguf"
const mtp = "DeepSeek-V4-Flash-MTP-Q4K-Q8_0-F32.gguf"

const models = [
  {
    text: "q2 main model (about 81 GB, 128 GB RAM)",
    file: q2
  },
  {
    text: "q4 main model (about 153 GB, 256 GB RAM)",
    file: q4
  },
  {
    text: "MTP optional draft model (about 3.5 GB)",
    file: mtp
  }
]

module.exports = {
  version: "7.0",
  title: "ds4.c",
  description: "Metal-only DeepSeek V4 Flash inference engine with OpenAI and Anthropic-compatible local HTTP APIs.",
  icon: "icon.png",
  menu: async (kernel, info) => {
    const installing = info.running("install.js")
    const downloading = info.running("download.js")
    const running = info.running("start.js")
    const updating = info.running("update.js")
    const resetting = info.running("reset.js")
    const clearing = info.running("clear_cache.js")
    const installed = info.exists("app/ds4-server")
    const q2Ready = info.exists(`app/gguf/${q2}`)
    const q4Ready = info.exists(`app/gguf/${q4}`)
    const modelReady = q2Ready || q4Ready
    const mtpReady = info.exists(`app/gguf/${mtp}`)

    const downloadMenu = {
      icon: "fa-solid fa-download",
      text: "Download Models",
      menu: models.map((item) => ({
        icon: "fa-solid fa-circle-down",
        text: item.text,
        href: "download.js",
        params: {
          file: item.file
        }
      }))
    }

    if (installing) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Installing",
        href: "install.js"
      }]
    }

    if (downloading) {
      return [{
        default: true,
        icon: "fa-solid fa-download",
        text: "Downloading",
        href: "download.js"
      }]
    }

    if (updating) {
      return [{
        default: true,
        icon: "fa-solid fa-arrows-rotate",
        text: "Updating",
        href: "update.js"
      }]
    }

    if (resetting) {
      return [{
        default: true,
        icon: "fa-solid fa-broom",
        text: "Resetting",
        href: "reset.js"
      }]
    }

    if (clearing) {
      return [{
        default: true,
        icon: "fa-solid fa-eraser",
        text: "Clearing Cache",
        href: "clear_cache.js"
      }]
    }

    if (!installed) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Install",
        href: "install.js"
      }, {
        icon: "fa-solid fa-arrows-rotate",
        text: "Update",
        href: "update.js"
      }]
    }

    if (running) {
      const local = kernel.memory.local[path.resolve(__dirname, "start.js")]
      if (local && local.url) {
        return [{
          default: true,
          icon: "fa-solid fa-server",
          text: "Models API",
          href: `${local.url}/v1/models`
        }, {
          icon: "fa-solid fa-terminal",
          text: "Terminal",
          href: "start.js"
        }, {
          icon: "fa-solid fa-eraser",
          text: "Clear KV Cache",
          href: "clear_cache.js"
        }]
      }
      return [{
        default: true,
        icon: "fa-solid fa-terminal",
        text: "Terminal",
        href: "start.js"
      }]
    }

    const startItems = []

    if (q2Ready) {
      startItems.push({
        default: true,
        icon: "fa-solid fa-power-off",
        text: "Start q2 Server",
        href: "start.js",
        params: {
          model: `gguf/${q2}`,
          ctx: 100000,
          kv: 8192
        }
      })
    }

    if (q4Ready) {
      startItems.push({
        default: !q2Ready,
        icon: "fa-solid fa-power-off",
        text: "Start q4 Server",
        href: "start.js",
        params: {
          model: `gguf/${q4}`,
          ctx: 100000,
          kv: 8192
        }
      })
    }

    if (modelReady) {
      startItems.push({
        icon: "fa-solid fa-gauge-high",
        text: "Start 32k Context",
        href: "start.js",
        params: {
          model: q2Ready ? `gguf/${q2}` : `gguf/${q4}`,
          ctx: 32768,
          kv: 4096
        }
      })
    }

    if (q2Ready && mtpReady) {
      startItems.push({
        icon: "fa-solid fa-forward-fast",
        text: "Start q2 With MTP",
        href: "start.js",
        params: {
          model: `gguf/${q2}`,
          ctx: 100000,
          kv: 8192,
          mtpArgs: `--mtp gguf/${mtp} --mtp-draft 2`
        }
      })
    }

    if (q4Ready && mtpReady) {
      startItems.push({
        icon: "fa-solid fa-forward-fast",
        text: "Start q4 With MTP",
        href: "start.js",
        params: {
          model: `gguf/${q4}`,
          ctx: 100000,
          kv: 8192,
          mtpArgs: `--mtp gguf/${mtp} --mtp-draft 2`
        }
      })
    }

    if (!modelReady) {
      downloadMenu.default = true
    }

    return [
      ...startItems,
      downloadMenu,
      {
        icon: "fa-solid fa-arrows-rotate",
        text: "Update",
        href: "update.js"
      },
      {
        icon: "fa-solid fa-plug",
        text: "Rebuild",
        href: "install.js"
      },
      {
        icon: "fa-solid fa-eraser",
        text: "Clear KV Cache",
        href: "clear_cache.js"
      },
      {
        icon: "fa-solid fa-broom",
        text: "Factory Reset",
        href: "reset.js"
      }
    ]
  }
}
