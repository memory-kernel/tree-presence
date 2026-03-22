import { useState } from 'react';
import { useWallet } from '../useWallet';
import { prepareWitnessTx } from '../api';
import { CELOSCAN, shortAddr } from '../utils';

type Props = {
  owner: string;
  onSuccess?: () => void;
};

export function InscribeForm({ owner, onSuccess }: Props) {
  const { address, hasWallet, connect, sendTransaction } = useWallet();
  const [message, setMessage] = useState('');
  const [tag, setTag] = useState('witness');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; html: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = address?.toLowerCase() === owner.toLowerCase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !message.trim()) {
      setStatus({ type: 'error', html: 'Please write an observation.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const prepared = await prepareWitnessTx({
        message: message.trim(),
        witnessAddress: address,
        tag1: tag,
        secret: secret.trim() || undefined,
      });

      if (prepared.verified) {
        setStatus({ type: 'success', html: 'Secret verified! Confirm the transaction in your wallet.' });
      }

      const txHash = await sendTransaction({ to: prepared.to, data: prepared.data });
      setStatus({
        type: 'success',
        html: `Witness inscribed! <a href="${CELOSCAN}/tx/${txHash}" target="_blank">View on CeloScan</a>. It will appear below shortly.`,
      });
      setMessage('');
      setSecret('');
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { message?: string; code?: number };
      const msg = error.code === 4001 ? 'Transaction rejected' : (error.message || 'Failed');
      setStatus({ type: 'error', html: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="inscription-zone">
      <div className="inscription-form-wrapper">
        <h3>Leave your mark</h3>

        {!hasWallet && (
          <p className="no-wallet">
            To inscribe a witness, you need a browser wallet (like MetaMask) connected to Celo.
          </p>
        )}

        {hasWallet && !address && (
          <div className="wallet-bar">
            <button className="btn-outline btn-sm" onClick={connect}>
              Connect Wallet
            </button>
          </div>
        )}

        {address && (
          <>
            <div className="wallet-bar">
              <span className="wallet-addr">{shortAddr(address)}</span>
            </div>

            {isOwner && (
              <div className="owner-warning" style={{ display: 'block' }}>
                You own this anchor. Witnesses must come from a different address.
              </div>
            )}

            <form className="inscription-form" onSubmit={handleSubmit}>
              <label>
                Your observation
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What do you notice about this tree today?"
                />
              </label>
              <label>
                Category
                <select value={tag} onChange={(e) => setTag(e.target.value)}>
                  <option value="witness">General witness</option>
                  <option value="ecological-observation">Ecological observation</option>
                  <option value="aesthetic-observation">Aesthetic observation</option>
                  <option value="community-observation">Community observation</option>
                  <option value="health-report">Health report</option>
                </select>
              </label>
              <label>
                Encounter secret (optional)
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="From the NFC tag at the tree"
                />
                <span className="form-hint">
                  Verified witnesses carry more weight in the confidence score.
                </span>
              </label>
              <button type="submit" disabled={submitting || isOwner}>
                {submitting ? 'Preparing...' : 'Inscribe'}
              </button>
              {status && (
                <div
                  className={`status status-${status.type}`}
                  dangerouslySetInnerHTML={{ __html: status.html }}
                />
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
