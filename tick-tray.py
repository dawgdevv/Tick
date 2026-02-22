#!/usr/bin/env python3
"""Tick Tray Indicator — Premium dark-themed GTK popup for Tick task manager."""

import json
import os
import signal
import subprocess
import threading
import urllib.request
from datetime import datetime

import gi
gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")
gi.require_version("AyatanaAppIndicator3", "0.1")
from gi.repository import Gtk, Gdk, GLib, Pango, AyatanaAppIndicator3

API_BASE = "http://localhost:8080"
API_TASKS = f"{API_BASE}/api/tasks"
API_LINKS = f"{API_BASE}/api/quicklinks"
ICON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tick-icon.png")
REFRESH_SEC = 30

C_BG = "#0c0c10"
C_PANEL = "#111116"
C_BORDER = "#1f1f2a"
C_HOVER = "#1a1a22"
C_TEXT = "#eaeafa"
C_SEC = "#83839a"
C_MUTED = "#525266"
C_ACCENT = "#4ade80"
C_ACCENT_HOVER = "#22c55e"
C_FAINT = "#2a2a35"

CSS = f"""
window.tick-popup {{
    background: transparent;
}}
.tick-container {{
    background: {C_PANEL};
    border: 1px solid {C_BORDER};
    border-radius: 14px;
    padding: 6px 0px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
}}
.tick-header {{
    padding: 12px 22px 4px 22px;
}}
.tick-header-title {{
    color: {C_TEXT};
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.5px;
}}
.tick-header-date {{
    color: {C_SEC};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
}}
.tick-section {{
    color: {C_MUTED};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    padding: 16px 22px 6px 22px;
}}
.tick-task-row {{
    padding: 8px 16px;
    margin: 2px 6px;
    border-radius: 8px;
}}
.tick-task-row:hover {{
    background: {C_HOVER};
}}
.tick-task-title {{
    color: {C_TEXT};
    font-size: 14px;
}}
.tick-task-done {{
    color: {C_MUTED};
    font-size: 14px;
    text-decoration: line-through;
}}
.tick-check {{
    min-width: 18px; min-height: 18px;
    border: 1.5px solid {C_MUTED};
    border-radius: 5px;
    background: transparent;
    padding: 0;
}}
.tick-check:hover {{
    border-color: {C_ACCENT};
}}
.tick-check.checked {{
    background: {C_ACCENT};
    border-color: {C_ACCENT};
    color: {C_BG};
    font-weight: 900;
    font-size: 12px;
}}
.tick-entry-box {{
    margin: 4px 22px;
    background: {C_BG};
    border: 1px solid {C_BORDER};
    border-radius: 8px;
}}
.tick-entry {{
    background: transparent;
    color: {C_TEXT};
    font-size: 13px;
    border: none;
    box-shadow: none;
    padding: 10px 14px;
    caret-color: {C_ACCENT};
}}
.tick-entry:focus {{
    background: transparent;
    border: none;
    box-shadow: none;
}}
.tick-btn-add {{
    background: transparent;
    color: {C_ACCENT};
    font-weight: 800;
    font-size: 15px;
    border: none;
    border-left: 1px solid {C_BORDER};
    border-radius: 0 8px 8px 0;
    padding: 0 16px;
}}
.tick-btn-add:hover {{
    background: {C_HOVER};
    color: {C_ACCENT_HOVER};
}}
.tick-focus-time {{
    color: {C_TEXT};
    font-size: 26px;
    font-weight: 400;
    letter-spacing: 1px;
}}
.tick-focus-btn {{
    background: {C_BG};
    border: 1px solid {C_BORDER};
    border-radius: 8px;
    color: {C_SEC};
    padding: 8px 12px;
    font-size: 14px;
}}
.tick-focus-btn:hover {{
    background: {C_HOVER};
    color: {C_TEXT};
    border-color: {C_MUTED};
}}
.tick-link-row {{
    padding: 8px 16px;
    margin: 2px 6px;
    border-radius: 8px;
}}
.tick-link-row:hover {{
    background: {C_HOVER};
}}
.tick-link-label {{
    color: {C_SEC};
    font-size: 13px;
}}
.tick-link-row:hover .tick-link-label {{
    color: {C_TEXT};
}}
.tick-empty {{
    color: {C_MUTED};
    font-size: 12px;
    font-style: italic;
    padding: 4px 22px;
}}
.tick-footer {{
    margin-top: 10px;
    padding: 16px 22px;
    border-top: 1px solid {C_BORDER};
}}
.tick-progress-bar {{
    min-height: 4px;
    border-radius: 2px;
    background: {C_BORDER};
    margin: 8px 0;
}}
.tick-progress-fill {{
    min-height: 4px;
    border-radius: 2px;
    background: {C_ACCENT};
}}
.tick-btn-dash {{
    background: {C_BG};
    border: 1px solid {C_BORDER};
    border-radius: 8px;
    color: {C_TEXT};
    font-size: 13px;
    font-weight: 600;
    padding: 10px;
    margin-top: 10px;
}}
.tick-btn-dash:hover {{
    background: {C_HOVER};
    border-color: {C_MUTED};
}}
"""

