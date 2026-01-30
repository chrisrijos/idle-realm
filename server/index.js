import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getTmuxData } from './tmux.js';
import { getDockerData } from './docker.js';

const execAsync = promisify(exec);
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3001;

// CORS for API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

// Poll and broadcast process data
async function pollProcesses() {
  try {
    const [tmux, docker] = await Promise.all([
      getTmuxData(),
      getDockerData()
    ]);

    broadcast({
      type: 'processes',
      timestamp: Date.now(),
      tmux,
      docker
    });
  } catch (err) {
    console.error('Poll error:', err.message);
  }
}

// API: Get logs
app.get('/api/logs', async (req, res) => {
  const { id, type } = req.query;

  try {
    let logs = '';

    if (type === 'docker-container') {
      const containerId = id.replace('docker-', '');
      const { stdout } = await execAsync(`docker logs --tail 50 ${containerId} 2>&1`);
      logs = stdout;
    } else if (type === 'tmux-pane') {
      const paneId = id.replace('tmux-pane-', '');
      const { stdout } = await execAsync(`tmux capture-pane -t ${paneId} -p -S -50 2>&1`);
      logs = stdout;
    } else if (type === 'tmux-session') {
      const sessionName = id.replace('tmux-session-', '');
      // Get first pane of session
      const { stdout } = await execAsync(`tmux capture-pane -t ${sessionName}:0.0 -p -S -50 2>&1`);
      logs = stdout;
    }

    res.json({ logs });
  } catch (e) {
    res.json({ error: e.message, logs: '' });
  }
});

// API: Kill process
app.post('/api/kill', async (req, res) => {
  const { id, type, name, paneId, session } = req.body;

  try {
    if (type === 'docker-container') {
      const containerId = id.replace('docker-', '');
      await execAsync(`docker stop ${containerId}`);
      res.json({ success: true, message: `Stopped container ${name}` });
    } else if (type === 'tmux-pane') {
      // Kill pane
      await execAsync(`tmux kill-pane -t ${paneId}`);
      res.json({ success: true, message: `Killed pane ${paneId}` });
    } else if (type === 'tmux-session') {
      // Kill entire session
      await execAsync(`tmux kill-session -t "${name}"`);
      res.json({ success: true, message: `Killed session ${name}` });
    } else {
      res.json({ error: 'Unknown process type' });
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial data immediately
  pollProcesses();

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start polling every 2 seconds
setInterval(pollProcesses, 2000);

server.listen(PORT, () => {
  console.log(`Fishtank server running on http://localhost:${PORT}`);
});
