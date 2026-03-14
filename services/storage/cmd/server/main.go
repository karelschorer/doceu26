package main

import (
    "encoding/json"
    "io"
    "log"
    "net/http"
    "os"
    "strings"
    "time"

    "github.com/doceu26/storage/internal/provider"
    sharedmiddleware "github.com/doceu26/shared/pkg/middleware"
    "github.com/google/uuid"
)

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8084"
    }

    basePath := os.Getenv("STORAGE_BASE_PATH")
    if basePath == "" {
        basePath = "/tmp/doceu26-storage"
    }

    p := provider.NewLocalProvider(basePath)

    mux := http.NewServeMux()

    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "storage", "time": time.Now().UTC().Format(time.RFC3339)})
    })

    // Upload: POST /api/v1/storage/{bucket}/{key}
    mux.HandleFunc("/api/v1/storage/", func(w http.ResponseWriter, r *http.Request) {
        parts := strings.SplitN(strings.TrimPrefix(r.URL.Path, "/api/v1/storage/"), "/", 2)
        if len(parts) < 2 {
            http.Error(w, "invalid path", http.StatusBadRequest)
            return
        }
        bucket, key := parts[0], parts[1]

        switch r.Method {
        case http.MethodPut, http.MethodPost:
            if key == "" {
                key = uuid.NewString()
            }
            err := p.Put(r.Context(), bucket, key, r.Body, r.ContentLength, r.Header.Get("Content-Type"))
            if err != nil {
                http.Error(w, err.Error(), http.StatusInternalServerError)
                return
            }
            w.Header().Set("Content-Type", "application/json")
            json.NewEncoder(w).Encode(map[string]string{"bucket": bucket, "key": key})

        case http.MethodGet:
            rc, err := p.Get(r.Context(), bucket, key)
            if err != nil {
                http.Error(w, "not found", http.StatusNotFound)
                return
            }
            defer rc.Close()
            io.Copy(w, rc)

        case http.MethodDelete:
            if err := p.Delete(r.Context(), bucket, key); err != nil {
                http.Error(w, err.Error(), http.StatusInternalServerError)
                return
            }
            w.WriteHeader(http.StatusNoContent)

        default:
            http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
        }
    })

    stack := sharedmiddleware.Logging(sharedmiddleware.Recovery(sharedmiddleware.CORS(mux)))
    log.Printf("storage service listening on :%s", port)
    if err := http.ListenAndServe(":"+port, stack); err != nil {
        log.Fatal(err)
    }
}
