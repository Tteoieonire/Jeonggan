<template>
  <b-modal id="exchange" title="불러오기/내보내기" @ok="send" @show="reset">
    <p>이 창의 내용을 복사하세요. 복사해둔 내용을 다시 이 창에 붙여넣고 OK 버튼을 누르면 작성한 정간보를 불러올 수 있습니다.</p>
    <b-form-textarea v-model="code" :rows="rows" :max-rows="rows"></b-form-textarea>
  </b-modal>
</template>

<script>
import { serializeMusic, deserializeMusic } from '../serializer.js'

export default {
  props: ['title', 'music'],
  data() {
    return {
      rows: 15,
      code: ''
    }
  },
  methods: {
    send() {
      const data = deserializeMusic(this.code)
      this.$emit('exchange', data.title, data.chapters)
    },
    reset() {
      this.code = this.yaml
    }
  },
  computed: {
    yaml() {
      const code = serializeMusic(this.title, this.music)
      this.code = code
      return code
    }
  },
  created() {
    this.code = this.yaml
  }
}
</script>