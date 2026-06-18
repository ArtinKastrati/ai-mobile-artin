const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Mock all Node.js core modules for the client bundle
const nodeMocks = [
  'ws',
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'sys',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib',
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...nodeMocks.reduce((acc, name) => {
    acc[name] = path.resolve(__dirname, 'constants/empty.js');
    return acc;
  }, {}),
};

module.exports = config;
