package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/doceu26/auth/internal/model"
	"github.com/doceu26/auth/internal/store"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid credentials")

type Claims struct {
	UserID string     `json:"user_id"`
	Role   model.Role `json:"role"`
	OrgID  string     `json:"org_id"`
	jwt.RegisteredClaims
}

type AuthService struct {
	store     store.UserStore
	jwtSecret []byte
}

func NewAuthService(store store.UserStore, jwtSecret string) *AuthService {
	if jwtSecret == "" {
		jwtSecret = "dev-secret-change-in-production"
	}
	return &AuthService{store: store, jwtSecret: []byte(jwtSecret)}
}

func (s *AuthService) Register(email, displayName, password string) (*model.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hashing password: %w", err)
	}
	user := &model.User{
		ID:           uuid.NewString(),
		Email:        email,
		DisplayName:  displayName,
		PasswordHash: string(hash),
		Role:         model.RoleMember,
		Active:       true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if err := s.store.Create(user); err != nil {
		return nil, err
	}
	return user, nil
}

// AdminCreateUser creates a user with a generated temporary password and returns it.
func (s *AuthService) AdminCreateUser(email, displayName string, role model.Role) (*model.User, string, error) {
	tempPassword := fmt.Sprintf("Temp%s!", uuid.NewString()[:8])
	hash, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", fmt.Errorf("hashing password: %w", err)
	}
	user := &model.User{
		ID:           uuid.NewString(),
		Email:        email,
		DisplayName:  displayName,
		PasswordHash: string(hash),
		Role:         role,
		Active:       true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if err := s.store.Create(user); err != nil {
		return nil, "", err
	}
	return user, tempPassword, nil
}

func (s *AuthService) ListUsers() ([]*model.User, error) {
	return s.store.List()
}

func (s *AuthService) UpdateUserRole(id string, role model.Role) (*model.User, error) {
	user, err := s.store.GetByID(id)
	if err != nil {
		return nil, err
	}
	user.Role = role
	user.UpdatedAt = time.Now()
	return user, s.store.Update(user)
}

func (s *AuthService) SetUserActive(id string, active bool) (*model.User, error) {
	user, err := s.store.GetByID(id)
	if err != nil {
		return nil, err
	}
	user.Active = active
	user.UpdatedAt = time.Now()
	return user, s.store.Update(user)
}

// CreateInviteToken returns a signed JWT that can be used once to set a password.
func (s *AuthService) CreateInviteToken(userID string) (string, error) {
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
			Audience:  jwt.ClaimStrings{"invite"},
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.jwtSecret)
}

// AcceptInvite validates an invite token and sets a new password for the user.
func (s *AuthService) AcceptInvite(tokenStr, newPassword string) (*model.User, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return s.jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired invite token")
	}
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("malformed claims")
	}
	user, err := s.store.GetByID(claims.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user.PasswordHash = string(hash)
	user.UpdatedAt = time.Now()
	return user, s.store.Update(user)
}

func (s *AuthService) Login(email, password string) (accessToken, refreshToken string, user *model.User, err error) {
	user, err = s.store.GetByEmail(email)
	if err != nil {
		return "", "", nil, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", nil, ErrInvalidCredentials
	}
	accessToken, err = s.issueToken(user, 15*time.Minute)
	if err != nil {
		return "", "", nil, err
	}
	refreshToken, err = s.issueToken(user, 7*24*time.Hour)
	return accessToken, refreshToken, user, err
}

func (s *AuthService) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func (s *AuthService) issueToken(user *model.User, duration time.Duration) (string, error) {
	claims := &Claims{
		UserID: user.ID,
		Role:   user.Role,
		OrgID:  user.OrgID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID,
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.jwtSecret)
}
