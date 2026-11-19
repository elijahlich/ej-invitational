# The EJ Invitational

Real-time scoring app for the wedding golf tournament at **Higuera Golf Club, Punta Mita, Mexico** on **November 19, 2026, 1:00 PM**. Three simultaneous tournaments across one round:

| Tournament | Format | Winner |
|---|---|---|
| **Hit a House** | Individual net stroke play (strokes off Alex at 6.2) | Lowest net total |
| **Anti-Shtick Invitational** | Group team match play — best net in group counts per hole | Group with most hole-points |
| **Skins** | Best individual net per hole wins the skin (tied = no skin / carryover) | Most skins |

## Groups & tee times

| Time | Group | Players |
|---|---|---|
| 1:00 PM | Group 1 | Elijah (8.3) · Charlie (11.7) · Alex (6.2) · Jack (20.7) |
| 1:10 PM | Group 2 | Ari (17.8) · Gary (26.6) · Bo (16.2) |
| 1:20 PM | Group 3 | Jordan (11.2) · Lisa (23.0) · Tom (12.3) |

## Scoring rules

- Course: **Higuera Golf Club · Punta Mita · White tees** (par 72, rating 69.6, slope 124)
- Course handicap uses USGA formula: `Index × (Slope / 113) + (Rating − Par)`, rounded to nearest whole
- Strokes applied to hardest holes first per the men's SI on the scorecard
- **All three tournaments use the same reference:** field-low handicap (Alex, 6.2). Keeps strokes consistent so a group containing Alex isn't penalized.
- **Skins:** ties = no skin · optional carryover (toggle in Setup)
- Max score per hole: **net quadruple bogey** — gross is capped at `par + 4 + strokes received this hole`, auto-capped on entry. (So a player getting a stroke on a hole can score one more gross than a scratch player before being capped.)

Score dots on hole entry:
- 🟢 Green dot per stroke the player receives this hole (applies to all 3 tournaments)

## How to deploy

Same stack as the Bandon app: **Vite + React + Firebase Firestore + Vercel** (all free tiers).

### 1. Set up Firebase (one-time)
1. Go to **https://console.firebase.google.com** → **Add project** → name it `ej-invitational` (or similar) → skip Google Analytics
2. In the project, **Build → Firestore Database → Create database → Start in production mode → us-west1**
3. Under **Rules**, paste the contents of `firestore.rules` and **Publish**
4. **Project Settings → Your apps → Web (</> icon)** → register app → copy the config values

### 2. Clone, configure, deploy locally
```bash
npm install
cp .env.example .env
# Fill .env with your Firebase values
npm run dev
```

### 3. Push to GitHub + Vercel
1. Create a new GitHub repo (e.g. `ej-invitational`) and push this folder
2. Go to **https://vercel.com** → **Import Project** → pick your repo
3. In Vercel, under **Environment Variables**, paste the same 6 `VITE_FIREBASE_*` keys from your `.env`
4. Deploy — Vercel gives you a URL like `ej-invitational.vercel.app`

### 4. Share
Text the URL to all 14 players. Everyone opens it in their phone browser, taps **"Set who you are"** once, and they're in.

## Troubleshooting

- **"Setup required" screen:** env vars missing in Vercel. Add them in Project Settings → Environment Variables, then redeploy from the Deployments tab.
- **Scores not syncing:** check that Firestore rules are published. The app queues writes locally if the cell connection drops, so scores still save and will sync when internet returns.
- **Wrong player names or handicaps:** tap **Players** tab → edit inline. Updates propagate to everyone's device in real time.
