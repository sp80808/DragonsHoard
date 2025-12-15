
class RNG {
    private seed: number;
    private useSeeded: boolean = false;

    constructor() {
        this.seed = Date.now();
    }

    setSeed(seed: number) {
        this.seed = seed;
        this.useSeeded = true;
        // Warm up
        this.next();
        this.next();
    }

    disableSeeded() {
        this.useSeeded = false;
    }

    // Mulberry32 Algorithm - Simple, fast, deterministic
    private random() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    next() {
        if (!this.useSeeded) return Math.random();
        return this.random();
    }

    // Helper: Float between min and max
    nextRange(min: number, max: number) {
        return this.next() * (max - min) + min;
    }

    // Helper: Int between min and max (inclusive)
    nextInt(min: number, max: number) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    // Helper: Pick random element from array
    choice<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)];
    }
    
    // Helper: Shuffle array in place (Fisher-Yates)
    shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

export const rng = new RNG();
