package handler

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
)

// sendInviteEmail sends an invite email to a new user.
// If SMTP_HOST is not set, it logs the invite details to stdout instead.
func sendInviteEmail(toEmail, displayName, tempPassword, inviteURL string) {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	smtpFrom := os.Getenv("SMTP_FROM")

	body := fmt.Sprintf(`Hello %s,

You have been invited to DocEU26 — your European workspace suite.

To get started, click the link below to set your password:

  %s

If you can't click the link, copy and paste it into your browser.

This invite link expires in 72 hours.

---
Your temporary credentials (valid until you set a new password):
  Email:    %s
  Password: %s

Welcome aboard,
The DocEU26 team
`, displayName, inviteURL, toEmail, tempPassword)

	if smtpHost == "" {
		// No SMTP configured — print invite to stdout so the admin can share it
		log.Printf("=== INVITE EMAIL (no SMTP configured) ===\nTo: %s\n%s\n=========================================\n", toEmail, body)
		return
	}

	if smtpPort == "" {
		smtpPort = "587"
	}
	if smtpFrom == "" {
		smtpFrom = smtpUser
	}

	msg := strings.Join([]string{
		"From: " + smtpFrom,
		"To: " + toEmail,
		"Subject: You're invited to DocEU26",
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		body,
	}, "\r\n")

	var auth smtp.Auth
	if smtpUser != "" && smtpPass != "" {
		auth = smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	}

	addr := smtpHost + ":" + smtpPort
	if err := smtp.SendMail(addr, auth, smtpFrom, []string{toEmail}, []byte(msg)); err != nil {
		log.Printf("failed to send invite email to %s: %v", toEmail, err)
	} else {
		log.Printf("invite email sent to %s", toEmail)
	}
}
