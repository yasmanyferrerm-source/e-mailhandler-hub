// Extends app.json. EXPO_BASE_URL lets the web build live under a sub-path,
// such as GitHub Pages' /e-mailhandler-hub.
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL || undefined },
});
