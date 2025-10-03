'use client';

// Advanced Perlin noise implementation for better terrain generation
export class NoiseGenerator {
  private permutation: number[] = [];
  private gradients: number[][] = [];

  constructor(seed: number = 12345) {
    this.setupNoise(seed);
  }

  private setupNoise(seed: number) {
    // Create permutation table based on seed
    this.permutation = new Array(512);
    const p = new Array(256);

    // Initialize with seed-based values
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Shuffle based on seed
    let seededRandom = seed;
    for (let i = 255; i > 0; i--) {
      seededRandom = (seededRandom * 16807) % 2147483647;
      const j = Math.floor((seededRandom / 2147483647) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    // Duplicate for easy wrapping
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = p[i % 256];
    }

    // 3D gradients
    this.gradients = [
      [1, 1, 0],
      [-1, 1, 0],
      [1, -1, 0],
      [-1, -1, 0],
      [1, 0, 1],
      [-1, 0, 1],
      [1, 0, -1],
      [-1, 0, -1],
      [0, 1, 1],
      [0, -1, 1],
      [0, 1, -1],
      [0, -1, -1],
    ];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // 3D Perlin noise
  noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const perm = this.permutation;
    const A = perm[X]! + Y;
    const AA = perm[A]! + Z;
    const AB = perm[A + 1]! + Z;
    const B = perm[X + 1]! + Y;
    const BA = perm[B]! + Z;
    const BB = perm[B + 1]! + Z;

    return this.lerp(
      this.lerp(
        this.lerp(
          this.grad(perm[AA]!, x, y, z),
          this.grad(perm[BA]!, x - 1, y, z),
          u
        ),
        this.lerp(
          this.grad(perm[AB]!, x, y - 1, z),
          this.grad(perm[BB]!, x - 1, y - 1, z),
          u
        ),
        v
      ),
      this.lerp(
        this.lerp(
          this.grad(perm[AA + 1]!, x, y, z - 1),
          this.grad(perm[BA + 1]!, x - 1, y, z - 1),
          u
        ),
        this.lerp(
          this.grad(perm[AB + 1]!, x, y - 1, z - 1),
          this.grad(perm[BB + 1]!, x - 1, y - 1, z - 1),
          u
        ),
        v
      ),
      w
    );
  }

  // 2D noise for height maps
  noise2D(x: number, y: number): number {
    return this.noise3D(x, y, 0);
  }

  // Fractal noise (multiple octaves)
  fractalNoise3D(
    x: number,
    y: number,
    z: number,
    octaves: number = 4,
    persistence: number = 0.5
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value +=
        this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return value / maxValue;
  }

  // Fractal noise for height maps
  fractalNoise2D(
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5
  ): number {
    return this.fractalNoise3D(x, y, 0, octaves, persistence);
  }

  // Ridged noise for mountain-like features
  ridgedNoise2D(x: number, y: number, octaves: number = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      let n = Math.abs(this.noise2D(x * frequency, y * frequency));
      n = 1 - n;
      value += n * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }

  // Billowy noise for clouds and organic shapes
  billowyNoise3D(x: number, y: number, z: number, octaves: number = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      const n = Math.abs(
        this.noise3D(x * frequency, y * frequency, z * frequency)
      );
      value += n * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }

  // Domain warping for more organic terrain
  warpedNoise2D(x: number, y: number, warpStrength: number = 0.1): number {
    const warpX = this.fractalNoise2D(x * 0.1, y * 0.1) * warpStrength;
    const warpY =
      this.fractalNoise2D(x * 0.1 + 100, y * 0.1 + 100) * warpStrength;

    return this.fractalNoise2D(x + warpX, y + warpY);
  }
}

// Biome generation utilities
export class BiomeGenerator {
  private temperatureNoise: NoiseGenerator;
  private humidityNoise: NoiseGenerator;

  constructor(seed: number = 12345) {
    this.temperatureNoise = new NoiseGenerator(seed);
    this.humidityNoise = new NoiseGenerator(seed + 1000);
  }

  getBiome(x: number, z: number): BiomeType {
    const temperature = this.temperatureNoise.fractalNoise2D(
      x * 0.005,
      z * 0.005
    );
    const humidity = this.humidityNoise.fractalNoise2D(x * 0.007, z * 0.007);

    // Normalize to 0-1 range
    const temp = (temperature + 1) * 0.5;
    const humid = (humidity + 1) * 0.5;

    if (temp > 0.7 && humid < 0.3) return BiomeType.CRYSTAL_DESERT;
    if (temp < 0.3 && humid > 0.7) return BiomeType.CYBER_TUNDRA;
    if (temp > 0.6 && humid > 0.6) return BiomeType.NEON_JUNGLE;
    if (temp < 0.4 && humid < 0.4) return BiomeType.QUANTUM_HIGHLANDS;
    if (temp > 0.4 && temp < 0.6) return BiomeType.PLASMA_FOREST;

    return BiomeType.CRAZY_PLAINS;
  }
}

export enum BiomeType {
  CRAZY_PLAINS = 'crazy_plains',
  NEON_JUNGLE = 'neon_jungle',
  CRYSTAL_DESERT = 'crystal_desert',
  CYBER_TUNDRA = 'cyber_tundra',
  PLASMA_FOREST = 'plasma_forest',
  QUANTUM_HIGHLANDS = 'quantum_highlands',
}

export const BIOME_COLORS = {
  [BiomeType.CRAZY_PLAINS]: {
    grass: 0x00ff88,
    dirt: 0x884400,
    stone: 0x666666,
    water: 0x0088ff,
  },
  [BiomeType.NEON_JUNGLE]: {
    grass: 0x00ff00,
    dirt: 0x004400,
    stone: 0x228844,
    water: 0x00ffaa,
  },
  [BiomeType.CRYSTAL_DESERT]: {
    grass: 0xffcc88,
    dirt: 0xddaa66,
    stone: 0x8888ff,
    water: 0x66aaff,
  },
  [BiomeType.CYBER_TUNDRA]: {
    grass: 0x88ccff,
    dirt: 0x4488cc,
    stone: 0x6666aa,
    water: 0x0044aa,
  },
  [BiomeType.PLASMA_FOREST]: {
    grass: 0xff8800,
    dirt: 0xaa4400,
    stone: 0xcc6600,
    water: 0xff4488,
  },
  [BiomeType.QUANTUM_HIGHLANDS]: {
    grass: 0xaa88ff,
    dirt: 0x664488,
    stone: 0x8844cc,
    water: 0x4400ff,
  },
};
