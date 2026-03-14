package kms

import "context"

type KeyManager interface {
	CreateKey(ctx context.Context, keyID string) error
	Encrypt(ctx context.Context, keyID string, plaintext []byte) ([]byte, error)
	Decrypt(ctx context.Context, keyID string, ciphertext []byte) ([]byte, error)
	RotateKey(ctx context.Context, keyID string) error
}
