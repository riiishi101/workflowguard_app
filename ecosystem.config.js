module.exports = {
  apps: [
    {
      name: 'workflowguard-backend',
      script: './backend/dist/main.js',
      cwd: '/var/www/workflowguard_app/backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/workflowguard/backend-error.log',
      out_file: '/var/log/workflowguard/backend-out.log',
      log_file: '/var/log/workflowguard/backend.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
