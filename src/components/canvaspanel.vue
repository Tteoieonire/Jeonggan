<template>
  <div>
    <!-- 장단 -->
    <b-list-group class="gak rhythm" aria-label="장단 각">
      <!--div class="befgak"></div-->
      <b-list-group-item
        v-for="(tick, j) in rhythm"
        :key="j"
        :active="this_tick(j)"
        :aria-label="tick || '빈칸'"
        @click="moveRhythm(j)"
        class="gugak"
        variant="info"
        button
      >
        <span aria-hidden>{{ tick || '' }}</span>
      </b-list-group-item>
    </b-list-group>

    <!-- 일반 각 -->
    <div v-for="(gaks, k) in view" :key="k" class="chapter">
      <b-list-group v-for="(gak, i) in gaks" :key="i" :aria-label="getGakLabel(i)" class="gak">
        <b-list-group-item
          v-for="(cell, j) in gak"
          button
          :key="j"
          :active="this_cell(k, calc_cell(gaks, i, j))"
          @click="move(k, calc_cell(gaks, i, j), 0, 0)"
        >
          <cell
            v-if="cell"
            :this_cell="this_cell(k, calc_cell(gaks, i, j))"
            :cursor="cursor"
            :cell="cell"
            @move="(r, c) => move(k, calc_cell(gaks, i, j), r, c)"
          ></cell>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>

<script>
import cell from './cell.vue'

export default {
  props: ['cursor', 'rhythm', 'view'],
  methods: {
    getGakLabel(i) {
      return i + 1 + '각'
    },
    calc_cell(gaks, i, j) {
      return gaks[0].length * i + j
    },
    this_cell(k, j) {
      if (this.cursor.rhythmMode) return false
      return this.cursor.chapter === k && this.cursor.cell === j
    },
    this_tick(j) {
      return this.cursor.rhythmMode && this.cursor.cell === j
    },
    move(chapter, cell, row, col) {
      this.$emit('move', chapter, cell, row, col)
    },
    move_fallback(cell, k, c) {
      if (!cell) this.move(k, c, 0, 0)
    },
    moveRhythm(j) {
      this.$emit('moveRhythm', j)
    }
  },
  components: {
    cell
  }
}
</script>

<style>
.gak {
  float: right;
  width: 3rem;
  margin-left: 1rem;
}

.gak > * {
  height: 3.5rem;
  padding: 0;
}

.befgak {
  height: 2rem;
  margin-bottom: 0.5rem;
}

.rhythm {
  position: sticky;
  right: 0;
}

.rhythm > * {
  font-size: 1.5rem;
  line-height: 3.5rem;
  text-align: center;
}
</style>