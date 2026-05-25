<template>
  <div class="d-inline-block">
    <b-button-group class="m-1" aria-label="쉼표와 숨표 입력">
      <b-button @click="rest" aria-label="쉼표">
        <span aria-hidden="true">△</span>
      </b-button>
      <b-button
        class="gugak breath-button"
        :pressed="breathMarked"
        @click="breathmarktoggle"
        aria-label="숨표"
        title="숨표"
        v-b-tooltip.hover.body
      >
        <span aria-hidden="true">숨표</span>
      </b-button>
    </b-button-group>

    <b-button-group class="m-1" aria-label="율명 입력">
      <b-button
        :disabled="!canLower"
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
        :disabled="!canRaise"
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

import {
  canLowerOctave,
  canRaiseOctave,
  getYulPadEntries,
  getYulPadEntry,
} from '@/features/keypad'
import { REST_OBJ } from '../../domain/constants'
import { MainEntry, ModifierEntry } from '../../domain/symbols'

export default defineComponent({
  props: {
    scale: { type: Array as PropType<number[]>, required: true },
    octave: { type: Number, required: true },
    breathMarked: { type: Boolean, required: true },
  },
  emits: {
    write(where: 'main' | 'modifier', obj: MainEntry | ModifierEntry) {
      return true
    },
    'octave-change': (delta: 1 | -1) => true,
    'breath-mark-toggle': () => true,
  },
  methods: {
    rest() {
      this.$emit('write', 'main', REST_OBJ)
    },
    breathmarktoggle() {
      this.$emit('breath-mark-toggle')
    },
    note(i: number) {
      const obj = getYulPadEntry(this.scale, this.octave, i)
      this.$emit('write', 'main', obj)
    },
    lower() {
      if (this.canLower) this.$emit('octave-change', -1)
    },
    raise() {
      if (this.canRaise) this.$emit('octave-change', +1)
    },
  },
  computed: {
    yuls() {
      return getYulPadEntries(this.scale, this.octave)
    },
    canLower() {
      return canLowerOctave(this.octave)
    },
    canRaise() {
      return canRaiseOctave(this.octave)
    },
  },
})
</script>

<style scoped>
.breath-button {
  min-width: 2.5rem;
}
</style>
