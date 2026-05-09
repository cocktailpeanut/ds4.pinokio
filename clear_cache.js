module.exports = {
  run: [
    {
      method: "fs.rm",
      params: {
        path: "cache"
      }
    },
    {
      method: "input",
      params: {
        title: "Cache Cleared",
        description: "The local disk KV cache has been removed. Downloaded GGUF model files were left untouched."
      }
    }
  ]
}
