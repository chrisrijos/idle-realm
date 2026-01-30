import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// Sprite colors by type
const COLORS = {
  'tmux-session': { body: 0x7b68ee, accent: 0x9370db, glow: 0xb19cd9 }, // Purple wizard
  'tmux-pane': { body: 0x48d1cc, accent: 0x40e0d0, glow: 0x7fffd4 },    // Cyan familiar
  'docker-running': { body: 0x2e8b57, accent: 0x3cb371, glow: 0x98fb98 }, // Green container
  'docker-stopped': { body: 0x4a4a5a, accent: 0x696969, glow: 0x808080 }, // Gray container
  'docker-healthy': { body: 0x228b22, accent: 0x32cd32, glow: 0x7cfc00 }, // Bright green
  'docker-unhealthy': { body: 0xcd5c5c, accent: 0xf08080, glow: 0xff6b6b }, // Red
  'frozen': { body: 0x4a6a8a, accent: 0x6a8aaa, glow: 0x88ccff }         // Blue frozen
};

export class Agent {
  constructor(data, worldWidth, worldHeight) {
    this.data = data;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.container = new Container();

    // Make clickable
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    // Random starting position
    this.x = 50 + Math.random() * (worldWidth - 100);
    this.y = 80 + Math.random() * (worldHeight - 160);
    this.container.x = this.x;
    this.container.y = this.y;

    // Movement
    this.vx = 0;
    this.vy = 0;
    this.targetX = this.x;
    this.targetY = this.y;
    this.wanderTimer = 0;
    this.direction = 1;

    // Animation
    this.bobOffset = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.05 + Math.random() * 0.03;
    this.healthPulse = 0;

    // Stale/frozen detection
    this.lastActivity = Date.now();
    this.isFrozen = false;
    this.frozenShake = 0;

    this.createSprite();
    this.createLabel();
    this.createFrozenOverlay();
  }

  createSprite() {
    const colors = this.getColors();
    const size = this.getSize();

    this.sprite = new Graphics();

    if (this.data.type === 'docker-container') {
      this.drawDockerSprite(colors, size);
    } else if (this.data.type === 'tmux-session') {
      this.drawWizardSprite(colors, size);
    } else if (this.data.type === 'tmux-pane') {
      this.drawFamiliarSprite(colors, size);
    }

    this.container.addChild(this.sprite);
  }

  drawDockerSprite(colors, size) {
    const w = size * 1.8;
    const h = size * 1.2;

    // Container body (box shape)
    this.sprite.roundRect(-w/2, -h/2, w, h, 4);
    this.sprite.fill(colors.body);

    // Container ridges (like shipping container)
    for (let i = 0; i < 3; i++) {
      const rx = -w/2 + 4 + i * (w - 8) / 3;
      this.sprite.rect(rx, -h/2 + 3, 2, h - 6);
      this.sprite.fill(colors.accent);
    }

    // Top lid
    this.sprite.roundRect(-w/2 - 2, -h/2 - 4, w + 4, 6, 2);
    this.sprite.fill(colors.accent);

    // Docker whale logo (simplified)
    this.sprite.rect(-6, -2, 4, 3);
    this.sprite.rect(-1, -2, 4, 3);
    this.sprite.rect(4, -2, 4, 3);
    this.sprite.rect(-6, 2, 4, 3);
    this.sprite.rect(-1, 2, 4, 3);
    this.sprite.rect(4, 2, 4, 3);
    this.sprite.fill(0xffffff);

    // Health indicator (heartbeat)
    if (this.data.health === 'healthy') {
      this.sprite.circle(w/2 - 4, -h/2 + 4, 3);
      this.sprite.fill(0x00ff00);
    } else if (this.data.health === 'unhealthy') {
      this.sprite.circle(w/2 - 4, -h/2 + 4, 3);
      this.sprite.fill(0xff0000);
    }

    // Ports indicator (small dots at bottom)
    if (this.data.ports && this.data.ports.length > 0) {
      const portCount = Math.min(this.data.ports.length, 4);
      for (let i = 0; i < portCount; i++) {
        const px = -w/4 + i * (w/2) / (portCount);
        this.sprite.circle(px, h/2 + 6, 2);
        this.sprite.fill(0x88ff88);
      }
    }
  }

