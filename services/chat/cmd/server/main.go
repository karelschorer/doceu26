package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/doceu26/chat/internal/hub"
	"github.com/doceu26/chat/internal/model"
	"github.com/doceu26/chat/internal/store"
	sharedmiddleware "github.com/doceu26/shared/pkg/middleware"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8087"
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://doceu26:0919baf639d1298ae7be3d382ec64fdd@172.18.0.5:5432/doceu26?sslmode=disable"
	}

	s, err := store.NewStore(dsn)
	if err != nil {
		log.Fatalf("store: %v", err)
	}

	h := hub.New(s)

	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "chat", "time": time.Now().UTC().Format(time.RFC3339)})
	})

	// WebSocket
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		userID := r.URL.Query().Get("user")
		userUUID := r.URL.Query().Get("uuid")
		channelID := r.URL.Query().Get("channel")
		if channelID == "" {
			http.Error(w, "missing channel", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("ws upgrade: %v", err)
			return
		}

		client := hub.NewClient(h, conn, userID, userUUID, channelID)
		go h.ServeClient(client)
	})

	// REST API: Groups
	mux.HandleFunc("/api/v1/chat/groups", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handleListGroups(w, r, s)
		case http.MethodPost:
			handleCreateGroup(w, r, s, h)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// REST API: Channels
	mux.HandleFunc("/api/v1/chat/channels", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handleListChannels(w, r, s)
		case http.MethodPost:
			handleCreateChannel(w, r, s)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// REST API: Channel by ID (delete) and messages
	mux.HandleFunc("/api/v1/chat/channels/", func(w http.ResponseWriter, r *http.Request) {
		// Parse: /api/v1/chat/channels/{id} or /api/v1/chat/channels/{id}/messages
		path := strings.TrimPrefix(r.URL.Path, "/api/v1/chat/channels/")
		parts := strings.SplitN(path, "/", 2)
		channelID := parts[0]

		if len(parts) == 2 && parts[1] == "messages" {
			handleGetMessages(w, r, s, channelID)
			return
		}

		if len(parts) == 1 && r.Method == http.MethodDelete {
			handleDeleteChannel(w, r, s, channelID)
			return
		}

		http.Error(w, "not found", http.StatusNotFound)
	})

	stack := sharedmiddleware.Logging(sharedmiddleware.Recovery(sharedmiddleware.CORS(mux)))
	log.Printf("chat service listening on :%s", port)
	if err := http.ListenAndServe(":"+port, stack); err != nil {
		log.Fatal(err)
	}
}

func handleListChannels(w http.ResponseWriter, r *http.Request, s *store.Store) {
	channels, err := s.ListChannels()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(channels)
}

func handleCreateChannel(w http.ResponseWriter, r *http.Request, s *store.Store) {
	var req struct {
		Name      string `json:"name"`
		IsPrivate bool   `json:"is_private"`
		CreatedBy string `json:"created_by"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	if req.CreatedBy == "" {
		http.Error(w, "created_by is required", http.StatusBadRequest)
		return
	}

	ch := &model.Channel{
		ID:        uuid.New().String(),
		Name:      req.Name,
		IsPrivate: req.IsPrivate,
		CreatedBy: req.CreatedBy,
		CreatedAt: time.Now().UTC(),
	}

	if err := s.CreateChannel(ch); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ch)
}

func handleDeleteChannel(w http.ResponseWriter, r *http.Request, s *store.Store, id string) {
	if err := s.DeleteChannel(id); err != nil {
		if strings.Contains(err.Error(), "cannot delete default") {
			http.Error(w, err.Error(), http.StatusForbidden)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func handleGetMessages(w http.ResponseWriter, r *http.Request, s *store.Store, channelID string) {
	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil {
			limit = v
		}
	}
	before := r.URL.Query().Get("before")

	messages, err := s.GetMessages(channelID, limit, before)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if messages == nil {
		messages = []*model.Message{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func handleListGroups(w http.ResponseWriter, r *http.Request, s *store.Store) {
	userUUID := r.URL.Query().Get("user")
	if userUUID == "" {
		http.Error(w, "user query param required", http.StatusBadRequest)
		return
	}
	groups, err := s.ListGroupsByMember(userUUID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if groups == nil {
		groups = []*model.Group{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}

func handleCreateGroup(w http.ResponseWriter, r *http.Request, s *store.Store, h *hub.Hub) {
	var req struct {
		ID          string   `json:"id"`
		Name        string   `json:"name"`
		Members     []string `json:"members"`
		MemberNames []string `json:"member_names"`
		CreatedBy   string   `json:"created_by"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if req.ID == "" || req.Name == "" || len(req.Members) < 2 || req.CreatedBy == "" {
		http.Error(w, "id, name, members (min 2), and created_by are required", http.StatusBadRequest)
		return
	}

	g := &model.Group{
		ID:          req.ID,
		Name:        req.Name,
		Members:     req.Members,
		MemberNames: req.MemberNames,
		CreatedBy:   req.CreatedBy,
		CreatedAt:   time.Now().UTC(),
	}

	if err := s.CreateGroup(g); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Notify all group members (except the creator) via WebSocket so they see the new group
	notification, err := json.Marshal(map[string]any{
		"type":  "group_created",
		"group": g,
	})
	if err != nil {
		log.Printf("marshal group_created notification: %v", err)
	} else {
		for _, memberUUID := range req.Members {
			if memberUUID != req.CreatedBy {
				h.SendToUser(memberUUID, notification)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(g)
}
