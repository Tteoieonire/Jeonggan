<template>
  <!-- 상단 메뉴바 -->
  <div class="container-fluid">
    <b-button-group class="m-1 float-right">
      <b-btn aria-label="실행 취소" v-show="false">
        <i class="fa fa-undo"></i>
      </b-btn>
      <b-btn aria-label="연주" v-show="false">
        <i class="fa fa-play"></i>
      </b-btn>

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
  methods: {}
}
</script>
