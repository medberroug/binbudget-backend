module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  baseUrl:"https://api.binbudget.com",
  cron: { enabled: true },
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', '282670e3e69c131b436b519a0d0625af'),
    },
  },
});
