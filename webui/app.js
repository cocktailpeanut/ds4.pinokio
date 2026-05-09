const MODEL = "deepseek-v4-flash"
const storeKey = "ds4.webui.state.v1"

const el = {
  connection: document.getElementById("connection"),
  chatList: document.getElementById("chatList"),
  transcript: document.getElementById("transcript"),
  composer: document.getElementById("composer"),
  prompt: document.getElementById("prompt"),
  sendButton: document.getElementById("sendButton"),
  stopButton: document.getElementById("stopButton"),
  newChat: document.getElementById("newChat"),
  settingsPanel: document.getElementById("settingsPanel"),
  settingsToggle: document.getElementById("settingsToggle"),
  closeSettings: document.getElementById("closeSettings"),
  railToggle: document.getElementById("railToggle"),
  sidebar: document.getElementById("sidebar"),
  systemPrompt: document.getElementById("systemPrompt"),
  maxTokens: document.getElementById("maxTokens"),
  temperature: document.getElementById("temperature"),
  temperatureOut: document.getElementById("temperatureOut"),
  topP: document.getElementById("topP"),
  topPOut: document.getElementById("topPOut"),
  topK: document.getElementById("topK"),
  minP: document.getElementById("minP"),
  minPOut: document.getElementById("minPOut")
}

const defaults = {
  settings: {
    system: "",
    max_tokens: 2048,
    temperature: 0.6,
    top_p: 0.95,
    top_k: 40,
    min_p: 0
  },
  conversations: [],
  activeId: null
}

let state = loadState()
let controller = null
const openReasoning = new Set()

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storeKey))
    return {
      ...defaults,
      ...stored,
      settings: { ...defaults.settings, ...(stored && stored.settings) }
    }
  } catch {
    return structuredClone(defaults)
  }
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state))
}

function activeConversation() {
  let conversation = state.conversations.find((item) => item.id === state.activeId)
  if (!conversation) {
    conversation = {
      id: uid(),
      title: "New chat",
      createdAt: Date.now(),
      messages: []
    }
    state.conversations.unshift(conversation)
    state.activeId = conversation.id
    saveState()
  }
  return conversation
}

function newConversation() {
  const conversation = {
    id: uid(),
    title: "New chat",
    createdAt: Date.now(),
    messages: []
  }
  state.conversations.unshift(conversation)
  state.activeId = conversation.id
  saveState()
  render()
  el.prompt.focus()
}

function deleteConversation(id) {
  state.conversations = state.conversations.filter((item) => item.id !== id)
  if (state.activeId === id) {
    state.activeId = state.conversations[0] ? state.conversations[0].id : null
  }
  saveState()
  render()
}

function titleFrom(text) {
  const trimmed = text.replace(/\s+/g, " ").trim()
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}...` : trimmed || "New chat"
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function renderMarkdown(value) {
  const parts = value.split(/```/g)
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      const lines = part.replace(/^\w+\n/, "").replace(/\n$/, "")
      return `<pre><code>${escapeHtml(lines)}</code></pre>`
    }
    return escapeHtml(part)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join("")
  }).join("")
}

function renderChatList() {
  el.chatList.innerHTML = ""
  for (const conversation of state.conversations) {
    const item = document.createElement("div")
    item.className = `chat-item${conversation.id === state.activeId ? " active" : ""}`

    const button = document.createElement("button")
    button.className = "chat-title"
    button.type = "button"
    button.textContent = conversation.title
    button.addEventListener("click", () => {
      state.activeId = conversation.id
      saveState()
      render()
      el.sidebar.classList.remove("open")
    })

    const remove = document.createElement("button")
    remove.className = "chat-delete"
    remove.type = "button"
    remove.textContent = "x"
    remove.setAttribute("aria-label", `Delete ${conversation.title}`)
    remove.addEventListener("click", () => deleteConversation(conversation.id))

    item.append(button, remove)
    el.chatList.append(item)
  }
}

function renderTranscript() {
  const conversation = activeConversation()
  el.transcript.innerHTML = ""

  if (conversation.messages.length === 0) {
    el.transcript.innerHTML = `
      <div class="empty">
        <div class="empty-inner">
          <h1>Local DeepSeek, direct.</h1>
          <p>Ready on localhost.</p>
        </div>
      </div>
    `
    return
  }

  for (const message of conversation.messages) {
    const turn = document.createElement("article")
    turn.className = "turn"

    const label = document.createElement("div")
    label.className = "turn-label"
    label.textContent = message.role === "user" ? "You" : "ds4.c"
    turn.append(label)

    if (message.reasoning) {
      const reasoning = document.createElement("details")
      reasoning.className = "reasoning"
      reasoning.open = openReasoning.has(message.id)
      reasoning.addEventListener("toggle", () => {
        if (reasoning.open) {
          openReasoning.add(message.id)
        } else {
          openReasoning.delete(message.id)
        }
      })
      const summary = document.createElement("summary")
      summary.textContent = "Reasoning"
      const body = document.createElement("div")
      body.className = "reasoning-body"
      body.innerHTML = renderMarkdown(message.reasoning)
      reasoning.append(summary, body)
      turn.append(reasoning)
    }

    const body = document.createElement("div")
    body.className = `message ${message.role}`
    body.innerHTML = renderMarkdown(message.content || "")
    turn.append(body)
    el.transcript.append(turn)
  }

  el.transcript.scrollTop = el.transcript.scrollHeight
}

