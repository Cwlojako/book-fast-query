import { createApp } from 'vue'
import './assets/reset.css'
import 'element-plus/theme-chalk/index.css'
import App from './App.vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import utils from './utils'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
utils.forEach((e) => {
    app.provide(Object.keys(e)[0], Object.values(e)[0])
})
app.mount('#app')
