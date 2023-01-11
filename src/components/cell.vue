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
        :content="x"
        :coord="coordWith(r, c)"
        :cursor="cursor"
        @moveTo="moveTo"
        @selectTo="selectTo"
        class="mycol"
      >
      </el>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import Cursor from '@/cursor'
import { Cell, Row } from '@/viewer'
import col from './col.vue'

export default defineComponent({
  props: {
    anchor: { type: Object as PropType<Cursor> },
    cell: { type: Object as PropType<Cell>, required: true },
    coord: { type: Object as PropType<Cursor>, required: true },
    cursor: { type: Object as PropType<Cursor> },
  },
  emits: {
    moveTo: (coord: Cursor) => true,
    selectTo: (coord: Cursor) => true,
    pointerDown: (coord: Cursor) => true,
    pointerOver: (coord: Cursor) => true,
  },
  methods: {
    getRowStyle(row: Row) {
      const longest = Math.max(this.rows.length, row.data.length)
      return {
        fontSize: 1.5 * Math.exp(-0.2 * longest) + 'rem',
        // height: 100 / this.cell.length + '%',
      }
    },
    coordWith(r: number, c: number): Cursor {
      const coord = this.coord.clone()
      coord.row = r
      coord.col = c
      return coord
    },
    moveTo(coord: Cursor) {
      this.$emit('moveTo', coord)
    },
    selectTo(coord: Cursor) {
      this.$emit('selectTo', coord)
    },
    pointerDown(e: PointerEvent) {
      ;(e.target as any).releasePointerCapture(e.pointerId)
      this.$emit('pointerDown', this.coord)
    },
    pointerOver() {
      this.$emit('pointerOver', this.coord)
    },
  },
  computed: {
    rows() {
      return this.cell.data
    },
    isSel(): boolean {
      if (this.anchor == null || this.cursor == null) return false
      return this.coord.isBetween(this.anchor, this.cursor, 'cell')
    },
    isHandle(): boolean {
      return !!(
        this.anchor?.isEqualTo(this.coord, 'cell') ||
        this.cursor?.isEqualTo(this.coord, 'cell')
      )
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
