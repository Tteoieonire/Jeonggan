import { InstrumentName } from 'soundfont-player'

import { MusicEditor } from './editing/music-editor'
import { MusicPlayer } from './playback'
import { Chapter, EditableMusicBase, ScoreFactory } from './score'
import { MusicViewer } from './navigation/viewer'
import { getID } from './utils'

export class Music implements EditableMusicBase {
  private _editor?: MusicEditor
  data: Chapter[]

  constructor(
    public title: string,
    chapters?: Chapter[],
    public instrument: InstrumentName = 'acoustic_grand_piano',
    public readonly score: ScoreFactory = new ScoreFactory(getID)
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
