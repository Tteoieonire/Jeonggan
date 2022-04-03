<template>
  <b-modal id="global" title="곡 설정" @ok="rename" @show="reset">
    <b-form-group label="곡 이름:">
      <b-form-input v-model="newTitle" type="text"></b-form-input>
    </b-form-group>
    <b-form-group label="MIDI 재생 악기:">
      <b-form-select
        v-model="newInstrument"
        :options="INSTRUMENTS"
      ></b-form-select>
    </b-form-group>
  </b-modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { InstrumentName } from 'soundfont-player'
import INSTRUMENTS from 'soundfont-player/names/fluidR3.json'

export default defineComponent({
  props: {
    title: { type: String, required: true },
    instrument: { type: String as PropType<InstrumentName>, required: true },
  },
  emits: { rename: (newTitle: string, newInstrument: InstrumentName) => true },
  data() {
    return {
      newTitle: '',
      newInstrument: 'acoustic_grand_piano' as InstrumentName,
      INSTRUMENTS,
    }
  },
  methods: {
    rename() {
      this.$emit('rename', this.newTitle, this.newInstrument)
    },
    reset() {
      this.newTitle = this.title
      this.newInstrument = this.instrument
    },
  },
})
</script>
