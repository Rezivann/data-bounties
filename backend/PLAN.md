# Backend Plan

This document captures the original intended role of the backend in Data Bounties. It is written as design documentation rather than a strict description of every implementation detail.

## Purpose

The backend is the orchestration layer between the frontend, the ML verification service, SQLite storage, and Hedera. Its job is to accept bounty submissions, enforce duplicate checks, ask the ML service for a verdict, and, when a submission passes, trigger the blockchain side effects that prove and pay out the result.

## Core Responsibilities

- Expose REST endpoints for bounties, submissions, and portfolio data.
- Persist bounties, submissions, user wallet mappings, and used token records in SQLite.
- Compute image fingerprints before ML verification to block duplicate or near-duplicate submissions.
- Call the ML service with the uploaded image and bounty prompt.
- Treat the ML service as the source of truth for whether a submission passes.
- If a submission passes:
  - mint a certificate NFT on Hedera,
  - write a permanent verification log to HCS,
  - send HBAR payout to the user's Hedera-linked account,
  - save the successful submission record.

## Planned Request Flow

### `POST /submissions/submit`

Expected input:

- `image` as multipart file upload
- `bountyId`
- `wallet_address`

Planned flow:

1. Validate the upload and look up the bounty.
2. Reject closed or missing bounties.
3. Compute a cryptographic hash and perceptual hash for the image.
4. Compare the perceptual hash against prior submissions for the same bounty.
5. Call `ml-service /verify` with the image and bounty prompt.
6. If `passed` is `false`, return a failure response without triggering payout.
7. If `passed` is `true`, call the Hedera workflow:
   - create or resolve the user's Hedera account,
   - mint the NFT certificate,
   - log the verdict to HCS,
   - send payout,
   - write the submission to the database.
8. Return success payload to the frontend with caption and certificate details.

## Data and Service Boundaries

### Database intent

The backend owns the operational data model:

- `bounties`: prompt, category, payout amount, slot counts, status, escrow linkage
- `submissions`: wallet address, image hashes, caption, confidence/match data, NFT metadata pointer, timestamp
- `users`: wallet to Hedera account mapping
- `used_tokens`: protection against token reuse

### ML contract

The ML service is intended to return a verdict object with these fields:

```json
{
  "authentic": true,
  "authenticity_score": 0.97,
  "match_score": 0.83,
  "passed": true,
  "caption": "a red octagonal stop sign on a city street",
  "perceptual_hash": "f8e4c2a1b3d5e7f9"
}
```

Backend rule:

- `passed` is the gate that determines whether blockchain actions happen.
- `caption` and scores are preserved for logs and user-facing portfolio views.
- `perceptual_hash` is intended to support duplicate prevention and auditability.

## Planned Routes

- `GET /bounties`: list open bounties for the marketplace
- `GET /bounties/:id`: fetch a single bounty
- `POST /bounties/create`: create a new bounty
- `POST /submissions/submit`: upload and verify an image submission
- `GET /portfolio/:walletAddress`: fetch verified NFT-backed submissions for a wallet
- `GET /portfolio/:walletAddress/balance`: fetch HBAR balance for the linked account
- `GET /health`: basic backend health check

## Hedera Responsibilities

The backend is the only layer that talks to Hedera. The original plan assigns it three blockchain duties:

- NFT minting as proof that a submission passed verification
- HCS logging for a tamper-resistant audit trail
- HBAR transfer for automatic payout

These should remain behind service wrappers so the submission route stays orchestration-focused.

## Non-Goals

- The backend does not decide whether an image is authentic or matches the prompt.
- The backend does not run ML models locally.
- The backend does not own wallet login UX or upload UI state.

## Success Criteria

- A valid image submission can move from upload to verified payout in one request flow.
- Failed submissions are rejected safely without minting, logging, or payout.
- Duplicate protection happens before expensive downstream work.
- Portfolio endpoints can reconstruct user-visible proof of verified submissions.
