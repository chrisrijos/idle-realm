import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class AudioButton {
  constructor(app, audioManager) {
    this.app = app;
    this.audio = audioManager;
    this.container = new Container();

    this.audioIcon = null;
    this.muteIcon = null;
    this.muteBg = null;
    this.trackLabel = null;

    this.createButtons();
    this.app.stage.addChild(this.container);
  }

  createButtons() {
    // Music toggle button
    const musicBtn = new Container();
    musicBtn.x = this.app.screen.width - 40;
    musicBtn.y = 10;
    musicBtn.eventMode = 'static';
    musicBtn.cursor = 'pointer';

    const musicBg = new Graphics();
    musicBg.roundRect(0, 0, 30, 24, 4);
    musicBg.fill({ color: 0x2a4a3a, alpha: 0.8 });
    musicBtn.addChild(musicBg);

    const musicStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: '#88aa88'
    });
    this.audioIcon = new Text({ text: '♪', style: musicStyle });
    this.audioIcon.x = 8;
    this.audioIcon.y = 3;
    musicBtn.addChild(this.audioIcon);

    musicBtn.on('pointerdown', async () => {
      await this.audio.toggle();
      this.updateUI();
    });

    // Mute button (mutes all sound including effects)
    const muteBtn = new Container();
    muteBtn.x = this.app.screen.width - 75;
    muteBtn.y = 10;
    muteBtn.eventMode = 'static';
    muteBtn.cursor = 'pointer';

    const muteBg = new Graphics();
    muteBg.roundRect(0, 0, 30, 24, 4);
    muteBg.fill({ color: 0x2a4a3a, alpha: 0.8 });
    muteBtn.addChild(muteBg);
    this.muteBg = muteBg;

    const muteStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 12,
      fill: '#88aa88'
    });
    this.muteIcon = new Text({ text: ')))' , style: muteStyle });
    this.muteIcon.x = 4;
    this.muteIcon.y = 5;
    muteBtn.addChild(this.muteIcon);

    muteBtn.on('pointerdown', () => {
      this.audio.toggleMute();
      this.updateUI();
    });

    // Track name display (click to change track)
    const trackBtn = new Container();
    trackBtn.x = this.app.screen.width - 145;
    trackBtn.y = 10;
    trackBtn.eventMode = 'static';
    trackBtn.cursor = 'pointer';

    const trackBg = new Graphics();
    trackBg.roundRect(0, 0, 65, 24, 4);
    trackBg.fill({ color: 0x2a4a3a, alpha: 0.8 });
    trackBtn.addChild(trackBg);

    const trackStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 9,
      fill: '#6a8a6a'
    });
    this.trackLabel = new Text({ text: 'Jabu-Jabu', style: trackStyle });
    this.trackLabel.x = 4;
    this.trackLabel.y = 7;
    trackBtn.addChild(this.trackLabel);

    trackBtn.on('pointerdown', () => {
      const trackName = this.audio.nextTrack();
      this.trackLabel.text = trackName;
    });

    this.container.addChild(trackBtn);
    this.container.addChild(muteBtn);
    this.container.addChild(musicBtn);
  }

  updateUI() {
    // Update music icon
    this.audioIcon.style.fill = this.audio.isPlaying ? '#aaffaa' : '#88aa88';
    this.audioIcon.text = this.audio.isPlaying ? '♫' : '♪';

    // Update mute icon
    if (this.audio.isMuted) {
      this.muteIcon.text = ')))';
      this.muteIcon.style.fill = '#ff6666';
      // Strike-through effect
      this.muteBg.clear();
      this.muteBg.roundRect(0, 0, 30, 24, 4);
      this.muteBg.fill({ color: 0x4a2a2a, alpha: 0.8 });
    } else {
      this.muteIcon.text = ')))';
      this.muteIcon.style.fill = '#88aa88';
      this.muteBg.clear();
      this.muteBg.roundRect(0, 0, 30, 24, 4);
      this.muteBg.fill({ color: 0x2a4a3a, alpha: 0.8 });
    }

    // Update track name
    this.trackLabel.text = this.audio.getTrackName();
  }
}
