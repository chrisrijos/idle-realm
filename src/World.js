import { Container, Graphics } from 'pixi.js';

const TILE_SIZE = 32;

// Tile types
const TILES = {
  GRASS: 0x2d4a3e,
  GRASS_LIGHT: 0x3d5a4e,
  STONE: 0x4a4a5a,
  WATER: 0x2a4a6a,
  WATER_LIGHT: 0x3a5a7a
};

export class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.container = new Container();

    this.createBackground();
    this.createTilemap();
    this.createBorder();
  }

  createBackground() {
    const bg = new Graphics();

    // Gradient-ish background
    bg.rect(0, 0, this.width, this.height);
    bg.fill(0x1a1a2e);

    this.container.addChild(bg);
  }

  createTilemap() {
    const tiles = new Graphics();
    const cols = Math.ceil(this.width / TILE_SIZE);
    const rows = Math.ceil(this.height / TILE_SIZE);

    // Generate simple tilemap
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Determine tile type based on position and noise
        const noise = this.noise(x * 0.3, y * 0.3);
        let color;

        if (noise > 0.6) {
          color = TILES.STONE;
        } else if (noise > 0.3) {
          color = (x + y) % 2 === 0 ? TILES.GRASS : TILES.GRASS_LIGHT;
        } else if (noise > 0.1) {
          color = TILES.GRASS_LIGHT;
        } else {
          color = (x + y) % 2 === 0 ? TILES.WATER : TILES.WATER_LIGHT;
        }

        tiles.rect(px, py, TILE_SIZE - 1, TILE_SIZE - 1);
        tiles.fill(color);
      }
    }

    // Add some decorative elements
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = 2 + Math.random() * 4;

      // Small grass tufts or stones
      tiles.circle(x, y, size);
      tiles.fill(Math.random() > 0.5 ? 0x4a6a5a : 0x5a5a6a);
    }

    tiles.alpha = 0.3;
    this.container.addChild(tiles);
  }

  createBorder() {
    const border = new Graphics();

    // Inner glow border
    border.rect(5, 5, this.width - 10, this.height - 10);
    border.stroke({ width: 2, color: 0x4a8a6a, alpha: 0.5 });

    // Outer frame
    border.rect(0, 0, this.width, this.height);
    border.stroke({ width: 4, color: 0x2a4a3a });

    // Corner decorations
    const corners = [[0, 0], [this.width, 0], [0, this.height], [this.width, this.height]];
    for (const [cx, cy] of corners) {
      border.circle(cx, cy, 8);
      border.fill(0x3a6a5a);
      border.circle(cx, cy, 4);
      border.fill(0x5a8a7a);
    }

    this.container.addChild(border);
  }

  // Simple noise function
  noise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
}
