package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/doceu26/auth/internal/handler"
	"github.com/doceu26/auth/internal/service"
	"github.com/doceu26/auth/internal/store"
	sharedmiddleware "github.com/doceu26/shared/pkg/middleware"
)

func seedDefaultUsers(authSvc *service.AuthService) {
	seeds := []struct {
		email, displayName, password string
		role                         string
	}{
		{"karel@doceu26.eu", "Karel Schorer", "DocEU26!", "admin"},
		{"demo@doceu26.eu", "Demo User", "DocEU26!", "member"},
	}
	for _, s := range seeds {
		u, err := authSvc.Register(s.email, s.displayName, s.password)
		if err != nil {
			log.Printf("seed: skipping %s (%v)", s.email, err)
			continue
		}
		if s.role == "admin" {
			authSvc.UpdateUserRole(u.ID, "admin")
		}
		log.Printf("seed: created user %s (%s)", s.displayName, s.email)
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	userStore := store.NewInMemoryUserStore()
	authService := service.NewAuthService(userStore, os.Getenv("JWT_SECRET"))
	seedDefaultUsers(authService)
	h := handler.NewHandler(authService)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "auth", "time": time.Now().UTC().Format(time.RFC3339)})
	})
	mux.HandleFunc("POST /api/v1/auth/register", h.Register)
	mux.HandleFunc("POST /api/v1/auth/login", h.Login)
	mux.HandleFunc("POST /api/v1/auth/refresh", h.Refresh)
	mux.HandleFunc("GET /api/v1/auth/me", h.Me)
	mux.HandleFunc("POST /api/v1/auth/accept-invite", h.AcceptInvite)

	// Admin endpoints (production: add auth middleware to restrict to admins)
	mux.HandleFunc("GET /api/v1/admin/users", h.AdminListUsers)
	mux.HandleFunc("POST /api/v1/admin/users", h.AdminCreateUser)
	mux.HandleFunc("PATCH /api/v1/admin/users/", h.AdminUpdateUser)

	stack := sharedmiddleware.Logging(sharedmiddleware.Recovery(sharedmiddleware.CORS(mux)))

	log.Printf("auth service listening on :%s", port)
	if err := http.ListenAndServe(":"+port, stack); err != nil {
		log.Fatal(err)
	}
}
