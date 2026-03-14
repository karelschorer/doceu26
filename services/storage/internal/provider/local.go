package provider

import (
    "context"
    "fmt"
    "io"
    "os"
    "path/filepath"
    "time"

    "github.com/doceu26/shared/pkg/storage"
)

// LocalProvider implements storage.Provider using the local filesystem.
type LocalProvider struct {
    basePath string
}

func NewLocalProvider(basePath string) *LocalProvider {
    return &LocalProvider{basePath: basePath}
}

func (p *LocalProvider) path(bucket, key string) string {
    return filepath.Join(p.basePath, bucket, key)
}

func (p *LocalProvider) Put(ctx context.Context, bucket, key string, reader io.Reader, size int64, contentType string) error {
    full := p.path(bucket, key)
    if err := os.MkdirAll(filepath.Dir(full), 0755); err != nil {
        return fmt.Errorf("mkdir: %w", err)
    }
    f, err := os.Create(full)
    if err != nil {
        return fmt.Errorf("create: %w", err)
    }
    defer f.Close()
    _, err = io.Copy(f, reader)
    return err
}

func (p *LocalProvider) Get(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
    return os.Open(p.path(bucket, key))
}

func (p *LocalProvider) Delete(ctx context.Context, bucket, key string) error {
    return os.Remove(p.path(bucket, key))
}

func (p *LocalProvider) List(ctx context.Context, bucket, prefix string) ([]storage.Object, error) {
    dir := filepath.Join(p.basePath, bucket, prefix)
    entries, err := os.ReadDir(dir)
    if err != nil {
        if os.IsNotExist(err) {
            return nil, nil
        }
        return nil, err
    }
    var objects []storage.Object
    for _, e := range entries {
        if e.IsDir() {
            continue
        }
        info, _ := e.Info()
        objects = append(objects, storage.Object{
            Key:          filepath.Join(prefix, e.Name()),
            ContentType:  "application/octet-stream",
            LastModified: info.ModTime(),
            Size:         info.Size(),
        })
    }
    return objects, nil
}

func (p *LocalProvider) GetSignedURL(ctx context.Context, bucket, key string, expiry time.Duration) (string, error) {
    // For local dev: return a direct path (not a real signed URL)
    return fmt.Sprintf("/files/%s/%s", bucket, key), nil
}

func (p *LocalProvider) Copy(ctx context.Context, srcBucket, srcKey, dstBucket, dstKey string) error {
    src, err := p.Get(ctx, srcBucket, srcKey)
    if err != nil {
        return err
    }
    defer src.Close()
    info, err := src.(*os.File).Stat()
    if err != nil {
        return err
    }
    return p.Put(ctx, dstBucket, dstKey, src, info.Size(), "")
}
