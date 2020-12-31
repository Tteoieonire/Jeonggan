<template>
  <!-- 하단 키 패널 -->
  <b-btn-toolbar key-nav class="container-fluid" v-if="!cursor.blurred && !cursor.playMode">
    <div v-if="cursor.rhythmMode" class="row mx-auto">
      <rhythmpad :tickIdx="tickIdx" @tickchange="tickchange"></rhythmpad>
    </div>
    <div v-else class="row">
      <div class="mx-auto">
        <yulpad :scale="scale" :octave="octave" @write="write" @octavechange="octavechange"></yulpad>
        <b-btn @click="erase" aria-label="지우개" class="m-1">
          <i class="fas fa-eraser"></i>
        </b-btn>

        <sympad @write="write" type="main"></sympad>
        <sympad v-if="sigimShow" @write="write" type="modifier"></sympad>
        <b-btn v-else class="m-1 dropup" disabled>
          <span class="dropdown-toggle">시김새</span>
        </b-btn>
      </div>

      <div class="mx-auto">
        <cellpad @shapechange="shapechange"></cellpad>
        <shapepad for="row" @shapechange="shapechange"></shapepad>
        <shapepad for="col" @shapechange="shapechange"></shapepad>
      </div>
    </div>
  </b-btn-toolbar>
</template>

<script>
import rhythmpad from './keypads/rhythmpad.vue'
import yulpad from './keypads/yulpad.vue'
import sympad from './keypads/sympad.vue'
import shapepad from './keypads/shapepad.vue'
import cellpad from './keypads/cellpad.vue'

export default {
  props: ['tickIdx', 'cursor', 'sigimShow', 'scale', 'octave'],
  methods: {
    write(where, obj) {
      this.$emit('write', where, obj)
    },
    erase() {
      this.$emit('erase')
    },
    shapechange(type, delta) {
      this.$emit('shapechange', type, delta)
    },
    octavechange(delta) {
      this.$emit('octavechange', delta)
    },
    tickchange(tickIdx) {
      this.$emit('tickchange', tickIdx)
    }
  },
  components: {
    rhythmpad,
    yulpad,
    sympad,
    shapepad,
    cellpad,
  }
}
</script>
