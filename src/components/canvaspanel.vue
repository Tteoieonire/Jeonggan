<template>
  <div class="gaks">
    <gak
      v-for="gak in gaks"
      :key="`${gak.chapterID}_${gak.gakIndex}`"
      :cursor="cursor"
      :gak="gak"
      @moveTo="moveTo"
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
    cursor: { type: Object as PropType<Cursor> },
    gaks: { type: Object as PropType<Gak[]>, required: true },
  },
  emits: {
    moveTo: (coord: Cursor) => true,
  },
  methods: {
    moveTo(coord: Cursor) {
      this.$emit('moveTo', coord)
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
