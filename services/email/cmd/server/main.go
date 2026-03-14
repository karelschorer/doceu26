package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "strings"
    "time"

    "github.com/doceu26/email/internal/model"
    "github.com/doceu26/email/internal/store"
    sharedmiddleware "github.com/doceu26/shared/pkg/middleware"
    "github.com/google/uuid"
)

type Handler struct {
    store store.EmailStore
}

func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
    writeJSON(w, status, map[string]string{"error": msg})
}

func (h *Handler) listEmails(w http.ResponseWriter, r *http.Request) {
    folder := model.Folder(r.URL.Query().Get("folder"))
    if folder == "" {
        folder = model.FolderInbox
    }
    accountID := r.Header.Get("X-User-ID")
    if accountID == "" {
        accountID = "default"
    }
    emails, err := h.store.List(accountID, folder, 50, 0)
    if err != nil {
        writeError(w, http.StatusInternalServerError, err.Error())
        return
    }
    if emails == nil {
        emails = []*model.Email{}
    }
    writeJSON(w, http.StatusOK, emails)
}

func (h *Handler) getEmail(w http.ResponseWriter, r *http.Request) {
    id := strings.TrimPrefix(r.URL.Path, "/api/v1/email/")
    email, err := h.store.GetByID(id)
    if err != nil {
        writeError(w, http.StatusNotFound, "email not found")
        return
    }
    writeJSON(w, http.StatusOK, email)
}

func (h *Handler) sendEmail(w http.ResponseWriter, r *http.Request) {
    var body struct {
        To      []string `json:"to"`
        Subject string   `json:"subject"`
        Body    string   `json:"body"`
    }
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        writeError(w, http.StatusBadRequest, "invalid body")
        return
    }
    accountID := r.Header.Get("X-User-ID")
    if accountID == "" {
        accountID = "default"
    }
    sent := &model.Email{
        ID:         uuid.NewString(),
        AccountID:  accountID,
        Folder:     model.FolderSent,
        To:         body.To,
        Subject:    body.Subject,
        TextBody:   body.Body,
        IsRead:     true,
        ReceivedAt: time.Now(),
    }
    h.store.Save(sent)
    writeJSON(w, http.StatusCreated, sent)
}

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8085"
    }

    h := &Handler{store: store.NewInMemoryEmailStore()}

    mux := http.NewServeMux()
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "email", "time": time.Now().UTC().Format(time.RFC3339)})
    })
    mux.HandleFunc("GET /api/v1/email", h.listEmails)
    mux.HandleFunc("GET /api/v1/email/", h.getEmail)
    mux.HandleFunc("POST /api/v1/email/send", h.sendEmail)

    stack := sharedmiddleware.Logging(sharedmiddleware.Recovery(sharedmiddleware.CORS(mux)))
    log.Printf("email service listening on :%s", port)
    if err := http.ListenAndServe(":"+port, stack); err != nil {
        log.Fatal(err)
    }
}
