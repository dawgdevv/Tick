package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/dawgdevv/tick/internal/db"
	"github.com/dawgdevv/tick/internal/handlers"
)

//go:embed internal/webdist/* internal/webdist/assets/*
var webFiles embed.FS

var (
	addr   = flag.String("addr", ":8080", "address to listen on")
	dbPath = flag.String("db", "tick.db", "path to SQLite database")
)

func main() {
	flag.Parse()

	if err := os.MkdirAll(filepath.Dir(*dbPath), 0755); err != nil {
		log.Fatalf("Failed to create db directory: %v", err)
	}

	database, err := db.Open(*dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer database.Close()

	if err := database.Migrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	mux := http.NewServeMux()

	dist, err := fs.Sub(webFiles, "internal/webdist")
	if err != nil {
		log.Fatal(err)
	}
	mux.Handle("/", http.FileServer(http.FS(dist)))

	api := handlers.NewAPI(database)
	mux.HandleFunc("/api/tasks", api.Tasks)
	mux.HandleFunc("/api/quicklinks", api.Quicklinks)

	mux.HandleFunc("/api/time", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"time":"%s","date":"%s"}`,
			time.Now().Format("15:04:05"),
			time.Now().Format("02/01/2006"))
	})

	log.Printf("Tick running at http://localhost%s", *addr)
	log.Fatal(http.ListenAndServe(*addr, mux))
}
