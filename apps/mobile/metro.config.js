const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Monorepo 支持：监视 workspace 包
config.watchFolders = [...(config.watchFolders ?? []), '../../packages'];

module.exports = config;
