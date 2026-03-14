package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "strings"
    "time"

    "github.com/doceu26/document/internal/model"
    "github.com/doceu26/document/internal/store"
    sharedmiddleware "github.com/doceu26/shared/pkg/middleware"
)

type Handler struct {
    store store.DocumentStore
}

func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
    writeJSON(w, status, map[string]string{"error": msg})
}

func (h *Handler) createDocument(w http.ResponseWriter, r *http.Request) {
    var body struct {
        Title string `json:"title"`
        Type  string `json:"type"`
    }
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        writeError(w, http.StatusBadRequest, "invalid body")
        return
    }
    ownerID := r.Header.Get("X-User-ID")
    if ownerID == "" {
        ownerID = "anonymous"
    }
    docType := model.DocumentType(body.Type)
    if docType == "" {
        docType = model.DocumentTypeDoc
    }
    doc, err := h.store.Create(ownerID, body.Title, docType)
    if err != nil {
        writeError(w, http.StatusInternalServerError, err.Error())
        return
    }
    writeJSON(w, http.StatusCreated, doc)
}

func (h *Handler) getDocument(w http.ResponseWriter, r *http.Request) {
    id := strings.TrimPrefix(r.URL.Path, "/api/v1/documents/")
    doc, err := h.store.GetByID(id)
    if err != nil {
        writeError(w, http.StatusNotFound, "document not found")
        return
    }
    writeJSON(w, http.StatusOK, doc)
}

func (h *Handler) listDocuments(w http.ResponseWriter, r *http.Request) {
    ownerID := r.Header.Get("X-User-ID")
    if ownerID == "" {
        ownerID = "anonymous"
    }
    docs, err := h.store.ListByOwner(ownerID)
    if err != nil {
        writeError(w, http.StatusInternalServerError, err.Error())
        return
    }
    if docs == nil {
        docs = []*model.Document{}
    }
    writeJSON(w, http.StatusOK, docs)
}

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8082"
    }

    h := &Handler{store: store.NewInMemoryDocumentStore()}

    mux := http.NewServeMux()
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "document", "time": time.Now().UTC().Format(time.RFC3339)})
    })
    mux.HandleFunc("POST /api/v1/documents", h.createDocument)
    mux.HandleFunc("GET /api/v1/documents", h.listDocuments)
    mux.HandleFunc("GET /api/v1/documents/", h.getDocument)

    stack := sharedmiddleware.Logging(sharedmiddleware.Recovery(sharedmiddleware.CORS(mux)))
    log.Printf("document service listening on :%s", port)
    if err := http.ListenAndServe(":"+port, stack); err != nil {
        log.Fatal(err)
    }
}
