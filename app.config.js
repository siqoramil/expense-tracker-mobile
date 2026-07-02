// Dynamic Expo config: sources extra.API_URL from the .env file so the API
// endpoint can be changed per-environment without editing app.json.
export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    API_URL: process.env.API_URL ?? config.extra?.API_URL,
  },
});
