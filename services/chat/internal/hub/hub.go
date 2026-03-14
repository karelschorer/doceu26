package hub

import (
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/doceu26/chat/internal/model"
	"github.com/doceu26/chat/internal/store"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Client struct {
	hub       *Hub
	conn      *websocket.Conn
	send      chan []byte
	userID    string // display name (from ?user=)
	uuid      string // user UUID (from ?uuid=)
	channelID string
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]struct{} // channelID -> clients
	store   *store.Store
}

func New(s *store.Store) *Hub {
	return &Hub{
		clients: make(map[string]map[*Client]struct{}),
		store:   s,
	}
}

func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[c.channelID] == nil {
		h.clients[c.channelID] = make(map[*Client]struct{})
	}
	h.clients[c.channelID][c] = struct{}{}
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients[c.channelID], c)
}

func (h *Hub) Broadcast(channelID string, msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients[channelID] {
		select {
		case client.send <- msg:
		default:
			close(client.send)
		}
	}
}

// SendToUser sends a message to a specific user (by UUID) across ALL channels.
func (h *Hub) SendToUser(userUUID string, msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, channelClients := range h.clients {
		for client := range channelClients {
			if client.uuid == userUUID {
				select {
				case client.send <- msg:
				default:
				}
			}
		}
	}
}

func isSignalType(msgType string) bool {
	return strings.HasPrefix(msgType, "call_") || strings.HasPrefix(msgType, "ice_") || strings.HasPrefix(msgType, "screen_")
}

func (h *Hub) ServeClient(c *Client) {
	h.Register(c)
	defer h.Unregister(c)

	go func() {
		for msg := range c.send {
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				break
			}
		}
		c.conn.Close()
	}()

	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		var envelope map[string]any
		if err := json.Unmarshal(raw, &envelope); err != nil {
			log.Printf("invalid message: %v", err)
			continue
		}

		msgType, _ := envelope["type"].(string)

		// Targeted delivery: if "to" field is present, send only to that user
		if toUser, ok := envelope["to"].(string); ok && toUser != "" {
			h.SendToUser(toUser, raw)
			continue
		}

		// Persist non-signal messages
		if h.store != nil && !isSignalType(msgType) {
			content, _ := envelope["content"].(string)
			userID, _ := envelope["user_id"].(string)
			displayName, _ := envelope["user_display_name"].(string)
			channelID, _ := envelope["channel_id"].(string)
			if channelID == "" {
				channelID = c.channelID
			}
			if userID == "" {
				userID = c.uuid
			}
			if displayName == "" {
				displayName = c.userID
			}
			if msgType == "" {
				msgType = "text"
			}

			msg := &model.Message{
				ID:              uuid.New().String(),
				ChannelID:       channelID,
				UserID:          userID,
				UserDisplayName: displayName,
				Content:         content,
				Type:            msgType,
				CreatedAt:       time.Now().UTC(),
			}
			if err := h.store.SaveMessage(msg); err != nil {
				log.Printf("save message: %v", err)
			}
		}

		h.Broadcast(c.channelID, raw)
	}
}

func NewClient(hub *Hub, conn *websocket.Conn, userID, userUUID, channelID string) *Client {
	return &Client{
		hub:       hub,
		conn:      conn,
		send:      make(chan []byte, 256),
		userID:    userID,
		uuid:      userUUID,
		channelID: channelID,
	}
}
