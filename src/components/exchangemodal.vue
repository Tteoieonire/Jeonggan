<template>
  <!-- 곡 설정 창 -->
  <b-modal id="exchange" title="불러오기/내보내기" @ok="send">
    <b-form-textarea
      v-model="yaml"
      :rows="rows"
      :max-rows="rows"
    ></b-form-textarea>
  </b-modal>
</template>

<script>
import { serializeMusic, deserializeMusic } from '../serializer.js'

export default {
  props: ['title', 'music'],
  data() {
    return {
      rows: 15,
      yaml: serializeMusic(this.title, this.music)
    }
  },
  methods: {
    send() {
      const data = deserializeMusic(this.yaml)
      console.log(data)
      debugger
      this.$emit('exchange', data.title, data.chapters)
    }
  }
}
</script>