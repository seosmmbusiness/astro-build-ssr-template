require('dotenv').config();

module.exports = {
  /**
   * Application configuration section
   * @see http://pm2.keymetrics.io/docs/usage/application-declaration/
   * @see http://pm2.keymetrics.io/docs/usage/environment/
   * @see https: //github.com/nuxt/nuxt.js/issues/1541
   */
  apps: [
    {
      name: process.env.APP_NAME || 'Template Astro',
      namespace: process.env.APP_NAMESPACE || 'AstroTemplate',
      script: 'npm',
      args: 'run start',
      instances: 2,
      exec_mode: 'cluster_mode',
      max_memory_restart: '2G',
      env_file: '.env',
      watch: false,
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
