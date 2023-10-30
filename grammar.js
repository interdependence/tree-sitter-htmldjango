module.exports = grammar({
  name: "htmldjango",

  // Handle whitespace explicitly
  extras: $ => [],

  rules: {
    template: $ => repeat(
      $._node
    ),

    _node: $ => choice(
      $._expression,
      $._statement,
      $._comment,
      $.content,
      /\s+/
    ),

    // General rules
    keyword: $ => choice("on", "off", "with", "as", "silent", "only", "from", "random", "by"),
    operator: $ => choice("==", "!=", "<", ">", "<=", ">="),
    keyword_operator: $ => choice("and", "or", "not", "in", "not in", "is", "is not"),
    number: $ => repeat1(/[0-9]/),
    boolean: $ => choice("True", "False"),
    string: $ => seq(
      choice(
        seq("'", repeat(/[^']/), "'"),
        seq('"', repeat(/[^"]/), '"')
      ),
      repeat(seq("|", $.filter))
    ),

    _word: $ => repeat1(/[A-Za-z0-9_]/),
    _ws: $ => repeat1(" "),

    // Expressions
    _expression: $ => seq("{{", optional($._ws), $.variable, optional($._ws), "}}"),

    variable: $ => seq($.variable_name, repeat(seq("|", $.filter))),
    // Django variables cannot start with an "_", can contain one or more words separated by a "."
    variable_name: $ => seq(repeat1(/[A-Za-z]/), optional($._word), repeat(seq(".", $._word))),
   
    filter: $ => seq($.filter_name, optional(seq(":", choice($.filter_argument, $._quoted_filter_argument)))),
    filter_name: $ => $._word,
    filter_argument: $ => seq($._word, repeat(seq(".", $._word))),
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
      $.unpaired_statement,
      $.detatched_end_statement
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
        "{%", $._ws, alias(tag_name + " ", $.tag_name), optional($._ws), repeat($._attribute), "%}",
        repeat($._node),
        "{%", $._ws, "end", alias(tag_name + " ", $.tag_name), optional($._ws), repeat($._attribute), alias("%}", $.end_paired_statement))));
    },

    if_statement: $ => seq(
      "{%", $._ws, alias("if ", $.tag_name), optional($._ws), repeat($._attribute), "%}",
      repeat($._node),
      repeat(prec.left(seq(
        alias($.elif_statement, $.branch_statement),
        repeat($._node),
      ))),
      optional(seq(
        alias($.else_statement, $.branch_statement),
        repeat($._node),
      )),
      "{%", $._ws, "end", alias("if ", $.tag_name), optional($._ws), alias("%}", $.end_paired_statement)
    ),
    elif_statement: $ => seq("{%", $._ws, alias("elif ", $.tag_name), optional($._ws), repeat($._attribute), "%}"),
    else_statement: $ => seq("{%", $._ws, alias("else ", $.tag_name), optional($._ws), "%}"),

    for_statement: $ => seq(
      "{%", $._ws, alias("for ", $.tag_name), optional($._ws), repeat($._attribute), "%}",
      repeat($._node),
      optional(seq(
        alias($.empty_statement, $.branch_statement),
        repeat($._node),
      )),
      "{%", $._ws, "end", alias("for ", $.tag_name), optional($._ws), alias("%}", $.end_paired_statement)
    ),
    empty_statement: $ => seq("{%", $._ws, alias("empty ", $.tag_name), optional($._ws), repeat($._attribute), "%}"),

    filter_statement: $ => seq(
      "{%", $._ws, alias("filter ", $.tag_name), optional($._ws), $.filter, repeat(seq("|", $.filter)), $._ws, "%}",
      repeat($._node),
      "{%", $._ws, "end", alias("filter ", $.tag_name), optional($._ws), alias("%}", $.end_paired_statement)
    ),
    
    unpaired_statement: $ => seq("{%", $._ws, alias($._word, $.tag_name), $._ws, repeat($._attribute), "%}"),
    detatched_end_statement: $ => seq("{%", $._ws, "end", alias($._word, $.tag_name), $._ws, repeat($._attribute), "%}"),

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
      choice(
        $._ws,
        seq(optional($._ws), ",", optional($._ws)),
        seq(optional($._ws), "=", optional($._ws))
      )
    ),

    // Comments
    // unpaired type {# comment #}
    // paired type   {% comment optional_label %}..{% endcomment %}
    _comment: $ => choice(
      $.unpaired_comment,
      $.paired_comment
    ),
    unpaired_comment: $ => seq("{#", repeat(/.|\s/), repeat(seq(alias($.unpaired_comment, ""), repeat(/.|\s/))), "#}"),
    paired_comment: $ => seq(
      alias("{%", ""), $._ws, "comment", optional(seq($._ws, $._word)), $._ws, alias("%}", ""),
      repeat(/.|\s/),
      repeat(seq(alias($.paired_comment, ""), repeat(/.|\s/))),
      alias("{%", ""), $._ws, "endcomment", $._ws, alias("%}", "")
    ),

    // All other content
    content: $ => /([^\{]|\{[^{%#])+/
  }
});
