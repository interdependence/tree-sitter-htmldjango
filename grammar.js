module.exports = grammar({
  name: "htmldjango",

  word: $ => $._identifier,

  externals: $ => [
    $._paired_comment_content
  ],

  rules: {
    template: $ => repeat(
      $._node
    ),

    _node: $ => choice(
      $._expression,
      $._statement,
      $._comment,
      $.content
    ),

    // General rules
    keyword: $ => token(seq(
      choice(
        "on",
        "off",
        "with",
        "as",
        "silent",
        "only",
        "from",
        "random",
        "by"
      ),
      /\s/
    )),
    keyword_operator: $ => token(seq(
      choice(
        "and",
        "or",
        "not",
        "in",
        "not in",
        "is",
        "is not"
      ),
      /\s/
    )),
    operator: $ => choice("==", "!=", "<", ">", "<=", ">="),
    number: $ => /[0-9]+/,
    boolean: $ => token(seq(choice("True", "False"), /\s/)),
    string: $ => seq(
      choice(
        seq("'", repeat(/[^']/), "'"),
        seq('"', repeat(/[^"]/), '"')
      ),
      repeat(seq("|", $.filter))
    ),

    _identifier: $ => /\w+/,

    // Expressions
    _expression: $ => seq("{{", choice($.variable, $.string), "}}"),

    variable: $ => seq($.variable_name, repeat(seq("|", $.filter))),
    // Django variables cannot start with an "_", can contain one or more words separated by a "."
    variable_name: $ => /[a-zA-Z](\w+)?((\.?\w)+)?/,

    filter: $ => seq($.filter_name, optional(seq(":", choice($.filter_argument, $._quoted_filter_argument)))),
    filter_name: $ => $._identifier,
    filter_argument: $ => seq($._identifier, repeat(seq(".", $._identifier))),
    _quoted_filter_argument: $ => choice(
      seq("'", alias(repeat(/[^']/), $.filter_argument), "'"),
      seq('"', alias(repeat(/[^"]/), $.filter_argument), '"')
    ),

    // Statements
    // unpaired type {% tag %}
    // paired type   {% tag %}..{% endtag %}
    _statement: $ => choice(
      $.paired_statement,
      alias($.if_statement, $.paired_statement),
      alias($.for_statement, $.paired_statement),
      alias($.filter_statement, $.paired_statement),
      $.unpaired_statement
    ),

    paired_statement: $ => {
      const tag_names = [
        "autoescape",
        "block",
        "blocktranslate",
        "ifchanged",
        "spaceless",
        "verbatim",
        "with"
      ];

      return choice(...tag_names.map((tag_name) => seq(
        "{%", alias(tag_name, $.tag_name), repeat($._attribute), "%}",
        repeat($._node),
        "{%", alias("end" + tag_name, $.tag_name), repeat($._attribute), alias("%}", $.end_paired_statement))));
    },

    if_statement: $ => seq(
      "{%", alias("if", $.tag_name), repeat($._attribute), "%}",
      repeat($._node),
      repeat(prec.left(seq(
        alias($.elif_statement, $.branch_statement),
        repeat($._node),
      ))),
      optional(seq(
        alias($.else_statement, $.branch_statement),
        repeat($._node),
      )),
      "{%", alias("endif", $.tag_name), alias("%}", $.end_paired_statement)
    ),
    elif_statement: $ => seq("{%", alias("elif", $.tag_name), repeat($._attribute), "%}"),
    else_statement: $ => seq("{%", alias("else", $.tag_name), "%}"),

    for_statement: $ => seq(
      "{%", alias("for", $.tag_name), repeat($._attribute), "%}",
      repeat($._node),
      optional(seq(
        alias($.empty_statement, $.branch_statement),
        repeat($._node),
      )),
      "{%", alias("endfor", $.tag_name), alias("%}", $.end_paired_statement)
    ),
    empty_statement: $ => seq("{%", alias("empty", $.tag_name), repeat($._attribute), "%}"),

    filter_statement: $ => seq(
      "{%", alias("filter", $.tag_name), $.filter, repeat(seq("|", $.filter)), "%}",
      repeat($._node),
      "{%", alias("endfilter", $.tag_name), alias("%}", $.end_paired_statement)
    ),
    unpaired_statement: $ => seq("{%", alias($._identifier, $.tag_name), repeat($._attribute), "%}"),

    _attribute: $ => seq(
      choice(
        $.keyword,
        $.operator,
        $.keyword_operator,
        $.number,
        $.boolean,
        $.string,
        $.variable
      ),
      optional(choice(",", "="))
    ),

    // Comments
    // unpaired type {# comment #}
    // paired type   {% comment optional_label %}..{% endcomment %}
    _comment: $ => choice(
      $.unpaired_comment,
      $.paired_comment
    ),
    unpaired_comment: $ => token(seq("{#", /([^#]|#[^}])*/, "#}")),
    paired_comment: $ => seq(
      "{%", "comment", optional($._identifier), "%}",
      $._paired_comment_content,
      "{%", "endcomment", "%}"
    ),

    // All other content
    content: $ => /([^\{]|\{[^{%#])+/
  }
});
