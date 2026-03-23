import { useState } from 'react';
import type { Member } from '../types';
import { useLongPress } from '../hooks/useLongPress';

interface Props {
  members: Member[];
  selected: Set<string>;
  onToggle: (code: string, multi: boolean) => void;
  onSelectAll: (codes: string[]) => void;
  avatars: Map<string, string>;
  onEnterMultiSelect: () => void;
}

const PRESETS = [
  { label: '一期', codes: ['乃琳', '嘉然', '贝拉'] },
  { label: '二期', codes: ['思诺', '心宜'] },
];

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

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

export default function MemberFilter({ members, selected, onToggle, onSelectAll, avatars, onEnterMultiSelect }: Props) {
  const [hintOpen, setHintOpen] = useState(false);

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
        <span className="filter-divider" />
        {PRESETS.map((p) => {
          const active = p.codes.length === selected.size && p.codes.every((c) => selected.has(c));
          return (
            <button
              key={p.label}
              className={`tag-chip member-preset-chip${active ? ' active' : ''}`}
              onClick={() => active ? onSelectAll([]) : onSelectAll(p.codes)}
            >
              {p.label}
            </button>
          );
        })}
        <div className="member-hint-wrap">
          <button
            className="member-hint-btn"
            onClick={() => isTouchDevice() && setHintOpen((v) => !v)}
            aria-label="多选说明"
          >
            ?
          </button>
          {/* PC: CSS hover tooltip */}
          <div className="member-hint-tooltip member-hint-tooltip--desktop">
            Ctrl / ⌘ + 点击多选
          </div>
          {/* Mobile: tap toggle */}
          {hintOpen && (
            <div className="member-hint-tooltip member-hint-tooltip--mobile">
              长按任意头像进入多选模式
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
