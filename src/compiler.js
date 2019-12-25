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

function compileColMain(col, time, duration, scale, lastPitch) {
  //scale C=0 ~ B=11, lastPitch in midi
  let pitches = []
  if (typeof col.main.pitch === 'number') {
    pitches = [col.main.pitch + 51]
  } else if (typeof col.main.pitch === 'string') {
    if (lastPitch == null) throw Error('Dunno how reference pitch')
    const mapper = buildScaleTable(scale, lastPitch)
    pitches = col.main.pitch.split('').map(rel => mapper[rel])
  } else throw Error('compileColMain col.main.pitch neither number nor string')

  duration /= pitches.length
  return pitches.map((note, idx) => ({
    note,
    duration,
    time: time + idx * duration
  }))
}

function compileColModifier(note, modifier, scale) {
  let time = note.time
  let duration = note.duration
  let refIdx = pitchToScaleIdx(note.note, scale)

  let pitches = modifier.pitch
    .split('')
    .map(rel => scaleIdxToPitch(rel - 3 + refIdx, scale))

  if (modifier.tall) {
    duration /= modifier.pitch.length
    return pitches.map((note, idx) => ({
      note,
      duration,
      time: time + idx * duration
    })) // equally
  }
  if (modifier.text === 'I' || modifier.text === 'H') {
    if (duration >= 0.4) {
      // 꾸밈음은 100 ms 이내로
      time = [time, time + 0.1, time + duration - 0.2]
      duration = [0.1, duration - 0.2, 0.1]
    } else {
      // 1:2:1
      time = [time, time + duration / 4, time + duration * 0.75]
      duration = [duration / 4, duration / 2, duration / 4]
    }
    return pitches.map((note, idx) => ({
      note,
      time: time[idx],
      duration: duration[idx]
    }))
  }
  const numNotes = pitches.length
  if (duration >= 0.1 * (numNotes + 1)) {
    // 꾸밈음은 100 ms 이내로
    return pitches.map((note, idx) => ({
      note,
      time: time + 0.1 * idx,
      duration: idx < numNotes - 1 ? 0.1 : duration - 0.1 * (numNotes - 1)
    }))
  } else {
    return pitches.map((note, idx) => ({
      note,
      time: time + (idx * duration) / (numNotes + 1),
      duration: ((idx < numNotes - 1 ? 1 : 2) * duration) / (numNotes + 1)
    }))
  }
}

function compileCol(col, time, duration, scale, lastPitch) {
  if (!col || !col.main) return [{ time, duration }]
  if (col.main.pitch === null) return [{ time, duration, note: null }]

  let notes = compileColMain(col, time, duration, scale, lastPitch)
  if (!col.modifier) return notes
  if (notes.length === 1) {
    return compileColModifier(notes[0], col.modifier, scale)
  }
  throw Error('Dunno how to read modifier on notes group')
}

function compileRecursive(element, time, duration, scale, lastPitch) {
  if (!Array.isArray(element)) {
    return compileCol(element, time, duration, scale, lastPitch)
  }
  duration /= element.length
  let compiled = []
  for (let i = 0; i < element.length; i++) {
    compiled = compiled.concat(
      compileRecursive(
        element[i],
        time + i * duration,
        duration,
        scale,
        lastPitch
      )
    )
    let lastNote = compiled[compiled.length - 1]
    if (lastNote.note != null) lastPitch = lastNote.note
  }
  return compiled
}

function combineNotes(notes) {
  if (notes.length === 0) return []
  let combined = []
  let cur = notes[0] // mutation ok...
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].note === undefined) {
      // continued
      cur.duration += notes[i].duration
    } else {
      // new entity
      if (cur.note) combined.push(cur)
      cur = notes[i]
    }
  }
  if (cur.note) combined.push(cur)
  return combined
}

function compileChapter(chapter, time, duration, scale) {
  let notes = compileRecursive(chapter, time, duration, scale)
  return combineNotes(notes)
}

export { compileChapter }
