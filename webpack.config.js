const path = require('path');
const fs = require('fs');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const config = require('./config').configBuilder;
const isProduction = process.env.NODE_ENV === 'production';

const defines = {
  __VERSION__: JSON.stringify(require('./package.json').version)
};

const devServer = {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.port || '8003',
  hot: true,
  open: false,
  disableHostCheck: true,
  watchOptions: {ignored: /node_modules/}
};

if (config.ssl && config.ssl.key && config.ssl.cert) {
  devServer.https = {
    key: fs.readFileSync(config.ssl.key),
    cert: fs.readFileSync(config.ssl.cert)
  };
}

module.exports = {
  mode: isProduction ? 'production' : 'development',
  devtool: 'source-map',
  entry: {
    'web-notifications': './src/web-notifications.ts',
    'service-worker': './src/service-worker.ts',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: `pushwoosh-[name].${isProduction ? '' : 'uncompress.'}js`,
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json', '.html'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'awesome-typescript-loader'
      },
      {
        test: /\.css$/,
        use: ['to-string-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /.*src\/.*\.html$/,
        exclude: /WebpackTemplates/,
        use: 'raw-loader'
      }
    ]
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          compress: {
            pure_getters: true,
            unsafe: true,
            unsafe_comps: true,
            warnings: false
          },
          mangle: true,
          output: {
            comments: false
          }
        }
      })
    ]
  },
  plugins: [
    new CleanWebpackPlugin([path.resolve(__dirname, 'dist')]),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin(defines),
    new HtmlWebpackPlugin({
      inject: true,
      template: 'develop/index.html',
      externals: {
        initParams: JSON.stringify(config.initParams)
      },
      excludeChunks: ['service-worker'],
      minify: false,
    }),
    new ScriptExtHtmlWebpackPlugin({async: /\.js$/}),
    new GenerateJsonPlugin('manifest.json', config.manifest),

    !isProduction && new webpack.HotModuleReplacementPlugin()
  ].filter(x => x),

  devServer
};
