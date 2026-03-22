import { confidenceLabel } from '../utils';

type Props = {
  confidence: number;
  count: number;
};

export function Confidence({ confidence, count }: Props) {
  const { label, cls } = confidenceLabel(confidence);

  return (
    <div className="confidence-section">
      <div className="confidence-row">
        <div className="confidence-bar">
          <div className="confidence-fill" style={{ width: `${confidence}%` }} />
        </div>
        <span className={`badge ${cls}`}>
          {confidence}% {label}
        </span>
      </div>
      <div className="confidence-detail">
        {count} witness{count !== 1 ? 'es' : ''}
      </div>
    </div>
  );
}
