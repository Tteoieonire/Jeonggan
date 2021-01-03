<template>
  <b-modal id="global" title="곡 설정" @ok="rename" @show="reset">
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
      name: '',
    }
  },
  methods: {
    rename() {
      this.$emit('rename', this.name)
    },
    reset() {
      this.name = this.title
    }
  }
}
</script>