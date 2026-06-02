module.exports = {
  apps: [
    {
      name: 'bill-radar-api',
      script: './node_modules/tsx/dist/cli.mjs',
      args: 'server/server.ts',
      cwd: 'D:\\Huhb\\AIProject\\HelperForBusyUByHY\\bill-radar\\bill-radar-pro',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        API_TOKEN: 'bill-radar-2026-secure',
        SITE_URL: 'https://save-radar-opal.vercel.app',
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
}
