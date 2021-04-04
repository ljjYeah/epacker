'use strict';

const configFactory = require('../config/webpack.config');
const createDevServerConfig = require('../config/webpackDevServer.config');

module.exports = {
  ...configFactory('development'),
  devServer: createDevServerConfig
}
