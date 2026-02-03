import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// Sprite colors by type
const COLORS = {
  'tmux-session': { body: 0xe6e6fa, accent: 0xd8bfd8, glow: 0xff69b4 }, // Jellyfish (lavender)
  'tmux-pane': { body: 0xff7f50, accent: 0xff6347, glow: 0xffa07a },    // Clownfish (orange)
  'docker-running': { body: 0x4682b4, accent: 0x5f9ea0, glow: 0x87ceeb }, // Whale (steel blue)
  'docker-stopped': { body: 0x708090, accent: 0x2f4f4f, glow: 0xa9a9a9 }, // Gray whale
  'docker-healthy': { body: 0x2e8b57, accent: 0x3cb371, glow: 0x98fb98 }, // Green whale
  'docker-unhealthy': { body: 0xcd5c5c, accent: 0xf08080, glow: 0xff6b6b }, // Red whale
  'frozen': { body: 0xaaddff, accent: 0x88ccff, glow: 0xe0ffff }         // Frozen blue
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
    this.tailAngle = 0;
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
      this.drawWhaleSprite(colors, size);
    } else if (this.data.type === 'tmux-session') {
      this.drawJellyfishSprite(colors, size);
    } else if (this.data.type === 'tmux-pane') {
      this.drawFishSprite(colors, size);
    }

    this.container.addChild(this.sprite);
  }

  drawWhaleSprite(colors, size) {
    const w = size * 2.5;
    const h = size * 1.5;

    // Body (ellipse)
    this.sprite.ellipse(0, 0, w/2, h/2);
    this.sprite.fill(colors.body);

    // Tail
    this.sprite.moveTo(-w/2, 0);
    this.sprite.lineTo(-w/2 - size, -size/2);
    this.sprite.lineTo(-w/2 - size, size/2);
    this.sprite.fill(colors.accent);

    // Eye
    this.sprite.circle(w/4, -h/6, 2);
    this.sprite.fill(0xffffff);
    this.sprite.circle(w/4, -h/6, 1);
    this.sprite.fill(0x000000);

    // Belly
    this.sprite.arc(0, 0, w/2, 0.5, Math.PI - 0.5);
    this.sprite.fill({ color: 0xffffff, alpha: 0.3 });

    // Blowhole spray (if running)
    if (this.data.running) {
        this.sprite.circle(0, -h/2 - 2, 2);
        this.sprite.fill({ color: 0xffffff, alpha: 0.5 });
    }
  }

  drawJellyfishSprite(colors, size) {
    // Dome
    this.sprite.arc(0, 0, size, Math.PI, 0);
    this.sprite.lineTo(size, size/2);
    this.sprite.lineTo(-size, size/2);
    this.sprite.fill(colors.body);

    // Tentacles
    for (let i = 0; i < 3; i++) {
       this.sprite.rect(-size/2 + i * (size/2), size/2, 2, size);
       this.sprite.fill(colors.accent);
    }
    
    // Glow
    this.sprite.circle(0, 0, size * 0.5);
    this.sprite.fill({ color: colors.glow, alpha: 0.5 });
  }

  drawFishSprite(colors, size) {
    // Body
    this.sprite.ellipse(0, 0, size * 1.5, size * 0.8);
    this.sprite.fill(colors.body);

    // Tail
    this.sprite.moveTo(-size * 1.5, 0);
    this.sprite.lineTo(-size * 2, -size/2);
    this.sprite.lineTo(-size * 2, size/2);
    this.sprite.fill(colors.accent);

    // Stripe
    this.sprite.rect(-size/2, -size * 0.8, size/2, size * 1.6);
    this.sprite.fill(0xffffff);

    // Eye
    this.sprite.circle(size * 0.8, -size * 0.3, 2);
    this.sprite.fill(0x000000);
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

    // Bubble Trap Effect
    this.frozenOverlay.circle(0, 0, size * 2);
    this.frozenOverlay.stroke({ width: 1, color: 0xffffff, alpha: 0.8 });
    this.frozenOverlay.fill({ color: 0xffffff, alpha: 0.2 });
    
    // Bubble highlight
    this.frozenOverlay.arc(-size/2, -size/2, size/2, 3, 4.5);
    this.frozenOverlay.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });

    if (!this.frozenText) {
      const style = new TextStyle({
        fontFamily: 'Courier New',
        fontSize: 8,
        fill: '#88ccff',
        fontWeight: 'bold'
      });
      this.frozenText = new Text({ text: 'STALE', style });
      this.frozenText.anchor.set(0.5, 0.5);
      this.frozenText.y = -size * 2 - 10;
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

  destroy() {
    this.container.destroy({ children: true });
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

    // Avoid others - Throttled check for performance
    if (Math.random() < 0.2) { // Only check 20% of frames
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

    // Tail wag for fish/whales
    if (this.data.type !== 'tmux-session') {
       // Simple skew to simulate tail movement
       this.sprite.skew.y = Math.sin(this.bobOffset * 4) * 0.1;
    }

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
