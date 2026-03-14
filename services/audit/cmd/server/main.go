package main

import (
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "sync"
    "time"

    "github.com/doceu26/audit/internal/model"
    sharedmiddleware "github.com/doceu26/shared/pkg/middleware"
    "github.com/google/uuid"
)

type AuditStore struct {
    mu     sync.RWMutex
    events []*model.AuditEvent
    lastHash string
}

func (s *AuditStore) Append(event *model.AuditEvent) {
    s.mu.Lock()
    defer s.mu.Unlock()

    event.ID = uuid.NewString()
    event.CreatedAt = time.Now()
    event.PrevHash = s.lastHash

    // Hash chain: sha256(prevHash + eventID + type + userID + timestamp)
    raw := fmt.Sprintf("%s:%s:%s:%s:%d", event.PrevHash, event.ID, event.Type, event.UserID, event.CreatedAt.UnixNano())
    h := sha256.Sum256([]byte(raw))
    event.Hash = hex.EncodeToString(h[:])
    s.lastHash = event.Hash

    s.events = append(s.events, event)
}

func (s *AuditStore) List(limit int) []*model.AuditEvent {
    s.mu.RLock()
    defer s.mu.RUnlock()
    if len(s.events) <= limit {
        return s.events
    }
    return s.events[len(s.events)-limit:]
}

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8090"
    }

    store := &AuditStore{}

    mux := http.NewServeMux()
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "audit", "time": time.Now().UTC().Format(time.RFC3339)})
    })

    mux.HandleFunc("POST /api/v1/audit/events", func(w http.ResponseWriter, r *http.Request) {
        var event model.AuditEvent
        if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
            http.Error(w, "invalid body", http.StatusBadRequest)
            return
        }
        event.IP = r.RemoteAddr
        event.UserAgent = r.Header.Get("User-Agent")
        store.Append(&event)
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(event)
    })

    mux.HandleFunc("GET /api/v1/audit/events", func(w http.ResponseWriter, r *http.Request) {
        events := store.List(100)
        if events == nil {
            events = []*model.AuditEvent{}
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(events)
    })

    stack := sharedmiddleware.Logging(sharedmiddleware.Recovery(sharedmiddleware.CORS(mux)))
    log.Printf("audit service listening on :%s", port)
    if err := http.ListenAndServe(":"+port, stack); err != nil {
        log.Fatal(err)
    }
}
