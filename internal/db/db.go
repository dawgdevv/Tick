package db

import (
	"database/sql"
	"errors"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var ErrNotFound = errors.New("not found")

type DB struct {
	*sql.DB
}

func Open(path string) (*DB, error) {
	db, err := sql.Open("sqlite3", path+"?_foreign_keys=on&_journal_mode=WAL")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(4)
	if _, err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		db.Close()
		return nil, err
	}
	return &DB{db}, nil
}

func (db *DB) Migrate() error {
	// Main tasks table with priority, recurring
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			completed INTEGER DEFAULT 0,
			date TEXT NOT NULL,
			priority TEXT DEFAULT 'normal',
			recurring INTEGER DEFAULT 0,
			recurring_type TEXT DEFAULT 'none',
			timer_seconds INTEGER DEFAULT 0,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS subtasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			task_id INTEGER NOT NULL,
			title TEXT NOT NULL,
			completed INTEGER DEFAULT 0,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS scratchpad (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			content TEXT NOT NULL DEFAULT '',
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS quicklinks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			url TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return err
	}

	// Upgrade existing databases created before new columns were added
	migrations := []struct {
		table, column, definition string
	}{
		{"tasks", "priority", "TEXT DEFAULT 'normal'"},
		{"tasks", "recurring", "INTEGER DEFAULT 0"},
		{"tasks", "recurring_type", "TEXT DEFAULT 'none'"},
		{"tasks", "timer_seconds", "INTEGER DEFAULT 0"},
		{"tasks", "created_at", "TEXT DEFAULT CURRENT_TIMESTAMP"},
		{"quicklinks", "parent_id", "INTEGER"},
		{"quicklinks", "type", "TEXT DEFAULT 'bookmark'"},
		{"quicklinks", "sort_order", "INTEGER DEFAULT 0"},
	}
	for _, m := range migrations {
		if err := db.addColumnIfNotExists(m.table, m.column, m.definition); err != nil {
			return err
		}
	}

	return nil
}

func (db *DB) addColumnIfNotExists(table, column, definition string) error {
	rows, err := db.Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var cid, notnull, pk int
		var name, ctype string
		var dfltValue sql.NullString
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dfltValue, &pk); err != nil {
			return err
		}
		if name == column {
			return nil
		}
	}
	_, err = db.Exec("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition)
	return err
}

// ─── Task ───────────────────────────────────────────────────────────────────

type Task struct {
	ID            int64  `json:"id"`
	Title         string `json:"title"`
	Completed     bool   `json:"completed"`
	Date          string `json:"date"`
	Priority      string `json:"priority"`
	Recurring     bool   `json:"recurring"`
	RecurringType string `json:"recurring_type"`
	TimerSeconds  int    `json:"timer_seconds"`
	CreatedAt     string `json:"created_at"`
	Subtasks      []Subtask `json:"subtasks,omitempty"`
}

