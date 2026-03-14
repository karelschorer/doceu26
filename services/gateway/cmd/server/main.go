package main

import (
	"encoding/json"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"

	sharedmiddleware "github.com/doceu26/shared/pkg/middleware"
)

func getServiceURL(name, envKey, defaultURL string) string {
	_ = name
	if v := os.Getenv(envKey); v != "" {
		return v
	}
	return defaultURL
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	type route struct {
		prefix string
		target string
	}

	routes := []route{
		{"/api/v1/auth", getServiceURL("auth", "AUTH_SERVICE_URL", "http://localhost:8081")},
		{"/api/v1/documents", getServiceURL("document", "DOCUMENT_SERVICE_URL", "http://localhost:8082")},
		{"/api/v1/collab", getServiceURL("collab", "COLLAB_SERVICE_URL", "http://localhost:8083")},
		{"/api/v1/storage", getServiceURL("storage", "STORAGE_SERVICE_URL", "http://localhost:8084")},
		{"/api/v1/email", getServiceURL("email", "EMAIL_SERVICE_URL", "http://localhost:8085")},
		{"/api/v1/calendar", getServiceURL("calendar", "CALENDAR_SERVICE_URL", "http://localhost:8086")},
		{"/api/v1/chat", getServiceURL("chat", "CHAT_SERVICE_URL", "http://localhost:8087")},
		{"/api/v1/search", getServiceURL("search", "SEARCH_SERVICE_URL", "http://localhost:8089")},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"service": "gateway",
			"time":    time.Now().UTC().Format(time.RFC3339),
		})
	})

	for _, rt := range routes {
		u, err := url.Parse(rt.target)
		if err != nil {
			log.Printf("invalid target %s: %v", rt.target, err)
			continue
		}
		proxy := httputil.NewSingleHostReverseProxy(u)
		prefix := rt.prefix
		mux.Handle(prefix+"/", http.StripPrefix(strings.TrimSuffix(prefix, "/"), proxy))
	}

	stack := sharedmiddleware.Logging(sharedmiddleware.Recovery(sharedmiddleware.CORS(mux)))
	log.Printf("gateway listening on :%s", port)
	if err := http.ListenAndServe(":"+port, stack); err != nil {
		log.Fatal(err)
	}
}
