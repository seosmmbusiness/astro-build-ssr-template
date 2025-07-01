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
      name: process.env.APP_NAME + ' 1' || 'Template Astro',
      namespace: process.env.APP_NAMESPACE || 'AstroTemplate',
      script: 'npm',
      args: 'run start',
      exec_mode: 'fork',
      max_memory_restart: '2G',
      env_file: '.env',
      watch: false,
      ignore_watch: ['node_modules'],
      env: {
        PORT: +process.env.ASTRO_PORT || 4321,
        NODE_ENV: 'production',
      },
    },
    {
      name: process.env.APP_NAME + ' 2' || 'Template Astro 2',
      namespace: process.env.APP_NAMESPACE || 'AstroTemplate',
      script: 'npm',
      args: 'run start',
      exec_mode: 'fork',
      max_memory_restart: '2G',
      env_file: '.env',
      watch: false,
      ignore_watch: ['node_modules'],
      env: {
        PORT: +process.env.ASTRO_PORT + 1 || 4322,
        NODE_ENV: 'production',
      },
    },
  ],
};
