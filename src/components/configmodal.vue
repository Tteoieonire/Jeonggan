<template>
  <!-- 곡 설정 창 -->
  <b-modal
    id="configmodal"
    title="장 설정"
    @ok="confirm"
    @show="reset"
    :ok-disabled="gakLength === 0"
  >
    <b-form-group label="장 이름:">
      <b-form-input v-model="name" type="text"></b-form-input>
    </b-form-group>

    <b-form-group label="빠르기:">
      <b-input-group prepend="분당" append="정간">
        <b-form-input v-model="tempo" type="number" min="0"></b-form-input>
      </b-input-group>
    </b-form-group>

    <b-form-group label="첫 정간 위치:">
      <b-input-group append="칸 띄우기">
        <b-form-input
          v-model="padding"
          type="number"
          min="0"
          :max="gakLength - 1"
        ></b-form-input>
      </b-input-group>
    </b-form-group>

    <b-form-group label="장단:">
      <b-input-group>
        <b-form-checkbox v-model="hideRhythm">장단 숨기기</b-form-checkbox>
      </b-input-group>
    </b-form-group>

    <b-form-group label="대강:">
      <div v-for="(subdivision, i) in measure" :key="i">
        <b-input-group append="칸">
          <b-button
            aria-label="대강 빼기"
            @click="deleteSubdivision(i)"
            variant="outline-danger"
          >
            <font-awesome-icon icon="xmark" />
          </b-button>
          <b-form-input
            v-model="measure[i]"
            type="number"
            min="0"
          ></b-form-input>
        </b-input-group>
      </div>
      <b-button
        @click="addSubdivision"
        style="width: 100%"
        variant="outline-secondary"
        ><font-awesome-icon icon="plus" /> 대강 추가</b-button
      >
    </b-form-group>

    <b-form-group label="음계:">
      <b-form-checkbox-group
        buttons
        v-model="scale"
        :options="yuls"
        name="yuls"
        class="yuls"
      ></b-form-checkbox-group>
    </b-form-group>

    <b-form-group label="장 관리:">
      <b-button variant="danger" @click="deletechapter" v-b-modal.configmodal
        >삭제</b-button
      >
    </b-form-group>
  </b-modal>
</template>

<style>
.yuls {
  width: 18rem;
  display: flex;
  flex-wrap: wrap;
}
.yuls * {
  margin: 0;
}
</style>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import { YUL_OBJ } from '../constants'
import { Config } from '../viewer'

const YULS = YUL_OBJ[3].map(x => ({ text: x.text, value: x.label }))
const SCALE = YUL_OBJ[3].map(x => x.label)

export default defineComponent({
  props: { config: { type: Object as PropType<Config>, required: true } },
  emits: {
    configchange: (config: Config, visible: boolean) => true,
    deletechapter: () => true,
  },
  data() {
    return {
      name: '',
      tempo: 0,
      measure: [0],
      padding: 0,
      hideRhythm: false,
      scale: ['황종'],
      yuls: YULS,
    }
  },
  methods: {
    addSubdivision() {
      this.measure.push(0)
    },
    deleteSubdivision(i: number) {
      this.measure.splice(i, 1)
      if (this.measure.length === 0) this.measure.push(0)
    },
    confirm() {
      let rhythm = JSON.parse(JSON.stringify(this.config.rhythm))
      if (rhythm.length > this.gakLength)
        rhythm = rhythm.slice(0, this.gakLength)
      while (rhythm.length < this.gakLength) rhythm.push([''])

      const config: Config = {
        name: this.name,
        tempo: +this.tempo,
        measure: this.measure.map(Number),
        padding: +this.padding,
        hideRhythm: this.hideRhythm,
        scale: this.scale
          .map(x => SCALE.indexOf(x))
          .sort((a: number, b: number) => a - b),
        rhythm,
      }
      this.$emit('configchange', config, true)
    },
    reset() {
      if (!this.config) return
      this.name = this.config.name
      this.tempo = this.config.tempo
      this.measure = this.config.measure.slice()
      this.padding = this.config.padding
      this.hideRhythm = this.config.hideRhythm
      this.scale = this.config.scale.map(i => SCALE[i])
    },
    deletechapter() {
      this.$emit('deletechapter')
    },
  },
  computed: {
    gakLength() {
      return this.measure.reduce((a, b) => +a + +b, 0)
    },
  },
  watch: {
    config() {
      this.reset()
    },
  },
  created() {
    this.reset()
  },
})
</script>
