<template>
  <b-container style="height: 100%">
    <b-row
      v-for="(row, r) in cell"
      :key="r"
      :style="getRowStyle(row)"
      align-v="center"
      class="myrow"
    >
      <b-col
        v-for="(col, c) in row"
        :key="c"
        :class="{cur: thisCol(r, c)}"
        @click.stop="move(r, c)"
      >
        <span class="gugak">{{getMain(col)}}</span>
        <span v-if="col && col.modifier" class="gugak modifier">{{ col.modifier.text }}</span>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  props: ['thisCell', 'cursor', 'cell'],
  methods: {
    getRowStyle(row) {
      const longest = Math.max(this.cell.length, row.length)
      return {
        fontSize: 1.5 * Math.exp(-0.2 * longest) + 'em',
        height: 100 / this.cell.length + '%'
      }
    },
    getMain(col) {
      return col && col.main ? col.main.text : '-'
    },
    move(r, c) {
      this.$emit('move', r, c)
    },
    thisCol(r, c) {
      if (!this.thisCell) return false
      return this.cursor.row === r && this.cursor.col === c
    }
  }
}
</script>

<style>
.myrow {
  width: 3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: justify;
  text-align-last: center;
  /**/
}

.myrow > * {
  padding: 0;
}

.cur {
  background-color: darkblue;
}

.modifier {
  font-size: 70%;
  margin-left: -0.3em;
  vertical-align: 10%;
}
</style>
