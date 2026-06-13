package handlers

import (
	"encoding/json"
	"errors"
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

func cors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

func (api *API) Tasks(w http.ResponseWriter, r *http.Request) {
	cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(204)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	switch r.Method {
	case http.MethodGet:
		// Create recurring tasks first
		api.db.CreateRecurringTasksForDate(date)
		
		tasks, err := api.db.GetTasks(date)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(tasks)

	case http.MethodPost:
		var req struct {
			Title         string `json:"title"`
			Date          string `json:"date"`
			Priority      string `json:"priority"`
			Recurring     bool   `json:"recurring"`
			RecurringType string `json:"recurring_type"`
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
		if req.Priority == "" {
			req.Priority = "normal"
		}
		task, err := api.db.CreateTask(req.Title, req.Date, req.Priority, req.Recurring, req.RecurringType)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(task)

	case http.MethodPut:
		id, err := strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)
		if err != nil {
			http.Error(w, "invalid id", 400)
			return
		}
		var req struct {
			Title    string `json:"title"`
			Priority string `json:"priority"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		if req.Title == "" {
			http.Error(w, "title is required", 400)
			return
		}
		if req.Priority == "" {
			req.Priority = "normal"
		}
		task, err := api.db.UpdateTask(id, req.Title, req.Priority)
		if err != nil {
			if errors.Is(err, db.ErrNotFound) {
				http.Error(w, "task not found", 404)
			} else {
				http.Error(w, err.Error(), 500)
			}
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

	default:
		http.Error(w, "method not allowed", 405)
	}
}

// ─── Task Timer ─────────────────────────────────────────────────────────────

func (api *API) TaskTimer(w http.ResponseWriter, r *http.Request) {
	cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(204)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	id, err := strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", 400)
		return
	}

	if r.Method == http.MethodPut {
		var req struct {
			Seconds int `json:"seconds"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		if err := api.db.UpdateTaskTimer(id, req.Seconds); err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(map[string]int{"seconds": req.Seconds})
		return
	}

	http.Error(w, "method not allowed", 405)
}

// ─── Subtasks ─────────────────────────────────────────────────────────────────

func (api *API) Subtasks(w http.ResponseWriter, r *http.Request) {
	cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(204)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	taskID, err := strconv.ParseInt(r.URL.Query().Get("task_id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid task_id", 400)
		return
	}

	switch r.Method {
	case http.MethodGet:
		subtasks, err := api.db.GetSubtasks(taskID)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(subtasks)

	case http.MethodPost:
		var req struct {
			Title string `json:"title"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		if req.Title == "" {
			http.Error(w, "title is required", 400)
			return
		}
		subtask, err := api.db.CreateSubtask(taskID, req.Title)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(subtask)

	default:
		http.Error(w, "method not allowed", 405)
	}
}

func (api *API) Subtask(w http.ResponseWriter, r *http.Request) {
	cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(204)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	id, err := strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", 400)
		return
	}

	switch r.Method {
	case http.MethodPatch:
		completed, err := api.db.ToggleSubtask(id)
		if err != nil {
			http.Error(w, "subtask not found", 404)
			return
		}
		json.NewEncoder(w).Encode(map[string]bool{"completed": completed})

	case http.MethodDelete:
		if err := api.db.DeleteSubtask(id); err != nil {
			http.Error(w, "subtask not found", 404)
			return
		}
		w.WriteHeader(204)

	default:
		http.Error(w, "method not allowed", 405)
	}
}

// ─── Scratchpad ─────────────────────────────────────────────────────────────

func (api *API) Scratchpad(w http.ResponseWriter, r *http.Request) {
	cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(204)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		scratchpad, err := api.db.GetScratchpad()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(scratchpad)

	case http.MethodPut:
		var req struct {
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		scratchpad, err := api.db.UpdateScratchpad(req.Content)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(scratchpad)

	default:
		http.Error(w, "method not allowed", 405)
	}
}

// ─── Quicklinks / Bookmarks ───────────────────────────────────────────────────

func (api *API) Quicklinks(w http.ResponseWriter, r *http.Request) {
	cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(204)
		return
	}
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
			Name     string `json:"name"`
			URL      string `json:"url"`
			Type     string `json:"type"`
			ParentID *int64 `json:"parent_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		if req.Name == "" {
			http.Error(w, "name is required", 400)
			return
		}
		linkType := req.Type
		if linkType == "" {
			linkType = "bookmark"
		}
		if linkType == "bookmark" && req.URL == "" {
			http.Error(w, "url is required for bookmarks", 400)
			return
		}
		link, err := api.db.CreateQuicklink(req.Name, req.URL, linkType, req.ParentID)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(link)

	case http.MethodPatch:
		id, err := strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)
		if err != nil {
			http.Error(w, "invalid id", 400)
			return
		}
		var req struct {
			Name      *string `json:"name"`
			URL       *string `json:"url"`
			ParentID  *int64  `json:"parent_id"`
			SortOrder *int    `json:"sort_order"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		link, err := api.db.UpdateQuicklink(id, req.Name, req.URL, req.ParentID, req.SortOrder)
		if err != nil {
			if errors.Is(err, db.ErrNotFound) {
				http.Error(w, "bookmark not found", 404)
			} else {
				http.Error(w, err.Error(), 500)
			}
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
			if errors.Is(err, db.ErrNotFound) {
				http.Error(w, "bookmark not found", 404)
			} else {
				http.Error(w, err.Error(), 500)
			}
			return
		}
		w.WriteHeader(204)

	default:
		http.Error(w, "method not allowed", 405)
	}
}

func (api *API) QuicklinksExport(w http.ResponseWriter, r *http.Request) {
	cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(204)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", 405)
		return
	}

	links, err := api.db.GetQuicklinks()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	format := r.URL.Query().Get("format")
	if format == "" {
		format = "html"
	}

	switch format {
	case "json":
		data, err := db.ExportQuicklinksJSON(links)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Content-Disposition", `attachment; filename="bookmarks.json"`)
		w.Write(data)
	case "html":
		html := db.ExportQuicklinksHTML(links)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Content-Disposition", `attachment; filename="bookmarks.html"`)
		w.Write([]byte(html))
	default:
		http.Error(w, "format must be html or json", 400)
	}
}

func (api *API) QuicklinksImport(w http.ResponseWriter, r *http.Request) {
	cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(204)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", 405)
		return
	}

	var req struct {
		Format   string `json:"format"`
		Data     string `json:"data"`
		ParentID *int64 `json:"parent_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if req.Data == "" {
		http.Error(w, "data is required", 400)
		return
	}
	if req.Format == "" {
		req.Format = "html"
	}

	var nodes []db.ImportNode
	var err error
	switch req.Format {
	case "html":
		nodes, err = db.ParseNetscapeBookmarks(req.Data)
	case "json":
		nodes, err = db.ParseJSONBookmarks(req.Data)
	default:
		http.Error(w, "format must be html or json", 400)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if err := api.db.ImportQuicklinks(nodes, req.ParentID); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	links, err := api.db.GetQuicklinks()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(links)
}
