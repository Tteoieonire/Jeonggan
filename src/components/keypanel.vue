<template>
  <!-- 하단 키 패널 -->
  <b-button-toolbar key-nav class="panel">
    <div v-if="rhythmMode" class="flex">
      <rhythmpad :tickIdx="tickIdx" @tickchange="tickchange" />
      <b-button @click="erase" aria-label="지우개" class="m-1">
        <font-awesome-icon icon="eraser" />
      </b-button>
      <shapepad for="row" @shapechange="shapechange" />
    </div>
    <div v-else class="flex">
      <yulpad
        style="order: 2"
        :scale="scale"
        :octave="octave"
        @write="write"
        @octavechange="octavechange"
      />

      <div style="order: 3">
        <b-button @click="erase" aria-label="지우개" class="m-1">
          <font-awesome-icon icon="eraser" />
        </b-button>

        <cellpad @shapechange="shapechange"></cellpad>
        <shapepad for="row" @shapechange="shapechange" />
        <shapepad for="col" @shapechange="shapechange" />
      </div>

      <div style="order: 1">
        <!-- TODO: 주법 -->
        <sympad @write="write" type="main" />
        <sympad
          :sigimShow="sigimShow"
          :trillShow="trillShow"
          :trill="trill"
          @write="write"
          @trillchange="trillchange"
          type="modifier"
        />
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

import { MainEntry, ModifierEntry, TrillState } from '@/symbols'
import cellpad from './keypads/cellpad.vue'
import rhythmpad from './keypads/rhythmpad.vue'
import shapepad from './keypads/shapepad.vue'
import sympad from './keypads/sympad.vue'
import yulpad from './keypads/yulpad.vue'

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
    shapechange: (type: 'cell' | 'row' | 'col', delta: 1 | -1) => true,
    octavechange: (delta: 1 | -1) => true,
    tickchange: (tickIdx: number) => true,
    trillchange: (trill: TrillState) => true,
  },
  methods: {
    write(where: 'main' | 'modifier', obj?: MainEntry | ModifierEntry) {
      this.$emit('write', where, obj)
    },
    erase() {
      this.$emit('erase')
    },
    shapechange(type: 'cell' | 'row' | 'col', delta: 1 | -1) {
      this.$emit('shapechange', type, delta)
    },
    octavechange(delta: 1 | -1) {
      this.$emit('octavechange', delta)
    },
    tickchange(tickIdx: number) {
      this.$emit('tickchange', tickIdx)
    },
    trillchange(trill: TrillState) {
      this.$emit('trillchange', trill)
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
