<template>
  <b-modal id="global" title="곡 설정" @ok="rename" @show="reset">
    <b-form-group label="곡 이름:">
      <b-form-input v-model="name" type="text"></b-form-input>
    </b-form-group>
    각 장마다 다르게 적용되는 설정은 각 장 첫 각 위쪽에 있는 공구(<i class="fas fa-wrench"></i>) 버튼을 눌러 설정할 수 있습니다.
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