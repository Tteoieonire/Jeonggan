<template>
  <!-- 하단 키 패널 -->
  <b-button-toolbar key-nav class="panel">
    <div v-if="rhythmMode" class="flex">
      <rhythmpad :tick-idx="tickIdx" @tick-change="tickchange" />
      <b-button @click="erase" aria-label="지우개" class="m-1">
        <font-awesome-icon icon="eraser" />
      </b-button>
      <shapepad for="row" @shape-change="shapechange" />
    </div>
    <div v-else class="flex">
      <yulpad
        style="order: 2"
        :scale="scale"
        :octave="octave"
        @write="write"
        @octave-change="octavechange"
      />

      <div style="order: 3">
        <b-button @click="erase" aria-label="지우개" class="m-1">
          <font-awesome-icon icon="eraser" />
        </b-button>

        <cellpad @shape-change="shapechange"></cellpad>
        <shapepad for="row" @shape-change="shapechange" />
        <shapepad for="col" @shape-change="shapechange" />
      </div>

      <div style="order: 1">
        <!-- TODO: 주법 -->
        <sympad
          :sigim-show="sigimShow"
          :trill-show="trillShow"
          :trill="trill"
          @write="write"
          @trill-change="trillchange"
          type="modifier"
        />
        <sympad @write="write" type="main" />
      </div>
    </div>
  </b-button-toolbar>
</template>

<style scoped>
.panel {
  width: 100%;
  padding: 0.5rem;
}

.flex {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
</style>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import { MainEntry, ModifierEntry, TrillState } from '@/domain/symbols'
import cellpad from './cellpad.vue'
import rhythmpad from './rhythmpad.vue'
import shapepad from './shapepad.vue'
import sympad from './sympad.vue'
import yulpad from './yulpad.vue'

export default defineComponent({
  props: {
    tickIdx: { type: Number, required: true },
    rhythmMode: { type: Boolean, required: true },
    sigimShow: { type: Boolean, required: true },
    trillShow: { type: Object as PropType<TrillState>, required: true },
    scale: { type: Object as PropType<number[]>, required: true },
    octave: { type: Number, required: true },
    trill: { type: Object as PropType<TrillState>, required: true },
  },
  emits: {
    write: (where: 'main' | 'modifier', obj?: MainEntry | ModifierEntry) =>
      true,
    erase: () => true,
    'shape-change': (type: 'cell' | 'row' | 'col', delta: 1 | -1) => true,
    'octave-change': (delta: 1 | -1) => true,
    'tick-change': (tickIdx: number) => true,
    'trill-change': (trill: TrillState) => true,
  },
  methods: {
    write(where: 'main' | 'modifier', obj?: MainEntry | ModifierEntry) {
      this.$emit('write', where, obj)
    },
    erase() {
      this.$emit('erase')
    },
    shapechange(type: 'cell' | 'row' | 'col', delta: 1 | -1) {
      this.$emit('shape-change', type, delta)
    },
    octavechange(delta: 1 | -1) {
      this.$emit('octave-change', delta)
    },
    tickchange(tickIdx: number) {
      this.$emit('tick-change', tickIdx)
    },
    trillchange(trill: TrillState) {
      this.$emit('trill-change', trill)
    },
  },
  components: {
    rhythmpad,
    yulpad,
    sympad,
    shapepad,
    cellpad,
  },
})
</script>
