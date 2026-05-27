const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'ttf'];

// Папки, за которыми Metro следит
config.watchFolders = [
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'assets'),   // ← вот это критически важно
];

config.resolver.extraNodeModules = {
  components: path.resolve(__dirname, 'src/components'),
  context: path.resolve(__dirname, 'src/context'),
  store: path.resolve(__dirname, 'src/store'),
  screens: path.resolve(__dirname, 'src/screens'),
  theme: path.resolve(__dirname, 'src/theme'),
  locales: path.resolve(__dirname, 'src/locales'),
};

module.exports = config;