// Vue3 升级：入口由 new Vue(...).$mount 改为 createApp(App).mount
import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'
import './map.css'
import '@arcgis/core/assets/esri/themes/dark/main.css'

createApp(App).mount('#app')
