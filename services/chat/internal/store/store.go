package store

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/doceu26/chat/internal/model"
	_ "github.com/lib/pq"
)

const migrations = `
CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_private BOOLEAN DEFAULT FALSE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_display_name TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop legacy FK constraint if it exists so DM/group channel IDs are accepted
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_channel_id_fkey;

CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON messages(channel_id, created_at);

CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    members TEXT[] NOT NULL,
    member_names TEXT[] NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO channels (id, name, is_private, created_by) VALUES
  ('general', 'general', false, 'system'),
  ('random', 'random', false, 'system'),
  ('dev', 'dev', false, 'system'),
  ('design', 'design', false, 'system'),
  ('announcements', 'announcements', false, 'system')
ON CONFLICT (id) DO NOTHING;
`

type Store struct {
	db *sql.DB
}

func NewStore(dsn string) (*Store, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	if _, err := db.Exec(migrations); err != nil {
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	return &Store{db: db}, nil
}

func (s *Store) SaveMessage(msg *model.Message) error {
	_, err := s.db.Exec(
		`INSERT INTO messages (id, channel_id, user_id, user_display_name, content, type, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		msg.ID, msg.ChannelID, msg.UserID, msg.UserDisplayName, msg.Content, msg.Type, msg.CreatedAt,
	)
	return err
}

func (s *Store) GetMessages(channelID string, limit int, before string) ([]*model.Message, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}

	var rows *sql.Rows
	var err error

	if before == "" {
		rows, err = s.db.Query(
			`SELECT id, channel_id, user_id, user_display_name, content, type, created_at
			 FROM messages WHERE channel_id = $1
			 ORDER BY created_at DESC LIMIT $2`,
			channelID, limit,
		)
	} else {
		rows, err = s.db.Query(
			`SELECT m.id, m.channel_id, m.user_id, m.user_display_name, m.content, m.type, m.created_at
			 FROM messages m
			 WHERE m.channel_id = $1
			   AND m.created_at < (SELECT created_at FROM messages WHERE id = $2)
			 ORDER BY m.created_at DESC LIMIT $3`,
			channelID, before, limit,
		)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*model.Message
	for rows.Next() {
		m := &model.Message{}
		if err := rows.Scan(&m.ID, &m.ChannelID, &m.UserID, &m.UserDisplayName, &m.Content, &m.Type, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}

	// Reverse so oldest first
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, rows.Err()
}

func (s *Store) CreateChannel(ch *model.Channel) error {
	_, err := s.db.Exec(
		`INSERT INTO channels (id, name, is_private, created_by, created_at)
		 VALUES ($1, $2, $3, $4, $5)`,
		ch.ID, ch.Name, ch.IsPrivate, ch.CreatedBy, ch.CreatedAt,
	)
	return err
}

func (s *Store) ListChannels() ([]*model.Channel, error) {
	rows, err := s.db.Query(
		`SELECT id, name, is_private, created_by, created_at FROM channels ORDER BY created_at`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var channels []*model.Channel
	for rows.Next() {
		c := &model.Channel{}
		if err := rows.Scan(&c.ID, &c.Name, &c.IsPrivate, &c.CreatedBy, &c.CreatedAt); err != nil {
			return nil, err
		}
		channels = append(channels, c)
	}
	return channels, rows.Err()
}

var defaultChannels = map[string]bool{
	"general":       true,
	"random":        true,
	"dev":           true,
	"design":        true,
	"announcements": true,
}

func (s *Store) DeleteChannel(id string) error {
	if defaultChannels[id] {
		return fmt.Errorf("cannot delete default channel %q", id)
	}
	_, err := s.db.Exec(`DELETE FROM channels WHERE id = $1`, id)
	return err
}

func (s *Store) CreateGroup(g *model.Group) error {
	_, err := s.db.Exec(
		`INSERT INTO groups (id, name, members, member_names, created_by, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (id) DO NOTHING`,
		g.ID, g.Name, g.Members, g.MemberNames, g.CreatedBy, g.CreatedAt,
	)
	return err
}

func (s *Store) ListGroupsByMember(userUUID string) ([]*model.Group, error) {
	rows, err := s.db.Query(
		`SELECT id, name, members, member_names, created_by, created_at
		 FROM groups WHERE $1 = ANY(members) ORDER BY created_at`,
		userUUID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []*model.Group
	for rows.Next() {
		g := &model.Group{}
		if err := rows.Scan(&g.ID, &g.Name, &g.Members, &g.MemberNames, &g.CreatedBy, &g.CreatedAt); err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, rows.Err()
}
