'use strict';

const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const paths = require('./paths');
// const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');
const postcssNormalize = require('postcss-normalize');

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

// const smp = new SpeedMeasurePlugin();

const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || '10000'
);

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const lessRegex = /\.(less)$/;
const sassRegex = /\.(scss|sass)$/;
const lessModuleRegex = /\.module\.(less)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';

  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve('style-loader'),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        options: paths.publicUrlOrPath.startsWith('.')
          ? { publicPath: '../../' }
          : {},
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          ident: 'postcss',
          plugins: () => [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009',
              },
              stage: 3,
            }),
            postcssNormalize(),
          ],
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        },
      },
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
            root: paths.appSrc,
          },
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: true,
          },
        }
      );
    }
    return loaders;
  };

  return {
    mode: isEnvDevelopment ? 'development' : 'production',
    bail: isEnvProduction,
    devtool: isEnvProduction ? false : 'cheap-module-source-map',
    entry: {
      index: paths.appIndexJs
    },
    output: {
      path: isEnvProduction ? paths.appBuild : undefined,
      pathinfo: isEnvDevelopment,
      filename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].js'
        : isEnvDevelopment && 'static/js/bundle.js',
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : isEnvDevelopment && 'static/js/[name].chunk.js',
      publicPath: paths.publicUrlOrPath
    },
    resolve: {
      alias: {
        '@constants': path.join(paths.appSrc, 'constants'),
        '@api': path.join(paths.appSrc, 'api'),
        '@useHooks': path.join(paths.appSrc, 'useHooks'),
        '@services': path.join(paths.appSrc, 'services'),
        '@utils': path.join(paths.appSrc, 'utils'),
        '@assets': path.join(paths.appSrc, 'assets'),
        '@components': path.join(paths.appSrc, 'components'),
        '@views': path.join(paths.appSrc, 'views'),
        '@stores': path.join(paths.appSrc, 'stores'),
        '@generated': path.join(paths.appSrc, 'generated')
      },
      extensions: [
        '.js',
        '.ts',
        '.tsx',
        '.json',
        '.jsx',
      ],
      // webpack5 已经不支持nodejs的核心模块需要做补丁
      fallback: {
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        process: false,
        buffer: false
      }
    },
    module: {
      strictExportPresence: true,
      rules: [
        {
          oneOf: [
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve('url-loader'),
              options: {
                limit: imageInlineSizeLimit,
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
            {
              test: /\.(js|jsx|ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: ['react-app'],
                plugins: [
                  ['import', { libraryName: 'antd', libraryDirectory: 'es', style: true }],
                  [
                    'styless',
                    {
                      'import': '~antd/lib/style/themes/default.less',
                      'lessOptions': {
                        'javascriptEnabled': true
                      }
                    }
                  ]
                ],
                cacheDirectory: true
              }
            },
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction
                  ? shouldUseSourceMap
                  : isEnvDevelopment,
              }),
              sideEffects: true,
            },
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction
                    ? shouldUseSourceMap
                    : isEnvDevelopment,
                }
              ).concat({
                  loader: require.resolve('resolve-url-loader'),
                  options: {
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                    root: paths.appSrc,
                  },
                },
                {
                  loader: require.resolve('sass-loader'),
                  options: {
                    sourceMap: true,
                  },
                }),
              sideEffects: true,
            },
            {
              test: lessRegex,
              exclude: lessModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction
                    ? shouldUseSourceMap
                    : isEnvDevelopment,
                }
              ).concat(
                {
                  loader: require.resolve('less-loader'),
                  options: {
                    javascriptEnabled: true,
                  },
                }),
            },
            {
              loader: require.resolve('file-loader'),
              exclude: [/\.(js|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              options: {
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin(
        {
          template: paths.appHtml,
          filename: "index.html",
          scriptLoading: 'blocking',
          inject: 'body',
          chunks: ['index'],
        }
      ),
      new webpack.ProvidePlugin({
        buffer: 'buffer',
        process:'process'
      }),
      // new webpack.DefinePlugin(env.stringified),
      // 热更新
      new webpack.HotModuleReplacementPlugin(),
      // css压缩
      isEnvProduction &&
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
      }),
      // bundle大小分析
      // isEnvProduction && new BundleAnalyzerPlugin(),
      // 抽离三方库
      new HtmlWebpackExternalsPlugin({
        externals: [
          {
            module: 'react',
            entry: 'https://unpkg.com/react@17/umd/react.production.min.js',
            global: 'React'
          },
          {
            module: 'react-dom',
            entry: 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js',
            global: 'ReactDOM'
          }
        ]
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
    performance: false,
    // webpack5
    target: isEnvProduction ? "browserslist" : "web",
  }
};
