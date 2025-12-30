
import { supabase } from '../src/utils/supabase';

declare global {
    interface Window {
        FBInstant: any;
        FB: any;
        fbq: any;
    }
}

class FacebookService {
    private isInitialized = false;
    private mode: 'INSTANT' | 'WEB' | 'MOCK' = 'MOCK';
    private playerInfo: { name: string; photo: string; id: string } = { name: 'Guest', photo: '', id: 'guest' };

    constructor() {}

    // 1. Initialize Async (Call this before App render)
    async initializeAsync(): Promise<void> {
        if (this.isInitialized) return;

        if (typeof window !== 'undefined' && window.FBInstant) {
            try {
                await window.FBInstant.initializeAsync();
                this.mode = 'INSTANT';
                this.isInitialized = true;
                
                // Get Player Info immediately after init for context
                this.playerInfo = {
                    name: window.FBInstant.player.getName(),
                    photo: window.FBInstant.player.getPhoto(),
                    id: window.FBInstant.player.getID()
                };
                
                console.log("FBInstant Initialized v8.0");
            } catch (error) {
                console.warn("FBInstant init failed, falling back to Web/Mock", error);
                this.mode = 'WEB'; // Fallback
            }
        } else {
            this.mode = 'WEB';
        }
    }

    // 2. Loading Progress
    setLoadingProgress(percentage: number): void {
        if (this.mode === 'INSTANT') {
            window.FBInstant.setLoadingProgress(percentage);
        }
    }

    // 3. Start Game Async
    async startGameAsync(): Promise<void> {
        if (this.mode === 'INSTANT') {
            await window.FBInstant.startGameAsync();
            console.log("FBInstant Game Started");
            this.syncWithSupabase();
        }
    }

    // Supabase Auth & Sync
    private async syncWithSupabase() {
        if (this.mode === 'MOCK') return;

        try {
            // Check if user exists based on FBID (simplified flow)
            // In a real app, you'd use a specific Supabase Auth Provider for FB or custom JWT
            // Here we stick to anonymous auth + metadata upsert for simplicity in this demo environment
            const { data: session } = await supabase.auth.getSession();
            
            if (!session.session) {
                const { error } = await supabase.auth.signInAnonymously();
                if (error) console.error("Supabase Auth Error:", error);
            }

            const user = (await supabase.auth.getUser()).data.user;
            if (user) {
                // Upsert Player Data
                const { error: upsertError } = await supabase
                    .from('players')
                    .upsert({
                        id: user.id,
                        fb_user_id: this.playerInfo.id,
                        username: this.playerInfo.name,
                        avatar_url: this.playerInfo.photo,
                        last_login: new Date().toISOString()
                    }, { onConflict: 'id' });
                
                if (upsertError) console.error("Player Sync Error:", upsertError);
            }
        } catch (e) {
            console.error("Sync Exception:", e);
        }
    }

    // Get Entry Point Data (for Deep Links/Gifts)
    getEntryPointData(): any {
        if (this.mode === 'INSTANT') {
            return window.FBInstant.getEntryPointData();
        }
        return null;
    }

    // Context & Social
    async chooseContext(): Promise<boolean> {
        if (this.mode === 'INSTANT') {
            try {
                await window.FBInstant.context.chooseAsync();
                return true;
            } catch (e) { return false; }
        }
        return false;
    }

    // Getters
    getPlayerName() { return this.playerInfo.name; }
    getPlayerPhoto() { return this.playerInfo.photo; }
    getPlayerID() { return this.playerInfo.id; }
    isInstant() { return this.mode === 'INSTANT'; }

    // Analytics
    trackPixelEvent(eventName: string, data: any): void {
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', eventName, data);
        }
    }

    // Auth Helpers
    isLoggedIn(): boolean {
        return this.playerInfo.id !== 'guest';
    }

    isInstantMode(): boolean {
        return this.mode === 'INSTANT';
    }

    async loginWeb(): Promise<boolean> {
        this.playerInfo = {
            name: 'Web Adventurer',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adventurer',
            id: 'web_user_' + Date.now()
        };
        return true;
    }

    isWebMode(): boolean {
        return this.mode === 'WEB';
    }

    // Data & Leaderboards
    async getLeaderboardEntries(leaderboardName: string, type: 'GLOBAL' | 'FRIENDS'): Promise<any[]> {
        if (this.mode === 'INSTANT') {
            try {
                const leaderboard = await window.FBInstant.getLeaderboardAsync(leaderboardName);
                return await leaderboard.getEntriesAsync(10, 0);
            } catch (e) {
                console.error('Failed to get leaderboard:', e);
                return [];
            }
        }
        return [];
    }

    async loadData(keys: string[]): Promise<any> {
        if (this.mode === 'INSTANT') {
            return await window.FBInstant.player.getDataAsync(keys);
        }
        const result: any = {};
        keys.forEach(key => {
            const val = localStorage.getItem(key);
            if (val) {
                try {
                    result[key] = JSON.parse(val);
                } catch {
                    result[key] = val;
                }
            }
        });
        return result;
    }

    async saveData(key: string, value: any): Promise<void> {
        if (this.mode === 'INSTANT') {
            await window.FBInstant.player.setDataAsync({ [key]: value });
        }
        localStorage.setItem(key, JSON.stringify(value));
    }

    async submitScore(leaderboardName: string, score: number, extraData?: string): Promise<void> {
        if (this.mode === 'INSTANT') {
            try {
                const lb = await window.FBInstant.getLeaderboardAsync(leaderboardName);
                await lb.setScoreAsync(score, extraData);
            } catch (e) {
                console.error("Submit score error:", e);
            }
        }
    }

    postSessionScore(score: number): void {
        if (this.mode === 'INSTANT' && typeof window.FBInstant.postSessionScoreAsync === 'function') {
            window.FBInstant.postSessionScoreAsync(score).catch(() => {});
        }
    }

    setStats(stats: Record<string, number>): void {
        if (this.mode === 'INSTANT') {
            window.FBInstant.player.setStatsAsync(stats).catch((e: any) => console.error(e));
        }
    }

    challengeFriend(score: number, heroClass: string): void {
        if (this.mode === 'INSTANT') {
            window.FBInstant.updateAsync({
                action: 'CUSTOM',
                cta: 'Play',
                text: {
                    default: `I scored ${score} as ${heroClass}! Beat me!`,
                },
                template: 'challenge',
                data: { score },
                strategy: 'IMMEDIATE',
                notification: 'NO_PUSH',
            }).catch((e: any) => console.error(e));
        }
    }
}

export const facebookService = new FacebookService();
