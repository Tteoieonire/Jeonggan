<template>

    <b-button-toolbar key-nav aria-label="율명 또는 쉼표 입력">
      <b-button-group class="m-1">
        <b-btn variant='outline-primary' aria-label="옥타브 내림" @click='lower' :disabled='oct<=0'>亻</b-btn>
				
        <b-btn v-for='(yul, i) in yuls' :key='i'
					@click='note(i)'
					v-html='yul.text'
					:title='yul.label' v-b-tooltip.hover></b-btn>
					
        <b-btn variant='outline-primary' aria-label="옥타브 올림" @click='raise' :disabled='oct>=4'>氵</b-btn>
      </b-button-group>
			
      <b-button-group class="mx-1 my-1">
        <b-btn @click='rest' aria-label='쉼표'>△</b-btn>
      </b-button-group>
    </b-button-toolbar>
  
  </template>

<script>
export default {
  props: ['scale'],
  data: () => ({
    oct: 2,
  }),
  methods: {
    rest() {
      this.$emit('write', 'main', { text: '△', pitch: null, label: '쉼표' });
    },
    note(i) {
      var obj = { text: this.yuls[i].text, label: this.yuls[i].label };
      obj.pitch = this.oct * 12 + this.scale[i];
      this.$emit('write', 'main', obj);
    },
    lower() {
      if (this.oct > 0) this.oct--;
    },
    raise() {
      if (this.oct < 4) this.oct++;
    },
  },
  computed: {
    yuls() {
      const YULLYEO = [
        ['&#14580;', '&#14549;', '&#14550;', '&#14563;', '&#14568;', '&#14561;', '&#14584;', '&#14569;', '&#7475265761;', '&#14574;', '&#14579;', '&#14585;'],
        ['&#20697;', '&#13362;', '&#13376;', '&#20448;', '&#13420;', '&#13398;', '&#6656065581;', '&#13411;', '&#20359;', '&#13426;', '&#13447;', '&#13475;'],
        ['&#40643;', '&#22823;', '&#22826;', '&#22846;', '&#22993;', '&#20210;', '&#34148;', '&#63988;', '&#22839;', '&#21335;', '&#28961;', '&#25033;'],
        ['&#28514;', '&#27727;', '&#27760;', '&#28025;', '&#15628;', '&#15582;', '&#15755;', '&#28107;', '&#27935;', '&#28275;', '&#28501;', '&#15760;'],
        ['&#15746;', '&#8089665816;', '&#15602;', '&#15674;', '&#15688;', '&#15650;', '&#15769;', '&#15689;', '&#15651;', '&#15708;', '&#15747;', '&#15773;']
      ];
      const OCTAVE = ["하배", "배", "", "청", "중청"];
      const HANGEUL = ["황종", "대려", "태주", "협종", "고선", "중려",
        "유빈", "임종", "이칙", "남려", "무역", "응종"];
      var names = YULLYEO[this.oct]
      return this.scale.map(x => ({
        text: names[x],
        label: OCTAVE[this.oct] + HANGEUL[x],
      }));
    },
  }
}
</script>