type Subtask struct {
	ID        int64  `json:"id"`
	TaskID    int64  `json:"task_id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
	CreatedAt string `json:"created_at"`
}

func (db *DB) GetTasks(date string) ([]Task, error) {
	rows, err := db.Query("SELECT id, title, completed, date, priority, recurring, recurring_type, timer_seconds, created_at FROM tasks WHERE date = ? ORDER BY priority DESC, created_at", date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tasks := make([]Task, 0)
	for rows.Next() {
		var t Task
		var completed, recurring int
		if err := rows.Scan(&t.ID, &t.Title, &completed, &t.Date, &t.Priority, &recurring, &t.RecurringType, &t.TimerSeconds, &t.CreatedAt); err != nil {
			return nil, err
		}
		t.Completed = completed == 1
		t.Recurring = recurring == 1
		tasks = append(tasks, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range tasks {
		subtasks, err := db.GetSubtasks(tasks[i].ID)
		if err != nil {
			return nil, err
		}
		tasks[i].Subtasks = subtasks
	}
	return tasks, nil
}

func (db *DB) CreateTask(title, date, priority string, recurring bool, recurringType string) (Task, error) {
	recurringInt := 0
	if recurring {
		recurringInt = 1
	}
	result, err := db.Exec("INSERT INTO tasks (title, date, priority, recurring, recurring_type) VALUES (?, ?, ?, ?, ?)", title, date, priority, recurringInt, recurringType)
	if err != nil {
		return Task{}, err
	}
	id, _ := result.LastInsertId()
	return Task{ID: id, Title: title, Date: date, Completed: false, Priority: priority, Recurring: recurring, RecurringType: recurringType}, nil
}

func (db *DB) ToggleTask(id int64) (bool, error) {
	var completed int
	err := db.QueryRow("SELECT completed FROM tasks WHERE id = ?", id).Scan(&completed)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, ErrNotFound
		}
		return false, err
	}
	_, err = db.Exec("UPDATE tasks SET completed = ? WHERE id = ?", 1-completed, id)
	return completed == 0, err
}

func (db *DB) UpdateTask(id int64, title, priority string) (Task, error) {
	var task Task
	var completed, recurring int
	err := db.QueryRow("SELECT id, title, completed, date, priority, recurring, recurring_type, timer_seconds, created_at FROM tasks WHERE id = ?", id).Scan(
		&task.ID, &task.Title, &completed, &task.Date, &task.Priority, &recurring, &task.RecurringType, &task.TimerSeconds, &task.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Task{}, ErrNotFound
		}
		return Task{}, err
	}
	task.Completed = completed == 1
	task.Recurring = recurring == 1
	_, err = db.Exec("UPDATE tasks SET title = ?, priority = ? WHERE id = ?", title, priority, id)
	if err != nil {
		return Task{}, err
	}
	task.Title = title
	task.Priority = priority
	return task, nil
}

func (db *DB) UpdateTaskTimer(id int64, seconds int) error {
	_, err := db.Exec("UPDATE tasks SET timer_seconds = ? WHERE id = ?", seconds, id)
	return err
}

func (db *DB) DeleteTask(id int64) error {
	result, err := db.Exec("DELETE FROM tasks WHERE id = ?", id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// ─── Subtasks ───────────────────────────────────────────────────────────────

func (db *DB) GetSubtasks(taskID int64) ([]Subtask, error) {
	rows, err := db.Query("SELECT id, task_id, title, completed, created_at FROM subtasks WHERE task_id = ? ORDER BY created_at", taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	subtasks := make([]Subtask, 0)
	for rows.Next() {
		var s Subtask
		var completed int
		if err := rows.Scan(&s.ID, &s.TaskID, &s.Title, &completed, &s.CreatedAt); err != nil {
			return nil, err
		}
		s.Completed = completed == 1
		subtasks = append(subtasks, s)
	}
	return subtasks, nil
}

func (db *DB) CreateSubtask(taskID int64, title string) (Subtask, error) {
	result, err := db.Exec("INSERT INTO subtasks (task_id, title) VALUES (?, ?)", taskID, title)
	if err != nil {
		return Subtask{}, err
	}
	id, _ := result.LastInsertId()
	return Subtask{ID: id, TaskID: taskID, Title: title, Completed: false}, nil
}

func (db *DB) ToggleSubtask(id int64) (bool, error) {
	var completed int
	err := db.QueryRow("SELECT completed FROM subtasks WHERE id = ?", id).Scan(&completed)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, ErrNotFound
		}
		return false, err
	}
	_, err = db.Exec("UPDATE subtasks SET completed = ? WHERE id = ?", 1-completed, id)
	return completed == 0, err
}

func (db *DB) DeleteSubtask(id int64) error {
	result, err := db.Exec("DELETE FROM subtasks WHERE id = ?", id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// ─── Recurring ──────────────────────────────────────────────────────────────

func (db *DB) GetRecurringTasks() ([]Task, error) {
	rows, err := db.Query("SELECT id, title, completed, date, priority, recurring, recurring_type, timer_seconds, created_at FROM tasks WHERE recurring = 1")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tasks := make([]Task, 0)
	for rows.Next() {
		var t Task
		var completed, recurring int
		if err := rows.Scan(&t.ID, &t.Title, &completed, &t.Date, &t.Priority, &recurring, &t.RecurringType, &t.TimerSeconds, &t.CreatedAt); err != nil {
			return nil, err
		}
		t.Completed = completed == 1
		t.Recurring = recurring == 1
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func (db *DB) CreateRecurringTasksForDate(date string) error {
	recurring, err := db.GetRecurringTasks()
	if err != nil {
		return err
	}

	for _, task := range recurring {
		shouldCreate := false
		now, _ := time.Parse("2006-01-02", date)
		taskDate, _ := time.Parse("2006-01-02", task.Date)
		
		switch task.RecurringType {
		case "daily":
			shouldCreate = true
		case "weekly":
			shouldCreate = now.Weekday() == taskDate.Weekday()
		case "weekdays":
			weekday := now.Weekday()
			shouldCreate = weekday >= time.Monday && weekday <= time.Friday
		}

		if shouldCreate {
			// Check if already exists for this date
			var count int
			err := db.QueryRow("SELECT COUNT(*) FROM tasks WHERE title = ? AND date = ? AND recurring = 0", task.Title, date).Scan(&count)
			if err != nil || count > 0 {
				continue
			}
			
			_, err = db.Exec("INSERT INTO tasks (title, date, priority, recurring, recurring_type) VALUES (?, ?, ?, 0, 'none')", task.Title, date, task.Priority)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

// ─── Scratchpad ─────────────────────────────────────────────────────────────

type Scratchpad struct {
	ID        int64  `json:"id"`
	Content   string `json:"content"`
	UpdatedAt string `json:"updated_at"`
}

func (db *DB) GetScratchpad() (Scratchpad, error) {
	var s Scratchpad
	err := db.QueryRow("SELECT id, content, updated_at FROM scratchpad ORDER BY id DESC LIMIT 1").Scan(&s.ID, &s.Content, &s.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Create initial
			result, err := db.Exec("INSERT INTO scratchpad (content) VALUES ('')")
			if err != nil {
				return Scratchpad{}, err
			}
			id, _ := result.LastInsertId()
			return Scratchpad{ID: id, Content: "", UpdatedAt: time.Now().Format("2006-01-02 15:04:05")}, nil
		}
		return Scratchpad{}, err
	}
	return s, nil
}

func (db *DB) UpdateScratchpad(content string) (Scratchpad, error) {
	var s Scratchpad
	err := db.QueryRow("SELECT id FROM scratchpad ORDER BY id DESC LIMIT 1").Scan(&s.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			result, err := db.Exec("INSERT INTO scratchpad (content) VALUES (?)", content)
			if err != nil {
				return Scratchpad{}, err
			}
			id, _ := result.LastInsertId()
			return Scratchpad{ID: id, Content: content, UpdatedAt: time.Now().Format("2006-01-02 15:04:05")}, nil
		}
		return Scratchpad{}, err
	}
	
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = db.Exec("UPDATE scratchpad SET content = ?, updated_at = ? WHERE id = ?", content, now, s.ID)
	if err != nil {
		return Scratchpad{}, err
	}
	return Scratchpad{ID: s.ID, Content: content, UpdatedAt: now}, nil
}

// ─── Quicklinks / Bookmarks ───────────────────────────────────────────────────

type Quicklink struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	URL       string `json:"url"`
	Type      string `json:"type"`
	ParentID  *int64 `json:"parent_id"`
	SortOrder int    `json:"sort_order"`
	CreatedAt string `json:"created_at"`
}

func scanQuicklink(scanner interface {
	Scan(dest ...any) error
}) (Quicklink, error) {
	var l Quicklink
	var parentID sql.NullInt64
	if err := scanner.Scan(&l.ID, &l.Name, &l.URL, &l.Type, &parentID, &l.SortOrder, &l.CreatedAt); err != nil {
		return Quicklink{}, err
	}
	if parentID.Valid {
		l.ParentID = &parentID.Int64
	}
	if l.Type == "" {
		l.Type = "bookmark"
	}
	return l, nil
}

const quicklinkSelect = `SELECT id, name, url, COALESCE(type, 'bookmark'), parent_id, COALESCE(sort_order, 0), created_at FROM quicklinks`

func (db *DB) GetQuicklinks() ([]Quicklink, error) {
	rows, err := db.Query(quicklinkSelect + ` ORDER BY COALESCE(parent_id, 0), sort_order, created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	links := make([]Quicklink, 0)
	for rows.Next() {
		l, err := scanQuicklink(rows)
		if err != nil {
			return nil, err
		}
		links = append(links, l)
	}
	return links, nil
}

