<template>
  <div class="gaks">
    <div class="title">{{ title }}</div>
    <gak
      v-for="gak in gaks"
      :key="`${gak.chapterID}_${gak.gakIndex}`"
      :anchor="anchor"
      :cursor="cursor"
      :gak="gak"
      @moveTo="moveTo"
      @selectTo="selectTo"
      @pointer-down="pointerDown"
      @pointer-over="pointerOver"
    ></gak>
  </div>
</template>

<script lang="ts">
import Cursor from '@/cursor'
import { Gak } from '@/viewer'
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
    moveTo: (coord: Cursor) => true,
    selectTo: (coord: Cursor) => true,
    pointerDown: (coord: Cursor) => true,
    pointerOver: (coord: Cursor) => true,
  },
  methods: {
    moveTo(coord: Cursor) {
      this.$emit('moveTo', coord)
    },
    selectTo(coord: Cursor) {
      this.$emit('selectTo', coord)
    },
    pointerDown(coord: Cursor) {
      this.$emit('pointerDown', coord)
    },
    pointerOver(coord: Cursor) {
      this.$emit('pointerOver', coord)
    },
  },
  components: { gak },
})
</script>

<style>
.gaks {
  overflow: hidden;
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
