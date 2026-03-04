# Plan: Global High Scores with Upstash Redis + Edge Functions

**TL;DR:** Replace localStorage with Upstash Redis by creating two Edge Functions (`/api/scores/get` and `/api/scores/submit`) and updating the game hooks to fetch/post via HTTP. Add Upstash SDK, set environment variables on Vercel, and test concurrency. Upstash free tier supports ~16k commands/day; suitable for hobby arcade. Real-time sync works (no 60s cache delay like Blob). Total setup: ~2 hours.

---

## Architecture

```
Browser (React)
  ↓ fetch() POST/GET
[Vercel Edge Functions] (/api/scores/*)
  ↓ REST API
[Upstash Redis]
  Key pattern: arcade-hs-{gameId}
  Value: JSON array of top-5 scores
```

**Key Properties:**
- No breaking changes to high score data structure (still `HighScoreEntry[]`)
- Backward compatible: new clients read from Redis; old localStorage data ignored
- All game hooks use identical pattern (engine code unchanged)
- Tests pass without modification (mocked localStorage remains)

---

## File Structure

**New files:**
- `api/scores/get.ts` — Fetch leaderboard for a game (GET `/api/scores/get?gameId=tetris`)
- `api/scores/submit.ts` — POST new score, return updated leaderboard

**Modified files:**
- `src/lib/highScores.ts` — Refactor: `loadScores()` and `isTopScore()` call Edge Functions; `addScore()` calls POST endpoint
- `src/games/tetris/useTetris.ts` — (and 3 other game hooks) add `useEffect` to sync pending state with Redis before rendering `<InitialsOverlay>`
- `src/components/GameCard.tsx` — Update score fetch to use Edge Function
- `vercel.json` — (new file) Configure `/api` functions if needed

**Config changes:**
- `.env.local` (dev) — Add `VITE_UPSTASH_REST_URL` (or leave browser-facing URL blank, fetch via relative proxy)
- Vercel Dashboard → Environment Variables → Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- `package.json` — Add `@upstash/redis` dependency

---

## Implementation Steps

### **Phase 1: Setup (15 min)**

1. **Create Upstash account & Redis database**
   - Sign up at upstash.com (free tier)
   - Create one Redis database in closest region
   - Copy REST URL and REST Token from dashboard

2. **Set environment variables on Vercel**
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Add `UPSTASH_REDIS_REST_URL` (copy from Upstash dashboard)
   - Add `UPSTASH_REDIS_REST_TOKEN` (REST auth token)
   - Both should be available in all environments (Production, Preview, Development)

3. **Install SDK**
   - Add `@upstash/redis` to `package.json`
   - Run `npm install`

### **Phase 2: Create Edge Functions (30 min)**

