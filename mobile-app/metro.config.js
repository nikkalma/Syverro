const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'ttf'];

config.watchFolders = [
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'assets'),
];

// Только те папки, которые нужны для абсолютных импортов
config.resolver.extraNodeModules = {
  '@components': path.resolve(__dirname, 'src/components'),
  '@context': path.resolve(__dirname, 'src/context'),
  '@screens': path.resolve(__dirname, 'src/screens'),
  '@theme': path.resolve(__dirname, 'src/theme'),
  '@locales': path.resolve(__dirname, 'src/locales'),
  '@types': path.resolve(__dirname, 'src/types'),
};

module.exports = config;