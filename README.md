# Data Bounties

> Turn real-world photo tasks into trustless, automatically-verified, on-chain bounties — no manual review, no smart contracts, instant payout.

Built at ETHGlobal NYC 2026.

## What It Does

Companies post **bounties** for specific real-world photo data — e.g. *"100 stop sign photos, $1 each."* Contributors upload a matching photo. An AI pipeline checks that the image is **authentic** (not AI-generated) and that it **matches the bounty's prompt**. If it passes:

- A **certificate NFT** is minted on Hedera, proving the contribution
- The verification result is logged to **Hedera Consensus Service (HCS)** as an immutable audit trail
- **HBAR is paid out automatically** to the contributor — no manual review, no smart contract code

The result: a decentralized data marketplace where contribution, verification, and payment are all transparent and automatic.

---

## How It Works

1. **Login** — User logs in via Privy (email/social/wallet). Privy creates an embedded wallet automatically; our backend creates a real Hedera testnet account behind the scenes and links the two.
2. **Browse bounties** — User picks an open bounty from the board (prompt, payout per image, category, slots remaining).
3. **Upload** — User submits a photo matching the prompt.
4. **Duplicate check** — Backend computes a perceptual hash and rejects near-duplicate submissions within the same bounty.
5. **AI verification** — The image is sent to our ML service, which:
   - Uses **SightEngine** to check whether the image is AI-generated
   - Uses **Google Cloud Vision** to check whether the image's labels match the bounty prompt, and to generate a caption
6. **On pass** — Backend mints an NFT certificate (Hedera Token Service), logs the verification to HCS, and sends the HBAR payout — all via the Hedera SDK, no Solidity.
7. **Portfolio** — User's portfolio shows their certificate cards: the real submitted photo, a "Verified" watermark/ribbon, category, caption, and updated HBAR balance.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│   Frontend       │────▶│  Backend              │────▶│  ML Service         │
│  React + Vite    │     │  Express + SQLite     │     │  FastAPI            │
│  Privy auth      │◀────│  Hedera SDK           │◀────│  SightEngine        │
│  (Vercel)        │     │  (Railway)            │     │  Google Cloud Vision│
└─────────────────┘     └──────────┬───────────┘     │  (Railway)          │
                                     │                  └────────────────────┘
                                     ▼
                          ┌──────────────────────┐
                          │  Hedera Testnet       │
                          │  - Token Service (NFT)│
                          │  - Consensus Service  │
                          │  - HBAR transfers     │
                          └──────────────────────┘
```

**Two separate "addresses" per user:**
- **Privy wallet address** (`0x...`) — the user's app identity, used for login and as a key in our database
- **Hedera account ID** (`0.0.xxxxxx`) — a real Hedera testnet account, created server-side the first time a user submits. All Hedera SDK operations (mint, transfer, HCS) use this account. The two are linked via a `users` table.

---

## Tech Stack & Partner Integrations

### Hedera (No Solidity track)
All on-chain logic is implemented directly via the **Hedera SDK** — no smart contracts:
- **Hedera Token Service (HTS)** — mints a unique NFT certificate per verified submission
- **Hedera Consensus Service (HCS)** — logs every verification result (wallet address, Hedera account ID, image hash, category, confidence score) to an immutable topic
- **Native HBAR transfers** — automatic payout to the contributor's Hedera account on a passing submission

### Privy
- Embedded wallet creation on login — users never see a seed phrase
- `@privy-io/react-auth` on the frontend; wallet readiness checked via `useWallets()` rather than just `authenticated`, since the embedded wallet can lag behind auth state

### Google Cloud (Vision API)
- Our ML service uses **Google Cloud Vision's label detection** to (a) score whether an uploaded image matches a bounty's prompt, and (b) generate a human-readable caption for the certificate
- Combined with **SightEngine** for AI-generated-image detection

---

## Repository Structure

```
.
├── backend/          # Express API + SQLite + Hedera SDK
│   ├── index.js
│   ├── database.js
│   ├── services/     # Hedera mint/payout/HCS, ML client, image hashing
│   └── routes/        # bounties, submissions, portfolio
├── frontend/         # React + Vite + Privy
│   └── src/
│       └── components/
└── ml-service/        # FastAPI verification service
    └── main.py         
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Hedera testnet account (operator account + private key)
- A Privy account/app
- A SightEngine account
- A Google Cloud project with the Vision API enabled + a service account key

Each of the three services below requires its own `.env` file with credentials. Variable names and required values are documented inline in each service's source (`database.js` and `services/hederaAccount.js` for the backend, `main.tsx`/`PrivyProvider` setup for the frontend, and the top of `main.py` for the ML service). Credentials are intentionally not listed here — do not commit `.env` files to the repository.

### 1. Backend

```bash
cd backend
npm install
npm start
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. ML Service

```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/bounties` | List all open bounties |
| `GET` | `/bounties/:id` | Get a single bounty by ID |
| `POST` | `/bounties` | Create a new bounty (`prompt`, `category`, `payout_amount`, `total_slots`) |
| `POST` | `/submissions/submit` | Submit an image for a bounty (multipart: `image`, `bountyId`, `wallet_address`) |
| `GET` | `/portfolio/:walletAddress` | Get a user's certificate NFTs |
| `GET` | `/portfolio/:walletAddress/balance` | Get a user's HBAR balance |
| `POST` | `/verify` (ML service) | Verify an image against a prompt — returns authenticity, match score, caption |

---

## Deployment

- **Frontend** → Vercel
  Root directory: `frontend` · Framework preset: Vite · Configured with the Privy app ID and backend API URL via environment variables

- **Backend** → Railway
  Root directory: `backend` · Persistent volume mounted at `/data` for the SQLite database and uploaded images · Configured with Hedera account credentials, HCS topic, NFT token ID, and the ML service URL via environment variables

- **ML Service** → Railway
  Root directory: `ml-service` · Custom start command: `uvicorn main:app --host 0.0.0.0 --port $PORT` · Configured with SightEngine and Google Cloud Vision credentials via environment variables (Google service account JSON is base64-encoded and decoded to a file at startup)

### Live Links

- Frontend: data-bounties.vercel.app
- Backend API: backend-production-8489.up.railway.app
- ML Service: mlend-production-6577.up.railway.app


---


## Tracks We're Targeting

- **Hedera — No Solidity**: entire on-chain logic (minting, HCS, payouts) via the Hedera SDK, zero smart contract code
- **Privy**: embedded wallet creation and seamless login

---

## Team

- Ivan Reznikov — backend, Hedera integration, frontend, deployment
- David Balzac — ML verification service (SightEngine + Google Cloud Vision)

---

## AI Attribution

In the interest of transparency: AI coding assistants were used throughout this project's development — for debugging deployment issues (Railway/Vercel configuration, dependency conflicts, build errors), guiding our development of frontend and backend code, and drafting this README itself. All AI-suggested code was reviewed, tested, and adjusted by the team before being included. The core architecture, integration design (Hedera + Privy + Google Cloud), and product concept are our own.

---
