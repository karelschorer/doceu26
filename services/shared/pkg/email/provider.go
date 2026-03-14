package email

import "context"

type Attachment struct {
	Filename    string
	ContentType string
	Data        []byte
}

type Message struct {
	From        string
	To          []string
	CC          []string
	BCC         []string
	Subject     string
	HTMLBody    string
	TextBody    string
	Attachments []Attachment
}

type DeliveryStatus struct {
	MessageID string
	Status    string
}

type DeliveryProvider interface {
	Send(ctx context.Context, msg Message) (string, error)
	SendBatch(ctx context.Context, msgs []Message) ([]string, error)
	CheckStatus(ctx context.Context, messageID string) (DeliveryStatus, error)
}
