#include <tree_sitter/parser.h>
#include <ctype.h>

enum TokenType {
  DIRECTIVE_AT,
  DIRECTIVE_NAME,
  DIRECTIVE_DOT,
  DIRECTIVE_METHOD,
  DIRECTIVE_ARGS,
};

void *tree_sitter_edge_external_scanner_create() { return NULL; }
void tree_sitter_edge_external_scanner_destroy(void *p) {}
void tree_sitter_edge_external_scanner_reset(void *p) {}
unsigned tree_sitter_edge_external_scanner_serialize(void *p, char *buffer) { return 0; }
void tree_sitter_edge_external_scanner_deserialize(void *p, const char *b, unsigned n) {}

bool tree_sitter_edge_external_scanner_scan(
  void *payload,
  TSLexer *lexer,
  const bool *valid_symbols
) {
  // Check for @ directive
  if (valid_symbols[DIRECTIVE_AT] && lexer->lookahead == '@') {
    lexer->result_symbol = DIRECTIVE_AT;
    lexer->advance(lexer, false);
    return true;
  }

  // Check for directive name after @
  if (valid_symbols[DIRECTIVE_NAME] &&
      (isalpha(lexer->lookahead) || lexer->lookahead == '_' || lexer->lookahead == '$')) {
    lexer->result_symbol = DIRECTIVE_NAME;

    while (isalnum(lexer->lookahead) || lexer->lookahead == '_' || lexer->lookahead == '$') {
      lexer->advance(lexer, false);
    }

    return true;
  }

  // Check for dot after directive name
  if (valid_symbols[DIRECTIVE_DOT] && lexer->lookahead == '.') {
    lexer->result_symbol = DIRECTIVE_DOT;
    lexer->advance(lexer, false);
    return true;
  }

  // Check for method name after dot
  if (valid_symbols[DIRECTIVE_METHOD] &&
      (isalpha(lexer->lookahead) || lexer->lookahead == '_' || lexer->lookahead == '$')) {
    lexer->result_symbol = DIRECTIVE_METHOD;

    while (isalnum(lexer->lookahead) || lexer->lookahead == '_' || lexer->lookahead == '$') {
      lexer->advance(lexer, false);
    }

    return true;
  }

  // Check for args in parentheses
  if (valid_symbols[DIRECTIVE_ARGS] && lexer->lookahead == '(') {
    lexer->result_symbol = DIRECTIVE_ARGS;
    lexer->advance(lexer, false);

    int depth = 1;
    while (depth > 0) {
      if (lexer->lookahead == 0) return false;
      if (lexer->lookahead == '(') depth++;
      if (lexer->lookahead == ')') depth--;
      lexer->advance(lexer, false);
    }

    return true;
  }

  return false;
}
