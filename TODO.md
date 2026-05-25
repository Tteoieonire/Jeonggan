# TODO

- Fine-tune the breath mark alignment at the end of a gak. Use a screenshot of
  the real canvas and adjust `.breath-mark` in `src/components/canvas/gak.vue`
  so `숨표` is centered on the cell end line. Initial measurement showed the
  current `bottom: -0.48rem` sits slightly high; a quick trial at
  `bottom: -0.56rem` moved it downward, but it still needs visual confirmation.
