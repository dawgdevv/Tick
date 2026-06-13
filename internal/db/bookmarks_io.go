package db

import (
	"encoding/json"
	"fmt"
	"html"
	"regexp"
	"strings"
	"time"
)

// ImportNode is a bookmark or folder parsed from an import file.
type ImportNode struct {
	Name     string       `json:"name"`
	URL      string       `json:"url,omitempty"`
	Type     string       `json:"type"`
	Children []ImportNode `json:"children,omitempty"`
}

type exportDocument struct {
	Version   int          `json:"version"`
	Exported  string       `json:"exported_at"`
	Bookmarks []ImportNode `json:"bookmarks"`
}

var (
	reFolder = regexp.MustCompile(`(?is)^\s*>?\s*<H3[^>]*>(.*?)</H3>`)
	reLink   = regexp.MustCompile(`(?is)^\s*>?\s*<A\s+[^>]*HREF\s*=\s*["']([^"']*)["'][^>]*>(.*?)</A>`)
	reDL     = regexp.MustCompile(`(?is)<DL[^>]*>`)
)

func (db *DB) ImportQuicklinks(nodes []ImportNode, parentID *int64) error {
	for _, node := range nodes {
		linkType := node.Type
		if linkType == "" {
			if node.URL != "" {
				linkType = "bookmark"
			} else {
				linkType = "folder"
			}
		}
		created, err := db.CreateQuicklink(node.Name, node.URL, linkType, parentID)
		if err != nil {
			return err
		}
		if len(node.Children) > 0 {
			pid := created.ID
			if err := db.ImportQuicklinks(node.Children, &pid); err != nil {
				return err
			}
		}
	}
	return nil
}

func ParseNetscapeBookmarks(raw string) ([]ImportNode, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}
	idx := reDL.FindStringIndex(raw)
	if idx == nil {
		return nil, fmt.Errorf("invalid bookmark HTML: missing <DL>")
	}
	return parseDLBlock(raw[idx[0]:])
}

func parseDLBlock(block string) ([]ImportNode, error) {
	block = strings.TrimSpace(block)
	closeIdx := findMatchingDLClose(block)
	if closeIdx < 0 {
		return nil, fmt.Errorf("unclosed <DL> block")
	}

	innerStart := strings.Index(block, ">")
	if innerStart < 0 {
		return nil, fmt.Errorf("invalid <DL> block")
	}
	inner := strings.TrimSpace(block[innerStart+1 : closeIdx])
	return parseDLChildren(inner), nil
}

func parseDLChildren(inner string) []ImportNode {
	var items []ImportNode
	pos := 0
	for pos < len(inner) {
		dtIdx := indexCaseInsensitive(inner[pos:], "<DT")
		if dtIdx < 0 {
			break
		}
		start := pos + dtIdx
		pos = start + 3
		if pos < len(inner) && inner[pos] == '>' {
			pos++
		}

		remaining := strings.TrimSpace(inner[pos:])
		if remaining == "" {
			break
		}

		if fm := reFolder.FindStringSubmatch(remaining); fm != nil {
			name := html.UnescapeString(strings.TrimSpace(stripTags(fm[1])))
			folder := ImportNode{Name: name, Type: "folder"}
			afterH3 := strings.TrimSpace(remaining[len(fm[0]):])
			if strings.HasPrefix(strings.ToUpper(afterH3), "<DL") {
				dlBlock, consumed := extractDLBlock(afterH3)
				if consumed > 0 {
					if children, err := parseDLBlock(dlBlock); err == nil {
						folder.Children = children
					}
					pos = len(inner) - len(afterH3) + consumed
					items = append(items, folder)
					continue
				}
			}
			pos = len(inner) - len(remaining) + len(fm[0])
			items = append(items, folder)
			continue
		}

		if lm := reLink.FindStringSubmatch(remaining); lm != nil {
			url := html.UnescapeString(strings.TrimSpace(lm[1]))
			name := html.UnescapeString(strings.TrimSpace(stripTags(lm[2])))
			if name == "" {
				name = url
			}
			items = append(items, ImportNode{Name: name, URL: url, Type: "bookmark"})
			pos = len(inner) - len(remaining) + len(lm[0])
			continue
		}

		pos = start + 3
	}
	return items
}

