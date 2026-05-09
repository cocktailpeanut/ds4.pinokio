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
        url: "{{input.event[1]}}"
      }
    }
  ]
}
