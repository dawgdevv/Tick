APP_NAME := tick
BIN_DIR := bin

.PHONY: help deps web-build sync-webdist build run dev clean

help:
	@echo "Available commands:"
	@echo "  make deps      Install frontend dependencies"
	@echo "  make web-build Build frontend assets"
	@echo "  make build     Build frontend + Go binary"
	@echo "  make run       Run the app (production build)"
	@echo "  make dev       Run Go server in background (for dev)"
	@echo "  make clean     Remove build output"

deps:
	cd web && npm install

web-build:
	cd web && npm run build

sync-webdist: web-build
	rm -rf internal/webdist
	mkdir -p internal/webdist/assets
	cp -f web/dist/index.html internal/webdist/
	cp -f web/dist/favicon.svg internal/webdist/
	cp -f web/dist/assets/* internal/webdist/assets/

build: sync-webdist
	mkdir -p $(BIN_DIR)
	go build -o $(BIN_DIR)/$(APP_NAME) .

run: build
	./$(BIN_DIR)/$(APP_NAME)

dev:
	@echo "Starting Go server in background..."
	go run . &
	@echo "Server PID: $$!"
	@echo "Test: curl http://localhost:8080/api/tasks"
	@echo "Stop: kill $$!"

clean:
	rm -rf $(BIN_DIR) web/dist