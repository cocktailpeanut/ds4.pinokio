module.exports = {
  run: [
    {
      when: "{{platform !== 'darwin'}}",
      method: "input",
      params: {
        title: "macOS Required",
        description: "ds4-server is Metal-only. This launcher is intended for Apple Silicon macOS machines with enough RAM for the selected GGUF."
      }
    },
    {
      when: "{{platform === 'darwin' && !exists('app')}}",
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/antirez/ds4 app"
        ]
      }
    },
    {
      when: "{{platform === 'darwin'}}",
      method: "shell.run",
      params: {
        path: "app",
        message: [
          "make"
        ]
      }
    },
    {
      when: "{{platform === 'darwin'}}",
      method: "input",
      params: {
        title: "Install Finished",
        description: "Download a q2 or q4 model from the Download Models menu, then start the server."
      }
    }
  ]
}
