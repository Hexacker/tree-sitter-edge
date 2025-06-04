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

    // Standalone EdgeJS expressions as attributes
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

    // SIMPLIFIED: Parse directive parameters as expressions with basic structure
    directive_params: ($) => seq("(", optional($.parameter_list), ")"),
    parameter_list: ($) =>
      choice(
        $.each_parameter, // Special case: @each(item in items)
        $.simple_expression // Everything else as simple expression
      ),

    each_parameter: ($) => seq($.param_identifier, "in", $.param_value),

    // SIMPLIFIED: Parse complex expressions as structured tokens
    simple_expression: ($) =>
      choice(
        $.assignment_statement, // @let(var = value)
        $.function_call_param, // function(args)
        $.comparison_statement, // a === b, a > b
        $.ternary_statement, // a ? b : c
        $.parameter_sequence, // a, b, c
        $.single_parameter // simple value
      ),

    // Handle @let(variable = value)
    assignment_statement: ($) =>
      seq(
        $.variable_name,
        "=",
        /[^)]*/ // Capture everything until closing paren
      ),

    // Handle function calls in parameters
    function_call_param: ($) => seq($.helper_name, "(", optional(/[^)]*/), ")"),

    // Handle comparisons like type === 'password'
    comparison_statement: ($) =>
      seq(
        $.param_identifier,
        choice("===", "==", "!==", "!=", ">", "<", ">=", "<="),
        /[^)]*/ // Rest of expression
      ),

    // Handle ternary expressions
    ternary_statement: ($) =>
      seq(
        $.param_identifier,
        "?",
        /[^)]*/ // Rest of ternary
      ),

    // Variable names (for assignments)
    variable_name: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,

    // Helper function names
    helper_name: ($) =>
      choice(
        "old",
        "route",
        "url",
        "asset",
        "csrf",
        "csrfField",
        $.param_identifier
      ),

    single_parameter: ($) => $.param_value,
    parameter_sequence: ($) =>
      seq($.param_value, repeat1(seq(",", $.param_value))),
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

    // Enhanced expression parsing for {{ }} expressions
    output_expression: ($) =>
      choice(
        seq("{{", optional($.expression_content), "}}"),
        seq("{{{", optional($.expression_content), "}}}")
      ),
    expression_content: ($) =>
      choice(
        prec(3, $.ternary_expression_output),
        prec(2, $.binary_expression),
        prec(1, $.function_call),
        $.member_expression,
        $.identifier
      ),

    // Ternary expressions in output (condition ? true : false)
    ternary_expression_output: ($) =>
      seq(
        choice($.identifier, $.member_expression),
        "?",
        choice($.param_string, $.identifier, $.member_expression),
        ":",
        choice($.param_string, $.identifier, $.member_expression)
      ),

    // Binary expressions (a || b)
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
