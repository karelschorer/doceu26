package model

import "time"

type EventStatus string

const (
    EventStatusConfirmed EventStatus = "confirmed"
    EventStatusTentative EventStatus = "tentative"
    EventStatusCancelled EventStatus = "cancelled"
)

type RSVPStatus string

const (
    RSVPAccepted  RSVPStatus = "accepted"
    RSVPDeclined  RSVPStatus = "declined"
    RSVPTentative RSVPStatus = "tentative"
    RSVPNeedsAction RSVPStatus = "needs-action"
)

type Attendee struct {
    Email  string     `json:"email"`
    Name   string     `json:"name"`
    Status RSVPStatus `json:"status"`
}

type Event struct {
    ID          string      `json:"id"`
    CalendarID  string      `json:"calendar_id"`
    Title       string      `json:"title"`
    Description string      `json:"description"`
    Location    string      `json:"location"`
    StartTime   time.Time   `json:"start_time"`
    EndTime     time.Time   `json:"end_time"`
    AllDay      bool        `json:"all_day"`
    Status      EventStatus `json:"status"`
    OrganizerID string      `json:"organizer_id"`
    Attendees   []Attendee  `json:"attendees"`
    Recurrence  string      `json:"recurrence"` // RRULE string
    CreatedAt   time.Time   `json:"created_at"`
    UpdatedAt   time.Time   `json:"updated_at"`
}

type Calendar struct {
    ID      string `json:"id"`
    UserID  string `json:"user_id"`
    Name    string `json:"name"`
    Color   string `json:"color"`
    Primary bool   `json:"primary"`
}
