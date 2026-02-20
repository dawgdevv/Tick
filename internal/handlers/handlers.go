package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/dawgdevv/tick/internal/db"
)

type API struct {
	db *db.DB
}

func NewAPI(database *db.DB) *API {
	return &API{db: database}
}

func (api *API) Tasks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	switch r.Method {
	case http.MethodGet:
		tasks, err := api.db.GetTasks(date)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(tasks)

	case http.MethodPost:
		var req struct {
			Title string `json:"title"`
			Date  string `json:"date"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		if req.Title == "" {
			http.Error(w, "title is required", 400)
			return
		}
		if req.Date == "" {
			req.Date = time.Now().Format("2006-01-02")
		}
		task, err := api.db.CreateTask(req.Title, req.Date)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(task)

	case http.MethodPatch:
		id, err := strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)
		if err != nil {
			http.Error(w, "invalid id", 400)
			return
		}
		completed, err := api.db.ToggleTask(id)
		if err != nil {
			http.Error(w, "task not found", 404)
			return
		}
		json.NewEncoder(w).Encode(map[string]bool{"completed": completed})

	case http.MethodDelete:
		id, err := strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)
		if err != nil {
			http.Error(w, "invalid id", 400)
			return
		}
		if err := api.db.DeleteTask(id); err != nil {
			http.Error(w, "task not found", 404)
			return
		}
		w.WriteHeader(204)
	}
}

func (api *API) Quicklinks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		links, err := api.db.GetQuicklinks()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(links)

	case http.MethodPost:
		var req struct {
			Name string `json:"name"`
			URL  string `json:"url"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		if req.Name == "" {
			http.Error(w, "name is required", 400)
			return
		}
		if req.URL == "" {
			http.Error(w, "url is required", 400)
			return
		}
		link, err := api.db.CreateQuicklink(req.Name, req.URL)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(link)

	case http.MethodDelete:
		id, err := strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)
		if err != nil {
			http.Error(w, "invalid id", 400)
			return
		}
		if err := api.db.DeleteQuicklink(id); err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.WriteHeader(204)
	}
}
