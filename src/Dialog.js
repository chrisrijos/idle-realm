import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class Dialog {
  constructor() {
    this.container = new Container();
    this.dialogs = [];
  }

  show(agent, message, duration = 2000) {
    // Check if this agent already has a dialog
    const existing = this.dialogs.find(d => d.agent === agent);
    if (existing) {
      // Update existing dialog
      existing.text.text = message;
      existing.remaining = duration / 16.67; // Convert to frames
      this.updateBubble(existing);
      return;
    }

    // Create new dialog
    const dialogContainer = new Container();

    // Bubble background
    const bubble = new Graphics();
    dialogContainer.addChild(bubble);

    // Text
    const style = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 10,
      fill: '#ffffff',
      wordWrap: true,
      wordWrapWidth: 100
    });
    const text = new Text({ text: message, style });
    text.x = 8;
    text.y = 6;
    dialogContainer.addChild(text);

    // Draw bubble to fit text
    const padding = 8;
    const width = text.width + padding * 2;
    const height = text.height + padding * 2;

    bubble.roundRect(0, 0, width, height, 6);
    bubble.fill({ color: 0x2a2a3a, alpha: 0.9 });
    bubble.stroke({ width: 1, color: 0x5a8a7a });

    // Tail
    bubble.moveTo(width / 2 - 6, height);
    bubble.lineTo(width / 2, height + 8);
    bubble.lineTo(width / 2 + 6, height);
    bubble.fill({ color: 0x2a2a3a, alpha: 0.9 });

    // Position above agent
    dialogContainer.x = agent.x - width / 2;
    dialogContainer.y = agent.y - agent.getSize() - height - 15;

    this.container.addChild(dialogContainer);

    const dialog = {
      agent,
      container: dialogContainer,
      bubble,
      text,
      remaining: duration / 16.67, // frames at ~60fps
      fadeStart: 30 // Start fading 30 frames before end
    };

    this.dialogs.push(dialog);
  }

  updateBubble(dialog) {
    const { bubble, text } = dialog;
    bubble.clear();

    const padding = 8;
    const width = text.width + padding * 2;
    const height = text.height + padding * 2;

    bubble.roundRect(0, 0, width, height, 6);
    bubble.fill({ color: 0x2a2a3a, alpha: 0.9 });
    bubble.stroke({ width: 1, color: 0x5a8a7a });

    bubble.moveTo(width / 2 - 6, height);
    bubble.lineTo(width / 2, height + 8);
    bubble.lineTo(width / 2 + 6, height);
    bubble.fill({ color: 0x2a2a3a, alpha: 0.9 });
  }

  update(deltaTime) {
    for (let i = this.dialogs.length - 1; i >= 0; i--) {
      const dialog = this.dialogs[i];

      // Follow agent
      const width = dialog.text.width + 16;
      const height = dialog.text.height + 16;
      dialog.container.x = dialog.agent.x - width / 2;
      dialog.container.y = dialog.agent.y - dialog.agent.getSize() - height - 15;

      // Countdown
      dialog.remaining -= deltaTime;

      // Fade out
      if (dialog.remaining < dialog.fadeStart) {
        dialog.container.alpha = Math.max(0, dialog.remaining / dialog.fadeStart);
      }

      // Remove when done
      if (dialog.remaining <= 0) {
        this.container.removeChild(dialog.container);
        this.dialogs.splice(i, 1);
      }
    }
  }
}
