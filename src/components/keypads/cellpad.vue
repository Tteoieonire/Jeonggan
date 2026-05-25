<template>
  <b-button-group class="m-1">
    <b-button @click="add" :aria-label="addLabel">
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
    <b-button @click="del" :aria-label="deleteLabel">
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

import {
  shapePadAriaLabel,
  shapePadChange,
  type ShapePadDelta,
} from '@/features/shape-pad'

export default defineComponent({
  emits: { 'shape-change': (type: 'cell', delta: ShapePadDelta) => true },
  methods: {
    add() {
      const [type, delta] = shapePadChange('cell', +1)
      this.$emit('shape-change', type, delta)
    },
    del() {
      const [type, delta] = shapePadChange('cell', -1)
      this.$emit('shape-change', type, delta)
    },
  },
  computed: {
    addLabel() {
      return shapePadAriaLabel('cell', +1)
    },
    deleteLabel() {
      return shapePadAriaLabel('cell', -1)
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
