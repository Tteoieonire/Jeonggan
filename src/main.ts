import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faEllipsisV,
  faEraser,
  faFile,
  faFolderOpen,
  faPause,
  faPlay,
  faRedo,
  faSave,
  faStop,
  faUndo,
} from '@fortawesome/free-solid-svg-icons'

import app from './app.vue'
import './style.css'

library.add(
  faEllipsisV,
  faEraser,
  faFile,
  faFolderOpen,
  faPause,
  faPlay,
  faRedo,
  faSave,
  faStop,
  faUndo
)

Vue.use(BootstrapVue)
Vue.component('font-awesome-icon', FontAwesomeIcon)

new Vue({
  el: '#app',
  render: h => h(app),
})
