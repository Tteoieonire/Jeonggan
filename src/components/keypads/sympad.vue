<template>
  <b-button-group class="m-1 aaa">
    <b-dropdown :text="label" dropup :disabled="disabled" @keydown.stop>
      <div v-for="(group, i) in SYMBOL" :key="i" class="sympad-flex">
        <b-dropdown-item-button
          v-for="(obj, j) in group"
          @click="write(obj)"
          @keydown.stop
          :key="j"
        >
          <div class="gugak" :aria-label="obj.label">
            <span aria-hidden="true">{{
              'text' in obj ? obj.text : obj.texts[0]
            }}</span>
          </div>
        </b-dropdown-item-button>
      </div>
    </b-dropdown>

    <b-button-group vertical v-if="type === 'modifier'">
      <b-button
        class="btn-half gugak"
        :disabled="disabled || !trillShow?.before"
        :pressed="trill?.before"
        @click="toggleTrillBefore"
        aria-label="앞에 굴리기"
      >
        <span aria-hidden="true">~</span>
      </b-button>
      <b-button
        class="btn-half gugak"
        :disabled="disabled || !trillShow?.after"
        :pressed="trill?.after"
        @click="toggleTrillAfter"
        aria-label="뒤에 굴리기"
      >
        <span aria-hidden="true">~</span>
      </b-button>
    </b-button-group>
  </b-button-group>
</template>

<style>
.sympad-flex {
  display: flex;
}

.sympad-flex > * {
  flex-grow: 1;
  padding: 0.2rem 0 !important;
  text-align: center !important;
}

.btn-half {
  padding: 0rem 0.5rem !important;
  line-height: 50% !important;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}
</style>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import {
  MainEntry,
  ModifierEntry,
  querySymbol,
  TrillState,
} from '../../symbols'

const frame_main = [
  ['3'],
  ['4', '5', '6'],
  ['2', '1', '0'],
  ['43', '53', '23', '13'],
  ['45', '21', '454', '212'],
  ['543', '432', '210', '54321'],
  ['4323', '2343', '45435'],
]

const frame_modifier = [
  [
    {
      text: '없애기',
      label: '시김새 없애기',
    },
  ],
  ['43', '53', '63'],
  ['23', '13', '03'],
  ['343', '353', '323', '313'],
  ['243', '3243', '24243', '243243'],
  ['I', 'H', '143'],
  ['=', '==', '===', '===='],
]

// TODO: Focusable??

export default defineComponent({
  props: {
    type: {
      type: String as PropType<'main' | 'modifier'>,
      required: true,
    },
    sigimShow: { type: Boolean },
    trillShow: { type: Object as PropType<TrillState> },
    trill: { type: Object as PropType<TrillState> },
  },
  emits: {
    write: (type: 'main' | 'modifier', obj?: MainEntry | ModifierEntry) => true,
    trillchange: (trillState: TrillState) => true,
  },
  methods: {
    write(obj?: MainEntry | ModifierEntry) {
      if (obj && !('pitch' in obj) && !('pitches' in obj)) obj = undefined
      this.$emit('write', this.type, obj)
    },
    toggleTrillBefore() {
      this.$emit('trillchange', {
        before: !this.trill?.before,
        after: this.trill?.after,
      })
    },
    toggleTrillAfter() {
      this.$emit('trillchange', {
        before: this.trill?.before,
        after: !this.trill?.after,
      })
    },
  },
  computed: {
    SYMBOL() {
      const frame = this.type === 'main' ? frame_main : frame_modifier

      return frame.map(row =>
        row.map(s => (typeof s === 'string' ? querySymbol(this.type, s) : s))
      )
    },
    label() {
      return this.type === 'main' ? '부호' : '시김새'
    },
    disabled() {
      return this.type === 'modifier' && !this.sigimShow
    },
  },
})
</script>
