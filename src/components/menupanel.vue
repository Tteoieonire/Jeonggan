<template>
  <!-- 상단 메뉴바 -->
  <b-btn-toolbar key-nav style='width:100%;display:block;'>
    <b-button-group class="m-1">
      <b-btn @click="init" aria-label="새로 만들기">
        <i class="fas fa-file"></i>
      </b-btn>
      <b-btn @click="open" aria-label="열기">
        <i class="fas fa-folder-open"></i>
      </b-btn>
      <b-btn @click="save" aria-label="저장">
        <i class="fas fa-save"></i>
      </b-btn>
    </b-button-group>

    <b-button-group class="m-1">
      <b-btn @click="undo" :disabled="!undoable" aria-label="실행 취소">
        <i class="fas fa-undo"></i>
      </b-btn>
      <b-btn @click="redo" :disabled="!redoable" aria-label="다시 실행">
        <i class="fas fa-redo"></i>
      </b-btn>
    </b-button-group>

    <b-button-group class="m-1">
      <b-btn
        v-if="playerMode === 'playing'"
        @click="pause"
        :disabled="rhythmMode"
        aria-label="일시 정지"
      >
        <i class="fas fa-pause"></i>
      </b-btn>
      <b-btn v-else @click="resume" :disabled="rhythmMode" aria-label="재생">
        <i class="fas fa-play"></i>
      </b-btn>
      <b-btn @click="stop" :disabled="rhythmMode || playerMode === 'stopped'" aria-label="연주 정지">
        <i class="fas fa-stop"></i>
      </b-btn>
    </b-button-group>

    <b-button-group class="m-1 float-right">
      <b-btn @click="addchapter" :disabled="rhythmMode">새 장 추가</b-btn>

      <b-dropdown no-caret right aria-label="그 밖의 명령 목록">
        <template slot="button-content">
          <i class="fas fa-ellipsis-v"></i>
        </template>

        <b-dropdown-item-button v-b-modal.exchange>불러오기/내보내기</b-dropdown-item-button>
      </b-dropdown>
    </b-button-group>
  </b-btn-toolbar>
</template>

<script>
export default {
  props: ['rhythmMode', 'playerMode', 'undoable', 'redoable'],
  methods: {
    addchapter() {
      this.$emit('addchapter')
    },
    resume() {
      this.$emit('play', 'resume')
    },
    pause() {
      this.$emit('play', 'pause')
    },
    stop() {
      this.$emit('play', 'stop')
    },
    init() {
      this.$emit('init')
    },
    open() {
      this.$emit('open')
    },
    save() {
      this.$emit('save')
    },
    undo() {
      this.$emit('undo')
    },
    redo() {
      this.$emit('redo')
    }
  }
}
</script>
