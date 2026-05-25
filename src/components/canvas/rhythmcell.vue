<template>
  <div class="container">
    <div
      v-for="(tick, i) in ticks"
      :key="i"
      @click="(e: MouseEvent) => moveRhythm(e, i)"
      class="myrow gugak"
      :class="{ cur: isCur[i] }"
      :style="rowStyle"
      ref="row"
    >
      {{ tick === '' ? '&nbsp;' : tick + '표' }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import Cursor from '@/domain/navigation/cursor'
import {
  coordInCanvasRhythmCell,
  getCanvasRhythmCellRowStyle,
  getCanvasRhythmTickStates,
} from '@/features/canvas'

export default defineComponent({
  props: {
    ticks: { type: Object as PropType<string[]>, required: true },
    coord: { type: Object as PropType<Cursor>, required: true },
    cursor: { type: Object as PropType<Cursor> },
  },
  emits: {
    'move-to': (coord: Cursor) => true,
  },
  methods: {
    coordWith(r: number): Cursor {
      return coordInCanvasRhythmCell(this.coord, r)
    },
    moveRhythm(e: MouseEvent, row: number) {
      // if (e.shiftKey) TODO
      this.$emit('move-to', this.coordWith(row))
    },
  },
  computed: {
    rowStyle() {
      return getCanvasRhythmCellRowStyle(this.ticks.length)
    },
    isCur(): boolean[] {
      return getCanvasRhythmTickStates(
        this.ticks.length,
        this.coord,
        this.cursor
      )
    },
  },
  watch: {
    isCur() {
      if (!('row' in this.$refs)) return
      const row = this.isCur.indexOf(true)
      if (row === -1) return
      ;(this.$refs.row as any)[row].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
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

  scroll-margin: 5rem 0 7rem;
}

.container {
  background-color: #fec;
}

.cur {
  background-color: #f60;
  color: white;
}
</style>
