import { useState, useEffect, useRef } from 'react';
import type { Live } from '../types';
import { getBroadcastKind, BROADCAST_LABELS } from '../types';
import { MEMBER_MAP } from '../constants';

const HOUR_HEIGHT = 64;
const START_HOUR = 0;
const END_HOUR = 24;
const DEFAULT_DURATION_MIN = 120; // fallback only

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function getWeekDays(): Date[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minuteOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getMemberColor(live: Live): string {
  const key = live.host || live.members[0];
  return MEMBER_MAP.get(key)?.color ?? '#6366f1';
}

function layoutEvents(dayLives: Live[], durationMin: number) {
  const sorted = [...dayLives].map((live) => {
    const start = new Date(live.start_time);
    const startMin = minuteOfDay(start);
    const endMin = startMin + durationMin;
    return { live, startMin, endMin, col: 0, cols: 1 };
  });
  sorted.sort((a, b) => a.startMin - b.startMin);

  const cols: number[] = [];
  for (const item of sorted) {
    let col = 0;
    while (cols[col] !== undefined && cols[col] > item.startMin) col++;
    item.col = col;
    cols[col] = item.endMin;
  }
  const maxCol = sorted.reduce((m, it) => Math.max(m, it.col), 0) + 1;
  for (const item of sorted) item.cols = maxCol;
  return sorted;
}

interface Tooltip {
  live: Live;
  x: number;
  y: number;
}

interface Props {
  lives: Live[];
  selectedSlugs: Set<string>;
  onToggleSlug: (slug: string) => void;
  duration: number;
}

export default function WeekCalendar({ lives, selectedSlugs, onToggleSlug, duration }: Props) {
  const weekDays = getWeekDays();
  const today = new Date();
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const calBodyRef = useRef<HTMLDivElement>(null);

  // Scroll to the earliest time-of-day across all events on first load
  useEffect(() => {
    if (lives.length === 0 || !calBodyRef.current) return;
    const minMinutes = Math.min(...lives.map((l) => minuteOfDay(new Date(l.start_time))));
    const scrollTop = Math.max(0, (minMinutes / 60) * HOUR_HEIGHT - HOUR_HEIGHT * 0.75);
    calBodyRef.current.scrollTop = scrollTop;
  }, [lives]);

  return (
    <>
      <div className="calendar" onMouseLeave={() => setTooltip(null)}>
        {/* Sticky header */}
        <div className="cal-header">
          <div className="cal-gutter" />
          {weekDays.map((day, i) => {
            const isToday = sameDay(day, today);
            return (
              <div key={i} className={`cal-day-head${isToday ? ' today' : ''}`}>
                <span className="cal-weekday">{DAY_NAMES[i]}</span>
                <span className="cal-date">{day.getDate()}</span>
              </div>
            );
          })}
        </div>

        {/* Scrollable grid body */}
        <div className="cal-body" ref={calBodyRef}>
          <div className="cal-gutter">
            {hours.map((h) => (
              <div key={h} className="cal-hour-label" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}>
                {h < 24 ? `${String(h).padStart(2, '0')}:00` : ''}
              </div>
            ))}
          </div>

          {weekDays.map((day, di) => {
            const dayLives = lives.filter((l) => sameDay(new Date(l.start_time), day));
            const laid = layoutEvents(dayLives, duration);

            return (
              <div key={di} className="cal-day-col" style={{ height: totalHeight }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className={`cal-hline${h === 12 ? ' noon' : ''}`}
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {laid.map(({ live, startMin, col, cols }, i) => {
                  const top = (startMin / 60) * HOUR_HEIGHT;
                  const height = Math.max((duration / 60) * HOUR_HEIGHT - 4, 28);
                  const color = getMemberColor(live);
                  const selected = live.slug ? selectedSlugs.has(live.slug) : false;

                  return (
                    <div
                      key={i}
                      className={`cal-event${selected ? ' selected' : ''}`}
                      style={{
                        top,
                        height,
                        left: `${(col / cols) * 100}%`,
                        width: `${100 / cols}%`,
                        borderLeftColor: color,
                        background: selected ? hexToRgba(color, 0.35) : hexToRgba(color, 0.15),
                        boxShadow: selected ? `0 0 0 1.5px ${color}` : undefined,
                      }}
                      onClick={() => live.slug && onToggleSlug(live.slug)}
                      onMouseEnter={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setTooltip({ live, x: rect.right + 6, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <div className="ev-header">
                        <span className="ev-time" style={{ color }}>
                          {new Date(live.start_time).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </span>
                        {live.members.length >= 2 && (
                          <span className={`ev-broadcast ev-broadcast-${getBroadcastKind(live.members)}`}>
                            {BROADCAST_LABELS[getBroadcastKind(live.members)]}
                          </span>
                        )}
                        {selected && <span className="ev-check">✓</span>}
                      </div>
                      <div className="ev-title">{live.title}</div>
                      <div className="ev-members">{live.members.join(' · ')}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed-position tooltip — outside calendar so overflow:hidden won't clip it */}
      {tooltip && (
        <EventTooltip tooltip={tooltip} />
      )}
    </>
  );
}

function EventTooltip({ tooltip }: { tooltip: Tooltip }) {
  const { live, x, y } = tooltip;
  const color = getMemberColor(live);
  const bk = getBroadcastKind(live.members);
  const startTime = new Date(live.start_time);

  // Clamp to viewport right edge
  const tooltipWidth = 240;
  const left = x + tooltipWidth > window.innerWidth ? x - tooltipWidth - 12 : x;

  return (
    <div
      className="ev-tooltip"
      style={{ left, top: y }}
      // Prevent the tooltip itself from triggering onMouseLeave on the calendar
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <div className="ev-tooltip-time" style={{ color }}>
        {startTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
        {' '}
        {startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </div>
      <div className="ev-tooltip-title">{live.title}</div>
      <div className="ev-tooltip-meta">
        <span className={`ev-broadcast ev-broadcast-${bk}`}>{BROADCAST_LABELS[bk]}</span>
        {live.tag && <span className="ev-tooltip-tag">{live.tag}</span>}
      </div>
      <div className="ev-tooltip-members">{live.members.join(' · ')}</div>
      {live.slug && (
        <div className="ev-tooltip-hint">点击卡片可加入/移出精选订阅</div>
      )}
    </div>
  );
}
