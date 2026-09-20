# CookieChain Pulse

A small, open-source Cookie Chain cApp that lets a visitor:

- connect a Nightly Wallet (with a Phantom-compatible fallback);
- view a connected address and live SOL balance from Cookie Chain;
- view a live network slot; and
- create a real, user-approved self-transfer transaction with confirmation and a CookieScan link.

## Run locally

This is a static site. From this directory, serve it with any static server, for example:

```powershell
npx serve .
```

Open the local URL in a browser with Nightly Wallet installed and set to Cookie Chain.

## Deployment

Deploy the folder unchanged to GitHub Pages, Netlify, Vercel, or any static host. No secrets are needed.

## Safety

The transfer button never sends funds automatically. It prepares a 0.000001 SOL self-transfer and the wallet owner must review and approve it in their wallet.
