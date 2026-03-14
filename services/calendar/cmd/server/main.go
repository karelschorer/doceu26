package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "time"

    "github.com/doceu26/calendar/internal/model"
    "github.com/doceu26/calendar/internal/store"
    sharedmiddleware "github.com/doceu26/shared/pkg/middleware"
)

type Handler struct {
    store store.EventStore
}

func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
    writeJSON(w, status, map[string]string{"error": msg})
}

func (h *Handler) createEvent(w http.ResponseWriter, r *http.Request) {
    var event model.Event
    if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
        writeError(w, http.StatusBadRequest, "invalid body")
        return
    }
    event.OrganizerID = r.Header.Get("X-User-ID")
    if err := h.store.CreateEvent(&event); err != nil {
        writeError(w, http.StatusInternalServerError, err.Error())
        return
    }
    writeJSON(w, http.StatusCreated, event)
}

func (h *Handler) listEvents(w http.ResponseWriter, r *http.Request) {
    calendarID := r.URL.Query().Get("calendar_id")
    startStr := r.URL.Query().Get("start")
    endStr := r.URL.Query().Get("end")

    start := time.Now().AddDate(0, -1, 0)
    end := time.Now().AddDate(0, 1, 0)

    if startStr != "" {
        if t, err := time.Parse(time.RFC3339, startStr); err == nil {
            start = t
        }
    }
    if endStr != "" {
        if t, err := time.Parse(time.RFC3339, endStr); err == nil {
            end = t
        }
    }

    events, err := h.store.ListEvents(calendarID, start, end)
    if err != nil {
        writeError(w, http.StatusInternalServerError, err.Error())
        return
    }
    if events == nil {
        events = []*model.Event{}
    }
    writeJSON(w, http.StatusOK, events)
}

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8086"
    }

    h := &Handler{store: store.NewInMemoryEventStore()}

    mux := http.NewServeMux()
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "calendar", "time": time.Now().UTC().Format(time.RFC3339)})
    })
    mux.HandleFunc("POST /api/v1/calendar/events", h.createEvent)
    mux.HandleFunc("GET /api/v1/calendar/events", h.listEvents)

    stack := sharedmiddleware.Logging(sharedmiddleware.Recovery(sharedmiddleware.CORS(mux)))
    log.Printf("calendar service listening on :%s", port)
    if err := http.ListenAndServe(":"+port, stack); err != nil {
        log.Fatal(err)
    }
}
