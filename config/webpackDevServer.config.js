'use strict';

const paths = require('./paths');

module.exports = {
  port: 8080,
  open: true,
  // 为每个静态文件开启gzip压缩
  compress: true,
  inline: true,
  hot: true,
  quiet: false,
  // 出现编译器错误或警告时，在浏览器中显示全屏覆盖
  overlay: false,
  historyApiFallback: {
    disableDotRule: true,
    index: paths.publicUrlOrPath,
  },
};
