module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "git pull"
      }
    },
    {
      when: "{{exists('app/.git')}}",
      method: "shell.run",
      params: {
        path: "app",
        message: [
          "git pull",
          "make clean",
          "make"
        ]
      }
    },
    {
      method: "input",
      params: {
        title: "Update Finished",
        description: "The launcher and ds4 app update steps have finished."
      }
    }
  ]
}
