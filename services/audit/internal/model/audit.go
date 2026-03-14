package model

import "time"

type EventType string

const (
    EventLogin          EventType = "auth.login"
    EventLogout         EventType = "auth.logout"
    EventDocCreate      EventType = "document.create"
    EventDocRead        EventType = "document.read"
    EventDocUpdate      EventType = "document.update"
    EventDocDelete      EventType = "document.delete"
    EventDocShare       EventType = "document.share"
    EventUserCreate     EventType = "user.create"
    EventUserDelete     EventType = "user.delete"
    EventDataExport     EventType = "gdpr.export"
    EventDataErase      EventType = "gdpr.erase"
    EventPermChange     EventType = "permission.change"
)

type AuditEvent struct {
    ID         string            `json:"id"`
    Type       EventType         `json:"type"`
    UserID     string            `json:"user_id"`
    OrgID      string            `json:"org_id"`
    ResourceID string            `json:"resource_id"`
    IP         string            `json:"ip"`
    UserAgent  string            `json:"user_agent"`
    Metadata   map[string]string `json:"metadata"`
    PrevHash   string            `json:"prev_hash"`
    Hash       string            `json:"hash"`
    CreatedAt  time.Time         `json:"created_at"`
}
