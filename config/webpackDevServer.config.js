'use strict';

const ignoredFiles = require('react-dev-utils/ignoredFiles');
const paths = require('./paths');
const getHttpsConfig = require('./getHttpsConfig');

const host = process.env.HOST || '0.0.0.0';

module.exports = function () {
  return {
    port: 8080,
    open: true,
    // 为每个静态文件开启gzip压缩
    compress: true,
    clientLogLevel: 'none',
    contentBase: paths.appPublic,
    contentBasePublicPath: paths.publicUrlOrPath,
    watchContentBase: true,
    inline: true,
    hot: true,
    injectClient: false,
    publicPath: paths.publicUrlOrPath.slice(0, -1),
    quiet: false,
    watchOptions: {
      ignored: ignoredFiles(paths.appSrc),
    },
    https: getHttpsConfig(),
    host,
    // 出现编译器错误或警告时，在浏览器中显示全屏覆盖
    overlay: false,
    historyApiFallback: {
      disableDotRule: true,
      index: paths.publicUrlOrPath,
    },
  };
};
