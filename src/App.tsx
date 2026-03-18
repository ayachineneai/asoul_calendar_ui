import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { fetchLives } from './api';
import { MEMBERS, API_BASE } from './constants';
import type { Live, BroadcastKind } from './types';
import { getBroadcastKind } from './types';
import MemberFilter from './components/MemberFilter';
import BroadcastFilter from './components/BroadcastFilter';
import TagFilter from './components/TagFilter';
import WeekCalendar from './components/WeekCalendar';
import DurationPicker from './components/DurationPicker';
import { useAvatars } from './hooks/useAvatars';

function App() {
  const avatars = useAvatars();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectedKinds, setSelectedKinds] = useState<Set<BroadcastKind>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [reminder, setReminder] = useState<number | null>(0);
  const [duration, setDuration] = useState(120);
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchLives([...selectedMembers])
      .then(setLives)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedMembers]);

  // Drop selected slugs that are no longer in the fetched lives
  useEffect(() => {
    const validSlugs = new Set(lives.map((l) => l.slug));
    setSelectedSlugs((prev) => {
      const next = new Set([...prev].filter((s) => validSlugs.has(s)));
      return next.size === prev.size ? prev : next;
    });
  }, [lives]);

  const allTags = useMemo(() => {
    const tags = new Set(lives.map((l) => l.tag).filter(Boolean));
    return [...tags].sort();
  }, [lives]);

  useEffect(() => {
    setSelectedTags((prev) => {
      const next = new Set([...prev].filter((t) => allTags.includes(t)));
      return next.size === prev.size ? prev : next;
    });
  }, [allTags]);

  const filteredLives = useMemo(() => {
    return lives.filter((l) => {
      if (selectedKinds.size > 0 && !selectedKinds.has(getBroadcastKind(l.members))) return false;
      if (selectedTags.size > 0 && !selectedTags.has(l.tag)) return false;
      return true;
    });
  }, [lives, selectedKinds, selectedTags]);

  // If specific events are selected, subscribe to those slugs only;
  // otherwise subscribe to current filter conditions.
  const subscribeUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedSlugs.size > 0) {
      for (const s of selectedSlugs) params.append('slug', s);
    } else {
      for (const m of selectedMembers) params.append('members', m);
      for (const k of selectedKinds) params.append('broadcast', k);
      for (const t of selectedTags) params.append('tag', t);
    }
    if (reminder !== null) params.set('reminder', String(reminder));
    params.set('duration', String(duration));
    return `${API_BASE}/calendar.ics?${params}`;
  }, [selectedMembers, selectedKinds, selectedTags, selectedSlugs, reminder, duration]);

  function makeToggle<T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>) {
    return (value: T, multi: boolean) => {
      setter((prev) => {
        if (multi) {
          const next = new Set(prev);
          next.has(value) ? next.delete(value) : next.add(value);
          return next;
        }
        // single-select: select only this item, or deselect if already the sole selection
        if (prev.size === 1 && prev.has(value)) return new Set();
        return new Set([value]);
      });
    };
  }

  const toggleMember = makeToggle(setSelectedMembers);
  const toggleTag = makeToggle(setSelectedTags);
  const toggleKind = makeToggle(setSelectedKinds);

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="app-title-icon">📅</span>
          <span>A-SOUL 本周日程</span>
        </div>
        <div className="header-right">
          {selectedSlugs.size > 0 && (
            <span className="slug-hint">已选 {selectedSlugs.size} 场</span>
          )}
          <a className="subscribe-btn" href={subscribeUrl}>
            {selectedSlugs.size > 0 ? '订阅已选场次' : '订阅日历'}
          </a>
          {selectedSlugs.size > 0 && (
            <button className="clear-slugs-btn" onClick={() => setSelectedSlugs(new Set())}>
              清除选择
            </button>
          )}
        </div>
      </header>

      <div className="filters">
        <MemberFilter members={MEMBERS} selected={selectedMembers} onToggle={toggleMember} avatars={avatars} />
        <BroadcastFilter selected={selectedKinds} onToggle={toggleKind} />
        <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
        <div className="filter-row">
          <span className="filter-label">设置</span>
          <label className="setting-item">
            <span>提前提醒</span>
            <select
              className="setting-select"
              value={reminder ?? ''}
              onChange={(e) => setReminder(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">不提醒</option>
              <option value={0}>准时提醒</option>
              <option value={5}>提前 5 分钟</option>
              <option value={10}>提前 10 分钟</option>
              <option value={15}>提前 15 分钟</option>
              <option value={30}>提前 30 分钟</option>
              <option value={60}>提前 1 小时</option>
            </select>
          </label>
          <label className="setting-item">
            <span>默认时长</span>
            <DurationPicker value={duration} onChange={setDuration} />
          </label>
        </div>
      </div>

      <main className="main">
        {loading && (
          <div className="status-msg">
            <span className="spinner" /> 加载中…
          </div>
        )}
        {error && <div className="status-msg error">加载失败：{error}</div>}
        {!loading && !error && (
          <WeekCalendar
            lives={filteredLives}
            selectedSlugs={selectedSlugs}
            onToggleSlug={toggleSlug}
            duration={duration}
          />
        )}
      </main>
    </div>
  );
}

export default App;
