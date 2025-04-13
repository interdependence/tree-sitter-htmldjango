package tree_sitter_htmldjango_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_htmldjango "github.com/interdependence/tree-sitter-htmldjango/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_htmldjango.Language())
	if language == nil {
		t.Errorf("Error loading Htmldjango grammar")
	}
}
