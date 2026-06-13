package db

import "testing"

func TestFindMatchingDLClose(t *testing.T) {
	block := `<DL><p>
<DT><H3>Imported</H3>
<DL><p>
<DT><A HREF="https://foo.com">Foo</A>
</DL><p>
</DL><p>`
	closeIdx := findMatchingDLClose(block)
	if closeIdx < 0 {
		t.Fatalf("expected close index, got %d", closeIdx)
	}

	inner := `<DL><p>
<DT><A HREF="https://foo.com">Foo</A>
</DL><p>`
	innerClose := findMatchingDLClose(inner)
	if innerClose < 0 {
		t.Fatalf("expected inner close index, got %d", innerClose)
	}
}

func TestParseDLBlockDirect(t *testing.T) {
	block := `<DL><p>
<DT><H3>Imported</H3>
<DL><p>
<DT><A HREF="https://foo.com">Foo</A>
</DL><p>
</DL><p>`
	nodes, err := parseDLBlock(block)
	if err != nil {
		t.Fatalf("parseDLBlock error: %v", err)
	}
	t.Logf("nodes: %+v", nodes)
}

func TestParseNetscapeBookmarks(t *testing.T) {
	raw := `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
<DT><H3>Imported</H3>
<DL><p>
<DT><A HREF="https://foo.com">Foo</A>
</DL><p>
</DL><p>`

	nodes, err := ParseNetscapeBookmarks(raw)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(nodes) != 1 {
		t.Fatalf("expected 1 root node, got %d", len(nodes))
	}
	if nodes[0].Name != "Imported" || nodes[0].Type != "folder" {
		t.Fatalf("unexpected folder: %+v", nodes[0])
	}
	if len(nodes[0].Children) != 1 {
		t.Fatalf("expected 1 child, got %d", len(nodes[0].Children))
	}
	if nodes[0].Children[0].URL != "https://foo.com" {
		t.Fatalf("unexpected child: %+v", nodes[0].Children[0])
	}
}
