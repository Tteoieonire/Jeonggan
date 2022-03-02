<template>
  <b-button-group class="m-1">
    <b-button @click="add" aria-label="새 정간 추가">
      <svg
        class="icon"
        aria-hidden="true"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          d="M18 6H6v12h12V6zm-2 7h-3v3h-2v-3H8v-2h3V8h2v3h3v2zm4-13v2H4V0H2v24h2v-2h16v2h2V0h-2zm0 20H4V4h16v16z"
        />
      </svg>
    </b-button>
    <b-button @click="del" aria-label="이 정간 삭제">
      <svg
        class="icon"
        aria-hidden="true"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          d="M18 6H6v12h12V6zm-2.5 3.9L13.4 12l2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1-2.1-2.1 1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4zM20 0v2H4V0H2v24h2v-2h16v2h2V0h-2zm0 20H4V4h16v16z"
        />
      </svg>
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: { shapechange: (type: 'cell', delta: 1 | -1) => true },
  methods: {
    add() {
      this.$emit('shapechange', 'cell', +1)
    },
    del() {
      this.$emit('shapechange', 'cell', -1)
    },
  },
})
</script>

<style scoped>
.icon {
  width: 1rem;
  height: 1rem;
  fill: white;
}
</style>
