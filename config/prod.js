module.exports = {
  env: {
    NODE_ENV: '"production"',
    // Supabase 配置
    SUPABASE_URL: JSON.stringify(process.env.SUPABASE_URL),
    SUPABASE_ANON_KEY: JSON.stringify(process.env.SUPABASE_ANON_KEY),
    APP_NUMBER: JSON.stringify(process.env.APP_NUMBER || '2'),
  },
  defineConstants: {
  },
  mini: {},
  h5: {
    /**
     * 如果h5端编译后体积过大，可以使用webpack-bundle-analyzer插件对打包体积进行分析。
     * 参考代码如下：
     * webpackChain (chain) {
     *   chain.plugin('analyzer')
     *     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [])
     * }
     */
  }
}
