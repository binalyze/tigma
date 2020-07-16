const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  entry: path.join(__dirname, '/src/tigma.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'tigma.js',
    library: 'tigma',
    libraryTarget: 'umd',
    globalObject: 'this'
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
