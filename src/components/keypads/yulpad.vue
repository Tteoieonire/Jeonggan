<template>
  <div class="d-inline-block">
    <b-button class="m-1" @click="rest" aria-label="쉼표">
      <span aria-hidden="true">△</span>
    </b-button>

    <b-button-group class="m-1" aria-label="율명 입력">
      <b-button
        :disabled="octave <= -3"
        @click="lower"
        variant="outline-primary"
        aria-label="옥타브 내림"
        >亻</b-button
      >

      <b-button
        v-for="(yul, i) in yuls"
        :key="i"
        :title="yul.label"
        :aria-label="yul.label"
        @click="note(i)"
        v-b-tooltip.hover
        class="gugak"
        style="font-size: 1.1rem"
        >{{ yul.text }}</b-button
      >

      <b-button
        :disabled="octave >= 3"
        @click="raise"
        variant="outline-primary"
        aria-label="옥타브 올림"
        >氵</b-button
      >
    </b-button-group>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import { REST_OBJ, YUL_OBJ } from '../../constants'
import { MainEntry, ModifierEntry } from '../../symbols'

export default defineComponent({
  props: {
    scale: { type: Array as PropType<number[]>, required: true },
    octave: { type: Number, required: true },
  },
  emits: {
    write(where: 'main' | 'modifier', obj: MainEntry | ModifierEntry) {
      return true
    },
    octavechange: (delta: 1 | -1) => true,
  },
  methods: {
    rest() {
      this.$emit('write', 'main', REST_OBJ)
    },
    note(i: number) {
      const obj = this.yuls[i]
      this.$emit('write', 'main', obj)
    },
    lower() {
      if (this.octave > -3) this.$emit('octavechange', -1)
    },
    raise() {
      if (this.octave < 3) this.$emit('octavechange', +1)
    },
  },
  computed: {
    yuls() {
      const obj = YUL_OBJ[this.octave + 3]
      return this.scale.map(x => obj[x])
    },
  },
})
</script>
