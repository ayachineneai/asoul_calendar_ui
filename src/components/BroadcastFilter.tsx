import type { BroadcastKind } from '../types';
import { BROADCAST_LABELS } from '../types';

type LiveKind = 'schedule' | 'unplanned';

const ALL_BROADCASTS: BroadcastKind[] = ['solo', 'duo', 'group'];
const LIVE_KIND_LABELS: Record<LiveKind, string> = { schedule: '官方', unplanned: '突击' };

interface Props {
  selected: Set<BroadcastKind>;
  onToggle: (kind: BroadcastKind, multi: boolean) => void;
  selectedLiveKinds: Set<LiveKind>;
  onToggleLiveKind: (kind: LiveKind) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
}

export default function BroadcastFilter({ selected, onToggle, selectedLiveKinds, onToggleLiveKind, hasActiveFilters, onReset }: Props) {
  return (
    <div className="filter-row">
      <span className="filter-label">类型</span>
      <div className="tag-list">
        {ALL_BROADCASTS.map((k) => (
          <button
            key={k}
            className={`tag-chip broadcast-chip broadcast-${k}${selected.has(k) ? ' active' : ''}`}
            onClick={(e) => onToggle(k, e.ctrlKey || e.metaKey)}
          >
            {BROADCAST_LABELS[k]}
          </button>
        ))}
        <span className="filter-divider" />
        {(['schedule', 'unplanned'] as LiveKind[]).map((k) => (
          <button
            key={k}
            className={`tag-chip live-kind-chip live-kind-${k}${selectedLiveKinds.has(k) ? ' active' : ''}`}
            onClick={() => onToggleLiveKind(k)}
          >
            {LIVE_KIND_LABELS[k]}
          </button>
        ))}
        {hasActiveFilters && (
          <button className="filter-reset-btn" onClick={onReset}>重置</button>
        )}
      </div>
    </div>
  );
}
