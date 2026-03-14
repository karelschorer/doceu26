import { useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  color?: string;
}

const DAYS_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EVENT_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#ea580c', '#0891b2', '#db2777', '#d97706'];

function eventColor(e: CalendarEvent): string {
  if (e.color) return e.color;
  let hash = 0;
  for (let i = 0; i < e.title.length; i++) hash = e.title.charCodeAt(i) + hash * 31;
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const today = new Date();
const todayStr = toDateStr(today);

function makeSeedDate(offsetDays: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const SEED_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Team standup', start_time: makeSeedDate(0, 9), end_time: makeSeedDate(0, 10), all_day: false, color: '#2563eb' },
  { id: 'e2', title: 'Design review', start_time: makeSeedDate(0, 14), end_time: makeSeedDate(0, 15), all_day: false, color: '#7c3aed' },
  { id: 'e3', title: 'Sprint planning', start_time: makeSeedDate(1, 10), end_time: makeSeedDate(1, 12), all_day: false, color: '#16a34a' },
  { id: 'e4', title: 'Product launch', start_time: makeSeedDate(5, 0), end_time: makeSeedDate(5, 23), all_day: true, color: '#ea580c' },
];

interface NewEventState {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
}

export function CalendarPage() {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(SEED_EVENTS);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEventState>({
    title: '', date: todayStr, startTime: '09:00', endTime: '10:00', allDay: false, color: '#2563eb',
  });
  const [miniMonth, setMiniMonth] = useState(new Date());

  const navigate = (dir: -1 | 1) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === 'month') d.setMonth(d.getMonth() + dir);
      else if (view === 'week') d.setDate(d.getDate() + dir * 7);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getEventsForDay = (dateStr: string) =>
    events.filter((e) => toDateStr(new Date(e.start_time)) === dateStr);

  function getWeekDays(): Date[] {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const wd = new Date(d);
      wd.setDate(d.getDate() + i);
      return wd;
    });
  }

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  function getEventsForHourDay(date: Date, hour: number): CalendarEvent[] {
    const dateStr = toDateStr(date);
    return events.filter((e) => !e.all_day && toDateStr(new Date(e.start_time)) === dateStr && new Date(e.start_time).getHours() === hour);
  }

  const createEvent = () => {
    if (!newEvent.title.trim()) return;
    const startISO = newEvent.allDay
      ? new Date(newEvent.date + 'T00:00:00').toISOString()
      : new Date(newEvent.date + 'T' + newEvent.startTime + ':00').toISOString();
    const endISO = newEvent.allDay
      ? new Date(newEvent.date + 'T23:59:00').toISOString()
      : new Date(newEvent.date + 'T' + newEvent.endTime + ':00').toISOString();

    setEvents((prev) => [...prev, {
      id: `ev-${Date.now()}`, title: newEvent.title,
      start_time: startISO, end_time: endISO, all_day: newEvent.allDay, color: newEvent.color,
    }]);
    fetch('/api/v1/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newEvent.title, start_time: startISO, end_time: endISO }),
    }).catch(() => { /* optimistic */ });
    setShowForm(false);
    setNewEvent({ title: '', date: todayStr, startTime: '09:00', endTime: '10:00', allDay: false, color: '#2563eb' });
  };

  const openNewEvent = (dateStr?: string) => {
    setNewEvent((p) => ({ ...p, date: dateStr ?? todayStr }));
    setShowForm(true);
  };

  function headerTitle(): string {
    if (view === 'month') return `${MONTHS[month]} ${year}`;
    if (view === 'week') {
      const days = getWeekDays();
      const first = days[0], last = days[6];
      if (first.getMonth() === last.getMonth())
        return `${MONTHS[first.getMonth()]} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`;
      return `${MONTHS_SHORT[first.getMonth()]} ${first.getDate()} – ${MONTHS_SHORT[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  const miniYear = miniMonth.getFullYear();
  const miniMonthIdx = miniMonth.getMonth();
  const miniFirstDay = new Date(miniYear, miniMonthIdx, 1).getDay();
  const miniDaysInMonth = new Date(miniYear, miniMonthIdx + 1, 0).getDate();

  const weekDays = getWeekDays();

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--color-bg)' }}>
      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <aside className="sidebar" style={{ width: 220, overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 10px 8px' }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 6, borderRadius: 'var(--radius-lg)' }} onClick={() => openNewEvent()}>
            <span style={{ fontSize: 16 }}>+</span> Create
          </button>
        </div>

        {/* Mini calendar */}
        <div style={{ padding: '8px 8px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
            <button onClick={() => setMiniMonth((p) => { const d = new Date(p); d.setMonth(d.getMonth() - 1); return d; })}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: 14, color: 'var(--color-text-3)', borderRadius: 4 }}>‹</button>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)' }}>{MONTHS_SHORT[miniMonthIdx]} {miniYear}</span>
            <button onClick={() => setMiniMonth((p) => { const d = new Date(p); d.setMonth(d.getMonth() + 1); return d; })}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: 14, color: 'var(--color-text-3)', borderRadius: 4 }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {DAYS_ABBR.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', padding: '2px 0' }}>{d[0]}</div>
            ))}
            {Array.from({ length: miniFirstDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: miniDaysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${miniYear}-${String(miniMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const hasEvent = events.some((e) => toDateStr(new Date(e.start_time)) === dateStr);
              return (
                <button key={day}
                  onClick={() => { setCurrentDate(new Date(dateStr)); setMiniMonth(new Date(dateStr)); }}
                  style={{
                    width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: isToday ? 700 : 400,
                    background: isToday ? 'var(--color-primary)' : 'transparent',
                    color: isToday ? '#fff' : hasEvent ? 'var(--color-primary)' : 'var(--color-text-2)',
                    border: 'none', cursor: 'pointer', borderRadius: '50%', position: 'relative',
                  }}>
                  {day}
                  {hasEvent && !isToday && <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sidebar-header" style={{ marginTop: 12 }}>My calendars</div>
        {[{ label: 'Personal', color: '#2563eb' }, { label: 'Work', color: '#16a34a' }, { label: 'Holidays', color: '#ea580c' }].map((cal) => (
          <div key={cal.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px', cursor: 'pointer' }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: cal.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{cal.label}</span>
          </div>
        ))}
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date())}>Today</button>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>‹</button>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(1)}>›</button>
          <span style={{ fontWeight: 600, fontSize: 17, color: 'var(--color-text)', marginLeft: 4, whiteSpace: 'nowrap' }}>{headerTitle()}</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 2, background: 'var(--color-bg-3)', borderRadius: 'var(--radius)', padding: 3 }}>
            {(['day', 'week', 'month'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  padding: '4px 12px', border: 'none', borderRadius: 'calc(var(--radius) - 2px)',
                  background: view === v ? 'var(--color-bg)' : 'transparent',
                  color: view === v ? 'var(--color-text)' : 'var(--color-text-3)',
                  fontWeight: view === v ? 600 : 400, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                  boxShadow: view === v ? 'var(--shadow-xs)' : 'none',
                }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ── Month view ── */}
        {view === 'month' && (
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              {DAYS_ABBR.map((d) => (
                <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>{d}</div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr' }}>
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`p${i}`} style={{ borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-2)' }} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateStr === todayStr;
                const dayEvents = getEventsForDay(dateStr);
                const col = (firstDayOfMonth + i) % 7;
                return (
                  <div key={day} onClick={() => openNewEvent(dateStr)}
                    style={{
                      borderRight: col === 6 ? 'none' : '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)',
                      padding: '4px 4px 2px', cursor: 'pointer', background: 'var(--color-bg)', minHeight: 80,
                      display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg)'; }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: isToday ? 700 : 400,
                      background: isToday ? 'var(--color-primary)' : 'transparent',
                      color: isToday ? '#fff' : 'var(--color-text-2)', marginBottom: 2, flexShrink: 0,
                    }}>{day}</div>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div key={ev.id} onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: 11, fontWeight: 500, background: eventColor(ev), color: '#fff', borderRadius: 3, padding: '1px 5px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {!ev.all_day && <span style={{ opacity: 0.85, marginRight: 3 }}>{formatEventTime(ev.start_time)}</span>}
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', paddingLeft: 4 }}>+{dayEvents.length - 3} more</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Week view ── */}
        {view === 'week' && (
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <div />
              {weekDays.map((d) => {
                const dateStr = toDateStr(d);
                const isToday = dateStr === todayStr;
                return (
                  <div key={dateStr} style={{ textAlign: 'center', padding: '8px 0', borderLeft: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>{DAYS_ABBR[d.getDay()]}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, width: 36, height: 36, borderRadius: '50%', background: isToday ? 'var(--color-primary)' : 'transparent', color: isToday ? '#fff' : 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0' }}>
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {HOURS.map((hour) => (
                <div key={hour} style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)', minHeight: 48 }}>
                  <div style={{ padding: '4px 8px 0', textAlign: 'right', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {hour === 0 ? '' : `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`}
                  </div>
                  {weekDays.map((d) => {
                    const slotEvents = getEventsForHourDay(d, hour);
                    return (
                      <div key={toDateStr(d)} style={{ borderLeft: '1px solid var(--color-border)', padding: '2px', cursor: 'pointer' }} onClick={() => openNewEvent(toDateStr(d))}>
                        {slotEvents.map((ev) => (
                          <div key={ev.id} onClick={(e) => e.stopPropagation()}
                            style={{ background: eventColor(ev), color: '#fff', borderRadius: 4, padding: '2px 5px', marginBottom: 2, fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Day view ── */}
        {view === 'day' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr' }}>
              <div />
              <div style={{ borderLeft: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '8px 12px', fontWeight: 600, fontSize: 14 }}>
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
            {HOURS.map((hour) => {
              const slotEvents = getEventsForHourDay(currentDate, hour);
              return (
                <div key={hour} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', borderBottom: '1px solid var(--color-border)', minHeight: 56 }}>
                  <div style={{ padding: '4px 8px 0', textAlign: 'right', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {hour === 0 ? '' : `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`}
                  </div>
                  <div style={{ borderLeft: '1px solid var(--color-border)', padding: '3px 8px', cursor: 'pointer' }} onClick={() => openNewEvent(toDateStr(currentDate))}>
                    {slotEvents.map((ev) => (
                      <div key={ev.id} onClick={(e) => e.stopPropagation()}
                        style={{ background: eventColor(ev), color: '#fff', borderRadius: 4, padding: '4px 8px', marginBottom: 3, fontSize: 13, fontWeight: 500 }}>
                        {ev.title}
                        <div style={{ fontSize: 11, opacity: 0.85 }}>{formatEventTime(ev.start_time)} – {formatEventTime(ev.end_time)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── New event modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">New event</div>
            <div className="form-group">
              <input className="input" placeholder="Add title" value={newEvent.title}
                onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                autoFocus style={{ fontSize: 16, fontWeight: 500 }}
                onKeyDown={(e) => { if (e.key === 'Enter') createEvent(); }} />
            </div>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={newEvent.allDay} onChange={(e) => setNewEvent((p) => ({ ...p, allDay: e.target.checked }))} style={{ accentColor: 'var(--color-primary)' }} />
                All day
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="input" value={newEvent.date} onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))} />
            </div>
            {!newEvent.allDay && (
              <div className="form-group" style={{ flexDirection: 'row', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Start time</label>
                  <input type="time" className="input" value={newEvent.startTime} onChange={(e) => setNewEvent((p) => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">End time</label>
                  <input type="time" className="input" value={newEvent.endTime} onChange={(e) => setNewEvent((p) => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {EVENT_COLORS.map((c) => (
                  <button key={c} onClick={() => setNewEvent((p) => ({ ...p, color: c }))}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: newEvent.color === c ? '3px solid var(--color-text)' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createEvent} disabled={!newEvent.title.trim()}>Save event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
