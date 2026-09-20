import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from 'https://esm.sh/@solana/web3.js@1.98.0';

const RPC_URL = 'https://rpc.cookiescan.io';
const EXPLORER_URL = 'https://cookiescan.io';
const COOKIE_GENESIS_HASH = '9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2';
const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const connection = new Connection(RPC_URL, 'confirmed');
const els = {
  connect: document.querySelector('#connectButton'),
  send: document.querySelector('#sendButton'),
  address: document.querySelector('#walletAddress'),
  balance: document.querySelector('#walletBalance'),
  hint: document.querySelector('#walletHint'),
  network: document.querySelector('#networkStatus'),
  slot: document.querySelector('#latestSlot'),
  status: document.querySelector('#transactionStatus'),
  explorer: document.querySelector('#explorerLink'),
  activityCount: document.querySelector('#activityCount'),
  activityList: document.querySelector('#activityList'),
};
let wallet;
let publicKey;

function nightlyProvider() {
  return window.nightly?.solana || (window.solana?.isNightly ? window.solana : null);
}

function provider() {
  return nightlyProvider() || window.solana;
}

function setStatus(text, type = '') {
  els.status.textContent = text;
  els.status.style.color = type === 'error' ? '#ff8b9c' : type === 'ok' ? '#75efa8' : '#d6e2f4';
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), ms)),
  ]);
}

async function refreshNetwork() {
  try {
    const slot = await withTimeout(connection.getSlot('confirmed'), 6_000);
    els.slot.textContent = slot.toLocaleString();
    els.network.textContent = 'Cookie Chain RPC live - checking identity';
    try {
      const genesisHash = await withTimeout(connection.getGenesisHash(), 3_000);
      els.network.textContent = genesisHash === COOKIE_GENESIS_HASH
        ? 'Verified Cookie Chain network'
        : 'RPC responded with an unexpected network';
    } catch {
      els.network.textContent = 'Cookie Chain RPC live - identity check timed out';
    }
  } catch {
    els.network.textContent = 'Unable to reach Cookie Chain RPC - retrying';
  }
}

async function refreshBalance() {
  if (!publicKey) return;
  const balance = await connection.getBalance(publicKey, 'confirmed');
  els.balance.textContent = `${(balance / LAMPORTS_PER_SOL).toFixed(6)} COOK`;
}

function shortSignature(signature) {
  return `${signature.slice(0, 10)}...${signature.slice(-8)}`;
}

async function refreshActivity() {
  if (!publicKey) return;
  try {
    const records = await connection.getSignaturesForAddress(publicKey, { limit: 6 }, 'confirmed');
    els.activityCount.textContent = `${records.length} recent record${records.length === 1 ? '' : 's'}`;
    els.activityList.replaceChildren();
    if (!records.length) {
      els.activityList.innerHTML = '<li>No confirmed Cookie Chain activity found for this address yet.</li>';
      return;
    }
    for (const record of records) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `${EXPLORER_URL}/tx/${record.signature}`;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = shortSignature(record.signature);
      const state = record.err ? 'failed' : 'confirmed';
      item.append(link, document.createTextNode(` - ${state}`));
      els.activityList.append(item);
    }
  } catch {
    els.activityCount.textContent = 'Unavailable';
    els.activityList.innerHTML = '<li>Activity could not be loaded from the Cookie Chain RPC.</li>';
  }
}

async function connectWallet() {
  wallet = provider();
  if (!wallet) {
    setStatus('Nightly Wallet was not detected. Install or unlock Nightly, then try again.', 'error');
    return;
  }
  try {
    els.connect.textContent = 'Connecting...';
    const result = await wallet.connect();
    publicKey = new PublicKey(result.publicKey || wallet.publicKey);
    els.address.textContent = publicKey.toBase58();
    els.hint.textContent = nightlyProvider()
      ? 'Nightly connected. You control every signature and approval.'
      : 'Compatible wallet connected. Nightly is recommended for Cookie Chain.';
    els.connect.textContent = nightlyProvider() ? 'Nightly connected' : 'Wallet connected';
    els.send.disabled = false;
    await refreshBalance();
    await refreshActivity();
    setStatus('Ready to publish a Memo ping on Cookie Chain.', 'ok');
  } catch (error) {
    els.connect.textContent = 'Connect Nightly';
    setStatus(`Wallet connection failed: ${error.message || 'Please try again.'}`, 'error');
  }
}

async function publishPing() {
  if (!wallet || !publicKey) return;
  try {
    els.send.disabled = true;
    setStatus('Preparing a Memo ping. Approve it in your wallet to continue.');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(new TransactionInstruction({
      keys: [],
      programId: new PublicKey(MEMO_PROGRAM_ID),
      data: new TextEncoder().encode(`cookiechain-pulse:${new Date().toISOString()}`),
    }));
    let signature;
    if (wallet.signAndSendTransaction) {
      const result = await wallet.signAndSendTransaction(tx);
      signature = result.signature || result;
    } else {
      const signed = await wallet.signTransaction(tx);
      signature = await connection.sendRawTransaction(signed.serialize());
    }
    setStatus('Transaction submitted. Waiting for Cookie Chain confirmation...');
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
    setStatus(`Confirmed: ${signature}`, 'ok');
    els.explorer.href = `${EXPLORER_URL}/tx/${signature}`;
    els.explorer.hidden = false;
    els.explorer.textContent = 'View transaction on CookieScan';
    await refreshBalance();
    await refreshActivity();
  } catch (error) {
    setStatus(`Transaction was not completed: ${error.message || 'Unknown error.'}`, 'error');
  } finally {
    els.send.disabled = false;
  }
}

els.connect.addEventListener('click', connectWallet);
els.send.addEventListener('click', publishPing);
refreshNetwork();
setInterval(refreshNetwork, 15_000);
