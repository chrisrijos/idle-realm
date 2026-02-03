import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// The Predator - appears when a process is killed
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

    // Shark Body
    const len = 60;
    const h = 25;

    // Main body
    this.sprite.ellipse(0, 0, len/2, h/2);
    this.sprite.fill(0x607d8b); // Blue-grey

    // Top fin
    this.sprite.moveTo(-5, -h/2);
    this.sprite.lineTo(5, -h/2 - 15);
    this.sprite.lineTo(15, -h/2);
    this.sprite.fill(0x607d8b);

    // Tail fin
    this.sprite.moveTo(-len/2, 0);
    this.sprite.lineTo(-len/2 - 15, -15);
    this.sprite.lineTo(-len/2 - 5, 0);
    this.sprite.lineTo(-len/2 - 15, 15);
    this.sprite.fill(0x607d8b);

    // Belly (lighter)
    this.sprite.arc(0, 0, len/2, 0.5, Math.PI - 0.5);
    this.sprite.fill({ color: 0xb0bec5, alpha: 0.8 });

    // Eye
    this.sprite.circle(len/3, -5, 2);
    this.sprite.fill(0x000000);
    
    // Gills
    this.sprite.rect(10, -5, 2, 10);
    this.sprite.rect(5, -5, 2, 10);
    this.sprite.rect(0, -5, 2, 10);
    this.sprite.fill(0x455a64);

    // Teeth (hidden unless attacking, but let's show a grin)
    for (let i = 0; i < 5; i++) {
        this.sprite.moveTo(15 + i*3, 5);
        this.sprite.lineTo(16 + i*3, 8);
        this.sprite.lineTo(17 + i*3, 5);
        this.sprite.fill(0xffffff);
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
    this.nameLabel = new Text({ text: 'THE PREDATOR', style });
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
        // Swim fast toward target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 30) {
          const speed = 6;
          this.x += (dx / dist) * speed * deltaTime;
          this.y += (dy / dist) * speed * deltaTime;
          
          // Face direction
          this.sprite.scale.x = dx > 0 ? 1 : -1;
          this.nameLabel.scale.x = dx > 0 ? 1 : -1; // Keep text readable? No, this flips text.
          if (dx < 0) this.nameLabel.scale.x = -1; // Actually we want to flip the sprite not container if possible, but here we flip sprite via scale.
          
        } else {
          this.phase = 'attacking';
          this.phaseTimer = 0;
        }
        break;

      case 'attacking':
        // Chomp animation
        if (this.phaseTimer < 20) {
          // Open/Close mouth shake
           this.sprite.rotation = Math.sin(this.phaseTimer * 2) * 0.2;
        } else if (this.phaseTimer === 20 || (this.phaseTimer > 20 && this.phaseTimer < 22)) {
          // Spawn bubbles/debris
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
        // Swim away
        this.x += 5 * deltaTime;
        this.container.alpha = Math.max(0, 1 - this.phaseTimer / 40);

        if (this.phaseTimer > 40) {
          this.phase = 'idle';
          this.isActive = false;
          this.container.visible = false;
          this.targetAgent = null;
          this.sprite.rotation = 0;
          this.sprite.scale.x = 1;
        }
        break;
    }

    // Update position with bob
    this.container.x = this.x;
    this.container.y = this.y + Math.sin(this.bobOffset * 2) * 3;

    // Update death particles
    this.updateParticles(deltaTime);
  }

  spawnDeathParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      const particle = new Graphics();

      // Random particle type
      const type = Math.random();
      if (type < 0.5) {
        // Red Bubbles (Blood/Oil)
        particle.circle(0, 0, 3);
        particle.fill({ color: 0xff4444, alpha: 0.8 });
        particle.circle(-1, -1, 1);
        particle.fill({ color: 0xffaaaa, alpha: 0.5 });
      } else {
        // Debris
        particle.rect(-2, -2, 4, 4);
        particle.fill({ color: 0xcccccc, alpha: 0.8 });
      }

      // Position relative to parent container
      // Since container moves, we need to offset relative to it, or just use world coords if we weren't adding to this.container.
      // But we ARE adding to this.container. So we need local coords.
      particle.x = x - this.container.x;
      particle.y = y - this.container.y;

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
      intensity: Math.sin(this.phaseTimer * 0.8) * 0.5 + 0.5
    };
  }
}
