const production = process.env.NODE_ENV === 'production'

var path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  mode: production ? 'production' : 'development',
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist/',
    filename: 'build.js',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: [['@babel/preset-env', { targets: '> 0.5%, not dead' }]],
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          production ? MiniCssExtractPlugin.loader : 'vue-style-loader',
          { loader: 'css-loader', options: { esModule: false } },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js',
    },
    modules: ['node_modules'],
  },
  devServer: {
    publicPath: '/dist/',
    historyApiFallback: true,
    noInfo: true,
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'main.css' }),
    new VueLoaderPlugin(),
  ],
}
