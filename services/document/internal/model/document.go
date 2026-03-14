package model

import "time"

type DocumentType string

const (
    DocumentTypeDoc   DocumentType = "doc"
    DocumentTypeSheet DocumentType = "sheet"
    DocumentTypeSlide DocumentType = "slide"
)

type Permission string

const (
    PermissionOwner  Permission = "owner"
    PermissionEditor Permission = "editor"
    PermissionViewer Permission = "viewer"
)

type Document struct {
    ID          string       `json:"id"`
    Title       string       `json:"title"`
    Type        DocumentType `json:"type"`
    OwnerID     string       `json:"owner_id"`
    Content     []byte       `json:"content,omitempty"`
    Version     int64        `json:"version"`
    CreatedAt   time.Time    `json:"created_at"`
    UpdatedAt   time.Time    `json:"updated_at"`
}

type DocumentShare struct {
    DocumentID string     `json:"document_id"`
    UserID     string     `json:"user_id"`
    Permission Permission `json:"permission"`
    CreatedAt  time.Time  `json:"created_at"`
}

type DocumentVersion struct {
    DocumentID string    `json:"document_id"`
    Version    int64     `json:"version"`
    Content    []byte    `json:"content"`
    UserID     string    `json:"user_id"`
    CreatedAt  time.Time `json:"created_at"`
}
