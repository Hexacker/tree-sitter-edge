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
    html_tag: ($) => choice($.start_tag, $.end_tag, $.self_closing_tag, $.style_element, $.script_element),
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
        seq('"', repeat(choice($.output_expression, $.attribute_text, /[^"{}]+/)), '"'),
        seq("'", repeat(choice($.output_expression, $.attribute_text, /[^'{}]+/)), "'")
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
    parameter_list: ($) => $.complex_parameter, // SIMPLIFIED - no choices that conflict

    // FIXED: More specific each_parameter matching - only matches when "in" is present
    // each_parameter: ($) =>
    //   seq(
    //     $.param_identifier,
    //     token(prec(10, "in")), // Higher precedence and more specific - only match if "in" is actually there
    //     $.param_value
    //   ),

    // Simple regex capture for everything else
    complex_parameter: ($) => /[^)]*/,

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
        prec(3, $.ternary_expression),
        prec(2, $.binary_expression),
        prec(1, $.function_call),
        $.member_expression,
        $.identifier
      ),

    ternary_expression: ($) =>
      seq(
        choice($.identifier, $.member_expression),
        "?",
        choice($.param_string, $.identifier, $.member_expression),
        ":",
        choice($.param_string, $.identifier, $.member_expression)
      ),

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