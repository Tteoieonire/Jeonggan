<template>
  <b-button-group class="m-1" aria-label="선택 영역 입력">
    <b-button
      class="gugak"
      :disabled="!canApplyPairedDurationMark"
      :pressed="activePairedDurationMark === 'long-short'"
      @click="longshortdurationmark"
      aria-label="덧길이 반길이"
      title="덧길이 반길이"
      v-b-tooltip.hover.body
    >
      <span aria-hidden="true">덧길이표 반길이표</span>
    </b-button>
    <b-button
      class="gugak"
      :disabled="!canApplyPairedDurationMark"
      :pressed="activePairedDurationMark === 'half-long'"
      @click="halflongdurationmark"
      aria-label="반길이 덧길이"
      title="반길이 덧길이"
      v-b-tooltip.hover.body
    >
      <span aria-hidden="true">반길이표 덧길이표</span>
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    canApplyPairedDurationMark: { type: Boolean, required: true },
    activePairedDurationMark: {
      type: String as PropType<'long-short' | 'half-long'>,
    },
  },
  emits: {
    'long-short-duration-mark': () => true,
    'half-long-duration-mark': () => true,
  },
  methods: {
    longshortdurationmark() {
      this.$emit('long-short-duration-mark')
    },
    halflongdurationmark() {
      this.$emit('half-long-duration-mark')
    },
  },
})
</script>
