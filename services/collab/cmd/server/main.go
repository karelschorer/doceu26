package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	sharedmiddleware "github.com/doceu26/shared/pkg/middleware"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Room struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]string // conn -> clientID
}

var (
	roomsMu sync.RWMutex
	rooms   = make(map[string]*Room)
)

func getRoom(docID string) *Room {
	roomsMu.Lock()
	defer roomsMu.Unlock()
	if r, ok := rooms[docID]; ok {
		return r
	}
	r := &Room{clients: make(map[*websocket.Conn]string)}
	rooms[docID] = r
	return r
}

func handleWS(w http.ResponseWriter, r *http.Request) {
	docID := r.URL.Query().Get("doc")
	if docID == "" {
		http.Error(w, "missing doc query param", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	room := getRoom(docID)
	room.mu.Lock()
	room.clients[conn] = r.URL.Query().Get("client")
	room.mu.Unlock()

	defer func() {
		room.mu.Lock()
		delete(room.clients, conn)
		room.mu.Unlock()
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		// Broadcast to all other clients in the room
		room.mu.RLock()
		for client := range room.clients {
			if client != conn {
				client.WriteMessage(websocket.BinaryMessage, msg)
			}
		}
		room.mu.RUnlock()
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "collab", "time": time.Now().UTC().Format(time.RFC3339)})
	})
	mux.HandleFunc("/ws", handleWS)

	stack := sharedmiddleware.Logging(sharedmiddleware.Recovery(mux))
	log.Printf("collab service listening on :%s", port)
	if err := http.ListenAndServe(":"+port, stack); err != nil {
		log.Fatal(err)
	}
}
