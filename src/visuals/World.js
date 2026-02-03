import { Container, Graphics } from 'pixi.js';

const TILE_SIZE = 32;

// Tile types
const TILES = {
  SAND: 0xe6d5ac,
  SAND_DARK: 0xd4c498,
  ROCK: 0x5a4a5a,
  DEEP_WATER: 0x0a1a2a,
  CORAL: 0xff7f50
};

export class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.container = new Container();

    this.bubbles = [];
    this.createBackground();
    this.createTilemap();
    this.createBorder();
  }

  createBackground() {
    const bg = new Graphics();

    // Deep ocean gradient (simulated with rects for now)
    bg.rect(0, 0, this.width, this.height);
    bg.fill(0x001e36); // Deep blue

    this.container.addChild(bg);
  }

  createTilemap() {
    const tiles = new Graphics();
    const cols = Math.ceil(this.width / TILE_SIZE);
    const rows = Math.ceil(this.height / TILE_SIZE);

    // Generate seabed
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Determine tile type based on position and noise
        const noise = this.noise(x * 0.2, y * 0.2);
        let color;

        // Bottom of screen is sand
        const depth = y / rows;
        
        if (depth > 0.8) {
           if (noise > 0.6) color = TILES.ROCK;
           else color = (x + y) % 2 === 0 ? TILES.SAND : TILES.SAND_DARK;
        } else {
           // Open water with some deep currents
           if (noise > 0.7) color = 0x002a4a;
           else color = 0x001e36;
        }

        tiles.rect(px, py, TILE_SIZE, TILE_SIZE);
        tiles.fill(color);
      }
    }

    // Add decorations (seaweed, bubbles, rocks)
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      
      if (y > this.height * 0.8) {
        // Seaweed on the bottom
        this.drawSeaweed(tiles, x, y);
      } else {
        // Distant bubbles/particles
        const size = 1 + Math.random() * 2;
        tiles.circle(x, y, size);
        tiles.fill({ color: 0xffffff, alpha: 0.1 });
      }
    }

    this.container.addChild(tiles);
  }

  drawSeaweed(graphics, x, y) {
    const height = 20 + Math.random() * 40;
    graphics.moveTo(x, y);
    // Simple wavy line
    graphics.bezierCurveTo(x - 5, y - height/3, x + 5, y - height*2/3, x, y - height);
    graphics.stroke({ width: 2, color: 0x2e8b57, alpha: 0.6 });
  }

  createBorder() {
    const border = new Graphics();

    // Inner glow border
    border.rect(5, 5, this.width - 10, this.height - 10);
    border.stroke({ width: 2, color: 0x4a8a6a, alpha: 0.3 });

    // Outer frame
    border.rect(0, 0, this.width, this.height);
    border.stroke({ width: 4, color: 0x1a3a5a });

    this.container.addChild(border);
  }

  // Simple noise function
  noise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
}
