import type { WitnessData, ResponseData } from '../types';
import { CELOSCAN, shortAddr, ringAge, humanTime } from '../utils';

type Props = {
  witnesses: WitnessData[];
  responses: ResponseData[];
};

function RingItem({
  witness,
  index,
  total,
  response,
}: {
  witness: WitnessData;
  index: number;
  total: number;
  response?: ResponseData;
}) {
  const age = ringAge(index, total);
  const verified = witness.tag2 === 'secret-proof';

  return (
    <div className={`ring-marker ${age} ring-text-only`}>
      {witness.message ? (
        <p className="ring-text">{witness.message}</p>
      ) : (
        <p className="ring-text ring-empty">(encounter recorded)</p>
      )}
      {response && (
        <div className="response-block">
          <div className="response-label">Guardian Response</div>
          <p className="ring-text">{response.message}</p>
          <a
            className="tx-link"
            href={`${CELOSCAN}/tx/${response.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            tx
          </a>
        </div>
      )}
      <div className="ring-meta">
        <a
          className="ring-author"
          href={`${CELOSCAN}/address/${witness.from}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {shortAddr(witness.from)}
        </a>
        {verified && <span className="badge badge-bright">verified</span>}
        <span className="ring-tag">{witness.tag1}</span>
        <span className="ring-date">
          {humanTime(witness.timestamp)}{' '}&middot;{' '}
          <a
            className="tx-link"
            href={`${CELOSCAN}/tx/${witness.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            tx
          </a>
        </span>
      </div>
    </div>
  );
}

export function EncounterLog({ witnesses, responses }: Props) {
  const responseMap = new Map<string, ResponseData>();
  for (const r of responses) {
    responseMap.set(`${r.clientAddress.toLowerCase()}-${r.feedbackIndex}`, r);
  }

  return (
    <div className="rings-section">
      <h2 className="rings-header">
        Encounter Log{' '}
        <span>
          {witnesses.length} witness{witnesses.length !== 1 ? 'es' : ''}
        </span>
      </h2>
      {witnesses.length > 0 ? (
        <div className="rings-trunk">
          {witnesses.map((w, i) => (
            <RingItem
              key={`${w.from}-${w.index}`}
              witness={w}
              index={i}
              total={witnesses.length}
              response={responseMap.get(
                `${w.from.toLowerCase()}-${w.index}`,
              )}
            />
          ))}
        </div>
      ) : (
        <div className="rings-empty">
          <div className="rings-empty-marker">
            <p className="rings-empty-text">
              No witnesses yet. Be the first to leave your mark.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
