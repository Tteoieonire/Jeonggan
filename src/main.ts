import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import './style.css'

import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faClipboard,
  faCopy,
  faEllipsisV,
  faEraser,
  faFile,
  faFolderOpen,
  faPause,
  faPlay,
  faPlus,
  faRedo,
  faSave,
  faScissors,
  faStop,
  faUndo,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import MyApp from './app.vue'

library.add(
  faClipboard,
  faCopy,
  faEllipsisV,
  faEraser,
  faFile,
  faFolderOpen,
  faPause,
  faPlay,
  faPlus,
  faRedo,
  faSave,
  faScissors,
  faStop,
  faUndo,
  faXmark
)

const app = createApp(MyApp)

app
  .use(createBootstrap())
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app')
