<template>
  <b-button-group class="gugak m-1">
    <b-button
      v-for="(item, i) in RHYTHM_OBJ"
      :key="i"
      :pressed="thisTick(i)"
      @click="change(i)"
    >
      {{ item }}표
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { RHYTHM_OBJ } from '../../constants'

export default defineComponent({
  props: { tickIdx: { type: Number, required: true } },
  emits: { tickchange: (i: number) => 0 <= i && i < RHYTHM_OBJ.length },
  data() {
    return { RHYTHM_OBJ }
  },
  methods: {
    thisTick(i: number) {
      return this.tickIdx === i
    },
    change(i: number) {
      this.$emit('tickchange', i)
    },
  },
})
</script>
