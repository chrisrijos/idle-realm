import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class ContextMenu {
  constructor(app, onAction) {
    this.app = app;
    this.onAction = onAction;
    this.container = new Container();
    this.container.visible = false;
    this.currentAgent = null;
    this.logInterval = null;

    this.background = new Graphics();
    this.container.addChild(this.background);

    this.titleText = null;
    this.buttons = [];
    this.logPanel = null;
    this.logText = null;

    this.createMenu();

    // Close on click outside
    this.app.stage.eventMode = 'static';
    this.app.stage.on('pointerdown', (e) => {
      if (this.container.visible && !this.isInsideMenu(e.global.x, e.global.y)) {
        this.hide();
      }
    });
  }

  createMenu() {
    const menuWidth = 280;
    const menuHeight = 380;

    // Semi-transparent dark background
    this.background.roundRect(0, 0, menuWidth, menuHeight, 8);
    this.background.fill({ color: 0x1a1a2e, alpha: 0.95 });
    this.background.stroke({ width: 2, color: 0x4a8a6a });

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: '#7be67b',
      fontWeight: 'bold'
    });
    this.titleText = new Text({ text: 'Process', style: titleStyle });
    this.titleText.x = 10;
    this.titleText.y = 10;
    this.container.addChild(this.titleText);

    // Status text
    const statusStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 10,
      fill: '#888888'
    });
    this.statusText = new Text({ text: '', style: statusStyle });
    this.statusText.x = 10;
    this.statusText.y = 30;
    this.container.addChild(this.statusText);

    // Buttons
    this.createButton('View Logs', 50, () => this.viewLogs());
    this.createButton('Kill Process', 85, () => this.killProcess(), 0x8a4a4a);
    this.createButton('Close', 120, () => this.hide(), 0x4a4a6a);

    // Log panel
    this.logPanel = new Container();
    this.logPanel.y = 155;
    this.logPanel.visible = false;

    const logBg = new Graphics();
    logBg.roundRect(5, 0, menuWidth - 10, 220, 4);
    logBg.fill({ color: 0x0a0a12, alpha: 0.95 });
    logBg.stroke({ width: 1, color: 0x3a5a4a });
    this.logPanel.addChild(logBg);

    // Log panel title
    const logTitleStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 9,
      fill: '#6a8a6a',
      fontWeight: 'bold'
    });
    const logTitle = new Text({ text: '── LOGS ──', style: logTitleStyle });
    logTitle.x = menuWidth / 2 - logTitle.width / 2;
    logTitle.y = 4;
    this.logPanel.addChild(logTitle);

    // Legend
    const legendStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 7,
      fill: '#556655'
    });
    const legend = new Text({ text: '[!]err [~]warn [+]ok [i]info', style: legendStyle });
    legend.x = 10;
    legend.y = 16;
    this.logPanel.addChild(legend);

    const logStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 8,
      fill: '#aaffaa',
      wordWrap: true,
      wordWrapWidth: menuWidth - 25,
      lineHeight: 11
    });
    this.logText = new Text({ text: 'Loading logs...', style: logStyle });
    this.logText.x = 10;
    this.logText.y = 28;
    this.logPanel.addChild(this.logText);

    this.container.addChild(this.logPanel);
  }

  createButton(label, y, onClick, color = 0x3a6a5a) {
    const btn = new Container();
    btn.y = y;
    btn.x = 10;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, 260, 28, 4);
    bg.fill(color);
    btn.addChild(bg);

    const style = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 12,
      fill: '#ffffff'
    });
    const text = new Text({ text: label, style });
    text.x = 10;
    text.y = 6;
    btn.addChild(text);

    btn.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, 260, 28, 4);
      bg.fill(color + 0x222222);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, 260, 28, 4);
      bg.fill(color);
    });
    btn.on('pointerdown', onClick);

    this.container.addChild(btn);
    this.buttons.push(btn);
  }

  show(agent, x, y) {
    this.currentAgent = agent;
    this.container.visible = true;
    this.logPanel.visible = false;
    if (this.logInterval) clearInterval(this.logInterval);

    // Position menu (keep on screen)
    const menuWidth = 280;
    const menuHeight = 380;
    this.container.x = Math.min(x, this.app.screen.width - menuWidth - 10);
    this.container.y = Math.min(y, this.app.screen.height - menuHeight - 10);

    // Update title
    const name = agent.data.name.length > 20
      ? agent.data.name.substring(0, 20) + '...'
      : agent.data.name;
    this.titleText.text = name;

    // Update status with rich details
    let status = '';
    if (agent.data.type === 'docker-container') {
      const state = agent.data.running ? 'Running' : 'Stopped';
      const health = agent.data.health !== 'none' && agent.data.health !== 'unknown'
        ? ` [${agent.data.health}]` : '';
      status = `${state}${health}`;
      if (agent.data.running) {
        status += ` | CPU: ${agent.data.cpu.toFixed(1)}% MEM: ${agent.data.mem.toFixed(1)}%`;
      }
      if (agent.data.uptimeStr) status += `\nUptime: ${agent.data.uptimeStr}`;
      if (agent.data.portsStr && agent.data.portsStr !== 'none') {
        status += `\nPorts: ${agent.data.portsStr}`;
      }
      if (agent.data.image) status += `\nImage: ${agent.data.image}`;
    } else if (agent.data.type === 'tmux-session') {
      status = agent.data.attached ? 'Attached' : 'Detached';
      status += ` | Windows: ${agent.data.windowCount || 1}`;
      if (agent.data.uptimeStr) status += `\nUptime: ${agent.data.uptimeStr}`;
    } else if (agent.data.type === 'tmux-pane') {
      status = `Command: ${agent.data.command}`;
      status += ` | PID: ${agent.data.pid || '?'}`;
      if (agent.data.path) status += `\nPath: ${agent.data.path}`;
      if (agent.data.dimensions) status += `\nSize: ${agent.data.dimensions}`;
    }
    this.statusText.text = status;
  }

  hide() {
    this.container.visible = false;
    this.logPanel.visible = false;
    this.currentAgent = null;
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
    }
  }

  isInsideMenu(x, y) {
    const bounds = this.container.getBounds();
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }

  async viewLogs() {
    if (!this.currentAgent) return;

    this.logPanel.visible = true;
    this.logText.text = 'Loading logs...';
    
    // Clear any existing interval
    if (this.logInterval) clearInterval(this.logInterval);

    const fetchLogs = async () => {
        if (!this.container.visible || !this.logPanel.visible || !this.currentAgent) {
            if (this.logInterval) clearInterval(this.logInterval);
            return;
        }

        try {
          const response = await fetch(`http://localhost:3001/api/logs?id=${encodeURIComponent(this.currentAgent.data.id)}&type=${this.currentAgent.data.type}`);
          const data = await response.json();
    
          if (data.logs) {
            const formatted = this.formatLogs(data.logs);
            this.logText.text = formatted || '(no output)';
          } else {
            this.logText.text = data.error || 'Failed to load logs';
          }
        } catch (e) {
          this.logText.text = `Error: ${e.message}`;
        }
    };

    // Initial fetch
    fetchLogs();

    // Poll every 2 seconds
    this.logInterval = setInterval(fetchLogs, 2000);
  }

  formatLogs(rawLogs) {
    const lines = rawLogs.split('\n').slice(-30);
    const formatted = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      let formattedLine = line;

      // Truncate long lines
      if (formattedLine.length > 60) {
        formattedLine = formattedLine.substring(0, 57) + '...';
      }

      // Add visual markers for log levels
      if (/error|fail|fatal|exception/i.test(line)) {
        formattedLine = `[!] ${formattedLine}`;
      } else if (/warn|warning/i.test(line)) {
        formattedLine = `[~] ${formattedLine}`;
      } else if (/info|notice/i.test(line)) {
        formattedLine = `[i] ${formattedLine}`;
      } else if (/debug|trace/i.test(line)) {
        formattedLine = `[.] ${formattedLine}`;
      } else if (/success|complete|done|ready|started|listening/i.test(line)) {
        formattedLine = `[+] ${formattedLine}`;
      }

      // Clean up common timestamp formats
      formattedLine = formattedLine
        .replace(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\d]*Z?\s*/g, '')
        .replace(/^\[\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\d]*Z?\]\s*/g, '')
        .replace(/^time="[^"]*"\s*/g, '')
        .replace(/^level=(\w+)\s*/g, '[$1] ');

      formatted.push(formattedLine);
    }

    return formatted.join('\n');
  }

  async killProcess() {
    if (!this.currentAgent) return;

    const confirmed = confirm(`Kill ${this.currentAgent.data.name}?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3001/api/kill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: this.currentAgent.data.id,
          type: this.currentAgent.data.type,
          name: this.currentAgent.data.name,
          paneId: this.currentAgent.data.paneId,
          session: this.currentAgent.data.session
        })
      });
      const data = await response.json();

      if (data.success) {
        this.hide();
      } else {
        alert(data.error || 'Failed to kill process');
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  }
}
