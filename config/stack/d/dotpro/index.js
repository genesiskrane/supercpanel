// config.js

const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  appName: '.pro Node Server',
  port: process.env.PORT || 6001,
};

const development = {
  ...baseConfig,
  db: {
    uri: 'mongodb://localhost:27017/myapp-dev',
  },
};

const production = {
  ...baseConfig,
  db: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://user:pass@cluster.mongodb.net/myapp',
  },
};

const config = {
  development,
  production,
};

module.exports = config[env];
