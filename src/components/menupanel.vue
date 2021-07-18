<template>
  <!-- 상단 메뉴바 -->
  <b-btn-toolbar key-nav style='width:100%;display:block;'>
    <b-button-group class="m-1">
      <b-btn v-b-modal.init aria-label="새로 만들기">
        <font-awesome-icon icon="file" />
      </b-btn>
      <b-btn @click="open" aria-label="열기">
        <font-awesome-icon icon="folder-open" />
        <input ref='uploadButton' type="file" accept='.yml,.yaml' style="display:none">
      </b-btn>

      <b-btn @click="save" aria-label="저장">
        <font-awesome-icon icon="save" />
      </b-btn>
    </b-button-group>

    <b-button-group class="m-1">
      <b-btn @click="undo" :disabled="!undoable" aria-label="실행 취소">
        <font-awesome-icon icon="undo" />
      </b-btn>
      <b-btn @click="redo" :disabled="!redoable" aria-label="다시 실행">
        <font-awesome-icon icon="redo" />
      </b-btn>
    </b-button-group>

    <div class='float-right'>
      <b-button-group class="m-1">
        <b-btn
          v-if="playerMode === 'playing'"
          @click="pause"
          :disabled="cursor.rhythmMode"
          aria-label="일시 정지"
        >
          <font-awesome-icon icon="pause" />
        </b-btn>
        <b-btn v-else @click="resume" :disabled="cursor.rhythmMode" aria-label="재생">
          <font-awesome-icon icon="play" />
        </b-btn>
        <b-btn @click="stop" :disabled="cursor.rhythmMode || editable" aria-label="연주 정지">
          <font-awesome-icon icon="stop" />
        </b-btn>
      </b-button-group>

      <b-button-group class="m-1">
        <b-btn @click="addchapter" :disabled="cursor.blurred || !editable">새 장 추가</b-btn>

        <b-dropdown no-caret right aria-label="그 밖의 명령 목록">
          <template slot="button-content">
            <font-awesome-icon icon="ellipsis-v" />
          </template>

          <b-dropdown-item-button v-b-modal.configmodal
            :disabled="cursor.blurred || !editable"
          >장 설정</b-dropdown-item-button>
          <b-dropdown-item-button v-b-modal.global>곡 설정</b-dropdown-item-button>
          <b-dropdown-item-button @click="exportMidi">MIDI 내보내기</b-dropdown-item-button>
        </b-dropdown>
      </b-button-group>
    </div>
  </b-btn-toolbar>
</template>

<script>
export default {
  props: ['cursor', 'playerMode', 'undoable', 'redoable'],
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
    open() {
      this.$refs['uploadButton'].click()
    },
    onfile(e) {
      const file = e.target.files[0]
      this.$emit('open', file)
    },
    save() {
      this.$emit('save')
    },
    exportMidi() {
      this.$emit('exportMidi')
    },
    undo() {
      this.$emit('undo')
    },
    redo() {
      this.$emit('redo')
    }
  },
  computed: {
    editable() {
      return this.playerMode === 'stopped'
    },
  },
  mounted() {
    this.$refs['uploadButton'].addEventListener('change', this.onfile)
  }
}
</script>
