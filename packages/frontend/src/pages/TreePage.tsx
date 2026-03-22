import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { AnchorData } from '../types';
import { fetchAnchor } from '../api';
import { resolveImageUri, CELOSCAN } from '../utils';
import { TreeHero } from '../components/TreeHero';
import { TreePresence } from '../components/TreePresence';
import { Confidence } from '../components/Confidence';
import { InscribeForm } from '../components/InscribeForm';
import { EncounterLog } from '../components/EncounterLog';
import { Conversation } from '../components/Conversation';

type Props = {
  id?: number;
};

const HIDDEN_META_KEYS = [
  'framework', 'bindingCommitment', 'bindingStrategy',
  'name', 'type', 'creator', 'imageURI', 'latitude', 'longitude',
];

export function TreePage({ id: propId }: Props) {
  const params = useParams();
  const anchorId = propId ?? Number(params.id);
  const [data, setData] = useState<AnchorData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (!anchorId || isNaN(anchorId)) return;
    fetchAnchor()
      .then(setData)
      .catch((err) => setError(err.message));
  }, [anchorId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInscribed = useCallback(() => {
    // Delay refetch to allow the transaction to settle on-chain
    setTimeout(loadData, 5000);
  }, [loadData]);

  if (error) {
    return (
      <div className="loading-state">
        <div className="tree-presence">
          <p className="error-msg">Could not load anchor #{anchorId}: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="loading-state">
        <div className="tree-presence">
          <p className="tree-presence-description" style={{ fontStyle: 'italic', color: 'var(--bark-400)' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const name = data.metadata.name || `Anchor #${data.id}`;
  const description = (data.registration?.description as string) || '';
  const imageURI = data.metadata.imageURI || (data.registration?.imageURI as string) || '';
  const imageUrl = imageURI ? resolveImageUri(imageURI) : undefined;

  const visibleMeta = Object.entries(data.metadata).filter(
    ([k]) => !HIDDEN_META_KEYS.includes(k),
  );

  return (
    <>
      <TreeHero name={name} imageUrl={imageUrl} />

      <TreePresence
        description={description}
        latitude={data.metadata.latitude}
        longitude={data.metadata.longitude}
        type={data.metadata.type}
        id={data.id}
        owner={data.owner}
      />

      <Confidence
        confidence={data.summary.confidence}
        count={data.summary.count}
      />

      <div className="links-row">
        <a
          href={`${CELOSCAN}/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=${data.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          CeloScan
        </a>
        <a href="/api/status" target="_blank" rel="noopener noreferrer">
          JSON API
        </a>
      </div>

      {visibleMeta.length > 0 && (
        <div className="onchain-section">
          <div className="section-title">On-chain state</div>
          <table className="meta-table">
            <tbody>
              {visibleMeta.map(([k, v]) => (
                <tr key={k}>
                  <td className="meta-key">{k}</td>
                  <td className="meta-val">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InscribeForm owner={data.owner} onSuccess={handleInscribed} />

      <EncounterLog witnesses={data.witnesses} responses={data.responses} />

      <Conversation treeName={name} />

      <footer className="site-footer">
        <a href="https://eips.ethereum.org/EIPS/eip-8004">ERC-8004</a> &middot;{' '}
        <a href="https://celo.org">Celo</a> &middot; Tree Presence
      </footer>
    </>
  );
}
