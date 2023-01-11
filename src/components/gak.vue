<template>
  <div class="wrapper">
    <div class="margin"></div>
    <div
      style="border-right: 1px solid black"
      :style="{ height: padding }"
      :class="{ padding: padding !== '0rem' }"
    ></div>
    <div class="gak" style="border-right: 1px solid black">
      <div
        v-for="[dummy, info] in grouped(gak.content.map(() => ''))"
        :key="info.index"
        class="annotation"
        :class="{ endsSubdivision: info.endsSubdivision }"
      ></div>
    </div>
  </div>
  <div class="wrapper">
    <div class="margin">
      <div v-if="gak.gakIndex === 0">
        <span class="title">{{ gak.title }}</span>
      </div>
    </div>

    <!-- 장단 -->
    <div v-if="gak.rhythm" :aria-label="label" class="gak rhythm">
      <rhythmcell
        v-for="[ticks, info] in grouped(gak.content)"
        :key="info.index"
        :ticks="ticks"
        :coord="coord(true, info.index)"
        :cursor="cursor"
        @moveTo="moveTo"
        class="main"
        :class="{
          endsSubdivision: info.endsSubdivision,
          endsChapter: info.endsChapter,
        }"
      >
      </rhythmcell>
    </div>

    <!-- 일반 각 -->
    <div v-else :aria-label="label" class="gak">
      <div
        :style="{ height: padding }"
        :class="{ padding: padding !== '0rem' }"
      ></div>
      <cell
        v-for="[cell, info] in grouped(gak.content)"
        :key="cell.id"
        :anchor="anchor"
        :cell="cell"
        :coord="coord(false, info.index)"
        :cursor="cursor"
        @moveTo="moveTo"
        @selectTo="selectTo"
        @pointer-down="pointerDown"
        @pointer-over="pointerOver"
        class="main"
        :class="{
          endsSubdivision: info.endsSubdivision,
          endsChapter: info.endsChapter,
        }"
      >
      </cell>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import Cursor from '@/cursor'
import { Gak } from '@/viewer'
import cell from './cell.vue'
import rhythmcell from './rhythmcell.vue'

type Info = { index: number; endsSubdivision: boolean; endsChapter: boolean }

export default defineComponent({
  props: {
    anchor: { type: Object as PropType<Cursor> },
    cursor: { type: Object as PropType<Cursor> },
    gak: { type: Object as PropType<Gak>, required: true },
  },
  emits: {
    moveTo: (coord: Cursor) => true,
    selectTo: (coord: Cursor) => true,
    pointerDown: (coord: Cursor) => true,
    pointerOver: (coord: Cursor) => true,
  },
  methods: {
    coord(
      rhythmMode: boolean,
      cell: number,
      row: number = 0,
      col: number = 0
    ): Cursor {
      if (!rhythmMode) {
        cell += this.gak.gakIndex * this.gakLength
        if (this.gak.gakIndex > 0) cell -= this.gak.padding
      }
      return new Cursor(rhythmMode, this.gak.chapterIndex, cell, row, col)
    },
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
    grouped<T>(content: T[]): [T, Info][] {
      const numbered = Array.from(content.entries())
      let idx = this.gak.gakIndex === 0 ? -this.gak.padding : 0
      const result: [T, Info][] = []
      for (const subdivision of this.gak.measure) {
        const sliced = numbered
          .slice(Math.max(0, idx), Math.max(0, idx + subdivision))
          .map(([index, data]): [T, Info] => [
            data,
            { index, endsSubdivision: false, endsChapter: false },
          ])
        if (sliced.length) {
          sliced[sliced.length - 1][1].endsSubdivision = true
          result.push(...sliced)
        }
        idx += subdivision
      }
      result[result.length - 1][1].endsChapter = this.gak.isLast
      return result
    },
  },
  computed: {
    gakLength() {
      return this.gak.measure.reduce((a, b) => a + b, 0)
    },
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
    rhythmcell,
  },
})
</script>

<style scoped>
.wrapper {
  overflow: hidden;
  border-bottom: 1px solid black;
}

.main {
  border: 1px solid black;
  border-bottom: none;
}

.annotation:first-child,
.padding {
  border-top: 1px solid black;
}

.margin {
  width: 100%;
  height: 5rem;
  text-align: center;
  padding: 0.5rem 0;
}

.title {
  height: 4rem;
  text-align: right;
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.endsSubdivision {
  border-bottom: 1px solid black;
}

.endsChapter {
  border-bottom: 3px double black;
}

.gak > * {
  height: 3.5rem;
}

.rhythm > * {
  text-align: center;
}
</style>

<style>
.gak * {
  padding: 0;
}
</style>
