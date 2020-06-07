<template>
  <!-- 곡 설정 창 -->
  <b-modal id="configmodal" title="장 설정" @ok="confirm" @show="reset">
    <b-form-group label="장 이름:">
      <b-form-input v-model="name" type="text"></b-form-input>
    </b-form-group>

    <b-form-group label="빠르기:">
      <b-input-group prepend="분당" append="정간">
        <b-form-input v-model="tempo" type="number"></b-form-input>
      </b-input-group>
    </b-form-group>

    <b-form-group label="각 길이:">
      <b-input-group append="칸">
        <b-form-input v-model="measure" type="number"></b-form-input>
      </b-input-group>
    </b-form-group>

    <b-form-group label="음계:">
      <b-form-checkbox-group buttons v-for="(row, r) in yuls" :key="r" v-model="scale" name="yuls">
        <b-form-checkbox
          v-for="(yul, i) in row"
          :key="yul.label"
          :value="i + 6 * r"
          :title="yul.label"
          v-b-tooltip.hover
        >{{yul.text}}</b-form-checkbox>
      </b-form-checkbox-group>
    </b-form-group>

    <b-form-group label="장 관리:">
      <b-btn variant="danger" @click="deletechapter">삭제</b-btn>
    </b-form-group>
  </b-modal>
</template>

<script>
import { YUL_OBJ } from '../constants.js'

const YULS = [YUL_OBJ[2].slice(0, 6), YUL_OBJ[2].slice(6, 12)]

export default {
  props: ['config'],
  data() {
    return {
      name: '',
      tempo: 0,
      measure: 0,
      padding: 0,
      scale: [],
      yuls: YULS
    }
  },
  methods: {
    confirm() {
      let rhythm = this.config.rhythm && this.config.rhythm.slice()
      if (rhythm) {
        rhythm.length = this.measure
        rhythm = JSON.parse(JSON.stringify(rhythm))
      }
      this.$emit('configchange', {
        name: this.name,
        tempo: this.tempo,
        measure: this.measure,
        padding: this.padding,
        scale: this.scale.map(Number).sort((a, b) => a - b),
        rhythm: rhythm
      })
    },
    reset() {
      if (!this.config) return
      this.name = this.config.name
      this.tempo = +this.config.tempo
      this.measure = +this.config.measure
      this.padding = +this.config.padding
      this.scale = this.config.scale.slice()
    },
    deletechapter() {
      this.$emit('deletechapter')
      this.$root.$emit('bv::hide::modal', 'configmodal')
    }
  },
  watch: {
    config() {
      this.reset()
    }
  },
  created() {
    this.reset()
  }
}
</script>