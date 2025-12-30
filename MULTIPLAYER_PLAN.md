
# 🐉 Dragon's Hoard: Live Multiplayer Plan (Supabase Realtime)

## Overview
Transforming the solitary 2048 experience into a social playground using Supabase Realtime features. We focus on asynchronous competition and "live" presence to drive retention.

## 1. Co-op Raids (Boss Battles)
**Concept:** Two players contribute damage to a shared Boss HP bar.
*   **Supabase Channel:** `room:raid_<raid_id>`
*   **Event:** `damage_dealt`
*   **UX:**
    *   Players invite a friend via FB Context (`facebookService.chooseContext()`).
    *   Both join a shared room.
    *   When Player A merges high-tier tiles, it sends `{ damage: 50, user: 'A' }` via `channel.send()`.
    *   The Boss HP bar updates instantly on both screens.
*   **Retention Hook:** "Help friend beat the Void Dragon!" (Social Obligation).

## 2. PvP Races (Ghost Mode)
**Concept:** Live race to 2048 against a friend's shadow.
*   **Supabase Channel:** `room:race_<race_id>`
*   **Data Structure:**
    ```json
    {
      "p1_score": 1024,
      "p1_max_tile": 64,
      "p2_score": 800,
      "p2_max_tile": 32
    }
    ```
*   **UX:**
    *   Split-screen UI (Portrait). Top half: Your grid. Bottom half: Opponent's simplified grid (just tile values, no animations to save bandwidth).
    *   Use `supabase.channel(...).on('broadcast', { event: 'grid_update' }, ...)`
    *   Send compressed grid state (RLE) every 500ms or on significant merge.
*   **Retention Hook:** Real-time status anxiety ("They are beating me!").

## 3. The "Stolen" Tribute System (Asynchronous PvP)
**Concept:** Players can "steal" from friends who haven't played in 24 hours.
*   **Table:** `daily_tributes` (columns: `owner_id`, `amount`, `protected_until`)
*   **Logic:**
    1.  Fetch friends list.
    2.  Query `daily_tributes` where `owner_id` IN (friends) AND `protected` = false.
    3.  Show "Steal 50 Gold" button next to friend's name on Leaderboard.
    4.  On click: Transaction (decrement friend, increment self, notify friend).
*   **Retention Hook:** Loss Aversion. Players MUST login to set `protected = true` (by playing one game).

## 4. Implementation Steps (Supabase)

### A. Database Schema
```sql
-- Raids
create table public.raids (
  id uuid primary key default uuid_generate_v4(),
  boss_type text not null,
  max_hp int not null,
  current_hp int not null,
  status text default 'active', -- active, defeated, failed
  participants jsonb[] -- [{id, name, damage}]
);

-- Realtime Setup
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.raids;
```

### B. Client Code (Example)
```typescript
import { supabase } from './utils/supabase';

const subscribeToRaid = (raidId: string, onUpdate: (hp: number) => void) => {
  const channel = supabase
    .channel(`raid:${raidId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'raids', filter: `id=eq.${raidId}` }, 
    (payload) => {
      onUpdate(payload.new.current_hp);
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
};
```

## 5. Mobile Performance Considerations
*   **Throttling:** Only broadcast grid updates when score changes by >10% or a combo > x3 occurs.
*   **Optimistic UI:** Show damage instantly locally, reconcile with server state later.
*   **Visuals:** In Co-op, show "Partner Merged!" toast instead of full grid replication to save rendering cost.