def _api(method, url, data=None, timeout=3):
    try:
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, method=method, data=body)
        if body:
            req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode()
            return json.loads(raw) if raw.strip() else None
    except Exception:
        return None

class TickPopup(Gtk.Window):
    def __init__(self):
        super().__init__(type=Gtk.WindowType.TOPLEVEL)
        self.set_decorated(False)
        self.set_skip_taskbar_hint(True)
        self.set_skip_pager_hint(True)
        self.set_type_hint(Gdk.WindowTypeHint.POPUP_MENU)
        self.set_keep_above(True)
        self.set_default_size(360, -1)
        self.set_resizable(False)
        
        # Make window transparent to allow curved borders of container to show
        screen = self.get_screen()
        visual = screen.get_rgba_visual()
        if visual:
            self.set_visual(visual)
        self.set_app_paintable(True)
        self.get_style_context().add_class("tick-popup")

        self.tasks = []
        self.links = []
        self.pom_time = 25 * 60
        self.pom_running = False
        self.pom_mode = "work"
        self.pom_timer_id = None

        self.connect("focus-out-event", lambda *_: self.hide())

        self.main_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        self.main_box.get_style_context().add_class("tick-container")
        self.add(self.main_box)
        self._rebuild()
        self._refresh_data()

    def _rebuild(self):
        for child in self.main_box.get_children():
            self.main_box.remove(child)

        # HEADER
        hdr = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
        hdr.get_style_context().add_class("tick-header")
        title = Gtk.Label(label="✓ Tick")
        title.get_style_context().add_class("tick-header-title")
        hdr.pack_start(title, False, False, 0)
        dt = Gtk.Label(label=datetime.now().strftime("%a, %b %d").upper())
        dt.get_style_context().add_class("tick-header-date")
        hdr.pack_end(dt, False, False, 0)
        self.main_box.pack_start(hdr, False, False, 0)

        # MAIN SCROLL
        scr = Gtk.ScrolledWindow()
        scr.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        scr.set_max_content_height(480)
        scr.set_propagate_natural_height(True)
        content = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        scr.add(content)
        self.main_box.pack_start(scr, True, True, 0)

        # TASKS
        pending = [t for t in self.tasks if not t.get("completed")]
        completed = [t for t in self.tasks if t.get("completed")]

        ts_lbl = Gtk.Label(label="TASKS")
        ts_lbl.set_xalign(0)
        ts_lbl.get_style_context().add_class("tick-section")
        content.pack_start(ts_lbl, False, False, 0)

        if not self.tasks:
            emp = Gtk.Label(label="No tasks for today")
            emp.set_xalign(0)
            emp.get_style_context().add_class("tick-empty")
            content.pack_start(emp, False, False, 0)
        else:
            for task in pending:
                content.pack_start(self._make_task_row(task), False, False, 0)
            
            if completed:
                cs_lbl = Gtk.Label(label=f"COMPLETED  ·  {len(completed)}")
                cs_lbl.set_xalign(0)
                cs_lbl.get_style_context().add_class("tick-section")
                content.pack_start(cs_lbl, False, False, 0)
                for task in completed:
                    content.pack_start(self._make_task_row(task), False, False, 0)

        # ADD TASK
        entry_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
        entry_box.get_style_context().add_class("tick-entry-box")
        entry = Gtk.Entry()
        entry.set_placeholder_text("Add a new task...")
        entry.get_style_context().add_class("tick-entry")
        entry.connect("activate", self._on_add_task)
        entry_box.pack_start(entry, True, True, 0)
        add_btn = Gtk.Button(label="+")
        add_btn.get_style_context().add_class("tick-btn-add")
        add_btn.connect("clicked", lambda _: self._on_add_task(entry))
        entry_box.pack_start(add_btn, False, False, 0)
        content.pack_start(entry_box, False, False, 0)

        # FOCUS
        fs_lbl = Gtk.Label(label="FOCUS" if self.pom_mode == "work" else "BREAK")
        fs_lbl.set_xalign(0)
        fs_lbl.get_style_context().add_class("tick-section")
        if self.pom_mode == "work":
            # Add subtle color to focus label
            fs_lbl.modify_fg(Gtk.StateFlags.NORMAL, Gdk.color_parse(C_ACCENT))
        content.pack_start(fs_lbl, False, False, 0)

        fbox = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=14)
        fbox.set_margin_start(22)
        fbox.set_margin_end(22)
        mins, secs = self.pom_time // 60, self.pom_time % 60
        self.time_label = Gtk.Label(label=f"{mins:02d}:{secs:02d}")
        self.time_label.get_style_context().add_class("tick-focus-time")
        fbox.pack_start(self.time_label, False, False, 0)

        play_btn = Gtk.Button(label="⏸" if self.pom_running else "▶")
        play_btn.get_style_context().add_class("tick-focus-btn")
        play_btn.connect("clicked", self._toggle_pom)
        fbox.pack_start(play_btn, False, False, 0)

        rst_btn = Gtk.Button(label="↺")
        rst_btn.get_style_context().add_class("tick-focus-btn")
        rst_btn.connect("clicked", self._reset_pom)
        fbox.pack_start(rst_btn, False, False, 0)
        content.pack_start(fbox, False, False, 0)

        # LINKS
        ls_lbl = Gtk.Label(label="LINKS")
        ls_lbl.set_xalign(0)
        ls_lbl.get_style_context().add_class("tick-section")
        content.pack_start(ls_lbl, False, False, 0)

        if not self.links:
            emp = Gtk.Label(label="No quicklinks")
            emp.set_xalign(0)
            emp.get_style_context().add_class("tick-empty")
            content.pack_start(emp, False, False, 0)
        else:
            for link in self.links:
                row = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
                row.get_style_context().add_class("tick-link-row")
                
                icon = Gtk.Label(label="↗")
                icon.modify_fg(Gtk.StateFlags.NORMAL, Gdk.color_parse(C_MUTED))
                row.pack_start(icon, False, False, 0)
                
                lbl = Gtk.LinkButton.new_with_label(link.get("url", "#"), link.get("name", "—"))
                lbl.get_child().get_style_context().add_class("tick-link-label")
                lbl.set_xalign(0)
                row.pack_start(lbl, True, True, 0)
                content.pack_start(row, False, False, 0)

        # FOOTER
        footer = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        footer.get_style_context().add_class("tick-footer")

        if self.tasks:
            done = sum(1 for t in self.tasks if t.get("completed"))
            total = len(self.tasks)
            pct = done / total if total else 0
            
            pbox = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
            p_lbl = Gtk.Label(label="PROGRESS")
            p_lbl.modify_fg(Gtk.StateFlags.NORMAL, Gdk.color_parse(C_MUTED))
            p_lbl.modify_font(Pango.FontDescription('10'))
            pbox.pack_start(p_lbl, False, False, 0)
            
            p_val = Gtk.Label(label=f"{done}/{total}")
            p_val.modify_fg(Gtk.StateFlags.NORMAL, Gdk.color_parse(C_ACCENT))
            p_val.modify_font(Pango.FontDescription('bold 11'))
            pbox.pack_end(p_val, False, False, 0)
            footer.pack_start(pbox, False, False, 0)

            # Bar
            bar_bg = Gtk.Box()
            bar_bg.get_style_context().add_class("tick-progress-bar")
            bar_fill = Gtk.Box()
            bar_fill.get_style_context().add_class("tick-progress-fill")
            # Max width logic via size request
            bar_fill.set_size_request(int(315 * pct), -1)
            bar_bg.pack_start(bar_fill, False, False, 0)
            footer.pack_start(bar_bg, False, False, 0)

        dash_btn = Gtk.Button(label="Open Full Dashboard")
        dash_btn.get_style_context().add_class("tick-btn-dash")
        dash_btn.connect("clicked", lambda _: subprocess.Popen(["xdg-open", API_BASE]))
        footer.pack_start(dash_btn, False, False, 0)

        self.main_box.pack_end(footer, False, False, 0)
        self.main_box.show_all()

    def _make_task_row(self, task):
        row = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        row.get_style_context().add_class("tick-task-row")

        is_done = task.get("completed")
        chk = Gtk.Button(label="✔" if is_done else "")
        chk.get_style_context().add_class("tick-check")
        if is_done:
            chk.get_style_context().add_class("checked")
        tid = task.get("id")
        chk.connect("clicked", lambda _, t=tid: self._toggle_task(t))
        row.pack_start(chk, False, False, 0)

        lbl = Gtk.Label(label=task.get("title", ""))
        lbl.set_xalign(0)
        lbl.set_ellipsize(Pango.EllipsizeMode.END)
        lbl.set_max_width_chars(35)
        lbl.get_style_context().add_class("tick-task-done" if is_done else "tick-task-title")
        row.pack_start(lbl, True, True, 0)

        return row

    def _toggle_task(self, task_id):
        def do():
            _api("PATCH", f"{API_TASKS}?id={task_id}")
            GLib.idle_add(self._refresh_data)
        threading.Thread(target=do, daemon=True).start()

    def _on_add_task(self, entry):
        title = entry.get_text().strip()
        if not title: return
        date = datetime.now().strftime("%Y-%m-%d")
        def do():
            _api("POST", API_TASKS, {"title": title, "date": date})
            GLib.idle_add(self._refresh_data)
        threading.Thread(target=do, daemon=True).start()
        entry.set_text("")

    def _toggle_pom(self, _btn):
        self.pom_running = not self.pom_running
        if self.pom_running and not self.pom_timer_id:
            self.pom_timer_id = GLib.timeout_add(1000, self._pom_tick)
        self._rebuild()

    def _reset_pom(self, _btn):
        self.pom_running = False
        self.pom_time = 25 * 60 if self.pom_mode == "work" else 5 * 60
        if self.pom_timer_id:
            GLib.source_remove(self.pom_timer_id)
            self.pom_timer_id = None
        self._rebuild()

    def _pom_tick(self):
        if not self.pom_running:
            self.pom_timer_id = None
            return False
        self.pom_time -= 1
        if self.pom_time <= 0:
            self.pom_running = False
            self.pom_mode = "break" if self.pom_mode == "work" else "work"
            self.pom_time = 5 * 60 if self.pom_mode == "break" else 25 * 60
            self.pom_timer_id = None
            self._rebuild()
            return False
        if hasattr(self, 'time_label') and self.time_label:
            m, s = self.pom_time // 60, self.pom_time % 60
            self.time_label.set_text(f"{m:02d}:{s:02d}")
        return True

    def _refresh_data(self):
        self.tasks = _api("GET", API_TASKS) or []
        self.links = _api("GET", API_LINKS) or []
        self._rebuild()

    def toggle_visible(self):
        if self.get_visible():
            self.hide()
        else:
            self._refresh_data()
            display = Gdk.Display.get_default()
            seat = display.get_default_seat()
            pointer = seat.get_pointer()
            _, x, y = pointer.get_position()
            screen = display.get_default_screen()
            sw = screen.get_width()
            self.move(min(x - 180, sw - 380), 32)
            self.show_all()
            self.present()

