import { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import {
  fetchLives,
  verifyToken,
  adminCreateLive,
  adminUpdateLive,
  adminDeleteLive,
} from './api';
import type { LiveBody } from './api';
import { MEMBERS, API_BASE } from './constants';
import type { Live, BroadcastKind } from './types';
import { getBroadcastKind } from './types';
import MemberFilter from './components/MemberFilter';
import BroadcastFilter from './components/BroadcastFilter';
import TagFilter from './components/TagFilter';
import WeekCalendar from './components/WeekCalendar';
import DurationPicker from './components/DurationPicker';
import LiveForm from './components/LiveForm';
import SubscribeModal from './components/SubscribeModal';
import { useAvatars } from './hooks/useAvatars';

function getMonday(offset: number): Date {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDays(offset: number): Date[] {
  const monday = getMonday(offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// Returns the week offset (relative to current week) that a date falls in
function dateToWeekOffset(date: Date): number {
  const currentMonday = getMonday(0).getTime();
  const dow = date.getDay();
  const liveMonday = new Date(date);
  liveMonday.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
  liveMonday.setHours(0, 0, 0, 0);
  return Math.round((liveMonday.getTime() - currentMonday) / (7 * 24 * 60 * 60 * 1000));
}

function App() {
  const avatars = useAvatars();

  useEffect(() => {
    const url = avatars.get('嘉然');
    if (!url) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      link.type = 'image/jpeg';
      link.href = url;
    }
  }, [avatars]);

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectedKinds, setSelectedKinds] = useState<Set<BroadcastKind>>(new Set());
  const [selectedLiveKinds, setSelectedLiveKinds] = useState<Set<'schedule' | 'unplanned'>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [reminder, setReminder] = useState<number | null>(0);
  const [duration, setDuration] = useState(120);
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [editingLive, setEditingLive] = useState<Live | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const fmt = (d: Date) =>
      d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  }, [weekDays]);

  // Allowed week range derived from available data
  const [minWeekOffset, maxWeekOffset] = useMemo(() => {
    if (lives.length === 0) return [0, 0];
    const offsets = lives.map((l) => dateToWeekOffset(new Date(l.start_time)));
    return [Math.min(...offsets), Math.max(...offsets)];
  }, [lives]);

  // Check token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      verifyToken(token).then((valid) => {
        if (valid) {
          setIsAdmin(true);
          setAdminToken(token);
        }
      });
    }
  }, []);

  // Fetch all lives once on mount (and after admin mutations)
  const loadLives = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchLives()
      .then(setLives)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLives();
  }, [loadLives]);

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
      if (selectedMembers.size > 0 && !l.members.some((m) => selectedMembers.has(m)))
        return false;
      if (selectedKinds.size > 0 && !selectedKinds.has(getBroadcastKind(l.members)))
        return false;
      if (selectedTags.size > 0 && !selectedTags.has(l.tag)) return false;
      if (selectedLiveKinds.size > 0 && !selectedLiveKinds.has(l.kind)) return false;
      return true;
    });
  }, [lives, selectedMembers, selectedKinds, selectedTags, selectedLiveKinds]);

  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // ICS download: slugs of this week's filtered lives
  const thisWeekIcsUrl = useMemo(() => {
    const weekStart = weekDays[0];
    const weekEnd = new Date(weekDays[6]);
    weekEnd.setDate(weekEnd.getDate() + 1);
    const slugs = filteredLives
      .filter((l) => {
        const t = new Date(l.start_time);
        return t >= weekStart && t < weekEnd;
      })
      .map((l) => l.slug);
    const params = new URLSearchParams();
    for (const s of slugs) params.append('slug', s);
    params.set('duration', String(duration));
    return `${API_BASE}/calendar.ics?${params}`;
  }, [filteredLives, weekDays, duration]);

  function makeToggle<T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>) {
    return (value: T, multi: boolean) => {
      setter((prev) => {
        if (multi) {
          const next = new Set(prev);
          next.has(value) ? next.delete(value) : next.add(value);
          return next;
        }
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

  // Admin handlers
  async function handleCreate(body: LiveBody) {
    await adminCreateLive(adminToken, body);
    loadLives();
  }

  async function handleUpdate(body: LiveBody) {
    if (!editingLive) return;
    await adminUpdateLive(adminToken, editingLive.slug, body);
    loadLives();
  }

  async function handleDelete(live: Live) {
    if (!confirm(`确认删除「${live.title}」？`)) return;
    await adminDeleteLive(adminToken, live.slug);
    loadLives();
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="app-title-icon" aria-hidden>
            <CalendarIcon />
          </span>
          <span>ASOUL日历</span>
        </div>
        <div className="header-right">
          {isAdmin && (
            <button className="admin-add-btn" onClick={() => setShowAddForm(true)}>
              + 新增日程
            </button>
          )}
          {selectedSlugs.size > 0 && (
            <span className="slug-hint">已选 {selectedSlugs.size} 场</span>
          )}
          {selectedSlugs.size > 0 && (
            <button className="clear-slugs-btn" onClick={() => setSelectedSlugs(new Set())}>
              清除选择
            </button>
          )}
          <a className="ics-download-btn" href={thisWeekIcsUrl} download="asoul_week.ics">
            下载本周ICS
          </a>
          <button className="subscribe-btn" onClick={() => setShowSubscribeModal(true)}>
            订阅日历
          </button>
        </div>
      </header>

      <div className="filters">
        <MemberFilter
          members={MEMBERS}
          selected={selectedMembers}
          onToggle={toggleMember}
          avatars={avatars}
        />
        <BroadcastFilter
          selected={selectedKinds}
          onToggle={toggleKind}
          selectedLiveKinds={selectedLiveKinds}
          onToggleLiveKind={(k) =>
            setSelectedLiveKinds((prev) => {
              const next = new Set(prev);
              next.has(k) ? next.delete(k) : next.add(k);
              return next;
            })
          }
        />
        <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
        <div className="filter-row">
          <span className="filter-label">设置</span>
          <label className="setting-item">
            <span>提前提醒</span>
            <select
              className="setting-select"
              value={reminder ?? ''}
              onChange={(e) =>
                setReminder(e.target.value === '' ? null : Number(e.target.value))
              }
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

      <div className="week-nav">
        <button
          className="week-nav-btn"
          onClick={() => setWeekOffset((o) => o - 1)}
          disabled={weekOffset <= minWeekOffset}
        >
          ← 上周
        </button>
        <span className="week-nav-label">{weekLabel}</span>
        {weekOffset !== 0 && weekOffset >= minWeekOffset && weekOffset <= maxWeekOffset && (
          <button className="week-nav-today" onClick={() => setWeekOffset(0)}>
            本周
          </button>
        )}
        <button
          className="week-nav-btn"
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={weekOffset >= maxWeekOffset}
        >
          下周 →
        </button>
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
            weekDays={weekDays}
            selectedSlugs={selectedSlugs}
            onToggleSlug={toggleSlug}
            duration={duration}
            isAdmin={isAdmin}
            onEditLive={setEditingLive}
            onDeleteLive={handleDelete}
          />
        )}
      </main>

      {showAddForm && (
        <LiveForm onSubmit={handleCreate} onClose={() => setShowAddForm(false)} />
      )}
      {editingLive && (
        <LiveForm
          live={editingLive}
          onSubmit={handleUpdate}
          onClose={() => setEditingLive(null)}
        />
      )}
      {showSubscribeModal && (
        <SubscribeModal
          onClose={() => setShowSubscribeModal(false)}
          avatars={avatars}
          members={MEMBERS}
        />
      )}
    </div>
  );
}

function CalendarIcon() {
  const day = new Date().getDate();
  return (
    <span className="cal-icon">
      <span className="cal-icon-cap" />
      <span className="cal-icon-day">{day}</span>
    </span>
  );
}

export default App;
