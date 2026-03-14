package store

import (
    "errors"
    "sync"
    "time"

    "github.com/doceu26/calendar/internal/model"
    "github.com/google/uuid"
)

var ErrNotFound = errors.New("event not found")

type EventStore interface {
    CreateEvent(event *model.Event) error
    GetEvent(id string) (*model.Event, error)
    ListEvents(calendarID string, start, end time.Time) ([]*model.Event, error)
    UpdateEvent(event *model.Event) error
    DeleteEvent(id string) error
    CreateCalendar(cal *model.Calendar) error
    ListCalendars(userID string) ([]*model.Calendar, error)
}

type InMemoryEventStore struct {
    mu        sync.RWMutex
    events    map[string]*model.Event
    calendars map[string]*model.Calendar
}

func NewInMemoryEventStore() *InMemoryEventStore {
    return &InMemoryEventStore{
        events:    make(map[string]*model.Event),
        calendars: make(map[string]*model.Calendar),
    }
}

func (s *InMemoryEventStore) CreateEvent(event *model.Event) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if event.ID == "" {
        event.ID = uuid.NewString()
    }
    event.CreatedAt = time.Now()
    event.UpdatedAt = time.Now()
    s.events[event.ID] = event
    return nil
}

func (s *InMemoryEventStore) GetEvent(id string) (*model.Event, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    e, ok := s.events[id]
    if !ok {
        return nil, ErrNotFound
    }
    return e, nil
}

func (s *InMemoryEventStore) ListEvents(calendarID string, start, end time.Time) ([]*model.Event, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    var result []*model.Event
    for _, e := range s.events {
        if e.CalendarID != calendarID {
            continue
        }
        if !e.EndTime.Before(start) && !e.StartTime.After(end) {
            result = append(result, e)
        }
    }
    return result, nil
}

func (s *InMemoryEventStore) UpdateEvent(event *model.Event) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if _, ok := s.events[event.ID]; !ok {
        return ErrNotFound
    }
    event.UpdatedAt = time.Now()
    s.events[event.ID] = event
    return nil
}

func (s *InMemoryEventStore) DeleteEvent(id string) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    delete(s.events, id)
    return nil
}

func (s *InMemoryEventStore) CreateCalendar(cal *model.Calendar) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if cal.ID == "" {
        cal.ID = uuid.NewString()
    }
    s.calendars[cal.ID] = cal
    return nil
}

func (s *InMemoryEventStore) ListCalendars(userID string) ([]*model.Calendar, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    var result []*model.Calendar
    for _, c := range s.calendars {
        if c.UserID == userID {
            result = append(result, c)
        }
    }
    return result, nil
}