  drawWizardSprite(colors, size) {
    // Body (round)
    this.sprite.circle(0, 0, size);
    this.sprite.fill(colors.body);

    // Inner glow
    this.sprite.circle(0, 0, size * 0.7);
    this.sprite.fill(colors.accent);

    // Eyes
    const eyeOffset = size * 0.3;
    const eyeSize = size * 0.15;
    this.sprite.circle(-eyeOffset, -size * 0.2, eyeSize);
    this.sprite.circle(eyeOffset, -size * 0.2, eyeSize);
    this.sprite.fill(0xffffff);

    // Pupils
    this.sprite.circle(-eyeOffset + 1, -size * 0.2, eyeSize * 0.5);
    this.sprite.circle(eyeOffset + 1, -size * 0.2, eyeSize * 0.5);
    this.sprite.fill(0x000000);

    // Wizard hat
    this.sprite.moveTo(-size * 0.7, -size * 0.7);
    this.sprite.lineTo(0, -size * 1.6);
    this.sprite.lineTo(size * 0.7, -size * 0.7);
    this.sprite.fill(colors.body);

    // Hat band
    this.sprite.rect(-size * 0.5, -size * 0.85, size, 4);
    this.sprite.fill(colors.glow);

    // Star on hat
    this.sprite.star(0, -size * 1.2, 5, 3, 1.5);
    this.sprite.fill(0xffff88);

    // Windows count badge
    if (this.data.windowCount > 1) {
      this.sprite.circle(size * 0.7, -size * 0.5, 6);
      this.sprite.fill(0x333355);
      this.sprite.circle(size * 0.7, -size * 0.5, 5);
      this.sprite.fill(colors.glow);
    }
  }

  drawFamiliarSprite(colors, size) {
    // Small floating orb
    this.sprite.circle(0, 0, size);
    this.sprite.fill(colors.body);

    this.sprite.circle(0, 0, size * 0.6);
    this.sprite.fill(colors.accent);

    // Tiny eyes
    this.sprite.circle(-size * 0.25, -size * 0.1, 2);
    this.sprite.circle(size * 0.25, -size * 0.1, 2);
    this.sprite.fill(0xffffff);

    this.sprite.circle(-size * 0.25 + 0.5, -size * 0.1, 1);
    this.sprite.circle(size * 0.25 + 0.5, -size * 0.1, 1);
    this.sprite.fill(0x000000);

    // Sparkle trail
    for (let i = 0; i < 3; i++) {
      const angle = this.bobOffset + i * 0.8;
      const dist = size + 4 + i * 3;
      const sx = Math.cos(angle) * dist * 0.5;
      const sy = Math.sin(angle) * dist * 0.3 + size * 0.5;
      this.sprite.circle(sx, sy, 1.5 - i * 0.3);
      this.sprite.fill({ color: colors.glow, alpha: 0.7 - i * 0.2 });
    }
  }

