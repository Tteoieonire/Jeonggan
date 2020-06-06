const CURSOR_AFTER = false

function wrappedIdx(idx, total) {
  idx %= total
  if (idx < 0) idx += total
  return idx
}

function moveToMostAligned(curPos, curDivision, destDivision) {
  const bgn = curPos / curDivision
  return Math.floor(bgn * destDivision)
}

function inRange(idx, arr) {
  return idx >= 0 && idx < arr.length
}

export { CURSOR_AFTER, wrappedIdx, moveToMostAligned, inRange }
