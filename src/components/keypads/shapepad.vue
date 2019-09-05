<template>
  <b-button-group class="m-1">
    <b-btn @click="add" :aria-label="'새' + label + '추가'">
      <svg
        class="icon"
        :transform="transform"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          d="M0 0v24h24V0H0zM22 21.9H2v-5h20L22 21.9 22 21.9zM16 11v2h-3v3h-2v-3H8v-2h3V8h2v3C13 11 16 11 16 11zM22 7H2v-5h20L22 7 22 7z"
        />
      </svg>
    </b-btn>
    <b-btn @click="del" :aria-label="'이' + label + '삭제'">
      <svg
        class="icon"
        :transform="transform"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
      >
        <path
          d="M0 0v16h16V0H0zM14.7 14.6H1.3V11.3h13.3V14.6zM5.6 6.6l0.9-0.9L8 7.1l1.4-1.4 0.9 0.9L8.9 8l1.4 1.4 -0.9 0.9L8 8.9l-1.4 1.4L5.6 9.4 7.1 8 5.6 6.6zM14.7 4.7H1.3V1.4h13.3V4.7z"
        />
      </svg>
    </b-btn>
  </b-button-group>
</template>

<script>
export default {
  props: ['for'],
  methods: {
    add() {
      this.$emit('shapechange', this.for, +1)
    },
    del() {
      this.$emit('shapechange', this.for, -1)
    }
  },
  computed: {
    label() {
      return this.for === 'col' ? ' 분박 ' : ' 행 '
    },
    transform() {
      return this.for === 'col' ? 'rotate(90)' : ''
    }
  }
}
</script>

<style>
.icon {
  width: 1rem;
  height: 1rem;
  fill: white;
}
</style>