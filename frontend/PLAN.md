# Frontend Plan

This document captures the original intended role of the frontend in Data Bounties. It is written as product and interaction documentation, using the current app structure as the frame.

## Purpose

The frontend is the marketplace experience for contributors. It should let a user authenticate, browse open bounties, upload an image for a selected bounty, and view proof of successful submissions after verification and payout.

## Product Goals

- Make available bounties easy to browse and understand.
- Let a user submit an image with as little friction as possible.
- Show a clear pass/fail result after backend verification.
- Surface the user's earned certificates and wallet balance in a simple portfolio view.

## Planned User Journey

1. User lands on the app and authenticates through Privy.
2. User views the bounty board with prompts, categories, payout amounts, and collection progress.
3. User selects a bounty and opens the upload screen.
4. User uploads a valid image and submits it.
5. Frontend sends the file, bounty ID, and wallet address to the backend.
6. While the backend runs ML verification and Hedera actions, the UI shows a verifying state.
7. If the submission passes:
   - show confirmation,
   - show the returned caption,
   - show certificate information,
   - reinforce that payout was sent.
8. If the submission fails:
   - show a clear rejection reason,
   - allow retry with a different image.
9. User can switch to portfolio view to see prior verified submissions and wallet balance.

## Screen Intent

### Header

- Provide app identity and primary navigation.
- Expose authentication state and login/logout controls.
- Allow switching between bounty discovery and portfolio view.

### Bounty Board

- Display open bounties as cards.
- Show:
  - category,
  - prompt,
  - payout amount,
  - progress toward total slots.
- Provide a clear call to action to submit for a bounty.

### Upload Screen

- Show the selected bounty context so the user knows what they are collecting.
- Allow image selection with a preview.
- Submit multipart form data to the backend.
- Handle four UI states cleanly:
  - idle,
  - loading,
  - success,
  - error.

### Portfolio

- Show the user's verified submissions as collectible certificates.
- Display Hedera-backed proof details such as serial number and image/caption metadata.
- Show current HBAR balance for the linked account.

## API Expectations

The frontend should treat the backend as the single public API surface.

### Bounty data

- `GET /bounties`
- `GET /bounties/:id`

Expected fields:

- `id`
- `prompt`
- `category`
- `payout_amount`
- `total_slots`
- `slots_filled`
- `status`

### Submission flow

- `POST /submissions/submit`

Expected success shape:

```json
{
  "success": true,
  "caption": "a red octagonal stop sign on a city street",
  "tokenId": "0.0.x",
  "serialNumber": "1"
}
```

Expected failure shape:

```json
{
  "error": "Image did not pass verification",
  "reason": "Appears AI generated"
}
```

### Portfolio data

- `GET /portfolio/:walletAddress`
- `GET /portfolio/:walletAddress/balance`

The frontend should use this data to render certificate cards and wallet balance without needing to know blockchain internals.

## Integration Boundaries

- Privy handles authentication and embedded wallet experience.
- The frontend does not call the ML service directly.
- The frontend does not talk to Hedera directly.
- All verification, logging, minting, and payout logic stays behind the backend.

## UX Priorities

- Fast path to first submission
- Clear verification status
- Strong trust cues after success
- Friendly rejection feedback after failure
- Mobile-friendly upload and browsing flow

## Success Criteria

- A new user can log in, find a bounty, and submit an image in one session.
- Success state clearly communicates verification, certificate issuance, and payout.
- Failure state explains why the image did not pass.
- Portfolio view makes verified work feel tangible and collectible.
