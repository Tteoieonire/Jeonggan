<template>
  <div @click="moveOrSelectTo" :class="{ cur: isCur }" class="col" ref="col">
    <span class="gugak">{{ main }}</span>
    <span v-if="content.data.modifier" class="gugak">{{
      content.data.modifier.text
    }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import Cursor from '@/cursor'
import { Col } from '@/viewer'

export default defineComponent({
  props: {
    anchor: { type: Object as PropType<Cursor> },
    content: { type: Object as PropType<Col>, required: true },
    coord: { type: Object as PropType<Cursor>, required: true },
    cursor: { type: Object as PropType<Cursor> },
  },
  emits: { moveTo: (coord: Cursor) => true, selectTo: (coord: Cursor) => true },
  methods: {
    moveOrSelectTo(e: MouseEvent) {
      if (e.shiftKey) {
        this.$emit('selectTo', this.coord)
        return
      }
      if (this.anchor != null) {
        if (this.anchor.isEqualTo(this.coord, 'cell')) return
        if (this.cursor?.isEqualTo(this.coord, 'cell')) return
      }
      this.$emit('moveTo', this.coord)
    },
  },
  computed: {
    main() {
      return this.content.data.main?.text || '-'
    },
    isCur(): boolean {
      if (this.cursor == null) return false
      return this.cursor.isEqualTo(this.coord)
    },
  },
  watch: {
    isCur() {
      if ('col' in this.$refs)
        (this.$refs.col as any).scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
    },
  },
})
</script>

<style scoped>
.col {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  scroll-margin: 5rem 0 9rem;
}

.cur {
  background-color: #06f;
  color: white;
}
</style>
