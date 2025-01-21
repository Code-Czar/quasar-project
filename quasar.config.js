/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

const { configure } = require('quasar/wrappers');
const path = require('path');

// const { resolve } = require('path');

module.exports = configure(function (/* ctx */) {
  return {
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ['i18n', 'router'],
    plugins: ['pinia'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      'roboto-font', // optional, you are not bound to it
      'material-icons', // optional, you are not bound to it
      'mdi-v7', // Material Design Icons
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      protocols: [
        {
          name: 'Infinity Installer',
          schemes: ['infinityinstaller'],
        },
      ],
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node18',
      },
      eslint: {
        warnings: false,
        errors: false,
      },

      vueRouterMode: 'hash', // available values: 'hash', 'history'
      // vueRouterBase,
      // vueDevtools,
      // vueOptionsAPI: false,

      // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

      // publicPath: '/',
      // analyze: true,
      // env: {},
      // rawDefine: {}
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      // extendViteConf (viteConf) {},
      // viteVuePluginOptions: {},

      vitePlugins: [
        [
          '@intlify/vite-plugin-vue-i18n',
          {
            include: path.resolve(__dirname, './src/i18n/**'),
          },
        ],
        [
          'vite-plugin-checker',
          {
            vueTsc: {
              tsconfigPath: 'tsconfig.vue-tsc.json',
            },
            // // eslint: {
            // //   lintCommand: 'eslint "./**/*.{js,ts,mjs,cjs,vue}"',
            // // },
          },
          // { server: false },
        ],
      ],
      // extraResources: [
      //   {
      //     from: './src-electron/installScripts',
      //     to: 'extraResources',
      //     filter: ['**/*.sh'],
      //   },
      // ],
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      // https: true
      open: true, // opens browser window automatically
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {},

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: [],
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   registerServiceWorker: 'src-pwa/register-service-worker',
    //   serviceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    // },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      // ssrPwaHtmlFilename: 'offline.html', // do NOT use index.html as name!
      // will mess up SSR

      // extendSSRWebserverConf (esbuildConf) {},
      // extendPackageJson (json) {},

      pwa: false,

      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      prodPort: 3000, // The default port that the production server should use
      // (gets superseded if process.env.PORT is specified at runtime)

      middlewares: [
        'render', // keep this as last one
      ],
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'generateSW', // or 'injectManifest'
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
      // useFilenameHashes: true,
      // extendGenerateSWOptions (cfg) {}
      // extendInjectManifestOptions (cfg) {},
      // extendManifestJson (json) {}
      // extendPWACustomSWConf (esbuildConf) {}
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf)
      // extendElectronPreloadConf (esbuildConf)

      inspectPort: 5858,

      deepLinking: {
        protocol: 'installer',
      },
      bundler: 'packager', // Use electron-packager
      packager: {
        platform: 'win32,darwin',
        arch: 'arm64,x64',
        asar: true,
        overwrite: true,
        prune: true,
        out: 'dist/electron',
        appBundleId: 'com.infinityInstaller.app',
        appCategoryType: 'public.app-category.utilities',
        extendInfo: path.resolve(__dirname, 'src-electron/Info.plist'),
        extraResource: [path.resolve(__dirname, 'src-electron/extensions')],
        win32metadata: {
          CompanyName: 'InfinityInstaller',
          FileDescription: 'Installer for Infinite Solutions ® softwares',
          OriginalFilename: 'InfinityInstaller.exe',
          ProductName: 'InfinityInstaller',
        },
      },

      builder: {
        appId: 'com.infinityInstaller.app',
        productName: 'InfinityInstaller',
        directories: {
          output: 'dist/electron',
        },
        extraResources: [
          {
            from: path.resolve(__dirname, 'dist-electron/installScripts'),
            to: 'installScripts',
            filter: ['**/*'],
          },
          {
            from: path.resolve(__dirname, 'src-electron/extensions'),
            to: 'extensions',
            filter: ['**/*'],
          },
        ],
        afterPack: async (context) => {
          const fs = require('fs');
          const path = require('path');
          const targetPath = path.join(
            context.appOutDir,
            'extraResources',
            'installScripts',
          );
          console.log(`Checking extraResources path: ${targetPath}`);
          if (fs.existsSync(targetPath)) {
            console.log('extraResources have been successfully added.');
          } else {
            console.log('extraResources folder is missing.');
          }
        },
        // Additional packaging options, such as platform-specific builds
        win: {
          target: [{ target: 'nsis' }, { target: 'zip' }],
        },
        mac: {
          category: 'public.app-category.utility',
          mergeASARs: false,
          identity: null,
          extendInfo: {
            CFBundleURLTypes: [
              {
                CFBundleURLName: 'com.infinityInstaller.app',
                CFBundleURLSchemes: ['installer', 'infinityinstaller'],
              },
            ],
            NSPrincipalClass: 'AtomApplication',
          },

          target: [
            {
              target: 'dmg',
              arch: 'x64',
            },
            {
              target: 'zip',
              arch: 'x64',
            },
            {
              target: 'dmg',
              arch: 'arm64',
            },
            {
              target: 'zip',
              arch: 'arm64',
            },
          ],
        },
        linux: {
          target: [{ target: 'AppImage' }, { target: 'zip' }],
        },
        // publish: [
        //   {
        //     provider: 'github',
        //     owner: 'Code-Czar',
        //     repo: 'quasar-project',
        //   },
        // ],
      },
      builderOptions: {
        // publish: [
        //   {
        //     provider: 'github',
        //     owner: 'Code-Czar',
        //     repo: 'quasar-project',
        //   },
        // ],
        extraResources: [
          {
            from: './src-electron/installScripts',
            to: 'extraResources',
            filter: ['**/*'],
          },
          {
            from: './src-electron/extensions',
            to: 'extraResources',
            filter: ['**/*'],
          },
          {
            from: './src-electron',
            to: '',
            filter: ['**/*.ts'],
          },
        ],
      },
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      contentScripts: ['my-content-script'],

      // extendBexScriptsConf (esbuildConf) {}
      // extendBexManifestJson (json) {}
    },
  };
});
