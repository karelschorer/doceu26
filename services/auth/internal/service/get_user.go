package service

import "github.com/doceu26/auth/internal/model"

func (s *AuthService) GetUser(id string) (*model.User, error) {
	return s.store.GetByID(id)
}
