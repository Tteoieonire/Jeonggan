<template>
  <b-modal id="init" title="새로 만들기" @ok="init">
    <b-form-group label="곡 이름:">
      <b-form-input v-model="name" type="text"></b-form-input>
    </b-form-group>
  </b-modal>
</template>

<script>
export default {
  props: ['title'],
  data() {
    return {
      name: this.title,
    }
  },
  methods: {
    init() {
      this.$emit('init', this.name)
    }
  }
}
</script>