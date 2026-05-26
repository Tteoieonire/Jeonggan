<template>
  <div
    class="container"
    :class="{ sel: isSel, handle: isHandle }"
    @pointerdown.prevent="pointerDown"
    @pointerover.prevent="pointerOver"
  >
    <div
      v-for="(row, r) in rows"
      :key="row.id"
      :style="getRowStyle(row)"
      align-v="center"
      class="myrow"
    >
      <el
        v-for="(x, c) in row.data"
        :key="x.id"
        :anchor="anchor"
        :col-count="row.data.length"
        :content="x"
        :coord="coordWith(r, c)"
        :cursor="cursor"
        @move-to="moveTo"
        @select-to="selectTo"
        class="mycol"
      >
      </el>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import Cursor from '@/domain/navigation/cursor'
import { Cell } from '@/domain/navigation/viewer'
import {
  coordInCanvasCell,
  getCanvasCellRowStyle,
  isCanvasCellHandle,
  isCanvasCellSelected,
} from '@/features/canvas'
import col from './col.vue'

export default defineComponent({
  props: {
    anchor: { type: Object as PropType<Cursor> },
    cell: { type: Object as PropType<Cell>, required: true },
    coord: { type: Object as PropType<Cursor>, required: true },
    cursor: { type: Object as PropType<Cursor> },
  },
  emits: {
    'move-to': (coord: Cursor) => true,
    'select-to': (coord: Cursor) => true,
    'pointer-down': (coord: Cursor) => true,
    'pointer-over': (coord: Cursor) => true,
  },
  methods: {
    getRowStyle(row: Cell['data'][number]) {
      return getCanvasCellRowStyle(this.rows.length, row.data.length)
    },
    coordWith(r: number, c: number): Cursor {
      return coordInCanvasCell(this.coord, r, c)
    },
    moveTo(coord: Cursor) {
      this.$emit('move-to', coord)
    },
    selectTo(coord: Cursor) {
      this.$emit('select-to', coord)
    },
    pointerDown(e: PointerEvent) {
      ;(e.target as any).releasePointerCapture(e.pointerId)
      this.$emit('pointer-down', this.coord)
    },
    pointerOver() {
      this.$emit('pointer-over', this.coord)
    },
  },
  computed: {
    rows() {
      return this.cell.data
    },
    isSel(): boolean {
      return isCanvasCellSelected(this.coord, this.anchor, this.cursor)
    },
    isHandle(): boolean {
      return isCanvasCellHandle(this.coord, this.anchor, this.cursor)
    },
  },
  components: {
    el: col,
  },
})
</script>

<style scoped>
.container {
  height: 100%;

  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.myrow {
  display: flex;
  flex-direction: row;

  flex-grow: 1;
  white-space: nowrap;
}

.mycol {
  flex-grow: 1;
}

.sel {
  background-color: #bdf;
}

.handle {
  touch-action: pinch-zoom;
}
</style>
