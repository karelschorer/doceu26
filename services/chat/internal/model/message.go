package model

import (
	"time"

	"github.com/lib/pq"
)

type Channel struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	IsPrivate bool      `json:"is_private"`
	CreatedBy string    `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
}

type Message struct {
	ID              string    `json:"id"`
	ChannelID       string    `json:"channel_id"`
	UserID          string    `json:"user_id"`
	UserDisplayName string    `json:"user_display_name"`
	Content         string    `json:"content"`
	Type            string    `json:"type"`
	CreatedAt       time.Time `json:"created_at"`
}

type Group struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Members     pq.StringArray `json:"members"`
	MemberNames pq.StringArray `json:"member_names"`
	CreatedBy   string         `json:"created_by"`
	CreatedAt   time.Time      `json:"created_at"`
}
