import { InstrumentName } from 'soundfont-player'

import { MusicEditor } from './music-editor'
import { MusicPlayer } from './playback'
import { Chapter, MusicBase, MusicViewer } from './viewer'

export class Music implements MusicBase {
  private _editor?: MusicEditor
  data: Chapter[]

  constructor(
    public title: string,
    chapters?: Chapter[],
    public instrument: InstrumentName = 'acoustic_grand_piano'
  ) {
    this.data = chapters || []
  }

  asGaks() {
    return this.data.flatMap((chapter, i) => chapter.asGaks(i))
  }

  getViewer() {
    return new MusicViewer(this)
  }

  getPlayer() {
    return new MusicPlayer(this)
  }

  getEditor() {
    if (this._editor == null) this._editor = new MusicEditor(this)
    return this._editor
  }
}
