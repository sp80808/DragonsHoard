
// Wrapper for Facebook Instant Games SDK 6.3 (API 8.0 compatible)
// Handles initialization, data saving, ads, and social features.

declare global {
    interface Window {
        FBInstant: any;
        fbq: any;
    }
}

class FacebookService {
    private isInitialized = false;
    private isMock = false;

    constructor() {
        if (typeof window !== 'undefined' && !window.FBInstant) {
            this.isMock = true;
            console.log("FBInstant not found. Running in MOCK mode.");
        }
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        if (this.isMock) {
            this.isInitialized = true;
            return;
        }

        try {
            await window.FBInstant.initializeAsync();
            this.isInitialized = true;
            console.log("FBInstant Initialized");
        } catch (error) {
            console.error("FBInstant Init Failed:", error);
            this.isMock = true;
        }
    }

    setLoadingProgress(percentage: number): void {
        if (this.isMock) return;
        try {
            window.FBInstant.setLoadingProgress(percentage);
        } catch(e) {}
    }

    async startGame(): Promise<void> {
        if (this.isMock) return;
        try {
            await window.FBInstant.startGameAsync();
            console.log("FBInstant Game Started");
        } catch (error) {
            console.error("FBInstant Start Failed:", error);
        }
    }

    onPause(callback: () => void): void {
        if (this.isMock) return;
        try {
            window.FBInstant.onPause(callback);
        } catch (e) {
            console.error("FB onPause failed:", e);
        }
    }

    // --- PLAYER DATA ---

    getPlayerName(): string {
        if (this.isMock) return "Local Hero";
        try {
            return window.FBInstant.player.getName() || "Adventurer";
        } catch (e) { return "Adventurer"; }
    }

    getPlayerPhoto(): string | null {
        if (this.isMock) return null;
        try {
            return window.FBInstant.player.getPhoto();
        } catch (e) { return null; }
    }

    getPlayerID(): string {
        if (this.isMock) return "local-user";
        try {
            return window.FBInstant.player.getID();
        } catch (e) { return "local-user"; }
    }

    // --- CLOUD STORAGE ---

    async saveData(key: string, data: any): Promise<void> {
        if (this.isMock) {
            localStorage.setItem(key, JSON.stringify(data));
            return;
        }
        try {
            await window.FBInstant.player.setDataAsync({ [key]: data });
        } catch (error) {
            console.error("FB Save Failed:", error);
        }
    }

    async loadData(keys: string[]): Promise<Record<string, any>> {
        if (this.isMock) {
            const result: Record<string, any> = {};
            keys.forEach(k => {
                const val = localStorage.getItem(k);
                if (val) result[k] = JSON.parse(val);
            });
            return result;
        }
        try {
            return await window.FBInstant.player.getDataAsync(keys);
        } catch (error) {
            console.error("FB Load Failed:", error);
            return {};
        }
    }

    async setStats(stats: Record<string, number>): Promise<void> {
        if (this.isMock) {
            console.log("Mock Stats Update:", stats);
            return;
        }
        try {
            await window.FBInstant.player.setStatsAsync(stats);
        } catch (error) {
            console.error("FB Stats Update Failed:", error);
        }
    }

    // --- SOCIAL & CONTEXT ---

    async chooseContext(): Promise<boolean> {
        if (this.isMock) {
            alert("Mock: Opening Friend Selector");
            return true;
        }
        try {
            await window.FBInstant.context.chooseAsync();
            console.log("Context Switched:", window.FBInstant.context.getID());
            return true;
        } catch (e) {
            console.log("Context selection cancelled/failed", e);
            return false;
        }
    }

    getEntryPointData(): any {
        if (this.isMock) return null;
        try {
            return window.FBInstant.getEntryPointData();
        } catch (e) { return null; }
    }

    // --- LEADERBOARDS ---

    async submitScore(leaderboardName: string, score: number, extraData: string = ''): Promise<void> {
        if (this.isMock) return;
        try {
            const leaderboard = await window.FBInstant.getLeaderboardAsync(leaderboardName);
            await leaderboard.setScoreAsync(score, extraData);
        } catch (error) {
            // Suppress error for "Leaderboard not found" during dev until created in dashboard
            console.warn("FB Leaderboard Submit Failed (Check Dashboard configuration):", error);
        }
    }

    postSessionScore(score: number): void {
        if (this.isMock) {
            console.log("Mock Post Session Score:", score);
            return;
        }
        try {
            window.FBInstant.postSessionScoreAsync(score);
        } catch (e) {
            console.error("FB Post Session Score failed:", e);
        }
    }

    async getConnectedLeaderboard(leaderboardName: string): Promise<any[]> {
        if (this.isMock) {
            // Return fake friend data
            return [
                { getRank: () => 1, getScore: () => 15000, getExtraData: () => JSON.stringify({level: 5}), getPlayer: () => ({ getName: () => "Alice", getPhoto: () => null }) },
                { getRank: () => 2, getScore: () => 12000, getExtraData: () => JSON.stringify({level: 4}), getPlayer: () => ({ getName: () => "Bob", getPhoto: () => null }) },
                { getRank: () => 3, getScore: () => 5000, getExtraData: () => JSON.stringify({level: 2}), getPlayer: () => ({ getName: () => "You", getPhoto: () => null }) },
            ];
        }
        try {
            const leaderboard = await window.FBInstant.getLeaderboardAsync(leaderboardName);
            const entries = await leaderboard.getConnectedPlayerEntriesAsync(10, 0);
            return entries;
        } catch (error) {
            console.error("FB Leaderboard Fetch Failed", error);
            return [];
        }
    }

    // --- MESSENGER UPDATES ---

    private createChallengeImage(score: number, heroClass: string): string {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 630; // FB optimal share size
            const ctx = canvas.getContext('2d');
            if (!ctx) return '';

            // Background
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 1200, 630);
            
            // Gradient overlay
            const grad = ctx.createLinearGradient(0, 0, 0, 630);
            grad.addColorStop(0, '#1e293b');
            grad.addColorStop(1, '#020617');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1200, 630);

            // Text
            ctx.fillStyle = '#fbbf24'; // Amber
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
        } catch (e) {
            console.error("Canvas generation failed", e);
            return '';
        }
    }

    async challengeFriend(score: number, heroClass: string): Promise<void> {
        if (this.isMock) {
            alert(`Mock: Challenge sent! Score: ${score}`);
            return;
        }

        try {
            const base64Image = this.createChallengeImage(score, heroClass);
            
            // NOTE: 'play_turn' must match the custom_update_templates in fbapp-config.json
            const payload = {
                action: 'CUSTOM',
                ctime: Date.now(),
                template: 'play_turn', 
                image: base64Image,
                text: {
                    default: `I just scored ${score} in Dragon's Hoard!`,
                    localizations: {
                        en_US: `I just scored ${score} in Dragon's Hoard!`
                    }
                },
                data: { score: score, challenger: this.getPlayerName() },
                strategy: 'IMMEDIATE',
                notification: 'NO_PUSH'
            };

            await window.FBInstant.updateAsync(payload);
            console.log("Message sent!");
        } catch (e) {
            console.error("Challenge failed", e);
        }
    }

    // --- PIXEL TRACKING ---
    trackPixelEvent(eventName: string, data?: object) {
        if (typeof window.fbq === 'function') {
            window.fbq('track', eventName, data);
        } else if (this.isMock) {
            console.log(`[Mock Pixel] Track: ${eventName}`, data);
        }
    }
}

export const facebookService = new FacebookService();
