const { getDefaultConfig } = require('expo/metro-config');

// Use Expo's default Metro config to avoid custom resolution issues
const config = getDefaultConfig(__dirname);

module.exports = config;


