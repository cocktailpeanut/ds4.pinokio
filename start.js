module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        path: "app",
        message: [
          "./ds4-server --model {{args.model}} --host 127.0.0.1 --port {{port}} --ctx {{args.ctx}} --kv-disk-dir ../cache/kv --kv-disk-space-mb {{args.kv}} {{args.mtpArgs || ''}}"
        ],
        on: [{
          event: "/(http:\\/\\/[0-9.:]+)/",
          done: true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        api_url: "{{input.event[1]}}"
      }
    },
    {
      method: "shell.run",
      params: {
        path: ".",
        message: [
          "node webui/server.js --host 127.0.0.1 --port {{port}} --target {{local.api_url}}"
        ],
        on: [{
          event: "/(http:\\/\\/[0-9.:]+)/",
          done: true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}"
      }
    }
  ]
}
