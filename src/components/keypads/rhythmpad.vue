<template>
  <b-form-radio-group
    :checked="value"
    @change="change"
    buttons
    name="rhythms"
    size="lg"
    class="my-1 mx-auto gugak"
  >
    <b-form-radio
      v-for="(item, i) in RHYTHM_OBJ"
      :key="i"
      :value="item"
      :aria-label="getLabel(item)"
    >
      <span aria-hidden>{{ getText(item) }}</span>
    </b-form-radio>
  </b-form-radio-group>
</template>
  
<script>
// 되긴 될까?? event가 다르지 않을까?
import { RHYTHM_OBJ } from '../../constants.js'
export default {
  props: ['value'],
  data() {
    return { RHYTHM_OBJ }
  },
  methods: {
    getLabel(item) {
      return item ? item.label : '빈칸'
    },
    getText(item) {
      return item ? item.text : ''
    },
    change(e) {
      this.$emit('input', e)
    }
  }
}
</script>
