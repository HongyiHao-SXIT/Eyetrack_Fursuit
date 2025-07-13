import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './plugins/element.js'
import './plugins/device.js'
import Toasted from 'vue-toasted'
import Persist from 'vue-component-persist'
import echarts from 'echarts'
import VueCropper from 'vue-cropper' 

const app = createApp(App)

app.use(VueCropper)
app.config.globalProperties.$echarts = echarts
app.config.productionTip = false
app.config.globalProperties.window = window

app.use(Toasted, {
  duration: 5000,
  position: 'top-center'
})

app.use(Persist, {
  read: k => {
    let data = JSON.parse(localStorage.getItem(k))
    try {
      data.data.isStale = true
    } catch (e) { throw e; }
    return data
  }
})

// Toast 去重
let lastToastText = null
app.config.globalProperties.$toasted.__show = app.config.globalProperties.$toasted.show
app.config.globalProperties.$toasted.show = (text, ...args) => {
  if (text !== lastToastText) {
    lastToastText = text
    setTimeout(() => lastToastText = null, 5000)
    return app.config.globalProperties.$toasted.__show(text, ...args)
  }
}

app.use(router)
app.mount('#app')