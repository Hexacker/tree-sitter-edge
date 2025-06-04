module.exports = grammar({
  name: "edge",
  extras: ($) => [/\s/],
  rules: {
    source_file: ($) => repeat($._content),
    _content: ($) =>
      choice(
        $.comment,
        $.doctype,
        $.html_tag,
        $.directive,
        $.output_expression,
        $.text_content
      ),
    html_tag: ($) => choice($.start_tag, $.end_tag, $.self_closing_tag),
    start_tag: ($) =>
      seq(
        "<",
        $.tag_name,
        repeat(choice($.attribute, $.standalone_expression)),
        ">"
      ),
    end_tag: ($) => seq("</", $.tag_name, ">"),
    self_closing_tag: ($) =>
      seq(
        "<",
        $.tag_name,
        repeat(choice($.attribute, $.standalone_expression)),
        "/>"
      ),
    doctype: ($) => seq("<!DOCTYPE", /\s+/, "html", ">"),
    tag_name: ($) => /[a-zA-Z][a-zA-Z0-9_\-:]*/,

    // Regular attributes
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

    // NEW: Standalone EdgeJS expressions as attributes
    standalone_expression: ($) => $.output_expression,

    directive: ($) => choice($.directive_statement, $.directive_keyword),
    directive_statement: ($) =>
      seq(
        "@",
        optional("!"),
        choice($.directive_component, $.directive_name),
        optional($.directive_params)
      ),
    directive_component: ($) => seq($.directive_name, ".", $.directive_method),
    directive_keyword: ($) => choice("@end", "@else", "@elseif"),
    directive_name: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    directive_method: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,

    // ENHANCED: More flexible parameter parsing
    directive_params: ($) => seq("(", optional($.parameter_list), ")"),
    parameter_list: ($) =>
      choice(
        $.single_parameter,
        $.parameter_sequence,
        $.each_parameter,
        $.comparison_expression
      ),
    single_parameter: ($) => $.param_value,
    parameter_sequence: ($) =>
      seq($.param_value, repeat1(seq(",", $.param_value))),
    each_parameter: ($) => seq($.param_identifier, "in", $.param_value),

    // NEW: Handle comparison expressions like (type === 'password')
    comparison_expression: ($) =>
      seq(
        $.param_value,
        choice("===", "==", "!=", "!==", "<", ">", "<=", ">="),
        $.param_value
      ),

    param_value: ($) =>
      choice(
        $.param_member_expression,
        $.param_object,
        $.param_string,
        $.param_number,
        $.param_identifier
      ),
    param_member_expression: ($) =>
      seq($.param_identifier, repeat1(seq(".", $.param_identifier))),
    param_object: ($) =>
      seq(
        "{",
        optional(
          choice(
            $.param_identifier,
            seq($.param_property, repeat(seq(",", $.param_property)))
          )
        ),
        "}"
      ),
    param_property: ($) =>
      seq(choice($.param_identifier, $.param_string), ":", $.param_value),
    param_identifier: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    param_string: ($) => choice(seq("'", /[^']*/, "'"), seq('"', /[^"]*/, '"')),
    param_number: ($) => /\d+(\.\d+)?/,

    // ENHANCED: Better expression parsing for complex JavaScript
    output_expression: ($) =>
      choice(
        seq("{{", optional($.expression_content), "}}"),
        seq("{{{", optional($.expression_content), "}}}")
      ),
    expression_content: ($) =>
      choice(
        prec(3, $.ternary_expression), // Highest precedence for ternary
        prec(2, $.binary_expression), // Binary operators like ||
        prec(1, $.function_call), // Function calls
        $.member_expression, // Member access
        $.identifier // Simple identifiers
      ),

    // NEW: Ternary expressions (condition ? true : false)
    ternary_expression: ($) =>
      seq(
        choice($.identifier, $.member_expression),
        "?",
        choice($.param_string, $.identifier, $.member_expression),
        ":",
        choice($.param_string, $.identifier, $.member_expression)
      ),

    // NEW: Binary expressions (a || b)
    binary_expression: ($) =>
      seq(
        choice($.identifier, $.member_expression),
        choice("||", "&&"),
        choice($.param_string, $.identifier, $.member_expression)
      ),

    function_call: ($) => seq($.identifier, "(", optional(/[^)]*/), ")"),
    member_expression: ($) =>
      seq($.identifier, repeat1(seq(".", $.identifier))),
    identifier: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    comment: ($) =>
      token(
        prec(4, seq("{{--", repeat(choice(/[^-]+/, /-[^-]/, /--[^}]/)), "--}}"))
      ),
    text_content: ($) => token(prec(-1, /[^<@{]+/)),
  },
});
