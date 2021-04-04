'use strict';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const paths = require('./paths');
const modules = require('./modules');
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');
const createDevServerConfig = require('./webpackDevServer.config');


const postcssNormalize = require('postcss-normalize');


// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

const webpackDevClientEntry = require.resolve(
  'react-dev-utils/webpackHotDevClient'
);

const smp = new SpeedMeasurePlugin();

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
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve('postcss-loader'),
        options: {
          // Necessary for external CSS imports to work
          // https://github.com/facebook/create-react-app/issues/2677
          ident: 'postcss',
          plugins: () => [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009',
              },
              stage: 3,
            }),
            // Adds PostCSS Normalize as the reset css with default options,
            // so that it honors browserslist config in package.json
            // which in turn let's users customize the target behavior as per their needs.
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

  return smp.wrap({
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
      alias: modules.projectAlias,
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
          template: paths.appHtml
        }
      ),
      new webpack.ProvidePlugin({
        buffer: 'buffer',
        process:'process'
      }),
      new webpack.DefinePlugin(env.stringified),
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
          },
          // {
          //   module: 'antd',
          //   entry: 'https://cdn.bootcdn.net/ajax/libs/antd/4.14.0/antd.min.js',
          //   global: 'antd'
          // },
          // {
          //   module: '@ant-design/icons',
          //   entry: 'https://cdn.bootcdn.net/ajax/libs/ant-design-icons/4.5.0/index.umd.min.js',
          //   global: '@ant-design/icons'
          // }
        ]
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
    performance: false,
    // webpack5
    target: isEnvProduction ? "browserslist" : "web",
    devServer: createDevServerConfig()
  });
};
