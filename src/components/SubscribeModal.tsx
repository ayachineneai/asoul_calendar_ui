import { useState, useMemo } from 'react';
import type { BroadcastKind, Member } from '../types';
import { BROADCAST_LABELS } from '../types';
import { API_BASE } from '../constants';

type LiveKind = 'schedule' | 'unplanned';

const KIND_LABELS: Record<LiveKind, string> = {
  schedule: '官方',
  unplanned: '突击',
};

interface Props {
  onClose: () => void;
  avatars: Map<string, string>;
  members: Member[];
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
}

const ALL_BROADCASTS: BroadcastKind[] = ['solo', 'duo', 'group'];
const ALL_KINDS: LiveKind[] = ['schedule', 'unplanned'];

export default function SubscribeModal({ onClose, avatars, members }: Props) {
  const [selMembers, setSelMembers] = useState<Set<string>>(new Set(members.map((m) => m.code)));
  const [selBroadcast, setSelBroadcast] = useState<Set<BroadcastKind>>(new Set(ALL_BROADCASTS));
  const [selKind, setSelKind] = useState<Set<LiveKind>>(new Set(ALL_KINDS));
  const [copied, setCopied] = useState(false);

  const webcalUrl = useMemo(() => {
    const params = new URLSearchParams();
    // 全选时不传参，后端默认返回全部
    if (selMembers.size < members.length) {
      for (const m of selMembers) params.append('members', m);
    }
    if (selBroadcast.size < ALL_BROADCASTS.length) {
      for (const b of selBroadcast) params.append('broadcast', b);
    }
    if (selKind.size < ALL_KINDS.length) {
      for (const k of selKind) params.append('kind', k);
    }
    const base = `${window.location.host}${API_BASE}/calendar.ics`;
    const qs = params.toString();
    return `webcal://${base}${qs ? '?' + qs : ''}`;
  }, [selMembers, selBroadcast, selKind]);

  async function handleCopy() {
    await navigator.clipboard.writeText(webcalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="modal-header">
          <span>订阅日历</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="sub-modal-body">
          <div className="sub-modal-section">
            <div className="form-label">成员</div>
            <div className="member-list">
              {members.map((m) => {
                const active = selMembers.has(m.code);
                const avatarUrl = avatars.get(m.code);
                return (
                  <button
                    key={m.code}
                    className={`member-avatar${active ? ' active' : ''}`}
                    onClick={() => setSelMembers((prev) => toggle(prev, m.code))}
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

          <div className="sub-modal-section">
            <div className="form-label">类型</div>
            <div className="tag-list">
              {(['solo', 'duo', 'group'] as BroadcastKind[]).map((k) => (
                <button
                  key={k}
                  className={`tag-chip broadcast-chip broadcast-${k}${selBroadcast.has(k) ? ' active' : ''}`}
                  onClick={() => setSelBroadcast((prev) => toggle(prev, k))}
                >
                  {BROADCAST_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          <div className="sub-modal-section">
            <div className="form-label">场次</div>
            <div className="tag-list">
              {(['schedule', 'unplanned'] as LiveKind[]).map((k) => (
                <button
                  key={k}
                  className={`tag-chip${selKind.has(k) ? ' active' : ''}`}
                  onClick={() => setSelKind((prev) => toggle(prev, k))}
                >
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          <div className="sub-modal-section">
            <div className="form-label">订阅链接</div>
            <div className="sub-modal-url-row">
              <input
                className="sub-modal-url-input"
                readOnly
                value={webcalUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button className="sub-modal-copy-btn" onClick={handleCopy}>
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          <div className="sub-modal-actions">
            <a className="subscribe-btn" href={webcalUrl}>
              立即订阅
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
