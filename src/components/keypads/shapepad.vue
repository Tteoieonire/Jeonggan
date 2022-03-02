<template>
  <b-button-group class="m-1">
    <b-button @click="add" :aria-label="'새' + label + '추가'">
      <svg
        class="icon"
        aria-hidden="true"
        role="img"
        :transform="transform"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          d="M2 19.5h20V22H2zm0-13v11h20v-11H2zM13 13v3h-2v-3H8v-2h3V8h2v3h3v2h-3zM2 2h20v2.5H2z"
        />
      </svg>
    </b-button>
    <b-button @click="del" :aria-label="'지금' + label + '삭제'">
      <svg
        class="icon"
        aria-hidden="true"
        role="img"
        :transform="transform"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          d="M2 19.5h20V22H2zm0-13v11h20v-11H2zm12.1 9L12 13.4l-2.1 2.1-1.4-1.4 2.1-2.1-2.1-2.1 1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1 2.1 2.1-1.4 1.4zM2 2h20v2.5H2z"
        />
      </svg>
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    for: { type: String as PropType<'col' | 'row'>, required: true }
  },
  emits: { shapechange: (type: 'row' | 'col', delta: 1 | -1) => true },
  methods: {
    add() {
      this.$emit('shapechange', this.for, +1)
    },
    del() {
      this.$emit('shapechange', this.for, -1)
    }
  },
  computed: {
    label() {
      return this.for === 'col' ? ' 열 ' : ' 행 '
    },
    transform() {
      return this.for === 'col' ? 'rotate(90)' : ''
    }
  }
})
</script>

<style scoped>
.icon {
  width: 1rem;
  height: 1rem;
  fill: white;
}
</style>