function renderSettings() {
  el.systemPrompt.value = state.settings.system
  el.maxTokens.value = state.settings.max_tokens
  el.temperature.value = state.settings.temperature
  el.temperatureOut.value = state.settings.temperature
  el.topP.value = state.settings.top_p
  el.topPOut.value = state.settings.top_p
  el.topK.value = state.settings.top_k
  el.minP.value = state.settings.min_p
  el.minPOut.value = state.settings.min_p
}

function render() {
  activeConversation()
  renderChatList()
  renderTranscript()
  renderSettings()
}

function syncSetting(key, value) {
  state.settings[key] = value
  saveState()
  renderSettings()
}

function apiMessages(messages) {
  const output = []
  if (state.settings.system.trim()) {
    output.push({ role: "system", content: state.settings.system.trim() })
  }
  for (const message of messages) {
    output.push({
      role: message.role,
      content: message.content
    })
  }
  return output
}

function parseSseChunk(text, onData) {
  const events = text.split("\n\n")
  const tail = events.pop() || ""
  for (const event of events) {
    const dataLines = event
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())

    for (const data of dataLines) {
      if (!data || data === "[DONE]") continue
      try {
        onData(JSON.parse(data))
      } catch {
        onData({ choices: [{ delta: { content: data } }] })
      }
    }
  }
  return tail
}

function applyDelta(message, payload) {
  const choice = payload.choices && payload.choices[0]
  const delta = choice && (choice.delta || choice.message)
  if (!delta) return

  if (typeof delta.reasoning_content === "string") {
    message.reasoning += delta.reasoning_content
  }
  if (typeof delta.reasoning === "string") {
    message.reasoning += delta.reasoning
  }
  if (typeof delta.content === "string") {
    message.content += delta.content
  }
  if (Array.isArray(delta.tool_calls)) {
    message.content += `\n\n${JSON.stringify(delta.tool_calls, null, 2)}`
  }
}

async function sendMessage(prompt) {
  const conversation = activeConversation()
  if (conversation.messages.length === 0) {
    conversation.title = titleFrom(prompt)
  }

  const userMessage = {
    id: uid(),
    role: "user",
    content: prompt,
    createdAt: Date.now()
  }
  const assistantMessage = {
    id: uid(),
    role: "assistant",
    content: "",
    reasoning: "",
    createdAt: Date.now()
  }

  conversation.messages.push(userMessage, assistantMessage)
  saveState()
  render()

  controller = new AbortController()
  el.stopButton.hidden = false
  el.sendButton.disabled = true

  try {
    const response = await fetch("/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: apiMessages(conversation.messages.filter((msg) => msg.id !== assistantMessage.id)),
        stream: true,
        max_tokens: Number(state.settings.max_tokens),
        temperature: Number(state.settings.temperature),
        top_p: Number(state.settings.top_p),
        top_k: Number(state.settings.top_k),
        min_p: Number(state.settings.min_p)
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `Request failed with ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      buffer = parseSseChunk(buffer, (payload) => {
        applyDelta(assistantMessage, payload)
        saveState()
        renderTranscript()
      })
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      assistantMessage.content += `\n\n${err.message}`
      assistantMessage.error = true
    }
  } finally {
    controller = null
    el.stopButton.hidden = true
    el.sendButton.disabled = false
    saveState()
    render()
  }
}

async function checkConnection() {
  try {
    const response = await fetch("/v1/models")
    if (!response.ok) throw new Error("offline")
    el.connection.textContent = "Connected"
  } catch {
    el.connection.textContent = "Offline"
  }
}

function autosizePrompt() {
  el.prompt.style.height = "0"
  el.prompt.style.height = `${Math.min(el.prompt.scrollHeight, 220)}px`
}

el.composer.addEventListener("submit", (event) => {
  event.preventDefault()
  const prompt = el.prompt.value.trim()
  if (!prompt || controller) return
  el.prompt.value = ""
  autosizePrompt()
  sendMessage(prompt)
})

el.prompt.addEventListener("input", autosizePrompt)
el.prompt.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault()
    el.composer.requestSubmit()
  }
})

el.stopButton.addEventListener("click", () => {
  if (controller) controller.abort()
})

el.newChat.addEventListener("click", newConversation)
el.settingsToggle.addEventListener("click", () => el.settingsPanel.classList.add("open"))
el.closeSettings.addEventListener("click", () => el.settingsPanel.classList.remove("open"))
el.railToggle.addEventListener("click", () => el.sidebar.classList.toggle("open"))

el.systemPrompt.addEventListener("change", () => syncSetting("system", el.systemPrompt.value))
el.maxTokens.addEventListener("change", () => syncSetting("max_tokens", Number(el.maxTokens.value)))
el.temperature.addEventListener("input", () => syncSetting("temperature", Number(el.temperature.value)))
el.topP.addEventListener("input", () => syncSetting("top_p", Number(el.topP.value)))
el.topK.addEventListener("change", () => syncSetting("top_k", Number(el.topK.value)))
el.minP.addEventListener("input", () => syncSetting("min_p", Number(el.minP.value)))

render()
autosizePrompt()
checkConnection()
