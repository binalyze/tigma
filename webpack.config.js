const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
  entry: path.join(__dirname, '/src/main.ts'),
  output: {
    filename: 'tigma.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    library: 'createEngine',
    libraryTarget: 'window',
    libraryExport: 'default'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        include: [
          path.resolve(__dirname)
        ],
      },
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  plugins: [
    new CompressionPlugin({
      compressionOptions: { level: 9 },
      threshold: 10240,
      minRatio: 0.8,
      deleteOriginalAssets: false,
    })
  ],
  devServer: {
    port: 8080,
    contentBase: '.',
    watchContentBase: true
  }
};
