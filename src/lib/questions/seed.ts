// Seeded pseudo-random number generator (Mulberry32)
export class SeededRandom {
  private state: number;

  constructor(seed?: string | number) {
    if (seed === undefined) {
      // High-entropy random seed
      const highEntropy = `${Date.now()}_${Math.random()}_${performance.now()}_${Math.random() * 1000000}`;
      let hash = 0;
      for (let i = 0; i < highEntropy.length; i++) {
        hash = (hash << 5) - hash + highEntropy.charCodeAt(i);
        hash |= 0;
      }
      this.state = (hash >>> 0) || Math.floor(Math.random() * 2147483647) + 1;
    } else if (typeof seed === "string") {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      this.state = (hash >>> 0) || Math.floor(Math.random() * 2147483647) + 1;
    } else {
      let num = seed;
      if (!Number.isInteger(num)) {
        num = Math.floor(num * 2147483647);
      }
      this.state = (num >>> 0) || Math.floor(Math.random() * 2147483647) + 1;
    }

    if (this.state === 0) {
      this.state = Math.floor(Math.random() * 2147483647) + 1;
    }
  }

  // Returns a float [0, 1)
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns integer between min and max inclusive
  range(min: number, max: number): number {
    if (min >= max) return min;
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Pick random element from array
  pick<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error("Cannot pick from empty array");
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }

  // Shuffle array (non-mutating)
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

/** Helper function to create an RNG with guaranteed freshness if no seed provided */
export function createRng(seed?: string | number): SeededRandom {
  return new SeededRandom(seed);
}
