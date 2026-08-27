const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Push 'tflite' to support loading TFLite files in the application
config.resolver.assetExts.push('tflite');

module.exports = config;
