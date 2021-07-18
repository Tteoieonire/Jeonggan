<template>
  <!-- 하단 키 패널 -->
  <b-btn-toolbar
    key-nav
    class="container-fluid"
    v-if="!cursor.blurred && !cursor.playMode"
  >
    <div v-if="cursor.rhythmMode" class="row mx-auto">
      <rhythmpad :tickIdx="tickIdx" @tickchange="tickchange" />
    </div>
    <div v-else class="row mx-auto">
      <div class="ml-auto mr-0">
        <!-- TODO: 주법 -->
        <sympad @write="write" type="main" />
        <sympad
          :sigimShow="sigimShow"
          :trillShow="trillShow"
          :trill="trill"
          @write="write"
          @trillchange="trillchange"
          type="modifier"
        />
      </div>

      <yulpad
        class="ml-auto mr-0"
        :scale="scale"
        :octave="octave"
        @write="write"
        @octavechange="octavechange"
      />

      <div class="ml-auto mr-0">
        <b-btn @click="erase" aria-label="지우개" class="m-1">
          <font-awesome-icon icon="eraser" />
        </b-btn>

        <shapepad for="col" @shapechange="shapechange" />
        <shapepad for="row" @shapechange="shapechange" />
        <cellpad @shapechange="shapechange"></cellpad>
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
  props: ['tickIdx', 'cursor', 'sigimShow', 'trillShow', 'scale', 'octave', 'trill'],
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
    },
    trillchange(trill) {
      this.$emit('trillchange', trill)
    },
  },
  components: {
    rhythmpad,
    yulpad,
    sympad,
    shapepad,
    cellpad,
  },
}
</script>
