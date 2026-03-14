module github.com/doceu26/auth

go 1.24

require (
	github.com/doceu26/shared v0.0.0
	github.com/golang-jwt/jwt/v5 v5.2.1
	github.com/google/uuid v1.6.0
	golang.org/x/crypto v0.31.0
)

replace github.com/doceu26/shared => ../shared
