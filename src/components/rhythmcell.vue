<template>
  <div class="container">
    <div
      v-for="(tick, i) in ticks"
      :key="i"
      @click="(e: MouseEvent) => moveRhythm(e, i)"
      class="myrow gugak"
      :class="{ cur: cursor?.isEqualTo(coordWith(i), 'row') }"
      :style="rowStyle"
    >
      {{ tick || '&nbsp;' }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import Cursor from '@/cursor'

export default defineComponent({
  props: {
    ticks: { type: Object as PropType<string[]>, required: true },
    coord: { type: Object as PropType<Cursor>, required: true },
    cursor: { type: Object as PropType<Cursor> },
  },
  emits: {
    moveTo: (coord: Cursor) => true,
  },
  methods: {
    coordWith(r: number): Cursor {
      const coord = this.coord.clone()
      coord.row = r
      return coord
    },
    moveRhythm(e: MouseEvent, row: number) {
      // if (e.shiftKey) TODO
      this.$emit('moveTo', this.coordWith(row))
    },
  },
  computed: {
    rowStyle() {
      return {
        fontSize: 2 * Math.exp(-0.2 * this.ticks.length) + 'rem',
        lineHeight: 3.5 / this.ticks.length + 'rem',
      }
    },
  },
})
</script>

<style scoped>
.container {
  height: 100%;

  display: flex;
  flex-direction: column;
}

.myrow {
  flex-grow: 1;
  white-space: nowrap;
}

.container {
  background-color: #fec;
}

.cur {
  background-color: #f60;
  color: white;
}
</style>
