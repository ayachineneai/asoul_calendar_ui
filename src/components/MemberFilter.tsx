import type { Member } from '../types';
import { useLongPress } from '../hooks/useLongPress';

interface Props {
  members: Member[];
  selected: Set<string>;
  onToggle: (code: string, multi: boolean) => void;
  avatars: Map<string, string>;
  onEnterMultiSelect: () => void;
}

function MemberChip({ m, active, avatarUrl, onToggle, onEnterMultiSelect }: {
  m: Member;
  active: boolean;
  avatarUrl?: string;
  onToggle: (code: string, multi: boolean) => void;
  onEnterMultiSelect: () => void;
}) {
  const lp = useLongPress(() => {
    onEnterMultiSelect();
    onToggle(m.code, true);
  });

  return (
    <button
      className={`member-avatar${active ? ' active' : ''}`}
      onClick={(e) => onToggle(m.code, e.ctrlKey || e.metaKey)}
      onTouchStart={lp.onTouchStart}
      onTouchMove={lp.onTouchMove}
      onTouchEnd={() => lp.onTouchEnd()}
      title={m.name}
      style={{ '--color': m.color } as React.CSSProperties}
    >
      <span className="avatar-circle">
        {avatarUrl ? (
          <img src={avatarUrl} alt={m.name} className="avatar-img" referrerPolicy="no-referrer" />
        ) : (
          m.name
        )}
      </span>
      <span className="avatar-name">{m.name}</span>
    </button>
  );
}

export default function MemberFilter({ members, selected, onToggle, avatars, onEnterMultiSelect }: Props) {
  return (
    <div className="filter-row">
      <span className="filter-label">成员</span>
      <div className="member-list">
        {members.map((m) => (
          <MemberChip
            key={m.code}
            m={m}
            active={selected.has(m.code)}
            avatarUrl={avatars.get(m.code)}
            onToggle={onToggle}
            onEnterMultiSelect={onEnterMultiSelect}
          />
        ))}
      </div>
    </div>
  );
}
