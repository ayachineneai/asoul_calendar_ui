import type { BroadcastKind } from '../types';
import { BROADCAST_LABELS } from '../types';
import { useLongPress } from '../hooks/useLongPress';

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
  onEnterMultiSelect: () => void;
}

function LongPressChip({ className, onClick, onEnterMultiSelect, children }: {
  className: string;
  onClick: () => void;
  onEnterMultiSelect: () => void;
  children: React.ReactNode;
}) {
  const lp = useLongPress(() => { onEnterMultiSelect(); onClick(); });
  return (
    <button
      className={className}
      onClick={onClick}
      onTouchStart={lp.onTouchStart}
      onTouchMove={lp.onTouchMove}
      onTouchEnd={() => lp.onTouchEnd()}
    >
      {children}
    </button>
  );
}

export default function BroadcastFilter({
  selected, onToggle, selectedLiveKinds, onToggleLiveKind,
  hasActiveFilters, onReset, onEnterMultiSelect,
}: Props) {
  return (
    <div className="filter-row">
      <span className="filter-label">类型</span>
      <div className="tag-list">
        {ALL_BROADCASTS.map((k) => (
          <LongPressChip
            key={k}
            className={`tag-chip broadcast-chip broadcast-${k}${selected.has(k) ? ' active' : ''}`}
            onClick={() => onToggle(k, false)}
            onEnterMultiSelect={onEnterMultiSelect}
          >
            {BROADCAST_LABELS[k]}
          </LongPressChip>
        ))}
        <span className="filter-divider" />
        {(['schedule', 'unplanned'] as LiveKind[]).map((k) => (
          <LongPressChip
            key={k}
            className={`tag-chip live-kind-chip live-kind-${k}${selectedLiveKinds.has(k) ? ' active' : ''}`}
            onClick={() => onToggleLiveKind(k)}
            onEnterMultiSelect={onEnterMultiSelect}
          >
            {LIVE_KIND_LABELS[k]}
          </LongPressChip>
        ))}
        {hasActiveFilters && (
          <button className="filter-reset-btn" onClick={onReset}>重置</button>
        )}
      </div>
    </div>
  );
}
