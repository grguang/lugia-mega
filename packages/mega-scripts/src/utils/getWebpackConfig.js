import { existsSync } from 'fs';
import { resolve } from 'path';
import { getConfig } from '@lugia/mega-webpack';
import is from '@lugia/mega-utils/lib/is';
import getEntry from './getEntry';

const defaultBrowsers = ['last 2 versions'];
const debug = require('debug')('@lugia/mega-scripts:getWebpackConfig');

const isDev = process.env.NODE_ENV === 'development';

export default function(opts = {}, applyConfig) {
  const { cwd, config, babel, paths, entry } = opts;

  const browserslist = config.browserslist || defaultBrowsers;
  debug(`babel: ${babel}`);
  debug(`browserslist: ${browserslist}`);

  if (!config.html) {
    config.html = { _fromMegaScriptsDefault: true };
    const appPublicHtmlPath = resolve(paths.appPublic, 'index.html');
    if (existsSync(appPublicHtmlPath)) {
      config.html.template = appPublicHtmlPath;
    }
    const appSrcHtmlPath = resolve(paths.appSrc, 'index.html');
    if (existsSync(appSrcHtmlPath)) {
      config.html.template = appSrcHtmlPath;
    }
    if (!isDev) {
      config.html.minify = {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      };
    }
  }

  if (!is.function(applyConfig)) {
    applyConfig = c => c;
  }

  return getConfig(
    applyConfig({
      cwd,
      hash: true,
      manifest: {},
      commons: [
        {
          name: 'vendors',
          minChunks(module) {
            // 把node_modules中的模块提取到vendors.js中
            return (
              module.resource &&
              (/\.js$/.test(module.resource) ||
                /\.css$/.test(module.resource)) &&
              module.resource.indexOf('node_modules') > -1
            );
          },
        },
      ],
      ...config,

      entry: getEntry({
        cwd: paths.appDirectory,
        entry: entry || config.entry,
        isBuild: !isDev,
      }),
      babel: config.babel || {
        presets: [
          [babel, { browsers: browserslist }],
          ...(config.extraBabelPresets || []),
        ],
        plugins: config.extraBabelPlugins || [],
      },
      browserslist,
    }),
    config.applyWebpack,
  );
}