  createLabel() {
    // Name label
    const nameStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 10,
      fill: '#ffffff',
      fontWeight: 'bold',
      dropShadow: { color: '#000000', blur: 2, distance: 1 }
    });

    let name = this.data.name;
    if (name.length > 16) name = name.substring(0, 16) + '..';

    this.nameLabel = new Text({ text: name, style: nameStyle });
    this.nameLabel.anchor.set(0.5, 0);
    this.nameLabel.y = this.getSize() + 8;
    this.container.addChild(this.nameLabel);

    // Detail label (type-specific info)
    const detailStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 8,
      fill: '#aaccaa'
    });

    this.detailLabel = new Text({ text: this.getDetailText(), style: detailStyle });
    this.detailLabel.anchor.set(0.5, 0);
    this.detailLabel.y = this.getSize() + 20;
    this.container.addChild(this.detailLabel);
  }

  getDetailText() {
    if (this.data.type === 'tmux-session') {
      const status = this.data.attached ? 'attached' : 'detached';
      return `[${status}] ${this.data.uptimeStr || ''}`;
    } else if (this.data.type === 'tmux-pane') {
      const cmd = this.data.command.length > 10
        ? this.data.command.substring(0, 10) + '..'
        : this.data.command;
      return `[${cmd}] pid:${this.data.pid || '?'}`;
    } else if (this.data.type === 'docker-container') {
      if (this.data.running) {
        const health = this.data.health !== 'none' && this.data.health !== 'unknown'
          ? ` ${this.data.health}` : '';
        return `[${this.data.uptimeStr}]${health}`;
      } else {
        return '[stopped]';
      }
    }
    return '';
  }

  createFrozenOverlay() {
    this.frozenOverlay = new Graphics();
    this.frozenOverlay.visible = false;
    this.container.addChild(this.frozenOverlay);
  }

  updateFrozenOverlay() {
    const size = this.getSize();
    this.frozenOverlay.clear();

    if (!this.isFrozen) {
      this.frozenOverlay.visible = false;
      if (this.frozenText) this.frozenText.visible = false;
      return;
    }

    this.frozenOverlay.visible = true;

    // Ice effect
    if (this.data.type === 'docker-container') {
      const w = size * 1.8;
      const h = size * 1.2;
      this.frozenOverlay.roundRect(-w/2 - 4, -h/2 - 8, w + 8, h + 12, 6);
      this.frozenOverlay.stroke({ width: 2, color: 0x88ccff, alpha: 0.6 });
    } else {
      this.frozenOverlay.circle(0, 0, size + 4);
      this.frozenOverlay.stroke({ width: 2, color: 0x88ccff, alpha: 0.6 });
    }

    // Snowflakes
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + this.bobOffset;
      const dist = size + 10 + Math.sin(this.bobOffset * 2 + i) * 3;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      this.frozenOverlay.circle(px, py, 2);
      this.frozenOverlay.fill({ color: 0xaaddff, alpha: 0.7 });
    }

    if (!this.frozenText) {
      const style = new TextStyle({
        fontFamily: 'Courier New',
        fontSize: 8,
        fill: '#88ccff',
        fontWeight: 'bold'
      });
      this.frozenText = new Text({ text: 'STALE', style });
      this.frozenText.anchor.set(0.5, 0.5);
      this.frozenText.y = -size - 18;
      this.container.addChild(this.frozenText);
    }
    this.frozenText.visible = true;
  }

  getColors() {
    if (this.isFrozen) return COLORS['frozen'];

    if (this.data.type === 'docker-container') {
      if (!this.data.running) return COLORS['docker-stopped'];
      if (this.data.health === 'healthy') return COLORS['docker-healthy'];
      if (this.data.health === 'unhealthy') return COLORS['docker-unhealthy'];
      return COLORS['docker-running'];
    }

    return COLORS[this.data.type] || COLORS['tmux-session'];
  }

  getSize() {
    if (this.data.type === 'tmux-session') return 18;
    if (this.data.type === 'tmux-pane') return 10;
    if (this.data.type === 'docker-container') {
      return 14 + Math.min(this.data.cpu || 0, 50) * 0.15;
    }
    return 14;
  }

  updateData(newData) {
    const oldActive = this.data.active;
    const oldRunning = this.data.running;
    const oldHealth = this.data.health;

    if (newData.active !== oldActive || newData.activity !== this.data.activity) {
      this.lastActivity = Date.now();
    }

    this.data = newData;

    // Update labels
    if (this.detailLabel) {
      this.detailLabel.text = this.getDetailText();
    }

    // Rebuild sprite if state changed
    if ((this.data.type === 'docker-container' && oldRunning !== newData.running) ||
        oldHealth !== newData.health) {
      this.container.removeChild(this.sprite);
      this.createSprite();
    }
  }

  update(deltaTime, allAgents) {
    const timeSinceActivity = Date.now() - this.lastActivity;
    const wasFrozen = this.isFrozen;

    if (this.data.type === 'docker-container' && !this.data.running) {
      this.isFrozen = true;
    } else if (timeSinceActivity > 30000 && !this.data.active) {
      this.isFrozen = true;
    } else {
      this.isFrozen = false;
    }

    if (wasFrozen !== this.isFrozen) {
      this.container.removeChild(this.sprite);
      this.createSprite();
      if (this.frozenText) this.frozenText.visible = false;
    }

    // Wander
    this.wanderTimer -= deltaTime;
    if (this.wanderTimer <= 0) {
      this.pickNewTarget();
      this.wanderTimer = this.isFrozen ? 200 : (60 + Math.random() * 120);
    }

    // Move
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      let speed = this.data.active ? 1.5 : 0.5;
      if (this.isFrozen) speed = 0.1;
      this.vx = (dx / dist) * speed;
      this.vy = (dy / dist) * speed;
      this.direction = this.vx > 0 ? 1 : -1;
    } else {
      this.vx *= 0.9;
      this.vy *= 0.9;
    }

    // Avoid others
    for (const other of allAgents.values()) {
      if (other === this) continue;
      const ox = other.x - this.x;
      const oy = other.y - this.y;
      const od = Math.sqrt(ox * ox + oy * oy);
      if (od < 45 && od > 0) {
        this.vx -= (ox / od) * 0.3;
        this.vy -= (oy / od) * 0.3;
      }
    }

    this.x += this.vx * deltaTime * 0.5;
    this.y += this.vy * deltaTime * 0.5;
    this.x = Math.max(40, Math.min(this.worldWidth - 40, this.x));
    this.y = Math.max(70, Math.min(this.worldHeight - 70, this.y));

    // Animation
    this.bobOffset += this.bobSpeed * deltaTime;
    let bob = Math.sin(this.bobOffset) * 2;

    if (this.isFrozen) {
      this.frozenShake += deltaTime * 0.5;
      bob = Math.sin(this.frozenShake * 10) * 1;
    }

    // Health pulse for docker
    if (this.data.type === 'docker-container' && this.data.health === 'healthy') {
      this.healthPulse += deltaTime * 0.1;
    }

    this.container.x = this.x;
    this.container.y = this.y + bob;
    this.sprite.scale.x = this.direction;

    // Alpha effects
    if (this.data.active || (this.data.cpu && this.data.cpu > 10)) {
      this.sprite.alpha = 0.85 + Math.sin(this.bobOffset * 2) * 0.15;
    } else if (this.isFrozen) {
      this.sprite.alpha = 0.6 + Math.sin(this.bobOffset) * 0.1;
    } else {
      this.sprite.alpha = 1;
    }

    this.updateFrozenOverlay();
  }

  pickNewTarget() {
    const range = this.isFrozen ? 20 : (this.data.active ? 150 : 80);
    this.targetX = this.x + (Math.random() - 0.5) * range;
    this.targetY = this.y + (Math.random() - 0.5) * range;
    this.targetX = Math.max(50, Math.min(this.worldWidth - 50, this.targetX));
    this.targetY = Math.max(80, Math.min(this.worldHeight - 80, this.targetY));
  }
}
