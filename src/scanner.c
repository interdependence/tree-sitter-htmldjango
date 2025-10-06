#include "tree_sitter/parser.h"
#include <wctype.h>

enum TokenType {
    PAIRED_COMMENT_CONTENT
};

static void advance(TSLexer *lexer) {
    lexer->advance(lexer, false);
}

static bool scan_str(TSLexer *lexer, const char *str) {
    for (int i = 0; str[i] != '\0'; i++) {
        if (lexer->lookahead == str[i]) {
            advance(lexer);
        } else {
            return false;
        }
    }
    return true;
}

bool tree_sitter_htmldjango_external_scanner_scan(
    void *payload,
    TSLexer *lexer,
    const bool *valid_symbols
) {
    if (valid_symbols[PAIRED_COMMENT_CONTENT]) {
        int depth = 0;
        while (lexer->lookahead != 0) {
            lexer->mark_end(lexer);

            if (lexer->lookahead == '{') {
                advance(lexer);

                if (lexer->lookahead == '%') {
                    advance(lexer);

                    while (iswspace(lexer->lookahead)) advance(lexer);

                    if (scan_str(lexer, "comment")) {
                        depth++;
                        continue;
                    }

                    if (scan_str(lexer, "endcomment")) {
                        if (depth == 0) {
                            lexer->result_symbol = PAIRED_COMMENT_CONTENT;
                            return true;
                        }
                        depth--;
                    }
                }
            }

            advance(lexer);
        }
    }

    return false;
}

void *tree_sitter_htmldjango_external_scanner_create() {
    return NULL;
}

void tree_sitter_htmldjango_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_htmldjango_external_scanner_serialize(void *payload, char *buffer) {
    return 0;
}

void tree_sitter_htmldjango_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}
