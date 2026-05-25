<template>
  <b-modal id="init" title="새로 만들기" @ok="init">
    <b-form-group label="곡 이름:">
      <b-form-input v-model="name" type="text"></b-form-input>
    </b-form-group>
  </b-modal>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: { title: { type: String, required: true } },
  emits: { init: (name: string) => true },
  data() {
    return {
      name: this.title,
    }
  },
  methods: {
    init() {
      this.$emit('init', this.name)
    },
  },
})
</script>
