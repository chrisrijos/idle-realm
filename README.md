# Fishtank 🐟

**A visual process monitor for tmux sessions and Docker containers.**

Watch your terminal processes swim around like creatures in a fishtank. Fishtank transforms boring process lists into an ambient, interactive 2D visualization with fantasy RPG-inspired sprites.

![Fishtank Demo](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18-green)

## Features

- **Real-time visualization** of tmux sessions, panes, and Docker containers
- **Distinct sprite types**: Wizards (tmux sessions), Familiars (panes), Containers (Docker)
- **Click-to-interact**: View logs, kill processes, see detailed stats
- **Health monitoring**: Visual indicators for container health status
- **Stale detection**: Frozen animation for inactive/stopped processes
- **Connection lines**: See relationships between sessions and panes
- **Ambient soundtrack**: Procedural synth music (toggle on/off)
- **Sound effects**: Audio cues for spawns, kills, errors, and state changes
- **Vertical layout**: Optimized for portrait/fishtank monitor orientation

## Quick Start

```bash
# Clone the repo
git clone https://github.com/chrisrijos/fishtank.git
cd fishtank

# Install dependencies
npm install

# Start the server
npm run dev

# Open in browser
open http://localhost:3000
```

## Requirements

- Node.js 18+
- tmux (optional - for tmux process monitoring)
- Docker (optional - for container monitoring)

## Usage

### Keyboard & Mouse

| Action | Effect |
|--------|--------|
| Click sprite | Open context menu |
| Click ♪ button | Toggle ambient music |
| Click outside menu | Close menu |

### Context Menu Options

- **View Logs**: See last 30 lines of process output
- **Kill Process**: Stop container or kill tmux session/pane
- **Close**: Dismiss the menu

### Sprite Types

| Sprite | Process Type | Color |
|--------|--------------|-------|
| 🧙 Wizard | tmux session | Purple |
| ✨ Familiar | tmux pane | Cyan |
| 📦 Container | Docker (running) | Green |
| 🪨 Stone | Docker (stopped) | Gray |
| ❄️ Frozen | Stale/inactive | Blue tint |

### Visual Indicators

- **Green dot**: Healthy container
- **Red dot**: Unhealthy container
- **Port dots**: Exposed ports (bottom of container)
- **Ice ring**: Stale/frozen process
- **Connection lines**: Parent-child relationships

## Configuration

The server runs on port 3001 (WebSocket + API) and the frontend on port 3000.

```javascript
// vite.config.js - change ports if needed
server: {
  port: 3000
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/logs` | GET | Get process logs |
| `/api/kill` | POST | Kill a process |
| `ws://localhost:3001` | WebSocket | Real-time process updates |

## Architecture

```
┌─────────────────────────────────────┐
│  Browser (PixiJS)                   │
│  • 2D sprite rendering              │
│  • WebSocket client                 │
│  • Audio (Web Audio API)            │
└──────────────┬──────────────────────┘
               │ WebSocket
┌──────────────┴──────────────────────┐
│  Node.js Server                     │
│  • Express + ws                     │
│  • tmux CLI polling                 │
│  • Docker CLI polling               │
│  • REST API for logs/kill           │
└─────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: PixiJS 8, Vite, Web Audio API
- **Backend**: Node.js, Express, ws (WebSocket)
- **Data**: tmux CLI, Docker CLI

## Development

```bash
# Run in development mode (hot reload)
npm run dev

# Run server only
npm run server

# Run client only
npm run client

# Build for production
npm run build
```

## Roadmap

- [ ] Kubernetes pod support
- [ ] Process CPU/memory graphs
- [ ] Custom themes
- [ ] Plugin system for other process types
- [ ] Multi-monitor support

## Contributing

Contributions welcome! Please read the contributing guidelines first.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Chris Rijos** - [@chrisrijos](https://github.com/chrisrijos)

---

*Made with 🐟 for developers who like to watch their processes swim.*
