import { useLongPress } from '../hooks/useLongPress';

interface Props {
  tags: string[];
  selected: Set<string>;
  onToggle: (tag: string, multi: boolean) => void;
  onEnterMultiSelect: () => void;
}

export default function TagFilter({ tags, selected, onToggle, onEnterMultiSelect }: Props) {
  if (tags.length === 0) return null;
  return (
    <div className="filter-row">
      <span className="filter-label">分类</span>
      <div className="tag-list">
        {tags.map((tag) => (
          <TagChip
            key={tag}
            tag={tag}
            active={selected.has(tag)}
            onToggle={onToggle}
            onEnterMultiSelect={onEnterMultiSelect}
          />
        ))}
      </div>
    </div>
  );
}

function TagChip({ tag, active, onToggle, onEnterMultiSelect }: {
  tag: string;
  active: boolean;
  onToggle: (tag: string, multi: boolean) => void;
  onEnterMultiSelect: () => void;
}) {
  const lp = useLongPress(() => { onEnterMultiSelect(); onToggle(tag, true); });
  return (
    <button
      className={`tag-chip${active ? ' active' : ''}`}
      onClick={(e) => onToggle(tag, e.ctrlKey || e.metaKey)}
      onTouchStart={lp.onTouchStart}
      onTouchMove={lp.onTouchMove}
      onTouchEnd={() => lp.onTouchEnd()}
    >
      {tag}
    </button>
  );
}
