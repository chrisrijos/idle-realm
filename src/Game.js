import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Agent } from './Agent.js';
import { World } from './World.js';
import { Dialog } from './Dialog.js';
import { Connections } from './Connections.js';
import { ContextMenu } from './ContextMenu.js';
import { AudioManager } from './Audio.js';

export class Game {
  constructor(app) {
    this.app = app;
    this.agents = new Map();
    this.world = null;
    this.dialogSystem = null;
    this.agentContainer = null;
    this.connections = null;
    this.contextMenu = null;
    this.audio = new AudioManager();
  }

  async init() {
    // Create world (tilemap background)
    this.world = new World(this.app.screen.width, this.app.screen.height);
    this.app.stage.addChild(this.world.container);

    // Create connections layer (renders behind agents)
    this.connections = new Connections();
    this.app.stage.addChild(this.connections.container);

    // Create agent container
    this.agentContainer = new Container();
    this.app.stage.addChild(this.agentContainer);

    // Create dialog system
    this.dialogSystem = new Dialog();
    this.app.stage.addChild(this.dialogSystem.container);

    // Create context menu (on top)
    this.contextMenu = new ContextMenu(this.app, (action, agent) => {
      this.handleMenuAction(action, agent);
    });
    this.app.stage.addChild(this.contextMenu.container);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 16,
      fill: '#6a8',
      fontWeight: 'bold'
    });
    const title = new Text({ text: 'THE IDLE REALM', style: titleStyle });
    title.x = this.app.screen.width / 2 - title.width / 2;
    title.y = 10;
    this.app.stage.addChild(title);

    // Audio button
    this.createAudioButton();
  }

  createAudioButton() {
    const btn = new Container();
    btn.x = this.app.screen.width - 40;
    btn.y = 10;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, 30, 24, 4);
    bg.fill({ color: 0x2a4a3a, alpha: 0.8 });
    btn.addChild(bg);

    const style = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: '#88aa88'
    });
    this.audioIcon = new Text({ text: '♪', style });
    this.audioIcon.x = 8;
    this.audioIcon.y = 3;
    btn.addChild(this.audioIcon);

    btn.on('pointerdown', async () => {
      const playing = await this.audio.toggle();
      this.audioIcon.style.fill = playing ? '#aaffaa' : '#88aa88';
      this.audioIcon.text = playing ? '♫' : '♪';
    });

    this.app.stage.addChild(btn);
  }

  handleMenuAction(action, agent) {
    if (action === 'kill') {
      this.audio.playKill();
    }
  }

  updateProcesses(data) {
    const seenIds = new Set();

    // Process tmux sessions
    for (const session of data.tmux.sessions) {
      seenIds.add(session.id);
      this.upsertAgent(session);
    }

    // Process tmux panes
    for (const pane of data.tmux.panes) {
      seenIds.add(pane.id);
      this.upsertAgent(pane);
    }

    // Process docker containers
    for (const container of data.docker.containers) {
      seenIds.add(container.id);
      this.upsertAgent(container);
    }

    // Remove agents that no longer exist
    for (const [id, agent] of this.agents) {
      if (!seenIds.has(id)) {
        this.agentContainer.removeChild(agent.container);
        this.agents.delete(id);
        this.audio.playKill();
      }
    }
  }

  upsertAgent(processData) {
    let agent = this.agents.get(processData.id);

    if (!agent) {
      // Create new agent
      agent = new Agent(processData, this.app.screen.width, this.app.screen.height);
      this.agents.set(processData.id, agent);
      this.agentContainer.addChild(agent.container);

      // Add click handler
      agent.container.on('pointerdown', (e) => {
        e.stopPropagation();
        this.contextMenu.show(agent, e.global.x, e.global.y);
      });

      // Show spawn dialog and play sound
      this.dialogSystem.show(agent, `${processData.name} spawned!`, 2000);

      if (processData.type === 'docker-container') {
        if (processData.running) {
          this.audio.playContainerStart();
        } else {
          this.audio.playContainerStop();
        }
      } else {
        this.audio.playSpawn();
      }
    } else {
      // Update existing agent - detect state changes
      const wasRunning = agent.data.running;
      const wasActive = agent.data.active;
      const oldHealth = agent.data.health;
      const wasFrozen = agent.isFrozen;

      agent.updateData(processData);

      // Docker container state changes
      if (processData.type === 'docker-container') {
        // Container started
        if (!wasRunning && processData.running) {
          this.dialogSystem.show(agent, `${processData.name} started!`, 2000);
          this.audio.playContainerStart();
        }
        // Container stopped
        else if (wasRunning && !processData.running) {
          this.dialogSystem.show(agent, `${processData.name} stopped!`, 2000);
          this.audio.playContainerStop();
        }

        // Health status changes
        if (oldHealth !== processData.health) {
          if (processData.health === 'healthy') {
            this.dialogSystem.show(agent, 'Health check passed!', 1500);
            this.audio.playHealthy();
          } else if (processData.health === 'unhealthy') {
            this.dialogSystem.show(agent, 'UNHEALTHY!', 2500);
            this.audio.playUnhealthy();
          }
        }
      }

      // Activity changes
      if (!wasActive && processData.active) {
        this.dialogSystem.show(agent, `${processData.name} active!`, 1500);
      }

      // Frozen state change
      if (!wasFrozen && agent.isFrozen) {
        this.dialogSystem.show(agent, 'Going stale...', 2000);
        this.audio.playFrozen();
      }
    }
  }

  update(deltaTime) {
    // Update all agents
    for (const agent of this.agents.values()) {
      agent.update(deltaTime, this.agents);
    }

    // Update connections between agents
    this.connections.update(this.agents, deltaTime);

    // Update dialogs
    this.dialogSystem.update(deltaTime);

    // Occasionally show random dialog
    if (Math.random() < 0.002 && this.agents.size > 0) {
      const agentArray = Array.from(this.agents.values());
      const randomAgent = agentArray[Math.floor(Math.random() * agentArray.length)];
      const messages = this.getIdleMessages(randomAgent.data);
      const msg = messages[Math.floor(Math.random() * messages.length)];
      this.dialogSystem.show(randomAgent, msg, 2500);
    }
  }

  getIdleMessages(data) {
    if (data.type === 'tmux-session') {
      return [
        `Session: ${data.name}`,
        data.attached ? 'Attached...' : 'Waiting...',
        '*stretches*',
        'Monitoring...'
      ];
    } else if (data.type === 'tmux-pane') {
      return [
        `Running: ${data.command}`,
        data.active ? 'Active!' : 'Idle...',
        '*typing*',
        '...'
      ];
    } else if (data.type === 'docker-container') {
      if (data.running) {
        return [
          `CPU: ${data.cpu.toFixed(1)}%`,
          `MEM: ${data.mem.toFixed(1)}%`,
          `Image: ${data.image.split(':')[0]}`,
          '*processing*'
        ];
      } else {
        return [
          'Stopped...',
          '*zzz*',
          'Waiting...',
          data.status
        ];
      }
    }
    return ['...'];
  }
}
