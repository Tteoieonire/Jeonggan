<template>

<b-dropdown text="부호" class='m-1' dropup>
  <b-container>
    <b-row role="group" v-for='(group, i) in SYMBOL' :key='i'>
      <b-col class='p-0' v-for='(obj, j) in group' :key='j'>
        <b-dropdown-item-btn
        class='gugak px-2' @click="write(obj)"
        :aria-label="obj.label">
          <span aria-hidden='true'>{{ obj.text }}</span>
        </b-dropdown-item-btn>
      </b-col>
    </b-row>
  </b-container>
</b-dropdown>

</template>

<script>
export default {
  data: () => ({// Focusable??
    SYMBOL: [
      [{ "text": "4", "label": "4, 제 음의 한 음 위" }, { "text": "5", "label": "5, 제 음의 두 음 위" }, { "text": "6", "label": "6, 제 음의 세 음 위" }],
      [{ "text": "2", "label": "2, 제 음의 한 음 아래" }, { "text": "1", "label": "1, 제 음의 두 음 아래" }, { "text": "0", "label": "0, 제 음의 세 음 아래" }],
      [{ "text": "43", "label": "4, 3, 제 음의 한 음 위, 제 음" }, { "text": "53", "label": "5, 3, 제 음의 두 음 위, 제 음" }, { "text": "23", "label": "2, 3, 제 음의 한 음 아래, 제 음" }, { "text": "13", "label": "1, 3, 제 음의 두 음 아래, 제 음" },],
      [{ "text": "45", "label": "4, 5, 제 음의 한 음 위, 제 음의 두 음 위" }, { "text": "21", "label": "2, 1, 제 음의 한 음 아래, 제 음의 두 음 아래" }],
      [{ "text": "543", "label": "5, 4, 3, 제 음의 두 음 위, 제 음의 한 음 위, 제 음" }, { "text": "432", "label": "4, 3, 2, 제 음의 한 음 위, 제 음, 제 음의 한 음 아래" }, { "text": "210", "label": "2, 1, 0, 제 음의 한 음 아래, 제 음의 두 음 아래, 제 음의 세 음 아래" }],
      [{ "text": "4323", "label": "4, 3, 2, 3, 제 음의 한 음 위, 제 음, 제 음의 한 음 아래, 제 음" }, { "text": "2343", "label": "2, 3, 4, 3, 제 음의 한 음 아래, 제 음, 제 음의 한 음 위, 제 음" }, { "text": "45435", "label": "4, 5, 4, 3, 5, 제 음의 한 음 위, 제 음의 두 음 위, 제 음의 한 음 위, 제 음, 제 음의 두 음 위" }]
    ],
  }),
  methods: {
    write(obj) {
      obj.pitch = obj.text;
      this.$emit('write', 'main', obj);
    },
  },
}
</script>
