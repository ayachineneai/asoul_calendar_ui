import type { Member } from '../types';

interface Props {
  members: Member[];
  selected: Set<string>;
  onToggle: (code: string, multi: boolean) => void;
  avatars: Map<string, string>;
}

export default function MemberFilter({ members, selected, onToggle, avatars }: Props) {
  return (
    <div className="filter-row">
      <span className="filter-label">成员</span>
      <div className="member-list">
        {members.map((m) => {
          const active = selected.has(m.code);
          const avatarUrl = avatars.get(m.code);
          return (
            <button
              key={m.code}
              className={`member-avatar${active ? ' active' : ''}`}
              onClick={(e) => onToggle(m.code, e.ctrlKey || e.metaKey)}
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
        })}
      </div>
    </div>
  );
}