func (db *DB) GetQuicklink(id int64) (Quicklink, error) {
	row := db.QueryRow(quicklinkSelect+` WHERE id = ?`, id)
	l, err := scanQuicklink(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Quicklink{}, ErrNotFound
		}
		return Quicklink{}, err
	}
	return l, nil
}

func (db *DB) nextSortOrder(parentID *int64) (int, error) {
	var maxOrder sql.NullInt64
	var err error
	if parentID == nil {
		err = db.QueryRow("SELECT MAX(sort_order) FROM quicklinks WHERE parent_id IS NULL").Scan(&maxOrder)
	} else {
		err = db.QueryRow("SELECT MAX(sort_order) FROM quicklinks WHERE parent_id = ?", *parentID).Scan(&maxOrder)
	}
	if err != nil {
		return 0, err
	}
	if maxOrder.Valid {
		return int(maxOrder.Int64) + 1, nil
	}
	return 0, nil
}

func (db *DB) CreateQuicklink(name, url, linkType string, parentID *int64) (Quicklink, error) {
	if linkType == "" {
		linkType = "bookmark"
	}
	if linkType == "folder" {
		url = ""
	}
	sortOrder, err := db.nextSortOrder(parentID)
	if err != nil {
		return Quicklink{}, err
	}

	var result sql.Result
	if parentID == nil {
		result, err = db.Exec(
			"INSERT INTO quicklinks (name, url, type, parent_id, sort_order) VALUES (?, ?, ?, NULL, ?)",
			name, url, linkType, sortOrder,
		)
	} else {
		result, err = db.Exec(
			"INSERT INTO quicklinks (name, url, type, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)",
			name, url, linkType, *parentID, sortOrder,
		)
	}
	if err != nil {
		return Quicklink{}, err
	}
	id, _ := result.LastInsertId()
	return db.GetQuicklink(id)
}

