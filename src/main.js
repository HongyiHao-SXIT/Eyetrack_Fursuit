import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Element Plus 替代 element-ui
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// vue-toastification 替代 vue-toasted
import Toast, { useToast } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// echarts 保留
import * as echarts from 'echarts'

// vue-advanced-cropper 替代 vue-cropper（示例用法，具体封装可继续优化）
import 'vue-advanced-cropper/dist/style.css'

// 手动模拟 vue-component-persist 的功能
function persistPlugin(app) {
  app.config.globalProperties.$persist = {
    read(key) {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      try {
        const data = JSON.parse(raw)
        data.data.isStale = true
        return data
      } catch (e) {
        console.error(e)
        return null
      }
    }
  }
}

// 去重 Toast 逻辑封装
let lastToastText = null
function createToastDeduplicator(toast) {
  return (text, options = {}) => {
    if (text !== lastToastText) {
      lastToastText = text
      setTimeout(() => (lastToastText = null), 5000)
      return toast(text, options)
    }
  }
}

// 创建 App 实例
const app = createApp(App)

app.use(router)
app.use(ElementPlus)
app.use(Toast, {
  timeout: 5000,
  position: 'top-center'
})
app.use(persistPlugin)

// 原型挂载 echarts
app.config.globalProperties.$echarts = echarts
app.config.globalProperties.window = window

// 注入 toast 去重（可在组件中使用 app.config.globalProperties.$toastDedup）
const toast = useToast()
app.config.globalProperties.$toastDedup = createToastDeduplicator(toast)

app.mount('#app')
