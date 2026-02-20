APP_NAME := tick
BIN_DIR := bin

.PHONY: help deps web-build build run clean

help:
	@echo "Available commands:"
	@echo "  make deps      Install frontend dependencies"
	@echo "  make web-build Build frontend assets"
	@echo "  make build     Build frontend + Go binary"
	@echo "  make run       Run the app"
	@echo "  make clean     Remove build output"

deps:
	cd web && npm install

web-build:
	cd web && npm run build

build: web-build
	mkdir -p $(BIN_DIR)
	go build -o $(BIN_DIR)/$(APP_NAME) .

run: build
	./$(BIN_DIR)/$(APP_NAME)

clean:
	rm -rf $(BIN_DIR) web/dist