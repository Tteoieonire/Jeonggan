<template>
  <div class="wrapper" :style="{height}">
    <div class="margin">
      <div v-if="gak.isFirst">
        <b-btn variant="link" @click="openconfig" v-b-modal.configmodal>
          <i class="fas fa-wrench" :title="title + ' 설정'"></i>
        </b-btn>
        <span class="title">{{ gak.title }}</span>
      </div>
    </div>

    <!-- 장단 -->
    <b-list-group v-if="gak.rhythm" class="gak rhythm" :aria-label="label">
      <b-list-group-item
        v-for="(tick, i) in gak.content"
        :key="i"
        :active="thisCell(i, true)"
        @click="moveRhythm(i)"
        tabindex="-1"
        class="gugak"
        variant="info"
        button
      >{{ tick || '' }}</b-list-group-item>
    </b-list-group>

    <!-- 일반 각 -->
    <b-list-group v-else class="gak" :aria-label="label">
      <b-list-group-item
        v-for="(cell, i) in gak.content"
        button
        :key="i"
        :active="thisCell(i, false)"
        @click="move(i, 0, 0)"
        tabindex="-1"
      >
        <cell
          v-if="cell"
          :thisCell="thisCell(i, false)"
          :cursor="cursor"
          :cell="cell"
          @move="(r, c) => move(i, r, c)"
        ></cell>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import cell from './cell.vue'

export default {
  props: ['cursor', 'gak', 'maxMeasure'],
  methods: {
    thisCell(cell, rhythmMode) {
      if (!rhythmMode) {
        cell += this.gak.gakIndex * this.gak.measure
      }
      return (
        this.cursor.rhythmMode === rhythmMode &&
        this.cursor.chapter === this.gak.chapterIndex &&
        this.cursor.cell === cell
      )
    },
    move(cell, row, col) {
      cell += this.gak.gakIndex * this.gak.measure
      this.$emit('move', this.gak.chapterIndex, cell, row, col)
    },
    moveRhythm(cell) {
      this.$emit('moveRhythm', this.gak.chapterIndex, cell)
    },
    openconfig() {
      this.$emit('openconfig', this.gak.chapterIndex)
    }
  },
  computed: {
    title() {
      return this.gak.title || this.gak.chapterIndex + 1 + '장'
    },
    label() {
      if (this.gak.rhythm) {
        return this.title + ' 장단'
      } else {
        return this.title + ' ' + (this.gak.gakIndex + 1) + '각'
      }
    },
    height() {
      return 7 + 3.5 * this.maxMeasure + 'rem'
    }
  },
  components: {
    cell
  }
}
</script>

<style>
.wrapper {
  width: 4rem;
  float: right;
  background-color: beige;
  overflow: hidden;
}

.margin {
  width: 100%;
  height: 7rem;
  text-align: center;
  background-color: white;
}

.title {
  height: 4rem;
  text-align: left;
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.gak {
  width: 3rem;
  margin: 0 auto;
}

.gak > * {
  height: 3.5rem;
  padding: 0;
}

.rhythm {
}

.rhythm > * {
  font-size: 1.5rem;
  line-height: 3.5rem;
  text-align: center;
}
</style>