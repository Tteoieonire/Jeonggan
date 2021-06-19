<template>
  <b-button-group class="m-1">
    <b-dropdown :text="label" dropup :disabled="disabled">
      <b-container>
        <b-row role="group" v-for="(group, i) in SYMBOL" :key="i">
          <b-col class="p-0" v-for="(obj, j) in group" :key="j">
            <b-dropdown-item-btn
              class="gugak sympad-item"
              @click="write(obj)"
              :aria-label="obj.label"
            >
              <span aria-hidden="true">{{ obj.text }}</span>
            </b-dropdown-item-btn>
          </b-col>
        </b-row>
      </b-container>
    </b-dropdown>

    <b-button-group vertical v-if="type === 'modifier'">
      <b-btn
        class="btn-half gugak"
        :disabled="disabled || !trillShow.before"
        :pressed="trill.before"
        @click="toggleTrillBefore"
      >
        ~
      </b-btn>
      <b-btn
        class="btn-half gugak"
        :disabled="disabled || !trillShow.after"
        :pressed="trill.after"
        @click="toggleTrillAfter"
      >
        ~
      </b-btn>
    </b-button-group>
  </b-button-group>
</template>

<style>
.sympad-item * {
  padding: 0.2rem 0 !important;
  text-align: center !important;
}

.btn-half {
  padding: 0rem 0.75rem !important;
  font-size: 0.5rem !important;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}
</style>

<script>
import { querySymbol } from '../../symbols'

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
      pitch: null,
    },
  ],
  ['43', '53', '63'],
  ['23', '13', '03'],
  ['343', '353', '323', '313'],
  ['143', '243', '3243', '24243', '243243'],
  ['I', 'H'],
  ['=', '==', '===', '===='],
]

// TODO: Focusable??
export default {
  props: ['type', 'sigimShow', 'trillShow', 'trill'],
  methods: {
    write(obj) {
      if (obj.pitch == null) obj = undefined
      this.$emit('write', this.type, obj)
    },
    toggleTrillBefore() {
      this.$emit('trillchange', {
        before: !this.trill.before,
        after: this.trill.after,
      })
    },
    toggleTrillAfter() {
      this.$emit('trillchange', {
        before: this.trill.before,
        after: !this.trill.after,
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
}
</script>
