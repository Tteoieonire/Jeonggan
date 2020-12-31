import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'

import app from './app.vue'
import '../assets/tteoi-jeonggan.css'
import './style.css'

Vue.use(BootstrapVue)

new Vue({
  el: '#app',
  render: h => h(app)
})
