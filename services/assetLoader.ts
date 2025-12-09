


import { TILE_STYLES, BOSS_STYLE, RUNE_STYLES, MUSIC_PATHS, STAGES, getStageBackground } from '../constants';
import { audioService } from './audioService';

// In-memory cache to prevent redundant fetches
const assetCache = new Map<string, Promise<void>>();

const retryOperation = async (operation: () => Promise<void>, maxRetries: number = 2): Promise<void> => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await operation();
            return;
        } catch (err: any) {
            // Optimization: If the resource is missing (404), don't retry.
            if (err && err.message && err.message.includes('404')) {
                console.warn(`Resource missing (404), skipping retry: ${err.message}`);
                return;
            }

            // Only log if it's not the last attempt
            if (i < maxRetries - 1) {
                console.warn(`Asset load failed (Attempt ${i + 1}/${maxRetries}), retrying...`, err);
                await new Promise(r => setTimeout(r, 300 * (i + 1))); // Exponential backoff
            }
        }
    }
    // Final failure is silent here to allow app to proceed without that asset
};

const loadImage = (url: string): Promise<void> => {
    if (assetCache.has(url)) return assetCache.get(url)!;

    const promise = new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    });

    assetCache.set(url, promise);
    return promise;
};

const loadAudio = (key: string, url: string): Promise<void> => {
    const cacheKey = `audio:${key}`;
    if (assetCache.has(cacheKey)) return assetCache.get(cacheKey)!;

    const promise = audioService.loadTrack(key, url);
    assetCache.set(cacheKey, promise);
    return promise;
};

// Loads essential assets needed for the Splash Screen and immediate Gameplay start
export const loadCriticalAssets = async (onProgress: (percent: number) => void) => {
    let loadedCount = 0;
    
    // 1. Collect Image URLs (Visuals are critical)
    const imagesToLoad = [
        ...Object.values(TILE_STYLES).map(s => s.imageUrl),
        BOSS_STYLE.imageUrl,
        ...Object.values(RUNE_STYLES).map(s => s.imageUrl),
        ...STAGES.map(s => getStageBackground(s.name)).filter(url => !!url)
    ].filter(Boolean);

    // 2. Collect Critical Audio (Only Splash Music)
    const audioToLoad = [
        { key: 'SPLASH', url: MUSIC_PATHS.SPLASH }
    ];

    const totalAssets = imagesToLoad.length + audioToLoad.length;
    if (totalAssets === 0) {
        onProgress(100);
        return;
    }

    const updateProgress = () => {
        loadedCount++;
        onProgress(Math.min(100, Math.floor((loadedCount / totalAssets) * 100)));
    };

    // 3. Execute Loads concurrently
    const imagePromises = imagesToLoad.map(url => 
        retryOperation(() => loadImage(url))
        .then(updateProgress)
    );

    const audioPromises = audioToLoad.map(track => 
        retryOperation(() => loadAudio(track.key, track.url))
        .then(updateProgress)
    );

    await Promise.allSettled([...imagePromises, ...audioPromises]);
    
    // Ensure 100% at end
    onProgress(100);
};

// Loads remaining audio tracks in the background
export const loadBackgroundAssets = async () => {
    const audioToLoad = [
        { key: 'DEATH', url: MUSIC_PATHS.DEATH }
        // Gameplay music is now procedural, so we don't load those files.
    ];

    const audioPromises = audioToLoad.map(track => 
        retryOperation(() => loadAudio(track.key, track.url))
    );

    await Promise.allSettled(audioPromises);
    console.log("Background assets loaded.");
};
