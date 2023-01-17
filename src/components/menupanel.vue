<template>
  <!-- 상단 메뉴바 -->
  <b-button-toolbar key-nav class="w-100 d-flex">
    <b-button-group class="m-1">
      <b-button v-b-modal.init aria-label="새로 만들기">
        <font-awesome-icon icon="file" />
      </b-button>
      <b-button @click="open" aria-label="열기">
        <font-awesome-icon icon="folder-open" />
        <input
          ref="uploadButton"
          type="file"
          accept=".yml,.yaml"
          style="display: none"
        />
      </b-button>

      <b-button @click="save" aria-label="저장">
        <font-awesome-icon icon="save" />
      </b-button>
    </b-button-group>

    <b-button-group class="m-1">
      <b-button
        @click="cut"
        :disabled="rhythmMode || !editable"
        aria-label="잘라내기"
      >
        <font-awesome-icon icon="scissors" />
      </b-button>
      <b-button
        @click="copy"
        :disabled="rhythmMode || !editable"
        aria-label="복사"
      >
        <font-awesome-icon icon="copy" />
      </b-button>
      <b-button
        @click="paste"
        :disabled="rhythmMode || !editable || !pastable"
        aria-label="붙여넣기"
      >
        <font-awesome-icon icon="clipboard" />
      </b-button>
    </b-button-group>

    <b-button-group class="m-1">
      <b-button @click="undo" :disabled="!undoable" aria-label="실행 취소">
        <font-awesome-icon icon="undo" />
      </b-button>
      <b-button @click="redo" :disabled="!redoable" aria-label="다시 실행">
        <font-awesome-icon icon="redo" />
      </b-button>
    </b-button-group>

    <div style="margin-left: auto">
      <b-button-group class="m-1">
        <b-button
          v-if="playing"
          @click="pause"
          :disabled="rhythmMode"
          aria-label="일시 정지"
        >
          <font-awesome-icon icon="pause" />
        </b-button>
        <b-button
          v-else
          @click="resume"
          :disabled="rhythmMode"
          aria-label="재생"
        >
          <font-awesome-icon icon="play" />
        </b-button>
        <b-button
          @click="stop"
          :disabled="rhythmMode || editable"
          aria-label="연주 정지"
        >
          <font-awesome-icon icon="stop" />
        </b-button>
      </b-button-group>

      <b-button-group class="m-1">
        <b-button @click="addchapter" :disabled="!editable"
          >새 장 추가</b-button
        >

        <b-dropdown no-caret right>
          <template #button-content>
            <span aria-label="그 밖의 명령 목록">
              <font-awesome-icon icon="ellipsis-v" />
            </span>
          </template>

          <b-dropdown-item-button v-b-modal.configmodal :disabled="!editable"
            >장 설정</b-dropdown-item-button
          >
          <b-dropdown-item-button v-b-modal.global
            >곡 설정</b-dropdown-item-button
          >
          <b-dropdown-item-button @click="exportMidi"
            >MIDI 내보내기</b-dropdown-item-button
          >
        </b-dropdown>
      </b-button-group>
    </div>
  </b-button-toolbar>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    playing: { type: Boolean },
    rhythmMode: { type: Boolean, required: true },
    undoable: { type: Boolean, required: true },
    redoable: { type: Boolean, required: true },
    pastable: { type: Boolean, required: true },
  },
  emits: {
    open: (file: File) => true,
    save: () => true,
    cut: () => true,
    copy: () => true,
    paste: () => true,
    undo: () => true,
    redo: () => true,
    addchapter: () => true,
    play: (mode: 'resume' | 'pause' | 'stop') => true,
    exportMidi: () => true,
  },
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
      ;(this.$refs.uploadButton as any).click()
    },
    onfile(e: Event) {
      const files = (e.target as HTMLInputElement).files
      if (files == null) throw Error('No file found')
      this.$emit('open', files[0])
    },
    save() {
      this.$emit('save')
    },
    exportMidi() {
      this.$emit('exportMidi')
    },
    cut() {
      this.$emit('cut')
    },
    copy() {
      this.$emit('copy')
    },
    paste() {
      this.$emit('paste')
    },
    undo() {
      this.$emit('undo')
    },
    redo() {
      this.$emit('redo')
    },
  },
  computed: {
    editable() {
      return this.playing == null
    },
  },
  mounted() {
    ;(this.$refs.uploadButton as any).addEventListener('change', this.onfile)
  },
})
</script>
