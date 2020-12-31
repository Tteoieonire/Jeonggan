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

function clone(obj) {
  if (obj === null || typeof obj !== 'object') return obj

  var copy = obj.constructor()
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr])
  }

  return copy
}

export { wrappedIdx, moveToMostAligned, inRange, clone }
