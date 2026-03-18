import type { BroadcastKind } from '../types';
import { BROADCAST_LABELS } from '../types';

const ALL_KINDS: BroadcastKind[] = ['solo', 'duo', 'group'];

interface Props {
  selected: Set<BroadcastKind>;
  onToggle: (kind: BroadcastKind, multi: boolean) => void;
}

export default function BroadcastFilter({ selected, onToggle }: Props) {
  return (
    <div className="filter-row">
      <span className="filter-label">类型</span>
      <div className="tag-list">
        {ALL_KINDS.map((k) => (
          <button
            key={k}
            className={`tag-chip broadcast-chip broadcast-${k}${selected.has(k) ? ' active' : ''}`}
            onClick={(e) => onToggle(k, e.ctrlKey || e.metaKey)}
          >
            {BROADCAST_LABELS[k]}
          </button>
        ))}
      </div>
    </div>
  );
}
