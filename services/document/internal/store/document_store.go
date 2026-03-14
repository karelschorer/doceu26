package store

import (
    "errors"
    "sync"
    "time"

    "github.com/doceu26/document/internal/model"
    "github.com/google/uuid"
)

var ErrNotFound = errors.New("document not found")
var ErrForbidden = errors.New("forbidden")

type DocumentStore interface {
    Create(ownerID, title string, docType model.DocumentType) (*model.Document, error)
    GetByID(id string) (*model.Document, error)
    ListByOwner(ownerID string) ([]*model.Document, error)
    Update(id string, title string, content []byte) (*model.Document, error)
    Delete(id string) error
    AddShare(docID, userID string, perm model.Permission) error
    GetShares(docID string) ([]*model.DocumentShare, error)
}

type InMemoryDocumentStore struct {
    mu    sync.RWMutex
    docs  map[string]*model.Document
    shares map[string][]*model.DocumentShare
}

func NewInMemoryDocumentStore() *InMemoryDocumentStore {
    return &InMemoryDocumentStore{
        docs:   make(map[string]*model.Document),
        shares: make(map[string][]*model.DocumentShare),
    }
}

func (s *InMemoryDocumentStore) Create(ownerID, title string, docType model.DocumentType) (*model.Document, error) {
    s.mu.Lock()
    defer s.mu.Unlock()
    doc := &model.Document{
        ID:        uuid.NewString(),
        Title:     title,
        Type:      docType,
        OwnerID:   ownerID,
        Version:   1,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    s.docs[doc.ID] = doc
    return doc, nil
}

func (s *InMemoryDocumentStore) GetByID(id string) (*model.Document, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    doc, ok := s.docs[id]
    if !ok {
        return nil, ErrNotFound
    }
    return doc, nil
}

func (s *InMemoryDocumentStore) ListByOwner(ownerID string) ([]*model.Document, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    var result []*model.Document
    for _, doc := range s.docs {
        if doc.OwnerID == ownerID {
            result = append(result, doc)
        }
    }
    return result, nil
}

func (s *InMemoryDocumentStore) Update(id string, title string, content []byte) (*model.Document, error) {
    s.mu.Lock()
    defer s.mu.Unlock()
    doc, ok := s.docs[id]
    if !ok {
        return nil, ErrNotFound
    }
    if title != "" {
        doc.Title = title
    }
    if content != nil {
        doc.Content = content
    }
    doc.Version++
    doc.UpdatedAt = time.Now()
    return doc, nil
}

func (s *InMemoryDocumentStore) Delete(id string) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if _, ok := s.docs[id]; !ok {
        return ErrNotFound
    }
    delete(s.docs, id)
    return nil
}

func (s *InMemoryDocumentStore) AddShare(docID, userID string, perm model.Permission) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    share := &model.DocumentShare{
        DocumentID: docID,
        UserID:     userID,
        Permission: perm,
        CreatedAt:  time.Now(),
    }
    s.shares[docID] = append(s.shares[docID], share)
    return nil
}

func (s *InMemoryDocumentStore) GetShares(docID string) ([]*model.DocumentShare, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.shares[docID], nil
}
