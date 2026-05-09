module.exports = {
  run: [
    {
      when: "{{!exists('app')}}",
      method: "input",
      params: {
        title: "Install Required",
        description: "Run Install before downloading models."
      }
    },
    {
      when: "{{exists('app')}}",
      method: "hf.download",
      params: {
        path: "app",
        "_": ["antirez/deepseek-v4-gguf", "{{args.file}}"],
        "local-dir": "gguf"
      }
    },
    {
      when: "{{exists('app')}}",
      method: "input",
      params: {
        title: "Download Finished",
        description: "The selected ds4 model download finished. Start the server from the sidebar."
      }
    }
  ]
}
