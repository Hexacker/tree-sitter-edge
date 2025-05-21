package tree_sitter_edge_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_edge "github.com/hexacker/tree-sitter-edge/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_edge.Language())
	if language == nil {
		t.Errorf("Error loading Edge grammar")
	}
}
