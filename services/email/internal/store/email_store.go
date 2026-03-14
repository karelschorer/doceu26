package store

import (
    "errors"
    "sync"

    "github.com/doceu26/email/internal/model"
)

var ErrNotFound = errors.New("email not found")

type EmailStore interface {
    Save(email *model.Email) error
    GetByID(id string) (*model.Email, error)
    List(accountID string, folder model.Folder, limit, offset int) ([]*model.Email, error)
    MarkRead(id string, read bool) error
    MarkStarred(id string, starred bool) error
    Move(id string, folder model.Folder) error
    Delete(id string) error
}

type InMemoryEmailStore struct {
    mu     sync.RWMutex
    emails map[string]*model.Email
}

func NewInMemoryEmailStore() *InMemoryEmailStore {
    return &InMemoryEmailStore{emails: make(map[string]*model.Email)}
}

func (s *InMemoryEmailStore) Save(email *model.Email) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.emails[email.ID] = email
    return nil
}

func (s *InMemoryEmailStore) GetByID(id string) (*model.Email, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    e, ok := s.emails[id]
    if !ok {
        return nil, ErrNotFound
    }
    return e, nil
}

func (s *InMemoryEmailStore) List(accountID string, folder model.Folder, limit, offset int) ([]*model.Email, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    var result []*model.Email
    for _, e := range s.emails {
        if e.AccountID == accountID && (folder == "" || e.Folder == folder) {
            result = append(result, e)
        }
    }
    if offset >= len(result) {
        return nil, nil
    }
    end := offset + limit
    if end > len(result) {
        end = len(result)
    }
    return result[offset:end], nil
}

func (s *InMemoryEmailStore) MarkRead(id string, read bool) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if e, ok := s.emails[id]; ok {
        e.IsRead = read
    }
    return nil
}

func (s *InMemoryEmailStore) MarkStarred(id string, starred bool) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if e, ok := s.emails[id]; ok {
        e.IsStarred = starred
    }
    return nil
}

func (s *InMemoryEmailStore) Move(id string, folder model.Folder) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if e, ok := s.emails[id]; ok {
        e.Folder = folder
    }
    return nil
}

func (s *InMemoryEmailStore) Delete(id string) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    delete(s.emails, id)
    return nil
}
