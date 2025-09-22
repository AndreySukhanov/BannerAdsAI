module.exports = {
  apps: [
    {
      name: 'banneradsai-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: './logs/backend.log',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      time: true,
      max_memory_restart: '512M',
      watch: false,
      autorestart: true
    },
    {
      name: 'banneradsai-frontend',
      script: 'npx',
      args: 'serve -s dist -l 4173',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/frontend.log',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      time: true,
      max_memory_restart: '256M',
      watch: false,
      autorestart: true
    }
  ]
};