func (db *DB) UpdateQuicklink(id int64, name, url *string, parentID *int64, sortOrder *int) (Quicklink, error) {
	current, err := db.GetQuicklink(id)
	if err != nil {
		return Quicklink{}, err
	}

	if name != nil {
		current.Name = *name
	}
	if url != nil {
		current.URL = *url
	}
	if parentID != nil {
		current.ParentID = parentID
	}
	if sortOrder != nil {
		current.SortOrder = *sortOrder
	}

	if current.Type == "folder" {
		current.URL = ""
	}

	var execErr error
	if current.ParentID == nil {
		_, execErr = db.Exec(
			"UPDATE quicklinks SET name = ?, url = ?, parent_id = NULL, sort_order = ? WHERE id = ?",
			current.Name, current.URL, current.SortOrder, id,
		)
	} else {
		_, execErr = db.Exec(
			"UPDATE quicklinks SET name = ?, url = ?, parent_id = ?, sort_order = ? WHERE id = ?",
			current.Name, current.URL, *current.ParentID, current.SortOrder, id,
		)
	}
	if execErr != nil {
		return Quicklink{}, execErr
	}
	return db.GetQuicklink(id)
}

func (db *DB) DeleteQuicklink(id int64) error {
	_, err := db.Exec(`
		WITH RECURSIVE descendants AS (
			SELECT id FROM quicklinks WHERE id = ?
			UNION ALL
			SELECT q.id FROM quicklinks q
			INNER JOIN descendants d ON q.parent_id = d.id
		)
		DELETE FROM quicklinks WHERE id IN (SELECT id FROM descendants)
	`, id)
	if err != nil {
		return err
	}
	return nil
}
