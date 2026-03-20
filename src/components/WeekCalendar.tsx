import { useState, useEffect, useRef, useCallback } from 'react';
import type { Live } from '../types';
import { getBroadcastKind, BROADCAST_LABELS } from '../types';
import { MEMBER_MAP } from '../constants';

const MIN_HOUR_HEIGHT = 32;
const MAX_HOUR_HEIGHT = 80;

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

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
  const kind = getBroadcastKind(live.members);
  if (kind === 'group') return '#7c3aed';
  if (kind === 'duo') return '#ea6800';
  for (const key of live.members) {
    const color = MEMBER_MAP.get(key)?.color;
    if (color) return color;
  }
  return '#6366f1';
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
  xLeft: number;
  y: number;
}

interface Props {
  lives: Live[];
  weekDays: Date[];
  selectedSlugs: Set<string>;
  onToggleSlug: (slug: string) => void;
  onClearSlugs: () => void;
  duration: number;
  isAdmin?: boolean;
  onEditLive?: (live: Live) => void;
  onDeleteLive?: (live: Live) => void;
}

export default function WeekCalendar({
  lives,
  weekDays,
  selectedSlugs,
  onToggleSlug,
  onClearSlugs,
  duration,
  isAdmin,
  onEditLive,
  onDeleteLive,
}: Props) {
  const today = new Date();
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const calBodyRef = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState(600);

  // Mobile detection with resize listener
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Mobile: default to today's day index (0=Monday … 6=Sunday)
  const [mobileDayIndex, setMobileDayIndex] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });
  const [mobileView, setMobileView] = useState<'day' | 'week'>('day');
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [detailLive, setDetailLive] = useState<Live | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent, live: Live) => {
    e.preventDefault();
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      setIsMultiSelect(true);
      navigator.vibrate?.(50);
      if (live.slug) onToggleSlug(live.slug);
    }, 400);
  }, [onToggleSlug]);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((live: Live) => {
    if (!longPressTimer.current) return; // long press already fired
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    if (isMultiSelect) {
      if (live.slug) onToggleSlug(live.slug);
    } else {
      setDetailLive(live);
    }
  }, [isMultiSelect, onToggleSlug]);

  // Track container height to fill it exactly
  useEffect(() => {
    const el = calBodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setBodyHeight(entries[0].contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dynamic hour range based on actual events
  const startHour =
    lives.length > 0
      ? Math.max(0, Math.min(...lives.map((l) => new Date(l.start_time).getHours())) - 1)
      : 0;
  const endHour =
    lives.length > 0
      ? Math.min(
          24,
          Math.max(...lives.map((l) => new Date(l.start_time).getHours())) +
            Math.ceil(duration / 60) +
            1,
        )
      : 24;
  const numHours = endHour - startHour;
  const HOUR_HEIGHT = Math.min(MAX_HOUR_HEIGHT, Math.max(MIN_HOUR_HEIGHT, bodyHeight / numHours));
  const totalHeight = numHours * HOUR_HEIGHT;
  const hours = Array.from({ length: numHours + 1 }, (_, i) => startHour + i);

  // Renders a single day column (used for both desktop and mobile)
  function renderDayCol(day: Date, di: number) {
    const dayLives = lives.filter((l) => sameDay(new Date(l.start_time), day));
    const laid = layoutEvents(dayLives, duration);

    return (
      <div key={di} className="cal-day-col" style={{ height: totalHeight }}>
        {hours.map((h) => (
          <div
            key={h}
            className={`cal-hline${h === 12 ? ' noon' : ''}`}
            style={{ top: (h - startHour) * HOUR_HEIGHT }}
          />
        ))}

        {laid.map(({ live, startMin, col, cols }, i) => {
          const top = (startMin / 60 - startHour) * HOUR_HEIGHT;
          const height = Math.max((duration / 60) * HOUR_HEIGHT - 4, 28);
          const color = getMemberColor(live);
          const selected = live.slug ? selectedSlugs.has(live.slug) : false;

          return (
            <div
              key={i}
              className={`cal-event${selected ? ' selected' : ''}${isAdmin ? ' admin-event' : ''}${isMultiSelect ? ' multi-select-mode' : ''}`}
              style={{
                top,
                height,
                left: `${(col / cols) * 100}%`,
                width: `${100 / cols}%`,
                borderLeftColor: color,
                background: selected ? hexToRgba(color, 0.25) : hexToRgba(color, 0.12),
                boxShadow: selected ? `0 0 0 1.5px ${color}` : undefined,
              }}
              onClick={isMobile ? undefined : () => live.slug && onToggleSlug(live.slug)}
              onTouchStart={isMobile ? (e) => handleTouchStart(e, live) : undefined}
              onTouchMove={isMobile ? handleTouchMove : undefined}
              onTouchEnd={isMobile ? () => handleTouchEnd(live) : undefined}
              onMouseEnter={(e) => {
                if (isMobile) return;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setTooltip({ live, x: rect.right + 6, xLeft: rect.left, y: rect.top });
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
                  <span
                    className={`ev-broadcast ev-broadcast-${getBroadcastKind(live.members)}`}
                  >
                    {BROADCAST_LABELS[getBroadcastKind(live.members)]}
                  </span>
                )}
                {selected && <span className="ev-check">✓</span>}
              </div>
              <div className="ev-title">
                {live.kind === 'unplanned' && live.title.startsWith('【突击】')
                  ? live.title.slice(4)
                  : live.title}
              </div>
              <div className="ev-members">{live.members.join(' · ')}</div>

              {isAdmin && (
                <div className="ev-admin-actions">
                  <button
                    className="ev-admin-btn ev-admin-edit"
                    title="编辑"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditLive?.(live);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="ev-admin-btn ev-admin-delete"
                    title="删除"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLive?.(live);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const isMobileWeek = isMobile && mobileView === 'week';

  return (
    <>
      {isMobile && isMultiSelect && (
        <div className="mobile-multiselect-bar">
          <span>已选 {selectedSlugs.size} 场</span>
          <div className="mobile-multiselect-actions">
            {selectedSlugs.size > 0 && (
              <button onClick={onClearSlugs}>清除</button>
            )}
            <button onClick={() => setIsMultiSelect(false)}>完成</button>
          </div>
        </div>
      )}
      <div className={`calendar${isMobileWeek ? ' mobile-week' : ''}`} onMouseLeave={() => setTooltip(null)}>
        {/* Desktop sticky header (also shown in mobile week view) */}
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

        {/* Mobile day navigation */}
        <div className="cal-mobile-nav">
          {mobileView === 'day' && (
            <button
              className="cal-nav-arrow"
              onClick={() => setMobileDayIndex((i) => Math.max(0, i - 1))}
              disabled={mobileDayIndex === 0}
            >
              ‹
            </button>
          )}
          <div className="cal-day-tabs">
            {mobileView === 'day' ? weekDays.map((day, i) => {
              const isToday = sameDay(day, today);
              return (
                <button
                  key={i}
                  className={`cal-day-tab${i === mobileDayIndex ? ' active' : ''}${isToday ? ' today' : ''}`}
                  onClick={() => setMobileDayIndex(i)}
                >
                  <span>{DAY_NAMES[i]}</span>
                  <span>{day.getDate()}</span>
                </button>
              );
            }) : <span className="cal-week-label">本周总览</span>}
          </div>
          {mobileView === 'day' && (
            <button
              className="cal-nav-arrow"
              onClick={() => setMobileDayIndex((i) => Math.min(6, i + 1))}
              disabled={mobileDayIndex === 6}
            >
              ›
            </button>
          )}
          <div className="cal-view-toggle">
            <button
              className={`cal-view-btn${mobileView === 'day' ? ' active' : ''}`}
              onClick={() => setMobileView('day')}
            >
              日
            </button>
            <button
              className={`cal-view-btn${mobileView === 'week' ? ' active' : ''}`}
              onClick={() => setMobileView('week')}
            >
              周
            </button>
          </div>
        </div>

        {/* Scrollable grid body */}
        <div className="cal-body" ref={calBodyRef}>
          <div className="cal-gutter">
            {hours.map((h) => (
              <div
                key={h}
                className="cal-hour-label"
                style={{ top: (h - startHour) * HOUR_HEIGHT }}
              >
                {h < 24 ? `${String(h).padStart(2, '0')}:00` : ''}
              </div>
            ))}
          </div>

          {isMobile && mobileView === 'day'
            ? renderDayCol(weekDays[mobileDayIndex], mobileDayIndex)
            : weekDays.map((day, di) => renderDayCol(day, di))}
        </div>
      </div>

      {/* Fixed-position tooltip — outside calendar so overflow:hidden won't clip it */}
      {tooltip && !isMobile && <EventTooltip tooltip={tooltip} />}

      {detailLive && (
        <MobileEventDetail live={detailLive} onClose={() => setDetailLive(null)} />
      )}
    </>
  );
}

function EventTooltip({ tooltip }: { tooltip: Tooltip }) {
  const { live, x, xLeft, y } = tooltip;
  const color = getMemberColor(live);
  const bk = getBroadcastKind(live.members);
  const startTime = new Date(live.start_time);

  const tooltipWidth = 240;
  // Prefer right side; if it overflows viewport, place fully to the left of the card
  const left = x + tooltipWidth > window.innerWidth ? xLeft - tooltipWidth - 6 : x;

  return (
    <div
      className="ev-tooltip"
      style={{ left, top: y }}
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <div className="ev-tooltip-time" style={{ color }}>
        {startTime.toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        })}{' '}
        {startTime.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
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

function MobileEventDetail({ live, onClose }: { live: Live; onClose: () => void }) {
  const color = getMemberColor(live);
  const bk = getBroadcastKind(live.members);
  const startTime = new Date(live.start_time);
  const title =
    live.kind === 'unplanned' && live.title.startsWith('【突击】')
      ? live.title.slice(4)
      : live.title;

  return (
    <div className="mobile-detail-overlay" onClick={onClose}>
      <div className="mobile-detail-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-detail-handle" />
        <div className="mobile-detail-time" style={{ color }}>
          {startTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
          {' '}
          {startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
        <div className="mobile-detail-title">{title}</div>
        <div className="mobile-detail-meta">
          {live.members.length >= 2 && (
            <span className={`ev-broadcast ev-broadcast-${bk}`}>{BROADCAST_LABELS[bk]}</span>
          )}
          <span className={`ev-broadcast ev-kind-label-${live.kind}`}>
            {live.kind === 'unplanned' ? '突击' : '官方'}
          </span>
          {live.tag && <span className="mobile-detail-tag">{live.tag}</span>}
        </div>
        <div className="mobile-detail-members">{live.members.join(' · ')}</div>
        <div className="mobile-detail-hint">长按卡片可进入多选模式</div>
      </div>
    </div>
  );
}
