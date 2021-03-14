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
function makeLabel(pitch) {
  const table = ['제 음의 세 음 아래', '제 음의 두 음 아래', '제 음의 한 음 아래', '제 음', '제 음의 한 음 위', '제 음의 두 음 위', '제 음의 세 음 위']
  pitch = pitch.split('')
  const digit = pitch.join(', ')
  const readout = pitch.map(n => table[n]).join(', ')
  return digit + ', ' + readout
}

const MAIN = [
  [{ text: '\u303B', label: '같은 음 반복', pitch: '3' }],
  [
    { text: '4', label: '4, 제 음의 한 음 위', pitch: '4' },
    { text: '5', label: '5, 제 음의 두 음 위', pitch: '5' },
    { text: '6', label: '6, 제 음의 세 음 위', pitch: '6' }
  ],
  [
    { text: '2', label: '2, 제 음의 한 음 아래', pitch: '2' },
    { text: '1', label: '1, 제 음의 두 음 아래', pitch: '1' },
    { text: '0', label: '0, 제 음의 세 음 아래', pitch: '0' }
  ],
  [
    { text: '43', label: '4, 3, 제 음의 한 음 위, 제 음', pitch: '43' },
    { text: '53', label: '5, 3, 제 음의 두 음 위, 제 음', pitch: '53' },
    { text: '23', label: '2, 3, 제 음의 한 음 아래, 제 음', pitch: '23' },
    { text: '13', label: '1, 3, 제 음의 두 음 아래, 제 음', pitch: '13' }
  ],
  [
    {
      text: '45',
      label: '4, 5, 제 음의 한 음 위, 제 음의 두 음 위',
      pitch: '45'
    },
    {
      text: '21',
      label: '2, 1, 제 음의 한 음 아래, 제 음의 두 음 아래',
      pitch: '21'
    },
    {
      text: '454',
      label: '4, 5, 4, 제 음의 한 음 위, 제 음의 두 음 위, 제 음의 한 음 위',
      pitch: '454'
    },
    {
      text: '212',
      label:
        '2, 1, 2, 제 음의 한 음 아래, 제 음의 두 음 아래, 제 음의 한 음 아래',
      pitch: '212'
    }
  ],
  [
    {
      text: '543',
      label: '5, 4, 3, 제 음의 두 음 위, 제 음의 한 음 위, 제 음',
      pitch: '543'
    },
    {
      text: '432',
      label: '4, 3, 2, 제 음의 한 음 위, 제 음, 제 음의 한 음 아래',
      pitch: '432'
    },
    {
      text: '210',
      label:
        '2, 1, 0, 제 음의 한 음 아래, 제 음의 두 음 아래, 제 음의 세 음 아래',
      pitch: '210'
    },
    {
      text: '54321',
      label:
        '5, 4, 3, 2, 1, 제 음의 두 음 위, 제 음의 한 음 위, 제 음, 제 음의 한 음 아래, 제 음의 두 음 아래',
      pitch: '54321'
    }
  ],
  [
    {
      text: '4323',
      label: '4, 3, 2, 3, 제 음의 한 음 위, 제 음, 제 음의 한 음 아래, 제 음',
      pitch: '4323'
    },
    {
      text: '2343',
      label: '2, 3, 4, 3, 제 음의 한 음 아래, 제 음, 제 음의 한 음 위, 제 음',
      pitch: '2343'
    },
    {
      text: '45435',
      label:
        '4, 5, 4, 3, 5, 제 음의 한 음 위, 제 음의 두 음 위, 제 음의 한 음 위, 제 음, 제 음의 두 음 위',
      pitch: '45435'
    }
  ]
]

