<template>
  <b-btn-group
    size="lg"
    class="my-1 mx-auto gugak"
  >
    <b-btn
      v-for="(item, i) in RHYTHM_OBJ"
      :key="i"
      :aria-label="getLabel(item)"
      :pressed="thisTick(i)"
      @click="change(i)"
    >
      <span aria-hidden>{{ getText(item) }}</span>
    </b-btn>
  </b-btn-group>
</template>
  
<script>
import { RHYTHM_OBJ } from '../../constants.js'
export default {
  props: ['tickIdx'],
  data() {
    return { RHYTHM_OBJ }
  },
  methods: {
    getLabel(item) {
      return item || '빈칸'
    },
    getText(item) {
      return item || ''
    },
    thisTick(i) {
      return this.tickIdx == i
    },
    change(i) {
      this.$emit('tickchange', i)
    }
  }
}
</script>
