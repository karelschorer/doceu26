package service

import (
	"time"

	"github.com/doceu26/auth/internal/model"
)

// IssueTokenPair issues a new access token and refresh token for an existing user.
// It is used by the refresh endpoint to rotate tokens without re-validating credentials.
func (s *AuthService) IssueTokenPair(user *model.User) (accessToken, refreshToken string, u *model.User, err error) {
	accessToken, err = s.issueToken(user, 15*time.Minute)
	if err != nil {
		return "", "", nil, err
	}
	refreshToken, err = s.issueToken(user, 7*24*time.Hour)
	if err != nil {
		return "", "", nil, err
	}
	return accessToken, refreshToken, user, nil
}
