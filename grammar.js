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

    directive_params: ($) => seq("(", optional($.parameter_list), ")"),

    parameter_list: ($) =>
      choice($.single_parameter, $.parameter_sequence, $.each_parameter),

    single_parameter: ($) => $.param_value,

    parameter_sequence: ($) =>
      seq($.param_value, repeat1(seq(",", $.param_value))),

    each_parameter: ($) => seq($.param_identifier, "in", $.param_value),

    param_value: ($) =>
      choice(
        $.param_member_expression,
        $.param_object,
        $.param_array,
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
            $.param_identifier, // For {provider} shorthand
            seq($.param_property, repeat(seq(",", $.param_property)))
          )
        ),
        "}"
      ),

    param_array: ($) =>
      seq(
        "[",
        optional(seq($.param_value, repeat(seq(",", $.param_value)))),
        "]"
      ),

    param_property: ($) =>
      seq(choice($.param_identifier, $.param_string), ":", $.param_value),

    param_identifier: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    param_string: ($) => choice(seq("'", /[^']*/, "'"), seq('"', /[^"]*/, '"')),
    param_number: ($) => /\d+(\.\d+)?/,

    // Simplified output expressions
    output_expression: ($) =>
      choice(
        seq("{{", optional($.expression_content), "}}"),
        seq("{{{", optional($.expression_content), "}}}")
      ),

    // Expression content - keep it simple but functional
    expression_content: ($) =>
      choice(
        $.expression_function_call,
        $.expression_member,
        $.expression_identifier
      ),

    // Function calls like route(), csrfField()
    expression_function_call: ($) =>
      seq(
        $.expression_identifier,
        "(",
        optional(/[^)]*/), // Simple argument capture
        ")"
      ),

    // Member expressions like user.name, auth.user.firstName
    expression_member: ($) =>
      seq($.expression_identifier, repeat1(seq(".", $.expression_identifier))),

    // Simple identifiers
    expression_identifier: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,

    comment: ($) =>
      token(
        prec(4, seq("{{--", repeat(choice(/[^-]+/, /-[^-]/, /--[^}]/)), "--}}"))
      ),

    text_content: ($) => token(prec(-1, /[^<@{]+/)),
  },
});
