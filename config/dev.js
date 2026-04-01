module.exports = {
  env: {
    NODE_ENV: '"development"',
    // Supabase 配置
    SUPABASE_URL: JSON.stringify(process.env.SUPABASE_URL),
    SUPABASE_ANON_KEY: JSON.stringify(process.env.SUPABASE_ANON_KEY),
    APP_NUMBER: JSON.stringify(process.env.APP_NUMBER || '2'),
  },
  defineConstants: {
  },
  mini: {},
  h5: {}
}
