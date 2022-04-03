<template>
  <div class="gaks">
    <gak
      v-for="gak in gaks"
      :key="`${gak.chapterID}_${gak.gakIndex}`"
      :cursor="cursor"
      :gak="gak"
      @move="move"
      @moveRhythm="moveRhythm"
    ></gak>
  </div>
</template>

<script lang="ts">
import Cursor from '@/cursor'
import { Gak } from '@/music'
import { defineComponent, PropType } from 'vue'

import gak from './gak.vue'

export default defineComponent({
  props: {
    cursor: { type: Object as PropType<Cursor | undefined>, required: true },
    gaks: { type: Object as PropType<Gak[]>, required: true },
  },
  emits: {
    move: (chapter: number, cell: number, row: number, col: number) => true,
    moveRhythm: (chapter: number, cell: number) => true,
  },
  methods: {
    move(chapter: number, cell: number, row: number, col: number) {
      this.$emit('move', chapter, cell, row, col)
    },
    moveRhythm(chapter: number, cell: number) {
      this.$emit('moveRhythm', chapter, cell)
    },
  },
  components: { gak },
})
</script>

<style scoped>
.gaks {
  display: flex;
  flex-flow: row-reverse wrap;
  align-items: flex-start;
}
</style>