class TickTray:
    def __init__(self):
        self.indicator = AyatanaAppIndicator3.Indicator.new(
            "tick-tray", ICON_PATH,
            AyatanaAppIndicator3.IndicatorCategory.APPLICATION_STATUS,
        )
        self.indicator.set_status(AyatanaAppIndicator3.IndicatorStatus.ACTIVE)
        self.indicator.set_title("Tick")

        menu = Gtk.Menu()
        show_item = Gtk.MenuItem(label="✓  Show Tick")
        show_item.connect("activate", lambda _: self.popup.toggle_visible())
        menu.append(show_item)

        dash = Gtk.MenuItem(label="🖥  Full Dashboard")
        dash.connect("activate", lambda _: subprocess.Popen(["xdg-open", API_BASE]))
        menu.append(dash)

        menu.append(Gtk.SeparatorMenuItem())
        quit_item = Gtk.MenuItem(label="Quit")
        quit_item.connect("activate", lambda _: Gtk.main_quit())
        menu.append(quit_item)

        menu.show_all()
        self.indicator.set_menu(menu)

        self.popup = TickPopup()
        GLib.timeout_add_seconds(REFRESH_SEC, self._auto_refresh)

    def _auto_refresh(self):
        if self.popup.get_visible():
            self.popup._refresh_data()
        return True

def main():
    provider = Gtk.CssProvider()
    provider.load_from_data(CSS.encode())
    Gtk.StyleContext.add_provider_for_screen(
        Gdk.Screen.get_default(), provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
    )

    signal.signal(signal.SIGINT, signal.SIG_DFL)
    TickTray()
    Gtk.main()

if __name__ == "__main__":
    main()
