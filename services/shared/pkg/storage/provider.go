package storage

import (
	"context"
	"io"
	"time"
)

type Object struct {
	Key          string
	Size         int64
	ContentType  string
	LastModified time.Time
	ETag         string
}

type Provider interface {
	Put(ctx context.Context, bucket, key string, reader io.Reader, size int64, contentType string) error
	Get(ctx context.Context, bucket, key string) (io.ReadCloser, error)
	Delete(ctx context.Context, bucket, key string) error
	List(ctx context.Context, bucket, prefix string) ([]Object, error)
	GetSignedURL(ctx context.Context, bucket, key string, expiry time.Duration) (string, error)
	Copy(ctx context.Context, srcBucket, srcKey, dstBucket, dstKey string) error
}
