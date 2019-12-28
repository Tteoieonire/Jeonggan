<template>
  <!-- 상단 메뉴바 -->
  <div class="container-fluid">
    <b-button-group class="m-1">
      <b-btn
        v-if="playerMode === 'playing'"
        @click="pause"
        :disabled="rhythmMode"
        aria-label="일시 정지"
      >
        <i class="fa fa-pause"></i>
      </b-btn>
      <b-btn v-else @click="resume" :disabled="rhythmMode" aria-label="재생">
        <i class="fa fa-play"></i>
      </b-btn>
      <b-btn @click="stop" :disabled="rhythmMode || playerMode === 'stopped'" aria-label="연주 정지">
        <i class="fa fa-stop"></i>
      </b-btn>
    </b-button-group>

    <b-button-group class="m-1 float-right">
      <b-btn @click="addchapter" :disabled="rhythmMode">새 장 추가</b-btn>

      <b-dropdown no-caret right aria-label="그 밖의 명령 목록">
        <template slot="button-content">
          <i class="fa fa-ellipsis-v"></i>
        </template>

        <b-dropdown-item-button v-show="false">저장</b-dropdown-item-button>
        <b-dropdown-item-button v-show="false">내려받기</b-dropdown-item-button>
        <b-dropdown-item-button v-b-modal.setting>곡 설정</b-dropdown-item-button>
      </b-dropdown>
    </b-button-group>
  </div>
</template>

<script>
export default {
  props: ['rhythmMode', 'playerMode'],
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
    }
  }
}
</script>
