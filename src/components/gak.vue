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
        :active="cursor?.isEqualTo(coord(true, i))"
        @click="(e: MouseEvent) => moveRhythm(e, i)"
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
      <b-list-group-item v-for="(cell, i) in gak.content" :key="cell.id">
        <cell
          :anchor="anchor"
          :cell="cell"
          :coord="coord(false, i)"
          :cursor="cursor"
          @moveTo="moveTo"
          @selectTo="selectTo"
          class="cell"
        >
        </cell>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import Cursor from '@/cursor'
import { Gak } from '@/viewer'
import cell from './cell.vue'

export default defineComponent({
  props: {
    anchor: { type: Object as PropType<Cursor> },
    cursor: { type: Object as PropType<Cursor> },
    gak: { type: Object as PropType<Gak>, required: true },
  },
  emits: {
    moveTo: (coord: Cursor) => true,
    selectTo: (coord: Cursor) => true,
  },
  methods: {
    coord(
      rhythmMode: boolean,
      cell: number,
      row: number = 0,
      col: number = 0
    ): Cursor {
      if (!rhythmMode) {
        cell += this.gak.gakIndex * this.gak.measure
        if (this.gak.gakIndex > 0) cell -= this.gak.padding
      }
      return new Cursor(rhythmMode, this.gak.chapterIndex, cell, row, col)
    },
    move(cell: number, row: number, col: number) {
      this.$emit('moveTo', this.coord(false, cell, row, col))
    },
    moveRhythm(e: MouseEvent, cell: number) {
      // if (e.shiftKey) TODO
      this.$emit('moveTo', this.coord(true, cell))
    },
    moveTo(coord: Cursor) {
      this.$emit('moveTo', coord)
    },
    selectTo(coord: Cursor) {
      this.$emit('selectTo', coord)
    },
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
}

.rhythm > * {
  font-size: 1.5rem;
  line-height: 3.5rem;
  text-align: center;
}
</style>

<style>
.gak * {
  padding: 0;
}
</style>
