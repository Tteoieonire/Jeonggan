<template>
  <b-container style="height: 100%">
    <b-row
      v-for="(row, r) in cell"
      :key="getID(row) ?? -r"
      :style="getRowStyle(row)"
      align-v="center"
      class="myrow"
    >
      <b-col
        v-for="(col, c) in row"
        :key="getID(col) ?? -c"
        :class="{ cur: thisCol(r, c) }"
        @click.stop="move(r, c)"
      >
        <span class="gugak">{{ getMain(col) }}</span>
        <span v-if="col && col.modifier" class="gugak modifier">{{
          'text' in col.modifier ? col.modifier.text : col.modifier.texts[0]
        }}</span>
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import Cursor from '@/cursor'
import { defineComponent, PropType } from 'vue'

import { Cell, Row, Col } from '../music'
import { getID } from '../utils'

export default defineComponent({
  props: {
    thisCell: { type: Boolean, required: true },
    cursor: { type: Cursor },
    cell: { type: Object as PropType<Cell>, required: true },
  },
  emits: { move: (row: number, col: number) => true },
  methods: {
    getRowStyle(row?: Row) {
      const longest = Math.max(this.cell.length, row ? row.length : 1)
      return {
        fontSize: 1.5 * Math.exp(-0.2 * longest) + 'em',
        height: 100 / this.cell.length + '%',
      }
    },
    getMain(col?: Col) {
      return col && col.main ? col.main.text : '-'
    },
    move(r: number, c: number) {
      this.$emit('move', r, c)
    },
    thisCol(r: number, c: number) {
      if (!this.thisCell) return false
      return this.cursor?.row === r && this.cursor?.col === c
    },
    getID,
  },
})
</script>

<style scoped>
.myrow {
  width: 3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  /**/
}

.myrow > * {
  padding: 0 !important;
}

.cur {
  background-color: darkblue;
}

.modifier {
  font-size: 70%;
  vertical-align: 15%;
}
</style>