1. **Create `/api/scores/get.ts`**
   - Accepts query param `gameId`
   - Calls `redis.get(`arcade-hs-{gameId}`)
   - Returns JSON array of top-5 (or empty array if key doesn't exist)
   - Set CORS headers for browser access
   - Add error boundary (if Redis is down, return empty array with 5xx status, let browser fall back to empty state)

2. **Create `/api/scores/submit.ts`**
   - Accepts POST body: `{ gameId, score, initials }`
   - Validate inputs (score is positive integer, initials is 1–3 alphanumeric)
   - Load current leaderboard from Redis
   - Insert new score, keep top-5, sort descending
   - Write back to Redis with `allowOverwrite: true` (since we're updating the same key)
   - Return updated leaderboard
   - Set CORS headers

### **Phase 3: Refactor highScores.ts (20 min)**

Currently `loadScores()` and `addScore()` use synchronous `localStorage`. Convert to `async` functions that call Edge Functions:

1. **`loadScores(gameId: string): Promise<HighScoreEntry[]>`**
   - Change return type from sync to `Promise`
   - Call `fetch('/api/scores/get?gameId=' + gameId)`
   - Parse JSON response
   - Fall back to `[]` if network error

2. **`isTopScore(gameId: string, score: number): Promise<boolean>`** (if needed as async)
   - Load scores, check if score > scores[4]?.score (or scores is length < 5)
   - Return boolean

3. **`addScore(gameId: string, score: number, initials: string): Promise<HighScoreEntry[]>`**
   - POST to `/api/scores/submit` with JSON body
   - Return the updated leaderboard array
   - If network error, log and return empty array (prevent UI hang)

**Backward compatibility:**
- Keep export interface `HighScoreEntry` unchanged
- Tests that mock `localStorage` still pass (tests don't call actual functions)

### **Phase 4: Update Game Hooks (25 min)**

Each game hook (`useTetris.ts`, `useSnake.ts`, etc.) needs minimal changes:

1. **Initialization effect: seed best score**
   - Currently: `const best = loadScores(GAME_ID)[0]?.score ?? 0`
   - Change to: Load async, use `useState` for best score state
   - Pattern:
     ```typescript
     const [bestScore, setBestScore] = useState(0);
     useEffect(() => {
       loadScores(GAME_ID).then(scores => 
         setBestScore(scores[0]?.score ?? 0)
       );
     }, []);
     ```

2. **Game-over effect: check if top score**
   - Currently: `isTopScore(GAME_ID, state.score)`
   - Change to: Call async version, await result before setting `pendingScore`

3. **Submit initials callback — NO CHANGE to ref-guard**
   - The ref-guard pattern remains identical
   - Just await `addScore()` before proceeding
   - Pattern stays the same:
     ```typescript
     if (pendingRef.current === null) return;
     const score = pendingRef.current;
     pendingRef.current = null;
     await addScore(GAME_ID, score, initials); // now async
     setPendingScore(null);
     dispatch({ type: "RESTART" });
     ```

4. **Landing page `<GameCard />`**
   - Currently loads scores synchronously in render
   - Change to: Load in `useEffect`, display "Loading..." skeleton while fetching
   - Or: Cache scores in a custom hook `useGlobalHighScores()`

### **Phase 5: Testing (20 min)**

1. **Unit tests for Edge Functions**
   - Mock `@upstash/redis` with a fake Redis implementation
   - Test `get.ts` with empty DB, full DB, missing gameId
   - Test `submit.ts` with valid/invalid inputs, concurrent writes

2. **Integration test: browser → edge → Redis**
   - Local dev: `npm run dev`, manually submit scores in browser DevTools Network tab
   - Verify `/api/scores/get` and `/api/scores/submit` responses

3. **Concurrency test**
   - Open two browser tabs, submit scores simultaneously
   - Verify only one is in top-5 (if scores are different)
   - Verify no data corruption

4. **Fallback test**
   - Temporarily disconnect Upstash (change TOKEN to invalid)
   - Verify game doesn't crash, shows graceful error or empty leaderboard

5. **Existing tests pass**
   - `npm test` — all existing tests should pass (localStorage mocks remain untouched)

---

## Verification

**Success criteria:**
- [x] Upstash account created, credentials set in Vercel dashboard
- [x] `/api/scores/get.ts` and `/api/scores/submit.ts` deploy successfully
- [x] Score submitted in one browser appears in leaderboard on another browser (within 1-2 seconds)
- [x] Top-5 sorting works correctly across different users
- [x] High score data persists after redeploy
- [x] All existing Vitest tests pass without modification
- [x] No console errors on game pages
- [x] Landing page `<GameCard>` loads leaderboard without layout shift

**Manual verification checklist:**
1. Play tetris locally, submit score → see it in GameCard on landing page
2. Open second incognito window, verify same top-5 displayed
3. Submit invalid initials → verify rejected by `<InitialsOverlay>`
4. Verify `npm test` passes
5. Deploy to Vercel preview, repeat steps 1-3

---

## Decisions

- **Edge Functions vs Node.js:** Use Edge (lighter, faster) for both GET and POST. Small response payloads (~1-2KB) well within limits.
- **Redis key naming:** Keep `arcade-hs-{gameId}` pattern for consistency (matches current localStorage keys).
- **Async refactoring scope:** Minimal — only `highScores.ts` and game hooks. Engine files unchanged.
- **Backward compatibility:** localStorage code removed, but tests mock it locally so they don't break.
- **Error handling:** If Redis unavailable, return empty leaderboard (graceful degradation). Scores are ephemeral in prototype phase.
- **Avoid conditional writes:** Don't use Redis `WATCH/MULTI/EXEC` yet. Simple overwrite of top-5 is sufficient for hobby tier. If scaling, add optimistic concurrency later.
