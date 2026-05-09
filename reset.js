module.exports = {
  run: [
    {
      method: "fs.rm",
      params: {
        path: "app"
      }
    },
    {
      method: "fs.rm",
      params: {
        path: "cache"
      }
    },
    {
      method: "input",
      params: {
        title: "Factory Reset Finished",
        description: "The cloned app, downloaded models, build outputs, and local cache were removed."
      }
    }
  ]
}
