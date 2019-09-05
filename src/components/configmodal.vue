<template>
  <!-- 곡 설정 창 -->
  <b-modal id="setting" title="곡 설정" ok-only>
    <b-form-group label="곡명:">
      <b-form-input v-model="title" type="text"></b-form-input>
    </b-form-group>

    <b-form-group label="음계:">
      <b-form-checkbox-group buttons v-model="scale" name="yuls">
        <b-form-checkbox value="0" v-b-tooltip.hover title="황종">&#40643;</b-form-checkbox>
        <b-form-checkbox value="1" v-b-tooltip.hover title="대려">&#22823;</b-form-checkbox>
        <b-form-checkbox value="2" v-b-tooltip.hover title="태주">&#22826;</b-form-checkbox>
        <b-form-checkbox value="3" v-b-tooltip.hover title="협종">&#22846;</b-form-checkbox>
        <b-form-checkbox value="4" v-b-tooltip.hover title="고선">&#22993;</b-form-checkbox>
        <b-form-checkbox value="5" v-b-tooltip.hover title="중려">&#20210;</b-form-checkbox>
      </b-form-checkbox-group>

      <b-form-checkbox-group buttons v-model="scale" name="yuls">
        <b-form-checkbox value="6" v-b-tooltip.hover title="유빈">&#34148;</b-form-checkbox>
        <b-form-checkbox value="7" v-b-tooltip.hover title="임종">&#63988;</b-form-checkbox>
        <b-form-checkbox value="8" v-b-tooltip.hover title="이칙">&#22839;</b-form-checkbox>
        <b-form-checkbox value="9" v-b-tooltip.hover title="남려">&#21335;</b-form-checkbox>
        <b-form-checkbox value="10" v-b-tooltip.hover title="무역">&#28961;</b-form-checkbox>
        <b-form-checkbox value="11" v-b-tooltip.hover title="응종">&#25033;</b-form-checkbox>
      </b-form-checkbox-group>
    </b-form-group>
  </b-modal>
</template>

<script>
export default {
  props: ['value'],
  data() {
    return this.value
  }
}
</script>