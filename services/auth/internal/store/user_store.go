package store

import (
	"errors"
	"sync"

	"github.com/doceu26/auth/internal/model"
)

var ErrNotFound = errors.New("user not found")
var ErrEmailTaken = errors.New("email already taken")

type UserStore interface {
	Create(user *model.User) error
	GetByID(id string) (*model.User, error)
	GetByEmail(email string) (*model.User, error)
	List() ([]*model.User, error)
	Update(user *model.User) error
}

type InMemoryUserStore struct {
	mu      sync.RWMutex
	byID    map[string]*model.User
	byEmail map[string]*model.User
}

func NewInMemoryUserStore() *InMemoryUserStore {
	return &InMemoryUserStore{
		byID:    make(map[string]*model.User),
		byEmail: make(map[string]*model.User),
	}
}

func (s *InMemoryUserStore) Create(user *model.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.byEmail[user.Email]; exists {
		return ErrEmailTaken
	}
	s.byID[user.ID] = user
	s.byEmail[user.Email] = user
	return nil
}

func (s *InMemoryUserStore) GetByID(id string) (*model.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u, ok := s.byID[id]
	if !ok {
		return nil, ErrNotFound
	}
	return u, nil
}

func (s *InMemoryUserStore) GetByEmail(email string) (*model.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u, ok := s.byEmail[email]
	if !ok {
		return nil, ErrNotFound
	}
	return u, nil
}

func (s *InMemoryUserStore) List() ([]*model.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	users := make([]*model.User, 0, len(s.byID))
	for _, u := range s.byID {
		users = append(users, u)
	}
	return users, nil
}

func (s *InMemoryUserStore) Update(user *model.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	existing, ok := s.byID[user.ID]
	if !ok {
		return ErrNotFound
	}
	if existing.Email != user.Email {
		delete(s.byEmail, existing.Email)
	}
	s.byID[user.ID] = user
	s.byEmail[user.Email] = user
	return nil
}
