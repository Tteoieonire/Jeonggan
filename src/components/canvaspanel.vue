<template>
  <div>
    <div v-for="(chapter, k) in view" :key="k" class="chapter">
      <div class="margin">
        <div>
          <b-btn variant="link" @click="openconfig(k)" v-b-modal.configmodal>
            <i class="fa fa-wrench" title="장 설정"></i>
          </b-btn>
        </div>
        <span class="title">{{ chapter.config.name }}</span>
      </div>
      <!-- 장단 -->
      <b-list-group v-if="chapter.config.rhythm" class="gak rhythm" aria-label="장단 각">
        <b-list-group-item
          v-for="(tick, j) in chapter.config.rhythm"
          :key="j"
          :active="this_cell(true, k, j)"
          @click="moveRhythm(k, j)"
          tabindex="-1"
          class="gugak"
          variant="info"
          button
        >{{ tick || '' }}</b-list-group-item>
      </b-list-group>

      <!-- 일반 각 -->
      <b-list-group
        v-for="(gak, i) in chapter.gaks"
        :key="i"
        :aria-label="getGakLabel(i)"
        class="gak"
      >
        <b-list-group-item
          v-for="(cell, j) in gak"
          button
          :key="j"
          :active="this_cell(false, k, j + i * chapter.config.measure)"
          @click="move(k, j + i * chapter.config.measure, 0, 0)"
          tabindex="-1"
        >
          <cell
            v-if="cell"
            :this_cell="this_cell(false, k, j + i * chapter.config.measure)"
            :cursor="cursor"
            :cell="cell"
            @move="(r, c) => move(k, j + i * chapter.config.measure, r, c)"
          ></cell>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>

<script>
import cell from './cell.vue'

export default {
  props: ['cursor', 'view'],
  methods: {
    getGakLabel(i) {
      return i + 1 + '각'
    },
    this_cell(rhythmMode, chapter, cell) {
      return (
        this.cursor.rhythmMode === rhythmMode &&
        this.cursor.chapter === chapter &&
        this.cursor.cell === cell
      )
    },
    move(chapter, cell, row, col) {
      if (this.cursor.playMode) return
      this.$emit('move', chapter, cell, row, col)
    },
    moveRhythm(chapter, cell) {
      if (this.cursor.playMode) return
      this.$emit('moveRhythm', chapter, cell)
    },
    openconfig(chapter) {
      this.$emit('openconfig', chapter)
    }
  },
  components: {
    cell
  }
}
</script>

<style>
.chapter {
  float: right;
}

.margin {
  height: 7rem;
  text-align: right;
}

.title {
  margin-right: 0.5rem;
  height: 4rem;
  text-align: left;
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.gak {
  float: right;
  width: 3rem;
  margin-left: 1rem;
}

.gak > * {
  height: 3.5rem;
  padding: 0;
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