
import { TILE_STYLES, BOSS_STYLE, RUNE_STYLES, STAGES, getStageBackground, THEME_STYLES } from '../constants';

// In-memory cache to prevent redundant fetches
const assetCache = new Map<string, Promise<void>>();

// Wrapper to timeout a promise
const timeoutPromise = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout loading ${label} after ${ms}ms`));
        }, ms);

        promise
            .then(value => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });
    });
};

const retryOperation = async (operation: () => Promise<void>, label: string, maxRetries: number = 1): Promise<void> => {
    for (let i = 0; i <= maxRetries; i++) {
        try {
            await operation();
            return;
        } catch (err: any) {
            if (err && err.message && err.message.includes('404')) {
                console.warn(`Resource missing (404), skipping: ${label}`);
                return;
            }
            if (i < maxRetries) {
                console.warn(`Retrying ${label} (${i + 1}/${maxRetries})...`);
                await new Promise(r => setTimeout(r, 500)); // Wait before retry
            } else {
                console.warn(`Failed to load ${label} after retries. Continuing without it.`);
            }
        }
    }
};

const loadImage = (url: string): Promise<void> => {
    if (assetCache.has(url)) return assetCache.get(url)!;

    const loadOp = new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    });

    // Timeout images after 3s to prevent hanging the whole app
    const promise = timeoutPromise(loadOp, 3000, url);
    assetCache.set(url, promise);
    return promise;
};

// Loads essential assets needed for the Splash Screen and immediate Gameplay start
export const loadCriticalAssets = async (onProgress: (percent: number) => void, startThemeId: string = 'DEFAULT') => {
    let loadedCount = 0;
    
    // 1. Collect Image URLs (Visuals are critical)
    const imagesToLoad = [
        // SPLASH BACKGROUND
        'https://image.pollinations.ai/prompt/mysterious%20dark%20fantasy%20dungeon%20entrance%20environment%20art%20no%20text%20scenery?width=1024&height=1024&nologo=true&seed=99',
        
        // DYNAMIC BACKGROUND TEXTURES (Explicitly preloading to prevent pop-in)
        'https://www.transparenttextures.com/patterns/stardust.png',
        'https://www.transparenttextures.com/patterns/dark-stone.png',
        'https://www.transparenttextures.com/patterns/diagmonds-light.png',
        'https://www.transparenttextures.com/patterns/black-scales.png',
        'https://www.transparenttextures.com/patterns/gold-scale.png',
        'https://www.transparenttextures.com/patterns/foggy-birds.png', // Used for fog layer

        // GAME ASSETS
        ...Object.values(TILE_STYLES).map(s => s.imageUrl),
        BOSS_STYLE.imageUrl,
        ...Object.values(RUNE_STYLES).map(s => s.imageUrl),
        ...STAGES.map(s => getStageBackground(s.name)).filter(url => !!url)
    ].filter(Boolean);

    // If starting in a specific theme, ensure those assets are loaded critically
    if (startThemeId !== 'DEFAULT' && THEME_STYLES[startThemeId]) {
        const themeAssets = Object.values(THEME_STYLES[startThemeId]).map((s: any) => s.imageUrl).filter(Boolean);
        imagesToLoad.push(...themeAssets);
    }

    const totalAssets = imagesToLoad.length;
    if (totalAssets === 0) {
        onProgress(100);
        return;
    }

    const updateProgress = () => {
        loadedCount++;
        onProgress(Math.min(100, Math.floor((loadedCount / totalAssets) * 100)));
    };

    // 2. Execute Loads concurrently with fail-safety
    const imagePromises = imagesToLoad.map(url => 
        retryOperation(() => loadImage(url), 'image')
        .then(updateProgress)
    );

    await Promise.allSettled([...imagePromises]);
    
    // Ensure 100% at end regardless of failures
    onProgress(100);
};

// Loads ALL theme assets in the background
export const loadBackgroundAssets = async () => {
    const allThemeImages = Object.values(THEME_STYLES).flatMap(theme => 
        Object.values(theme).map((s: any) => s.imageUrl).filter(Boolean)
    );

    const visualPromises = allThemeImages.map(url => retryOperation(() => loadImage(url), 'theme_asset'));

    await Promise.allSettled(visualPromises);
    console.log("Background assets loaded.");
};
