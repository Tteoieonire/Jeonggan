const production = process.env.NODE_ENV === 'production'

const path = require('path')
const webpack = require('webpack')

const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = {
  mode: production ? 'production' : 'development',
  devtool: production ? 'cheap-module-source-map' : 'inline-source-map',
  entry: path.resolve(__dirname, './src/main.ts'),
  output: {
    path: path.resolve(__dirname, './docs'),
    filename: 'build.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.[jt]s$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: '> 0.5%, not dead' }],
                'babel-preset-typescript-vue3',
              ],
              plugins: ['@babel/plugin-transform-runtime'],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.woff2?$/,
        type: 'asset/resource',
      },
      {
        test: /\.mp3$/,
        type: 'asset/inline',
      },
    ],
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.ts', '.js', '.vue'],
    plugins: [new TsconfigPathsPlugin()],
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, '/'),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
    }),
    new VueLoaderPlugin(),
  ],
}