func extractDLBlock(s string) (string, int) {
	closeIdx := findMatchingDLClose(s)
	if closeIdx < 0 {
		return "", 0
	}
	end := closeIdx + len("</DL>")
	return s[:end], end
}

func indexCaseInsensitive(s, substr string) int {
	return strings.Index(strings.ToUpper(s), strings.ToUpper(substr))
}

func findMatchingDLClose(s string) int {
	upper := strings.ToUpper(s)
	depth := 0
	for i := 0; i < len(s); {
		open := findDLOpen(upper, i)
		close := strings.Index(upper[i:], "</DL>")
		if open == -1 && close == -1 {
			return -1
		}
		if open != -1 && (close == -1 || open < i+close) {
			depth++
			i = open + 3
			continue
		}
		depth--
		if depth == 0 {
			return i + close
		}
		i += close + 5
	}
	return -1
}

func findDLOpen(upper string, start int) int {
	for idx := start; idx < len(upper); {
		pos := strings.Index(upper[idx:], "<DL")
		if pos == -1 {
			return -1
		}
		abs := idx + pos
		if abs > 0 && upper[abs-1] == '/' {
			idx = abs + 3
			continue
		}
		return abs
	}
	return -1
}

func stripTags(s string) string {
	re := regexp.MustCompile(`<[^>]*>`)
	return re.ReplaceAllString(s, "")
}

func ParseJSONBookmarks(raw string) ([]ImportNode, error) {
	var doc exportDocument
	if err := json.Unmarshal([]byte(raw), &doc); err == nil && len(doc.Bookmarks) > 0 {
		return doc.Bookmarks, nil
	}
	var nodes []ImportNode
	if err := json.Unmarshal([]byte(raw), &nodes); err != nil {
		return nil, err
	}
	return nodes, nil
}

func ExportQuicklinksJSON(links []Quicklink) ([]byte, error) {
	tree := buildExportTree(links, nil)
	doc := exportDocument{
		Version:   1,
		Exported:  time.Now().UTC().Format(time.RFC3339),
		Bookmarks: tree,
	}
	return json.MarshalIndent(doc, "", "  ")
}

func ExportQuicklinksHTML(links []Quicklink) string {
	tree := buildExportTree(links, nil)
	var b strings.Builder
	b.WriteString("<!DOCTYPE NETSCAPE-Bookmark-file-1>\n")
	b.WriteString("<!-- This is an automatically generated file.\n")
	b.WriteString("     It will be read and overwritten.\n")
	b.WriteString("     DO NOT EDIT! -->\n")
	b.WriteString("<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">\n")
	b.WriteString("<TITLE>Bookmarks</TITLE>\n")
	b.WriteString("<H1>Bookmarks</H1>\n")
	b.WriteString("<DL><p>\n")
	writeHTMLNodes(&b, tree, 1)
	b.WriteString("</DL><p>\n")
	return b.String()
}

func buildExportTree(links []Quicklink, parentID *int64) []ImportNode {
	var nodes []ImportNode
	for _, l := range links {
		if !sameParent(l.ParentID, parentID) {
			continue
		}
		node := ImportNode{Name: l.Name, Type: l.Type}
		if l.Type == "folder" {
			node.Children = buildExportTree(links, &l.ID)
		} else {
			node.URL = l.URL
		}
		nodes = append(nodes, node)
	}
	return nodes
}

func sameParent(a, b *int64) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return *a == *b
}

func writeHTMLNodes(b *strings.Builder, nodes []ImportNode, depth int) {
	indent := strings.Repeat("    ", depth)
	for _, n := range nodes {
		if n.Type == "folder" || len(n.Children) > 0 {
			b.WriteString(indent + "<DT><H3>" + html.EscapeString(n.Name) + "</H3>\n")
			b.WriteString(indent + "<DL><p>\n")
			writeHTMLNodes(b, n.Children, depth+1)
			b.WriteString(indent + "</DL><p>\n")
			continue
		}
		b.WriteString(indent + "<DT><A HREF=\"" + html.EscapeString(n.URL) + "\">" + html.EscapeString(n.Name) + "</A>\n")
	}
}
