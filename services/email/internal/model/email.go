package model

import "time"

type Folder string

const (
    FolderInbox   Folder = "INBOX"
    FolderSent    Folder = "Sent"
    FolderDrafts  Folder = "Drafts"
    FolderTrash   Folder = "Trash"
    FolderArchive Folder = "Archive"
)

type Email struct {
    ID          string    `json:"id"`
    AccountID   string    `json:"account_id"`
    Folder      Folder    `json:"folder"`
    MessageID   string    `json:"message_id"`
    From        string    `json:"from"`
    To          []string  `json:"to"`
    CC          []string  `json:"cc"`
    Subject     string    `json:"subject"`
    TextBody    string    `json:"text_body"`
    HTMLBody    string    `json:"html_body"`
    IsRead      bool      `json:"is_read"`
    IsStarred   bool      `json:"is_starred"`
    HasAttachment bool    `json:"has_attachment"`
    ReceivedAt  time.Time `json:"received_at"`
}

type EmailAccount struct {
    ID           string `json:"id"`
    UserID       string `json:"user_id"`
    Email        string `json:"email"`
    IMAPHost     string `json:"imap_host"`
    IMAPPort     int    `json:"imap_port"`
    SMTPHost     string `json:"smtp_host"`
    SMTPPort     int    `json:"smtp_port"`
    Username     string `json:"username"`
}
