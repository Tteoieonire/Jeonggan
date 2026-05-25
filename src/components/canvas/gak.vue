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
        @move-to="moveTo"
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
        @move-to="moveTo"
        @select-to="selectTo"
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

import Cursor from '@/domain/navigation/cursor'
import { Gak } from '@/domain/navigation/viewer'
import {
  coordInGak,
  getGakLabel,
  getGakLength,
  getGakPadding,
  getGakTitle,
  groupGakContent,
  type GakGroupInfo,
} from '@/features/canvas'
import cell from './cell.vue'
import rhythmcell from './rhythmcell.vue'

export default defineComponent({
  props: {
    anchor: { type: Object as PropType<Cursor> },
    cursor: { type: Object as PropType<Cursor> },
    gak: { type: Object as PropType<Gak>, required: true },
  },
  emits: {
    'move-to': (coord: Cursor) => true,
    'select-to': (coord: Cursor) => true,
    'pointer-down': (coord: Cursor) => true,
    'pointer-over': (coord: Cursor) => true,
  },
  methods: {
    coord(
      rhythmMode: boolean,
      cell: number,
      row: number = 0,
      col: number = 0
    ): Cursor {
      return coordInGak(this.gak, rhythmMode, cell, row, col)
    },
    moveTo(coord: Cursor) {
      this.$emit('move-to', coord)
    },
    selectTo(coord: Cursor) {
      this.$emit('select-to', coord)
    },
    pointerDown(coord: Cursor) {
      this.$emit('pointer-down', coord)
    },
    pointerOver(coord: Cursor) {
      this.$emit('pointer-over', coord)
    },
    grouped<T>(content: T[]): [T, GakGroupInfo][] {
      return groupGakContent(content, this.gak)
    },
  },
  computed: {
    gakLength() {
      return getGakLength(this.gak.measure)
    },
    title() {
      return getGakTitle(this.gak)
    },
    label() {
      return getGakLabel(this.gak)
    },
    padding() {
      return getGakPadding(this.gak)
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
