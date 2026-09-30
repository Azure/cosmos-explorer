const path = require("node:path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    redirectBridge: path.resolve(__dirname, "../src/redirectBridge.ts"),
  },
  output: {
    path: path.resolve(__dirname, "redirect-bridge"),
    filename: "[name].[contenthash:8].js",
    publicPath: "/",
    clean: true,
  },
  devtool: false,
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: require.resolve("ts-loader"),
        options: {
          transpileOnly: true,
          onlyCompileBundledFiles: true,
          configFile: path.resolve(__dirname, "../tsconfig.json"),
        },
      },
    ],
  },
  optimization: {
    splitChunks: false,
    runtimeChunk: false,
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "redirectBridge.html",
      template: path.resolve(__dirname, "../src/redirectBridge.html"),
      chunks: ["redirectBridge"],
    }),
  ],
};
