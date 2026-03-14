package config

import "os"

// Get returns the value of an environment variable, or a default if not set.
func Get(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}
