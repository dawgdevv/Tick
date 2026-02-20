package db

import (
	"database/sql"
	"errors"

	_ "github.com/mattn/go-sqlite3"
)

var ErrNotFound = errors.New("not found")

type DB struct {
	*sql.DB
}

func Open(path string) (*DB, error) {
	db, err := sql.Open("sqlite3", path+"?_foreign_keys=on")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	return &DB{db}, nil
}

func (db *DB) Migrate() error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			completed INTEGER DEFAULT 0,
			date TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS quicklinks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			url TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);
	`)
	return err
}

type Task struct {
	ID        int64  `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
	Date      string `json:"date"`
	CreatedAt string `json:"created_at"`
}

func (db *DB) GetTasks(date string) ([]Task, error) {
	rows, err := db.Query("SELECT id, title, completed, date, created_at FROM tasks WHERE date = ? ORDER BY created_at", date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []Task
	for rows.Next() {
		var t Task
		var completed int
		if err := rows.Scan(&t.ID, &t.Title, &completed, &t.Date, &t.CreatedAt); err != nil {
			return nil, err
		}
		t.Completed = completed == 1
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func (db *DB) CreateTask(title, date string) (Task, error) {
	result, err := db.Exec("INSERT INTO tasks (title, date) VALUES (?, ?)", title, date)
	if err != nil {
		return Task{}, err
	}
	id, _ := result.LastInsertId()
	return Task{ID: id, Title: title, Date: date, Completed: false}, nil
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

type Quicklink struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	URL       string `json:"url"`
	CreatedAt string `json:"created_at"`
}

func (db *DB) GetQuicklinks() ([]Quicklink, error) {
	rows, err := db.Query("SELECT id, name, url, created_at FROM quicklinks ORDER BY created_at")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var links []Quicklink
	for rows.Next() {
		var l Quicklink
		if err := rows.Scan(&l.ID, &l.Name, &l.URL, &l.CreatedAt); err != nil {
			return nil, err
		}
		links = append(links, l)
	}
	return links, nil
}

func (db *DB) CreateQuicklink(name, url string) (Quicklink, error) {
	result, err := db.Exec("INSERT INTO quicklinks (name, url) VALUES (?, ?)", name, url)
	if err != nil {
		return Quicklink{}, err
	}
	id, _ := result.LastInsertId()
	return Quicklink{ID: id, Name: name, URL: url}, nil
}

func (db *DB) DeleteQuicklink(id int64) error {
	_, err := db.Exec("DELETE FROM quicklinks WHERE id = ?", id)
	return err
}
