import { Container, Graphics } from 'pixi.js';

export class Connections {
  constructor() {
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);

    // Particle effects for interactions
    this.particles = [];
  }

  update(agents, deltaTime) {
    this.graphics.clear();

    const agentArray = Array.from(agents.values());

    // Draw parent-child connections (tmux session -> panes)
    for (const agent of agentArray) {
      if (agent.data.type === 'tmux-pane') {
        // Find parent session
        const parent = agentArray.find(
          a => a.data.type === 'tmux-session' && a.data.name === agent.data.session
        );
        if (parent) {
          this.drawConnection(parent, agent, 0x48d1cc, 0.3);
        }
      }
    }

    // Draw proximity interactions (when agents are close)
    for (let i = 0; i < agentArray.length; i++) {
      for (let j = i + 1; j < agentArray.length; j++) {
        const a = agentArray[i];
        const b = agentArray[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Close proximity - draw interaction line
        if (dist < 60 && dist > 20) {
          const alpha = (60 - dist) / 60 * 0.5;

          // Different colors for different interaction types
          let color = 0x5a8a7a; // default green

          if (a.data.type === b.data.type) {
            color = 0x7a7aaa; // same type = purple
          } else if (
            (a.data.type.includes('docker') && b.data.type.includes('docker')) ||
            (a.data.type.includes('tmux') && b.data.type.includes('tmux'))
          ) {
            color = 0x8a8a5a; // same family = yellow
          }

          this.drawConnection(a, b, color, alpha);

          // Spawn particles at interaction point
          if (Math.random() < 0.05) {
            this.spawnParticle((a.x + b.x) / 2, (a.y + b.y) / 2, color);
          }
        }

        // Very close - "talking" interaction
        if (dist < 35 && dist > 10) {
          this.drawTalkingIndicator(a, b);
        }
      }
    }

    // Draw docker container clusters (same image/network)
    const dockerAgents = agentArray.filter(a => a.data.type === 'docker-container' && a.data.running);
    for (let i = 0; i < dockerAgents.length; i++) {
      for (let j = i + 1; j < dockerAgents.length; j++) {
        const a = dockerAgents[i];
        const b = dockerAgents[j];

        // Connect containers from same project (by name prefix)
        const aPrefix = a.data.name.split('_')[0] || a.data.name.split('-')[0];
        const bPrefix = b.data.name.split('_')[0] || b.data.name.split('-')[0];

        if (aPrefix === bPrefix && aPrefix.length > 3) {
          this.drawConnection(a, b, 0x32cd32, 0.15);
        }
      }
    }

    // Update particles
    this.updateParticles(deltaTime);
  }

  drawConnection(a, b, color, alpha) {
    this.graphics.moveTo(a.x, a.y);
    this.graphics.lineTo(b.x, b.y);
    this.graphics.stroke({ width: 1, color, alpha });
  }

  drawTalkingIndicator(a, b) {
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;

    // Small sparkle at midpoint
    const time = Date.now() * 0.01;
    const pulse = Math.sin(time) * 0.5 + 0.5;

    this.graphics.circle(midX, midY, 3 + pulse * 2);
    this.graphics.fill({ color: 0xffffff, alpha: 0.3 + pulse * 0.3 });
  }

  spawnParticle(x, y, color) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2 - 1,
      life: 30,
      color
    });
  }

  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx * deltaTime * 0.5;
      p.y += p.vy * deltaTime * 0.5;
      p.vy += 0.05 * deltaTime; // gravity
      p.life -= deltaTime;

      if (p.life > 0) {
        const alpha = p.life / 30;
        this.graphics.circle(p.x, p.y, 2);
        this.graphics.fill({ color: p.color, alpha });
      } else {
        this.particles.splice(i, 1);
      }
    }
  }
}
