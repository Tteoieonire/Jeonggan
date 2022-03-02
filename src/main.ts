import './style.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'

import BootstrapVue3 from 'bootstrap-vue-3'
import { createApp } from 'vue'

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
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import MyApp from './app.vue'

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

createApp(MyApp)
  .use(BootstrapVue3)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app')
