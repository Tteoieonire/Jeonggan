<template>
  <div class="gaks">
    <div class="title">{{ title }}</div>
    <gak
      v-for="gak in gaks"
      :key="`${gak.chapterID}_${gak.gakIndex}`"
      :anchor="anchor"
      :cursor="cursor"
      :gak="gak"
      @move-to="moveTo"
      @select-to="selectTo"
      @pointer-down="pointerDown"
      @pointer-over="pointerOver"
    ></gak>
  </div>
</template>

<script lang="ts">
import Cursor from '@/domain/navigation/cursor'
import { Gak } from '@/domain/navigation/viewer'
import { defineComponent, PropType } from 'vue'

import gak from './gak.vue'

export default defineComponent({
  props: {
    title: { type: String, required: true },
    anchor: { type: Object as PropType<Cursor> },
    cursor: { type: Object as PropType<Cursor> },
    gaks: { type: Object as PropType<Gak[]>, required: true },
  },
  emits: {
    'move-to': (coord: Cursor) => true,
    'select-to': (coord: Cursor) => true,
    'pointer-down': (coord: Cursor) => true,
    'pointer-over': (coord: Cursor) => true,
  },
  methods: {
    moveTo(coord: Cursor) {
      this.$emit('move-to', coord)
    },
    selectTo(coord: Cursor) {
      this.$emit('select-to', coord)
    },
    pointerDown(coord: Cursor) {
      this.$emit('pointer-down', coord)
    },
    pointerOver(coord: Cursor) {
      this.$emit('pointer-over', coord)
    },
  },
  components: { gak },
})
</script>

<style>
.gaks {
  overflow: visible;
  border: 1px solid black;
  display: grid;
  direction: rtl;
  grid-template-columns: repeat(auto-fill, minmax(1.5rem, auto) 3rem);
}

.gaks * {
  direction: ltr;
}

.gaks > :last-child {
  border-left: 1px solid black;
}
</style>

<style scoped>
.title {
  border-left: 1px solid black;
  border-bottom: 1px solid black;
  grid-column: 1 / 3;

  font-size: 1.5rem;

  writing-mode: vertical-rl;
  text-orientation: upright;

  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
