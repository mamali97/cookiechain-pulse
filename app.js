import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from 'https://esm.sh/@solana/web3.js@1.98.0';

const RPC_URL = 'https://rpc.cookiescan.io';
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
};
let wallet;
let publicKey;

function provider() {
  return window.nightly?.solana || window.solana;
}

function setStatus(text, type = '') {
  els.status.textContent = text;
  els.status.style.color = type === 'error' ? '#ff8b9c' : type === 'ok' ? '#75efa8' : '#d6e2f4';
}

async function refreshNetwork() {
  try {
    const slot = await connection.getSlot('confirmed');
    els.slot.textContent = slot.toLocaleString();
    els.network.textContent = 'Connected to Cookie Chain';
  } catch {
    els.network.textContent = 'Unable to reach Cookie Chain RPC';
  }
}

async function refreshBalance() {
  if (!publicKey) return;
  const balance = await connection.getBalance(publicKey, 'confirmed');
  els.balance.textContent = `${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`;
}

async function connectWallet() {
  wallet = provider();
  if (!wallet) {
    setStatus('Nightly Wallet was not detected. Install or unlock Nightly, then try again.', 'error');
    return;
  }
  try {
    els.connect.textContent = 'Connecting…';
    const result = await wallet.connect();
    publicKey = new PublicKey(result.publicKey || wallet.publicKey);
    els.address.textContent = publicKey.toBase58();
    els.hint.textContent = 'Wallet connected. You control every transaction approval.';
    els.connect.textContent = 'Wallet connected';
    els.send.disabled = false;
    await refreshBalance();
    setStatus('Ready to create a self-transfer test on Cookie Chain.', 'ok');
  } catch (error) {
    els.connect.textContent = 'Connect Nightly';
    setStatus(`Wallet connection failed: ${error.message || 'Please try again.'}`, 'error');
  }
}

async function sendSelfTransfer() {
  if (!wallet || !publicKey) return;
  try {
    els.send.disabled = true;
    setStatus('Preparing transaction. Approve it in your wallet to continue.');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(
      SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: publicKey, lamports: 1_000 })
    );
    const result = await wallet.signAndSendTransaction(tx);
    const signature = result.signature || result;
    setStatus('Transaction submitted. Waiting for Cookie Chain confirmation…');
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
    setStatus(`Confirmed: ${signature}`, 'ok');
    els.explorer.href = `https://cookiescan.io/tx/${signature}`;
    els.explorer.hidden = false;
    els.explorer.textContent = 'View transaction on CookieScan';
    await refreshBalance();
  } catch (error) {
    setStatus(`Transaction was not completed: ${error.message || 'Unknown error.'}`, 'error');
  } finally {
    els.send.disabled = false;
  }
}

els.connect.addEventListener('click', connectWallet);
els.send.addEventListener('click', sendSelfTransfer);
refreshNetwork();
setInterval(refreshNetwork, 15_000);
