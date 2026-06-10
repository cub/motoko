module.exports = {
  apps: [
    {
      name: 'motoko',
      script: 'index.mjs',
      node_args: '--env-file-if-exists=.env',
      max_memory_restart: '300M',
      restart_delay: 5000,
      time: true
    }
  ]
};
