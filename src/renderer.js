function scaleIdxToPitch(idx, scale) {
  let oct = Math.floor(idx / scale.length)
  idx -= oct * scale.length
  return scale[idx] + 3 + 12 * oct
}

function approxInScale(note, scale) {
  // note & scale both 0-11
  let minDist = 15
  let minIdx = 0
  for (let i = -scale.length; i < 2 * scale.length; i++) {
    let dist = Math.abs(scaleIdxToPitch(i, scale) - note)
    if (dist < minDist) minIdx = i
  }
  return minIdx
}

function pitchToScaleIdx(pitch, scale) {
  let oct = Math.floor((pitch - 3) / 12)
  let idx = scale.indexOf((pitch - 3) % 12)
  if (idx === -1) idx = approxInScale((pitch - 3) % 12, scale)
  return idx + oct * scale.length
}

function buildScaleTable(scale, refNote) {
  let refIdx = pitchToScaleIdx(refNote, scale)
  return [-3, -2, -1, 0, 1, 2, 3].map(rel =>
    scaleIdxToPitch(refIdx + rel, scale)
  )
}

function renderMain(note, scale, lastPitch) {
  //scale C=0 ~ B=11, lastPitch in midi
  let pitches = []
  if (typeof note.main.pitch === 'number') {
    pitches = [note.main.pitch + 51]
  } else if (typeof note.main.pitch === 'string') {
    if (lastPitch == null) throw Error('Dunno how reference pitch')
    const mapper = buildScaleTable(scale, lastPitch)
    pitches = note.main.pitch.split('').map(rel => mapper[rel])
  } else throw Error('renderMain pitch neither number nor string')

  let base_duration = note.head_duration / pitches.length
  let tail_duration = base_duration + (note.duration - note.head_duration)
  return pitches.map((pitch, idx) => ({
    note: pitch,
    duration: idx < pitches.length - 1 ? base_duration : tail_duration,
    time: note.time + idx * base_duration,
  }))
}

function renderModifier(note, modifier, scale, graceCap) {
  const refIdx = pitchToScaleIdx(note.note, scale)
  const pitches = modifier.pitch.map(part =>
    part.split('').map(rel => scaleIdxToPitch(rel - 3 + refIdx, scale))
  )
  let notes = allotGrace(pitches, note.time, note.head_duration, graceCap)
  notes[notes.length - 1].duration += (note.duration - note.head_duration)
  return notes
}

function allotGrace(pitches, time, duration, graceCap) {
  const numGrace = pitches[0].length + pitches[2].length
  const numMain = pitches[1].length

  const squeeze = duration < graceCap * (numGrace + numMain * 2)
  const graceDur = squeeze ? duration / (numGrace + numMain * 2) : graceCap
  const mainDur = (duration - graceDur * numGrace) / numMain

  let results = [].concat(
    pitches[0].map(note => ({ note, duration: graceDur })),
    pitches[1].map(note => ({ note, duration: mainDur })),
    pitches[2].map(note => ({ note, duration: graceDur }))
  )
  for (let i = 0; i < results.length; i++) {
    results[i].time = time
    time += results[i].duration
  }
  return results
}

function renderNote(note, scale, lastPitch, graceCap) {
  let notes = renderMain(note, scale, lastPitch)
  if (!note.modifier) return notes
  if (notes.length === 1) {
    return renderModifier(notes[0], note.modifier, scale, graceCap)
  }
  throw Error('Dunno how to read modifier on notes group')
}

function render(notes, scale, ticksPerSecond = 1000) {
  const graceCap = ticksPerSecond / 10
  let lastPitch = undefined
  let result = []
  for (let i = 0; i < notes.length; i++) {
    let rendered = renderNote(notes[i], scale, lastPitch, graceCap)
    result = result.concat(rendered)
    lastPitch = rendered[rendered.length - 1].note
  }
  return result
}

export { render }
