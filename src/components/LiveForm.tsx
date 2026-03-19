import { useState } from 'react';
import type { Live } from '../types';
import type { LiveBody } from '../api';
import { MEMBERS } from '../constants';

interface Props {
  live?: Live;
  onSubmit: (body: LiveBody) => Promise<void>;
  onClose: () => void;
}

function splitDateTime(iso: string) {
  // iso is like "2026-03-19T20:00" or "2026-03-19T20:00:00"
  const [date = '', timePart = ''] = iso.split('T');
  return { date, time: timePart.slice(0, 5) };
}

export default function LiveForm({ live, onSubmit, onClose }: Props) {
  const initial = live ? splitDateTime(live.start_time) : { date: '', time: '' };
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [title, setTitle] = useState(live?.title ?? '');
  const [members, setMembers] = useState<string[]>(live?.members ?? []);
  const [host, setHost] = useState(live?.host ?? '');
  const [tag, setTag] = useState(live?.tag ?? '');
  const [kind, setKind] = useState<'schedule' | 'unplanned'>(live?.kind ?? 'schedule');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleMember(code: string) {
    setMembers((prev) => {
      const next = prev.includes(code) ? prev.filter((m) => m !== code) : [...prev, code];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || !title || members.length === 0) {
      setError('请填写开播日期、时间、标题，并选择至少一位成员');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        start_time: `${date}T${time}:00`,
        title,
        members,
        host: host || members[0],
        tag,
        kind,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{live ? '编辑日程' : '新增日程'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="live-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <span className="form-label">开播时间</span>
            <div className="form-datetime-row">
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <input
                type="time"
                className="form-input form-input-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <label className="form-field">
            <span className="form-label">标题</span>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="直播标题"
              required
            />
          </label>

          <div className="form-field">
            <span className="form-label">成员</span>
            <div className="form-members">
              {MEMBERS.map((m) => (
                <label
                  key={m.code}
                  className={`form-member-chip${members.includes(m.code) ? ' active' : ''}`}
                  style={{ '--member-color': m.color } as React.CSSProperties}
                >
                  <input
                    type="checkbox"
                    checked={members.includes(m.code)}
                    onChange={() => toggleMember(m.code)}
                    style={{ display: 'none' }}
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </div>

          <label className="form-field">
            <span className="form-label">主播</span>
            <input
              type="text"
              className="form-input"
              list="host-suggestions"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="留空自动取第一位成员"
            />
            <datalist id="host-suggestions">
              {members.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>
          </label>

          <label className="form-field">
            <span className="form-label">标签</span>
            <input
              type="text"
              className="form-input"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="可选，如：游戏、歌回"
            />
          </label>

          <label className="form-field">
            <span className="form-label">类型</span>
            <select
              className="form-select"
              value={kind}
              onChange={(e) => setKind(e.target.value as 'schedule' | 'unplanned')}
            >
              <option value="schedule">计划直播</option>
              <option value="unplanned">临时直播</option>
            </select>
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="form-btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="form-btn-submit" disabled={submitting}>
              {submitting ? '提交中…' : live ? '保存修改' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
