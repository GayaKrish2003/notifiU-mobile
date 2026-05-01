const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  "@notifiu/shared": path.resolve(__dirname, "../../packages/shared/src"),
};

config.watchFolders = [
  path.resolve(__dirname, "../../packages/shared"),
];

module.exports = withNativeWind(config, { input: "./global.css" });