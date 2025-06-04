module.exports = grammar({
  name: "edge",

  extras: ($) => [/\s/],

  rules: {
    source_file: ($) => repeat($._content),

    _content: ($) =>
      choice(
        $.comment,
        $.doctype,
        $.html_tag, // Treat all HTML tags independently
        $.directive,
        $.output_expression,
        $.text_content
      ),

    // Remove element structure entirely - treat tags independently
    html_tag: ($) => choice($.start_tag, $.end_tag, $.self_closing_tag),

    // Individual tag types
    start_tag: ($) => seq("<", $.tag_name, repeat($.attribute), ">"),
    end_tag: ($) => seq("</", $.tag_name, ">"),
    self_closing_tag: ($) => seq("<", $.tag_name, repeat($.attribute), "/>"),

    doctype: ($) => seq("<!DOCTYPE", /\s+/, "html", ">"),
    tag_name: ($) => /[a-zA-Z][a-zA-Z0-9_\-:]*/,

    attribute: ($) =>
      seq(
        $.attribute_name,
        optional(seq("=", choice($.quoted_attribute_value, $.attribute_value)))
      ),

    attribute_name: ($) => /[a-zA-Z_:][a-zA-Z0-9_:\-\.]*/,
    attribute_value: ($) => /[^\s"'=<>`]+/,
    quoted_attribute_value: ($) =>
      choice(
        seq('"', optional(/[^"]*/), '"'),
        seq("'", optional(/[^']*/), "'")
      ),

    // EdgeJS directives
    directive: ($) => choice($.directive_statement, $.directive_keyword),

    directive_statement: ($) =>
      seq("@", $.directive_name, optional($.directive_params)),

    directive_keyword: ($) => choice("@end", "@else", "@elseif"),

    directive_name: ($) => /[a-zA-Z_$][a-zA-Z0-9_$\.]*/,
    directive_params: ($) => seq("(", optional(/[^)]*/), ")"),

    output_expression: ($) =>
      choice(
        seq("{{", optional(/[^}]*/), "}}"),
        seq("{{{", optional(/[^}]*/), "}}}")
      ),

    comment: ($) => token(prec(4, /\{\{--[\s\S]*?--\}\}/)),

    text_content: ($) => token(prec(-1, /[^<@{]+/)),
  },
});
