<template>
  <div @click.stop="moveTo" :class="{ cur: isCur }" class="col">
    <span class="gugak">{{ main }}</span>
    <span v-if="content?.modifier" class="gugak modifier">{{
      'text' in content?.modifier
        ? content?.modifier.text
        : content?.modifier.texts[0]
    }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import Cursor from '@/cursor'
import { Col } from '@/music'

export default defineComponent({
  props: {
    content: { type: Object as PropType<Col> },
    coord: { type: Object as PropType<Cursor>, required: true },
    cursor: { type: Object as PropType<Cursor> },
  },
  emits: { moveTo: (coord: Cursor) => true },
  methods: {
    moveTo() {
      this.$emit('moveTo', this.coord)
    },
  },
  computed: {
    main() {
      return this.content?.main?.text || '-'
    },
    isCur(): boolean {
      if (this.cursor == null) return false
      return this.cursor.isEqualTo(this.coord)
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
}

.cur {
  background-color: #aaf;
}

.modifier {
  font-size: 70%;
  vertical-align: 15%;
}
</style>
