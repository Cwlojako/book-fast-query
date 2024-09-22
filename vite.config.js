import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  server: {
    proxy: {
      // 有路网代理
      '/youlu': {
        target: 'https://www.youlu.net/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/youlu/, '')
      },
      '/xiaoguya': {
        target: 'https://api.xiaoguya.com:9898/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/xiaoguya/, '')
      },
      '/xc': {
        target: 'https://book.xclink.cn/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/xc/, '')
      }
    }
  }
})
