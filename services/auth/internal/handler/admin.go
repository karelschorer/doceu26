package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/doceu26/auth/internal/model"
	"github.com/doceu26/auth/internal/store"
)

// AdminListUsers GET /api/v1/admin/users
func (h *Handler) AdminListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.svc.ListUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list users")
		return
	}
	writeJSON(w, http.StatusOK, users)
}

// AdminCreateUser POST /api/v1/admin/users
func (h *Handler) AdminCreateUser(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email       string     `json:"email"`
		DisplayName string     `json:"display_name"`
		Role        model.Role `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Email == "" || body.DisplayName == "" {
		writeError(w, http.StatusBadRequest, "email and display_name are required")
		return
	}
	if body.Role == "" {
		body.Role = model.RoleMember
	}
	user, tempPassword, err := h.svc.AdminCreateUser(body.Email, body.DisplayName, body.Role)
	if err != nil {
		if errors.Is(err, store.ErrEmailTaken) {
			writeError(w, http.StatusConflict, "email already taken")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not create user")
		return
	}

	inviteToken, err := h.svc.CreateInviteToken(user.ID)
	if err != nil {
		// Non-fatal: still create the user, just skip the invite link
		inviteToken = ""
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = fmt.Sprintf("http://%s", r.Host)
	}
	signupURL := ""
	if inviteToken != "" {
		signupURL = fmt.Sprintf("%s/accept-invite?token=%s", appURL, inviteToken)
		go sendInviteEmail(body.Email, body.DisplayName, tempPassword, signupURL)
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"user":          user,
		"temp_password": tempPassword,
		"signup_url":    signupURL,
	})
}

// AdminUpdateUser PATCH /api/v1/admin/users/{id}
func (h *Handler) AdminUpdateUser(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/admin/users/")
	if id == "" {
		writeError(w, http.StatusBadRequest, "user id required")
		return
	}

	var body struct {
		Role   *model.Role `json:"role"`
		Active *bool       `json:"active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var user *model.User
	var err error

	if body.Role != nil {
		user, err = h.svc.UpdateUserRole(id, *body.Role)
		if err != nil {
			writeError(w, http.StatusNotFound, "user not found")
			return
		}
	}
	if body.Active != nil {
		user, err = h.svc.SetUserActive(id, *body.Active)
		if err != nil {
			writeError(w, http.StatusNotFound, "user not found")
			return
		}
	}
	if user == nil {
		writeError(w, http.StatusBadRequest, "no changes specified")
		return
	}
	writeJSON(w, http.StatusOK, user)
}

// AcceptInvite POST /api/v1/auth/accept-invite
// Body: { "token": "<invite_jwt>", "password": "<new_password>" }
func (h *Handler) AcceptInvite(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Token == "" || body.Password == "" {
		writeError(w, http.StatusBadRequest, "token and password are required")
		return
	}
	if len(body.Password) < 8 {
		writeError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}
	user, err := h.svc.AcceptInvite(body.Token, body.Password)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"message": "password set successfully", "user": user})
}
