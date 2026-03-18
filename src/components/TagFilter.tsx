interface Props {
  tags: string[];
  selected: Set<string>;
  onToggle: (tag: string, multi: boolean) => void;
}

export default function TagFilter({ tags, selected, onToggle }: Props) {
  if (tags.length === 0) return null;
  return (
    <div className="filter-row">
      <span className="filter-label">分类</span>
      <div className="tag-list">
        {tags.map((tag) => (
          <button
            key={tag}
            className={`tag-chip${selected.has(tag) ? ' active' : ''}`}
            onClick={(e) => onToggle(tag, e.ctrlKey || e.metaKey)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
