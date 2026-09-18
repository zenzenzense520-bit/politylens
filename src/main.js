import Vue from 'vue'
import App from './App.vue'
import './styles.css'
import './map.css'
import '@arcgis/core/assets/esri/themes/dark/main.css'

Vue.config.productionTip = false

new Vue({
  render: (h) => h(App),
}).$mount('#app')
