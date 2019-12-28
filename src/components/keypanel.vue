<template>
  <!-- 하단 키 패널 -->
  <div class="container-fluid" v-if="!cursor.blurred && !cursor.playMode">
    <div v-if="cursor.rhythmMode" class="row">
      <rhythmpad :value="value" @input="write_rhythm"></rhythmpad>
    </div>
    <div v-else class="row">
      <yulpad :scale="scale" :octave="octave" @write="write" @octavechange="octavechange"></yulpad>
      <b-btn @click="erase" aria-label="지우개" class="m-1">
        <i class="fa fa-eraser"></i>
      </b-btn>

      <sympad @write="write" type="main"></sympad>
      <sympad v-if="sigimShow" @write="write" type="modifier"></sympad>
      <b-btn v-else class="m-1 dropup" disabled>
        <span class="dropdown-toggle">시김새</span>
      </b-btn>

      <shapepad for="row" @shapechange="shapechange"></shapepad>
      <shapepad for="col" @shapechange="shapechange"></shapepad>
    </div>
  </div>
</template>

<script>
import rhythmpad from './keypads/rhythmpad.vue'
import yulpad from './keypads/yulpad.vue'
import sympad from './keypads/sympad.vue'
import shapepad from './keypads/shapepad.vue'

export default {
  props: ['cursor', 'sigimShow', 'scale', 'value', 'octave'],
  methods: {
    write_rhythm(tick) {
      this.$emit('input', tick)
    },
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
    }
  },
  components: {
    rhythmpad,
    yulpad,
    sympad,
    shapepad
  }
}
</script>
