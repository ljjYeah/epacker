'use strict';

const configFactory = require('../config/webpack.config');

module.exports = {
  ...configFactory('production')
}