const MODIFIER = [
  [{ text: '없애기', pitch: null, label: '시김새 없애기' }],
  [
    { text: '𝆔43', label: '4, 3, 제 음의 한 음 위, 제 음', pitch: '43' },
    { text: '𝆔53', label: '5, 3, 제 음의 두 음 위, 제 음', pitch: '53' },
    { text: '𝆔63', label: '6, 3, 제 음의 세 음 위, 제 음', pitch: '63' }
  ],
  [
    { text: '𝆔23', label: '2, 3, 제 음의 한 음 아래, 제 음', pitch: '23' },
    { text: '𝆔13', label: '1, 3, 제 음의 두 음 아래, 제 음', pitch: '13' },
    { text: '𝆔03', label: '0, 3, 제 음의 세 음 아래, 제 음', pitch: '03' }
  ],
  [
    {
      text: '𝆔343',
      label: '3, 4, 3, 제 음, 제 음의 한 음 위, 제 음',
      pitch: '343'
    },
    {
      text: '𝆔353',
      label: '3, 5, 3, 제 음, 제 음의 두 음 위, 제 음',
      pitch: '353'
    },
    {
      text: '𝆔323',
      label: '3, 2, 3, 제 음, 제 음의 한 음 아래, 제 음',
      pitch: '323'
    },
    {
      text: '𝆔313',
      label: '3, 1, 3, 제 음, 제 음의 두 음 아래, 제 음',
      pitch: '313'
    }
  ],
  [
    {
      text: '𝆔143',
      label: '1, 4, 3, 제 음의 두 음 아래, 제 음의 한 음 위, 제 음',
      pitch: '143'
    },
    {
      text: '𝆔243',
      label: '2, 4, 3, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음',
      pitch: '243'
    },
    {
      text: '𝆔3243',
      label: '3, 2, 4, 3, 제 음, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음',
      pitch: '3243'
    },
    {
      text: '𝆔24243',
      label:
        '2, 4, 2, 4, 3, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음',
      pitch: '24243'
    },
    {
      text: '𝆔243243',
      label:
        '2, 4, 3, 2, 4, 3, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음, 제 음의 한 음 아래, 제 음의 한 음 위, 제 음',
      pitch: '243243'
    }
  ],

  [
    {
      pitch: '232',
      text: 'I',
      label: '앞뒤 2, 제 음의 앞뒤로 제 음의 한 음 아래'
    },
    {
      pitch: '434',
      text: 'H',
      label: '앞뒤 4, 제 음의 앞뒤로 제 음의 한 음 위'
    }
  ],
  [
    {
      text: '343',
      tall: true,
      label: '3, 4, 3, 균등, 제 음, 제 음의 한 음 위, 제 음을 균등하게',
      pitch: '343'
    },
    {
      text: '323',
      tall: true,
      label: '3, 2, 3, 균등, 제 음, 제 음의 한 음 아래, 제 음을 균등하게',
      pitch: '323'
    },
    {
      text: '353',
      tall: true,
      label: '3, 5, 3, 균등, 제 음, 제 음의 두 음 위, 제 음을 균등하게',
      pitch: '353'
    },
    {
      text: '313',
      tall: true,
      label: '3, 1, 3, 균등, 제 음, 제 음의 두 음 아래, 제 음을 균등하게',
      pitch: '313'
    }
  ]
]

export { MAIN, MODIFIER }
export function querySymbol(where, pitch) {
  if (pitch === '3') return MAIN[0][0]
  let text = pitch
  if (where === 'modifier') {
    const HASH = {"43":[1,0],"53":[1,1],"63":[1,2],"23":[2,0],"13":[2,1],"03":[2,2],"343":[3,0],"353":[3,1],"323":[3,2],"313":[3,3],"143":[4,0],"243":[4,1],"3243":[4,2],"24243":[4,3],"243243":[4,4],"I":[5,0],"H":[5,1], "=":[6,0],"==":[6,1],"===":[6,2],"====":[6,3]}
    const reply = HASH[pitch]
    if (reply) return MODIFIER[reply[0]][reply[1]]
    text = "𝆔" + pitch
  }
  return {
    text: text,
    pitch: pitch,
    label: makeLabel(pitch)
  }
}

// Focusable??
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
      return this.type === 'main' ? MAIN : MODIFIER
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
