module.exports = function override(config, env) {
  // Add rule for markdown files
  config.module.rules.push({
    test: /\.md$/,
    use: 'raw-loader'
  });

  return config;
}; 