const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Provide a web-compatible shim for expo-sqlite
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return {
      filePath: require.resolve('./src/services/sqlite-web-shim.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
