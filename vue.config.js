module.exports = {
  devServer: {
    proxy: {
      '/ws': {
        target: 'http://127.0.0.1:8113',
        changeOrigin: true,
        ws: true
      }
    }
  }
}
