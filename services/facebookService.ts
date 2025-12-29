
// Wrapper for Facebook Instant Games SDK 6.3 (API 8.0 compatible) AND Standard Web SDK
// Handles initialization, data saving, ads, and social features.

declare global {
    interface Window {
        FBInstant: any;
        FB: any;
        fbq: any;
        fbAsyncInit: any;
    }
}

class FacebookService {
    private isInitialized = false;
    private mode: 'INSTANT' | 'WEB' | 'MOCK' = 'MOCK';
    private webProfile: { name: string; photo: string; id: string } | null = null;

    constructor() {
        // Constructor logic if needed
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        // 1. Try Instant Games (Mobile/FB App)
        if (typeof window !== 'undefined' && window.FBInstant) {
            try {
                await window.FBInstant.initializeAsync();
                this.mode = 'INSTANT';
                this.isInitialized = true;
                console.log("FBInstant Initialized");
                return;
            } catch (error) {
                console.warn("FBInstant init failed, falling back...");
            }
        }

        // 2. Try Standard Web SDK (itch.io / Web)
        // We wait a bit for the async script to load if it hasn't yet
        if (typeof window !== 'undefined') {
            if (window.FB) {
                this.initWebSDK();
            } else {
                window.fbAsyncInit = () => {
                    this.initWebSDK();
                };
            }
        }
    }

