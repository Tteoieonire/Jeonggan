<template>
  <!-- 곡 설정 창 -->
  <b-modal id="config" title="장 설정" @ok="confirm">
    <b-form-group label="장 이름:">
      <b-form-input v-model="name" type="text"></b-form-input>
    </b-form-group>

    <b-form-group label="빠르기:">
      <b-input-group prepend="분당" append="정간">
        <b-form-input v-model="tempo" type="number"></b-form-input>
      </b-input-group>
    </b-form-group>

    <b-form-group label="음계:">
      <b-form-checkbox-group v-for="(row, r) in yuls" :key="r" buttons v-model="scale" name="yuls">
        <b-form-checkbox
          v-for="(yul, i) in row"
          :key="yul.label"
          :value="i + r * 6"
          :title="yul.label"
          v-html="yul.text"
          v-b-tooltip.hover
        ></b-form-checkbox>
      </b-form-checkbox-group>
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
      name: this.config && this.config.name,
      tempo: this.config && this.config.tempo,
      measure: this.config && this.config.measure,
      scale: this.config && this.config.scale.slice(),
      padding: this.config && this.config.padding,
      yuls: YULS
    }
  },
  methods: {
    confirm() {
      const rhythm = this.config.rhythm && this.config.rhythm.slice()
      if (rhythm) rhythm.length = this.measure
      this.$emit('configchange', {
        name: this.name,
        tempo: this.tempo,
        measure: this.measure,
        padding: this.padding,
        scale: this.scale.sort(),
        rhythm: rhythm // change length accordingly
      })
    }
  }
}
</script>