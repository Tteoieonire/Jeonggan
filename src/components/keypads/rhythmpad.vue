<template>
  <b-form-radio-group
    :checked="tickIdx"
    @change="change"
    buttons
    name="rhythms"
    size="lg"
    class="my-1 mx-auto gugak"
  >
    <b-form-radio
      v-for="(item, i) in RHYTHM_OBJ"
      :key="i"
      :value="i"
      :aria-label="getLabel(item)"
    >
      <span aria-hidden>{{ getText(item) }}</span>
    </b-form-radio>
  </b-form-radio-group>
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
    change(e) {
      this.$emit('tickchange', e)
    }
  }
}
</script>
