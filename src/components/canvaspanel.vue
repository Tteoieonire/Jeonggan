<template>
  <div>
    <gak
      v-for="(gak, i) in view.gaks"
      :key="i"
      :cursor="cursor"
      :gak="gak"
      :maxMeasure="view.maxMeasure"
      @move="move"
      @moveRhythm="moveRhythm"
      @openconfig="openconfig"
    ></gak>
  </div>
</template>

<script>
import gak from './gak.vue'

export default {
  props: ['cursor', 'view'],
  methods: {
    move(chapter, cell, row, col) {
      this.$emit('move', chapter, cell, row, col)
    },
    moveRhythm(chapter, cell) {
      this.$emit('moveRhythm', chapter, cell)
    },
    openconfig(chapter) {
      this.$emit('openconfig', chapter)
    }
  },
  components: {
    gak
  }
}
</script>