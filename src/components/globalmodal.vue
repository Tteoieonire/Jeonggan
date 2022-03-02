<template>
  <b-modal id="global" title="곡 설정" @ok="rename" @show="reset">
    <b-form-group label="곡 이름:">
      <b-form-input v-model="name" type="text"></b-form-input>
    </b-form-group>
  </b-modal>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: { title: { type: String, required: true } },
  emits: { rename: (name: string) => true },
  data() {
    return { name: '' }
  },
  methods: {
    rename() {
      this.$emit('rename', this.name)
    },
    reset() {
      this.name = this.title
    }
  }
})
</script>
