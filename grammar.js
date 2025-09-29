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
    html_tag: ($) =>
      choice(
        $.start_tag,
        $.end_tag,
        $.self_closing_tag,
        $.style_element,
        $.script_element
      ),
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

    // Special handling for style tags to properly parse CSS content
    style_element: ($) =>
      seq(
        "<",
        alias("style", $.tag_name),
        repeat(choice($.attribute, $.standalone_expression)),
        ">",
        optional($.css_content),
        "</",
        alias("style", $.tag_name),
        ">"
      ),

    // Special handling for script tags to properly parse JavaScript content
    script_element: ($) =>
      seq(
        "<",
        alias("script", $.tag_name),
        repeat(choice($.attribute, $.standalone_expression)),
        ">",
        optional($.js_content),
        "</",
        alias("script", $.tag_name),
        ">"
      ),

    // CSS content inside style tags
    css_content: ($) => token(prec(-2, /[^<]+/)),

    // JavaScript content inside script tags
    js_content: ($) => token(prec(-2, /[^<]+/)),

    doctype: ($) => seq("<!DOCTYPE", /\s+/, "html", ">"),
    tag_name: ($) => /[a-zA-Z][a-zA-Z0-9_\-:]*/,

    // Regular attributes with mixed content support
    attribute: ($) =>
      seq(
        $.attribute_name,
        optional(seq("=", choice($.mixed_attribute_value, $.attribute_value)))
      ),
    attribute_name: ($) => /[a-zA-Z_:][a-zA-Z0-9_:\-\.]*/,
    attribute_value: ($) => /[^\\s"'=<>`]+/,

    // Text content inside attributes (not EdgeJS expressions)
    attribute_text: ($) => token(prec(-1, /[^"'{}]+/)),

    // Handle EdgeJS expressions inside quoted attributes
    mixed_attribute_value: ($) =>
      choice(
        seq(
          '"',
          repeat(choice($.output_expression, $.attribute_text, /[^"{}]+/)),
          '"'
        ),
        seq(
          "'",
          repeat(choice($.output_expression, $.attribute_text, /[^'{}]+/)),
          "'"
        )
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

    // Parse @end, @else as @ + keyword (consistent with @if)
    directive_keyword: ($) => seq("@", choice("end", "else", "elseif")),

    directive_name: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    directive_method: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,

    // FIXED: Simplified directive parameter parsing to avoid conflicts
    directive_params: ($) => seq("(", optional($.parameter_list), ")"),
    parameter_list: ($) => choice($.each_parameter, $.complex_parameter), // Support each directive with 'in' syntax

    // Each parameter pattern: item in items
    each_parameter: ($) =>
      seq($.identifier, /\s+/, "in", /\s+/, $.js_expression),

    // Complex parameter that handles JavaScript expressions
    complex_parameter: ($) => $.js_expression,

    // Enhanced JavaScript expression support
    js_expression: ($) =>
      choice(
        $.function_call,
        $.member_expression,
        $.array_expression,
        $.object_expression,
        $.string_literal,
        $.template_string,
        $.number_literal,
        $.boolean_literal,
        $.null_literal,
        $.identifier,
        $.ternary_expression,
        $.binary_expression
      ),

    // Function call with arguments
    function_call: ($) =>
      seq(
        choice($.identifier, $.member_expression),
        "(",
        optional($.argument_list),
        ")"
      ),

    // Argument list in function calls
    argument_list: ($) =>
      seq($.js_expression, repeat(seq(",", $.js_expression))),

    // Member expression like obj.method or obj.property
    member_expression: ($) =>
      prec.left(
        seq(
          choice($.identifier, $.function_call, $.member_expression),
          repeat1(seq(".", $.identifier))
        )
      ),

    // Array expression
    array_expression: ($) => seq("[", optional($.array_elements), "]"),

    array_elements: ($) =>
      seq($.js_expression, repeat(seq(",", $.js_expression))),

    // Object expression
    object_expression: ($) => seq("{", optional($.object_properties), "}"),

    object_properties: ($) =>
      seq($.object_property, repeat(seq(",", $.object_property))),

    object_property: ($) =>
      seq(
        choice($.identifier, $.string_literal, $.number_literal),
        ":",
        $.js_expression
      ),

    // Literals
    string_literal: ($) =>
      choice(
        seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),
        seq("'", repeat(choice(/[^'\\]/, /\\./)), "'")
      ),

    template_string: ($) =>
      seq(
        "`",
        repeat(choice(/[^`\\$]/, /\\./, seq("${", $.js_expression, "}"))),
        "`"
      ),

    number_literal: ($) => /-?\d+(\.\d+)?/,

    boolean_literal: ($) => choice("true", "false"),

    null_literal: ($) => "null",

    identifier: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,

    ternary_expression: ($) =>
      prec.left(
        seq($.js_expression, "?", $.js_expression, ":", $.js_expression)
      ),

    binary_expression: ($) =>
      prec.left(
        -1, // Lower precedence than ternary
        seq(
          $.js_expression,
          choice(
            "||",
            "&&",
            "==",
            "!=",
            "<",
            ">",
            "<=",
            ">=",
            "+",
            "-",
            "*",
            "/",
            "%"
          ),
          $.js_expression
        )
      ),

    // param_value: ($) =>
    //   choice(
    //     $.param_member_expression,
    //     $.param_object,
    //     $.param_string,
    //     $.param_number,
    //     $.param_identifier
    //   ),
    // param_member_expression: ($) =>
    //   seq($.param_identifier, repeat1(seq(".", $.param_identifier))),
    // param_object: ($) =>
    //   seq(
    //     "{",
    //     optional(
    //       choice(
    //         $.param_identifier,
    //         seq($.param_property, repeat(seq(",", $.param_property)))
    //       )
    //     ),
    //     "}"
    //   ),
    // param_property: ($) =>
    //   seq(choice($.param_identifier, $.param_string), ":", $.param_value),
    // param_identifier: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    // param_string: ($) => choice(seq("'", /[^']*/, "'"), seq('"', /[^"]*/, '"')),
    // param_number: ($) => /\d+(\.\d+)?/,

    // Enhanced expression parsing for {{ }} expressions
    output_expression: ($) =>
      choice(
        seq("{{", optional($.js_expression), "}}"),
        seq("{{{", optional($.js_expression), "}}}")
      ),
    comment: ($) =>
      token(
        prec(4, seq("{{--", repeat(choice(/[^-]+/, /-[^-]/, /--[^}]/)), "--}}"))
      ),
    text_content: ($) => token(prec(-1, /[^<@{]+/)),
  },
});
