<template>
  <div class="wrapper">
    <div class="margin">
      <div v-if="gak.gakIndex === 0">
        <span class="title">{{ gak.title }}</span>
      </div>
    </div>

    <!-- 장단 -->
    <b-list-group v-if="gak.rhythm" class="gak rhythm" :aria-label="label">
      <b-list-group-item
        v-for="(tick, i) in gak.content"
        :key="i"
        :active="thisCell(i, true)"
        @click="moveRhythm(i)"
        class="gugak"
        variant="info"
        >{{ tick || '' }}</b-list-group-item
      >
    </b-list-group>

    <!-- 일반 각 -->
    <b-list-group
      v-else
      class="gak"
      :aria-label="label"
      :style="{ paddingTop: padding }"
    >
      <b-list-group-item
        v-for="(cell, i) in gak.content"
        :key="getID(cell) ?? -i"
        :active="thisCell(i, false)"
        @click="move(i, 0, 0)"
      >
        <cell
          v-if="cell"
          :thisCell="thisCell(i, false)"
          :cursor="cursor"
          :cell="cell"
          @move="(r, c) => move(i, r, c)"
        ></cell>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import cell from './cell.vue'
import Cursor from '@/cursor'
import { Gak } from '@/music'
import { getID } from '../utils'

export default defineComponent({
  props: {
    cursor: { type: Object as PropType<Cursor> },
    gak: { type: Object as PropType<Gak>, required: true },
  },
  emits: {
    move: (gak: number, cell: number, row: number, col: number) => true,
    moveRhythm: (gak: number, cell: number) => true,
  },
  methods: {
    thisCell(cell: number, rhythmMode: boolean) {
      if (!rhythmMode) {
        cell += this.gak.gakIndex * this.gak.measure
        if (this.gak.gakIndex > 0) cell -= this.gak.padding
      }
      return (
        this.cursor?.rhythmMode === rhythmMode &&
        this.cursor?.chapter === this.gak.chapterIndex &&
        this.cursor?.cell === cell
      )
    },
    move(cell: number, row: number, col: number) {
      cell += this.gak.gakIndex * this.gak.measure
      if (this.gak.gakIndex > 0) cell -= this.gak.padding
      this.$emit('move', this.gak.chapterIndex, cell, row, col)
    },
    moveRhythm(cell: number) {
      this.$emit('moveRhythm', this.gak.chapterIndex, cell)
    },
    getID,
  },
  computed: {
    title() {
      return this.gak.title || this.gak.chapterIndex + 1 + '장'
    },
    label() {
      if (this.gak.rhythm) {
        return this.title + ' 장단'
      } else {
        return this.title + ' ' + (this.gak.gakIndex + 1) + '각'
      }
    },
    padding() {
      return (this.gak.gakIndex === 0 ? this.gak.padding : 0) * 3.5 + 'rem'
    },
  },
  components: {
    cell,
  },
})
</script>

<style scoped>
.wrapper {
  width: 4rem;
  background-color: beige;
  overflow: hidden;
}

.margin {
  width: 100%;
  height: 5rem;
  text-align: center;
  background-color: white;
  padding: 0.5rem 0;
}

.title {
  height: 4rem;
  text-align: right;
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.gak {
  width: 3rem;
  margin: 0 auto;
}

.gak > * {
  height: 3.5rem;
  padding: 0 !important;
}

.rhythm > * {
  font-size: 1.5rem;
  line-height: 3.5rem;
  text-align: center;
}
</style>
