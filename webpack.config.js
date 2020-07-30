const path = require('path');

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

  ],
  devServer: {
    port: 8080,
    contentBase: '.',
    watchContentBase: true
  }
};
