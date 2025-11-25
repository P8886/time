import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'
import './styles/global.scss'

const app = createApp(App)

// 配置应用参数
app.config.errorHandler = (err, instance, info) => {
  console.error('全局错误:', err, info)
}

if (process.env.NODE_ENV === 'development') {
  app.config.performance = true
}

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus, {
  locale: zhCn,
})

app.use(router)

app.mount('#app')