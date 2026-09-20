# CookieChain Pulse

CookieChain Pulse is a small, open-source Cookie Chain activity console. It uses the public Cookie Chain RPC directly, keeps every private key inside the connected wallet, and makes real on-chain actions explicit.

## What it does

- Nightly-first wallet connection, with a Solana-compatible fallback;
- live Cookie Chain slot plus genesis-hash verification;
- connected address and native **COOK** balance;
- recent, explorer-linked activity for the connected address; and
- a real, user-approved Memo-program ping, followed by confirmation and a CookieScan link.

The app uses Cookie Chain's public RPC (`https://rpc.cookiescan.io`) and the standard Solana client SDK. It has no server, API key, private key, analytics tracker, or hidden transaction flow.

## Run locally

This is a static site. From this directory, serve it with any static server, for example:

```powershell
npx serve .
```

Open the local URL in a browser with Nightly Wallet installed. In Nightly, add Cookie Chain as a custom SVM network with `https://rpc.cookiescan.io`, then keep a small amount of COOK for network fees.

## Deployment

Deploy the folder unchanged to GitHub Pages, Netlify, Vercel, or any static host. No secrets are needed.

## Safety

The publish button never sends funds automatically. It creates a Memo instruction only after the wallet owner reviews and approves it. Network fees, if any, are shown by the wallet before signing.