    private initWebSDK() {
        try {
            window.FB.init({
                appId: '1734049544181820',
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
            this.mode = 'WEB';
            this.isInitialized = true;
            console.log("FB Web SDK Initialized");

            // Check if already logged in
            window.FB.getLoginStatus((response: any) => {
                if (response.status === 'connected') {
                    this.fetchWebProfile();
                }
            });
        } catch (e) {
            console.error("FB Web Init Failed:", e);
            this.mode = 'MOCK';
            this.isInitialized = true;
        }
    }

    // --- WEB AUTHENTICATION ---

    async loginWeb(): Promise<boolean> {
        if (this.mode !== 'WEB') return false;
        
        return new Promise((resolve) => {
            window.FB.login((response: any) => {
                if (response.authResponse) {
                    this.fetchWebProfile().then(() => resolve(true));
                } else {
                    console.log("User cancelled login or did not fully authorize.");
                    resolve(false);
                }
            }, { scope: 'public_profile' });
        });
    }

    async fetchWebProfile(): Promise<void> {
        if (this.mode !== 'WEB') return;
        return new Promise((resolve) => {
            window.FB.api('/me', { fields: 'name,picture.width(100).height(100)' }, (response: any) => {
                if (response && !response.error) {
                    this.webProfile = {
                        id: response.id,
                        name: response.name,
                        photo: response.picture?.data?.url
                    };
                    console.log("FB Web Profile Loaded:", this.webProfile);
                }
                resolve();
            });
        });
    }

    isWebMode(): boolean {
        return this.mode === 'WEB';
    }

    isInstantMode(): boolean {
        return this.mode === 'INSTANT';
    }

    isLoggedIn(): boolean {
        if (this.mode === 'INSTANT') return true; // Instant games are always logged in
        if (this.mode === 'WEB') return !!this.webProfile;
        return false;
    }

    // --- GAME LIFECYCLE ---

    setLoadingProgress(percentage: number): void {
        if (this.mode === 'INSTANT') {
            try { window.FBInstant.setLoadingProgress(percentage); } catch(e) {}
        }
    }

    async startGame(): Promise<void> {
        if (this.mode === 'INSTANT') {
            try {
                await window.FBInstant.startGameAsync();
                console.log("FBInstant Game Started");
            } catch (error) {
                console.error("FBInstant Start Failed:", error);
            }
        }
    }

    onPause(callback: () => void): void {
        if (this.mode === 'INSTANT') {
            try { window.FBInstant.onPause(callback); } catch (e) {}
        }
    }

    // --- PLAYER DATA ---

    getPlayerName(): string {
        if (this.mode === 'INSTANT') {
            try { return window.FBInstant.player.getName() || "Adventurer"; } catch (e) { return "Adventurer"; }
        } else if (this.mode === 'WEB' && this.webProfile) {
            return this.webProfile.name;
        }
        return "Local Hero";
    }

    getPlayerPhoto(): string | null {
        if (this.mode === 'INSTANT') {
            try { return window.FBInstant.player.getPhoto(); } catch (e) { return null; }
        } else if (this.mode === 'WEB' && this.webProfile) {
            return this.webProfile.photo;
        }
        return null;
    }

    getPlayerID(): string {
        if (this.mode === 'INSTANT') {
            try { return window.FBInstant.player.getID(); } catch (e) { return "local-user"; }
        } else if (this.mode === 'WEB' && this.webProfile) {
            return this.webProfile.id;
        }
        return "local-user";
    }

    // --- CLOUD STORAGE ---

    async saveData(key: string, data: any): Promise<void> {
        if (this.mode === 'INSTANT') {
            try { await window.FBInstant.player.setDataAsync({ [key]: data }); } catch (e) { console.error(e); }
        } else {
            // For Web/Mock, we rely on LocalStorage which is handled in storageService.ts
            // But we could implement a cloud save mock here if we had a backend.
            // For now, no-op or specific handling if we wanted to mirror to a DB.
        }
    }

    async loadData(keys: string[]): Promise<Record<string, any>> {
        if (this.mode === 'INSTANT') {
            try { return await window.FBInstant.player.getDataAsync(keys); } catch (e) { return {}; }
        }
        return {}; // storageService.ts handles localstorage fallback
    }

    async setStats(stats: Record<string, number>): Promise<void> {
        if (this.mode === 'INSTANT') {
            try { await window.FBInstant.player.setStatsAsync(stats); } catch (e) {}
        }
    }

    // --- SOCIAL & CONTEXT ---

    async chooseContext(): Promise<boolean> {
        if (this.mode === 'INSTANT') {
            try {
                await window.FBInstant.context.chooseAsync();
                return true;
            } catch (e) { return false; }
        }
        if (this.mode === 'MOCK' || this.mode === 'WEB') {
            alert("Context switching is only available on Facebook Instant Games.");
            return true;
        }
        return false;
    }

    getEntryPointData(): any {
        if (this.mode === 'INSTANT') {
            try { return window.FBInstant.getEntryPointData(); } catch (e) { return null; }
        }
        return null;
    }

    // --- LEADERBOARDS ---

    async submitScore(leaderboardName: string, score: number, extraData: string = ''): Promise<void> {
        if (this.mode === 'INSTANT') {
            try {
                const leaderboard = await window.FBInstant.getLeaderboardAsync(leaderboardName);
                await leaderboard.setScoreAsync(score, extraData);
            } catch (e) { console.warn("FB Leaderboard Error:", e); }
        }
    }

    postSessionScore(score: number): void {
        if (this.mode === 'INSTANT') {
            try { window.FBInstant.postSessionScoreAsync(score); } catch (e) {}
        }
    }

    async getLeaderboardEntries(leaderboardName: string, type: 'GLOBAL' | 'FRIENDS'): Promise<any[]> {
        if (this.mode === 'INSTANT') {
            try {
                const leaderboard = await window.FBInstant.getLeaderboardAsync(leaderboardName);
                if (type === 'GLOBAL') {
                    return await leaderboard.getEntriesAsync(10, 0);
                } else {
                    return await leaderboard.getConnectedPlayerEntriesAsync(10, 0);
                }
            } catch (e) {
                console.error("FB Leaderboard Error:", e);
                return [];
            }
        }
        return [];
    }

    // --- MESSENGER UPDATES ---

    private createChallengeImage(score: number, heroClass: string): string {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 630;
            const ctx = canvas.getContext('2d');
            if (!ctx) return '';

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 1200, 630);
            const grad = ctx.createLinearGradient(0, 0, 0, 630);
            grad.addColorStop(0, '#1e293b');
            grad.addColorStop(1, '#020617');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1200, 630);

            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 80px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("DRAGON'S HOARD", 600, 150);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 120px monospace';
            ctx.fillText(score.toLocaleString(), 600, 320);

            ctx.font = '40px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`Class: ${heroClass}`, 600, 420);

            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 50px sans-serif';
            ctx.fillText("CAN YOU BEAT ME?", 600, 520);

            return canvas.toDataURL('image/png');
        } catch (e) { return ''; }
    }

    async challengeFriend(score: number, heroClass: string): Promise<void> {
        if (this.mode === 'INSTANT') {
            try {
                const base64Image = this.createChallengeImage(score, heroClass);
                const payload = {
                    action: 'CUSTOM',
                    ctime: Date.now(),
                    template: 'play_turn', 
                    image: base64Image,
                    text: {
                        default: `I just scored ${score} in Dragon's Hoard!`,
                        localizations: { en_US: `I just scored ${score} in Dragon's Hoard!` }
                    },
                    data: { score: score, challenger: this.getPlayerName() },
                    strategy: 'IMMEDIATE',
                    notification: 'NO_PUSH'
                };
                await window.FBInstant.updateAsync(payload);
            } catch (e) { console.error(e); }
        } else {
            // Web Share Fallback
            if (navigator.share) {
                navigator.share({
                    title: "Dragon's Hoard",
                    text: `I just scored ${score} as a ${heroClass}! Can you beat me?`,
                    url: window.location.href
                }).catch(console.error);
            } else {
                alert(`Challenge Score: ${score}! Share this with your friends.`);
            }
        }
    }

    // --- PIXEL TRACKING ---
    trackPixelEvent(eventName: string, data?: object) {
        if (typeof window.fbq === 'function') {
            window.fbq('track', eventName, data);
        }
    }
}

export const facebookService = new FacebookService();
