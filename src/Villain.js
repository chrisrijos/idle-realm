import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// The Reaper - appears when a process is killed
export class Villain {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.container = new Container();
    this.container.visible = false;

    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isActive = false;
    this.phase = 'idle'; // 'idle', 'appearing', 'moving', 'attacking', 'vanishing'
    this.phaseTimer = 0;
    this.bobOffset = 0;
    this.attackCallback = null;
    this.targetAgent = null;

    // Death particles
    this.deathParticles = [];
    this.particleContainer = new Container();

    this.createSprite();
  }

  createSprite() {
    this.sprite = new Graphics();

    // Reaper body (dark hooded figure)
    // Hood
    this.sprite.moveTo(0, -35);
    this.sprite.lineTo(-20, -10);
    this.sprite.lineTo(-18, 15);
    this.sprite.lineTo(18, 15);
    this.sprite.lineTo(20, -10);
    this.sprite.closePath();
    this.sprite.fill({ color: 0x1a1a2e, alpha: 0.95 });

    // Hood outline
    this.sprite.moveTo(0, -35);
    this.sprite.lineTo(-20, -10);
    this.sprite.lineTo(-18, 15);
    this.sprite.lineTo(18, 15);
    this.sprite.lineTo(20, -10);
    this.sprite.closePath();
    this.sprite.stroke({ width: 2, color: 0x4a0080 });

    // Inner hood darkness
    this.sprite.ellipse(0, -5, 12, 15);
    this.sprite.fill(0x000000);

    // Glowing eyes
    this.sprite.circle(-5, -8, 3);
    this.sprite.circle(5, -8, 3);
    this.sprite.fill(0xff0044);

    // Eye glow
    this.sprite.circle(-5, -8, 5);
    this.sprite.circle(5, -8, 5);
    this.sprite.fill({ color: 0xff0044, alpha: 0.3 });

    // Scythe
    this.sprite.moveTo(25, -25);
    this.sprite.lineTo(25, 25);
    this.sprite.stroke({ width: 3, color: 0x4a4a4a });

    // Scythe blade
    this.sprite.moveTo(25, -25);
    this.sprite.quadraticCurveTo(45, -35, 45, -15);
    this.sprite.quadraticCurveTo(45, -5, 25, -5);
    this.sprite.fill(0x888888);

    // Blade edge
    this.sprite.moveTo(25, -25);
    this.sprite.quadraticCurveTo(45, -35, 45, -15);
    this.sprite.stroke({ width: 1, color: 0xcccccc });

    // Wispy bottom
    for (let i = 0; i < 5; i++) {
      const wx = -15 + i * 8;
      const wy = 15 + Math.sin(i) * 3;
      this.sprite.moveTo(wx, wy);
      this.sprite.lineTo(wx + Math.sin(i * 0.7) * 5, wy + 15);
      this.sprite.stroke({ width: 2, color: 0x1a1a2e, alpha: 0.7 - i * 0.1 });
    }

    this.container.addChild(this.sprite);

    // Name label
    const style = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 10,
      fill: '#ff4466',
      fontWeight: 'bold',
      dropShadow: { color: '#000000', blur: 3, distance: 1 }
    });
    this.nameLabel = new Text({ text: 'THE REAPER', style });
    this.nameLabel.anchor.set(0.5, 0);
    this.nameLabel.y = 30;
    this.container.addChild(this.nameLabel);

    // Particle container for death effects
    this.container.addChild(this.particleContainer);
  }

  // Called when a kill action is triggered
  attackTarget(agent, callback) {
    if (this.isActive) return;

    this.isActive = true;
    this.targetAgent = agent;
    this.attackCallback = callback;

    // Start offscreen
    this.x = this.worldWidth + 50;
    this.y = agent.y;
    this.targetX = agent.x;
    this.targetY = agent.y;

    this.container.x = this.x;
    this.container.y = this.y;
    this.container.visible = true;
    this.container.alpha = 0;

    this.phase = 'appearing';
    this.phaseTimer = 0;
  }

  update(deltaTime) {
    if (!this.isActive && this.deathParticles.length === 0) return;

    this.bobOffset += deltaTime * 0.1;
    this.phaseTimer += deltaTime;

    switch (this.phase) {
      case 'appearing':
        // Fade in
        this.container.alpha = Math.min(1, this.phaseTimer / 30);
        if (this.phaseTimer > 30) {
          this.phase = 'moving';
          this.phaseTimer = 0;
        }
        break;

      case 'moving':
        // Glide toward target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 30) {
          const speed = 4;
          this.x += (dx / dist) * speed * deltaTime;
          this.y += (dy / dist) * speed * deltaTime;
        } else {
          this.phase = 'attacking';
          this.phaseTimer = 0;
        }
        break;

      case 'attacking':
        // Slash effect and spawn death particles
        if (this.phaseTimer < 20) {
          // Scythe swing animation
          this.sprite.rotation = Math.sin(this.phaseTimer * 0.5) * 0.5;
        } else if (this.phaseTimer === 20 || (this.phaseTimer > 20 && this.phaseTimer < 22)) {
          // Spawn death particles at target location
          if (this.targetAgent && this.deathParticles.length < 30) {
            this.spawnDeathParticles(this.targetAgent.x, this.targetAgent.y);
          }
        } else if (this.phaseTimer > 40) {
          // Execute the kill
          if (this.attackCallback) {
            this.attackCallback();
            this.attackCallback = null;
          }
          this.phase = 'vanishing';
          this.phaseTimer = 0;
        }
        break;

      case 'vanishing':
        // Fade out and move away
        this.x += 3 * deltaTime;
        this.container.alpha = Math.max(0, 1 - this.phaseTimer / 40);

        if (this.phaseTimer > 40) {
          this.phase = 'idle';
          this.isActive = false;
          this.container.visible = false;
          this.targetAgent = null;
          this.sprite.rotation = 0;
        }
        break;
    }

    // Update position with bob
    this.container.x = this.x;
    this.container.y = this.y + Math.sin(this.bobOffset) * 5;

    // Update death particles
    this.updateParticles(deltaTime);
  }

  spawnDeathParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      const particle = new Graphics();

      // Random particle type
      const type = Math.random();
      if (type < 0.3) {
        // Skull
        particle.circle(0, 0, 4);
        particle.fill(0xffffff);
        particle.circle(-1.5, -1, 1);
        particle.circle(1.5, -1, 1);
        particle.fill(0x000000);
        particle.rect(-1.5, 2, 3, 2);
        particle.fill(0x000000);
      } else if (type < 0.6) {
        // Soul wisp
        particle.circle(0, 0, 3);
        particle.fill({ color: 0x88ffff, alpha: 0.7 });
        particle.circle(0, -2, 2);
        particle.fill({ color: 0xaaffff, alpha: 0.5 });
      } else {
        // Dark shard
        particle.moveTo(0, -5);
        particle.lineTo(3, 0);
        particle.lineTo(0, 5);
        particle.lineTo(-3, 0);
        particle.closePath();
        particle.fill({ color: 0x4a0080, alpha: 0.8 });
      }

      // Position relative to parent container (world coords stored separately)
      particle.x = x;
      particle.y = y;

      this.particleContainer.addChild(particle);

      this.deathParticles.push({
        graphic: particle,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 4 - 2,
        life: 60 + Math.random() * 40,
        maxLife: 60 + Math.random() * 40,
        rotation: Math.random() * 0.2 - 0.1,
        gravity: 0.08
      });
    }
  }

  updateParticles(deltaTime) {
    for (let i = this.deathParticles.length - 1; i >= 0; i--) {
      const p = this.deathParticles[i];

      p.life -= deltaTime;
      p.vy += p.gravity * deltaTime;
      p.graphic.x += p.vx * deltaTime * 0.5;
      p.graphic.y += p.vy * deltaTime * 0.5;
      p.graphic.rotation += p.rotation * deltaTime;
      p.graphic.alpha = Math.max(0, p.life / p.maxLife);
      p.graphic.scale.set(0.5 + (p.life / p.maxLife) * 0.5);

      if (p.life <= 0) {
        this.particleContainer.removeChild(p.graphic);
        this.deathParticles.splice(i, 1);
      }
    }
  }

  // Create connection effect when villain is attacking
  getAttackLine() {
    if (this.phase !== 'attacking' || !this.targetAgent) return null;
    return {
      from: { x: this.x, y: this.y },
      to: { x: this.targetAgent.x, y: this.targetAgent.y },
      intensity: Math.sin(this.phaseTimer * 0.3) * 0.5 + 0.5
    };
  }
}
