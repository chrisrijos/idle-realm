import { Application } from 'pixi.js';
import { Game } from './Game.js';

const VERTICAL_WIDTH = 540;
const VERTICAL_HEIGHT = 960;

async function init() {
  const app = new Application();

  await app.init({
    width: VERTICAL_WIDTH,
    height: VERTICAL_HEIGHT,
    backgroundColor: 0x1a1a2e,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  });

  document.getElementById('game').appendChild(app.canvas);

  const game = new Game(app);
  await game.init();

  // Connect WebSocket
  const wsUrl = `ws://${window.location.hostname}:3001`;
  let ws;
  let reconnectTimeout;

  function connect() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      document.getElementById('status').textContent = 'Connected';
      document.getElementById('status').className = '';
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'processes') {
          game.updateProcesses(data);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    ws.onclose = () => {
      document.getElementById('status').textContent = 'Disconnected - Reconnecting...';
      document.getElementById('status').className = 'disconnected';
      clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  connect();

  // Game loop
  app.ticker.add((ticker) => {
    game.update(ticker.deltaTime);
  });
}

init().catch(console.error);
