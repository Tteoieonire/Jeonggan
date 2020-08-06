<template>
  <div class="d-inline-block">
    <b-button-group class="m-1" aria-label="율명 입력">
      <b-btn :disabled="octave<=0" @click="lower" variant="outline-primary" aria-label="옥타브 내림">亻</b-btn>

      <b-btn
        v-for="(yul, i) in yuls"
        :key="i"
        :title="yul.label"
        @click="note(i)"
        v-b-tooltip.hover
      >{{yul.text}}</b-btn>

      <b-btn :disabled="octave>=4" @click="raise" variant="outline-primary" aria-label="옥타브 올림">氵</b-btn>
    </b-button-group>

    <b-button-group class="mx-1 my-1">
      <b-btn @click="rest" aria-label="쉼표">△</b-btn>
    </b-button-group>
  </div>
</template>

<script>
import { YUL_OBJ, REST_OBJ } from '../../constants.js'

export default {
  props: ['scale', 'octave'],
  methods: {
    rest() {
      this.$emit('write', 'main', REST_OBJ)
    },
    note(i) {
      let obj = this.yuls[i]
      this.$emit('write', 'main', obj)
    },
    lower() {
      if (this.octave > 0) this.$emit('octavechange', -1)
    },
    raise() {
      if (this.octave < 4) this.$emit('octavechange', +1)
    }
  },
  computed: {
    yuls() {
      const obj = YUL_OBJ[this.octave]
      return this.scale.map(x => obj[x]);
    }
  }
}
</script>
