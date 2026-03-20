import type { BroadcastKind } from '../types';
import { BROADCAST_LABELS } from '../types';

const ALL_KINDS: BroadcastKind[] = ['solo', 'duo', 'group'];

interface Props {
  selected: Set<BroadcastKind>;
  onToggle: (kind: BroadcastKind, multi: boolean) => void;
  scheduleOnly: boolean;
  onToggleSchedule: () => void;
}

export default function BroadcastFilter({ selected, onToggle, scheduleOnly, onToggleSchedule }: Props) {
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
        <button
          className={`tag-chip kind-chip-schedule${scheduleOnly ? ' active' : ''}`}
          onClick={onToggleSchedule}
        >
          官方
        </button>
      </div>
    </div>
  );
}
