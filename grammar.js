module.exports = grammar({
  name: "edge",
  extras: ($) => [/\s/],
  conflicts: ($) => [
    [$.component_parameter, $.expression_content],
    [$.param_string, $.attribute_text],
    [$.unary_expression, $.binary_expression],
    [$.unary_expression, $.ternary_expression],
    [$.ternary_expression],
    [$.array_literal],
    [$.binary_expression],
    [$.ternary_expression, $.binary_expression]
  ],
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
    doctype: ($) => seq("<!DOCTYPE", optional(/\s+/), "html", ">"),
    tag_name: ($) => /[a-zA-Z][a-zA-Z0-9_\-:]*/,

    // Regular attributes with mixed content support
    attribute: ($) =>
      seq(
        $.attribute_name,
        optional(seq("=", choice($.mixed_attribute_value, $.attribute_value)))
      ),
    attribute_name: ($) => /[a-zA-Z_:][a-zA-Z0-9_:\-\.]*/,
    attribute_value: ($) => /[^\s"'=<>`]+/,

    // Handle EdgeJS expressions inside quoted attributes
    mixed_attribute_value: ($) =>
      choice(
        seq('"', /[^"]*/, '"'),
        seq("'", /[^']*/, "'")
      ),

    // Text content inside attributes (not EdgeJS expressions)
    attribute_text: ($) => token(prec(-1, /[^"']+|["']/)),

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

    // Directive parameter parsing with proper structure
    directive_params: ($) => seq("(", optional($.parameter_list), ")"),
    parameter_list: ($) => 
      choice(
        prec(3, $.each_parameter),
        prec(3, $.component_parameter),
        prec(2, $.let_parameter),
        prec(1, seq(
          $.expression_content,
          repeat(seq(",", $.expression_content))
        ))
      ),

    // Each parameter for @each loops
    each_parameter: ($) =>
      seq(
        $.param_identifier,
        "in",
        $.expression_content
      ),

    // Component parameter for @!component syntax
    component_parameter: ($) =>
      choice(
        seq(
          $.param_string,
          optional(seq(",", $.param_object))
        ),
        $.param_object
      ),

    // Let parameter for @let directives
    let_parameter: ($) =>
      seq(
        $.param_identifier,
        "=",
        $.expression_content
      ),

    param_value: ($) =>
      choice(
        $.param_member_expression,
        $.param_object,
        $.param_string,
        $.param_number,
        $.param_boolean,
        $.param_identifier
      ),

    // Boolean literals
    param_boolean: ($) => choice("true", "false"),
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
        prec.left(5, $.ternary_expression),
        prec.left(4, $.binary_expression),
        prec.left(3, $.function_call),
        prec.left(2, $.member_expression),
        prec.right(1, $.unary_expression),
        prec.left(0, $.array_literal),
        $.identifier,
        $.param_string,
        $.param_number
      ),

    // Unary expressions (e.g., !condition, -number)
    unary_expression: ($) =>
      seq(
        choice("!", "-", "+"),
        $.expression_content
      ),
      
    // Array literals
    array_literal: ($) =>
      seq(
        "[",
        optional(seq(
          $.expression_content,
          repeat(seq(",", $.expression_content))
        )),
        "]"
      ),

    ternary_expression: ($) =>
      seq(
        $.expression_content,
        "?",
        $.expression_content,
        ":",
        $.expression_content
      ),

    binary_expression: ($) =>
      seq(
        $.expression_content,
        choice("||", "&&", "==", "!=", "===", "!==", "<", ">", "<=", ">=", "+", "-", "*", "/", "%"),
        $.expression_content
      ),

    function_call: ($) => 
      seq(
        $.identifier, 
        "(", 
        optional(seq(
          $.expression_content,
          repeat(seq(",", $.expression_content))
        )), 
        ")"
      ),
    member_expression: ($) =>
      seq(
        choice($.identifier, $.function_call),
        repeat1(seq(".", choice($.identifier, $.function_call)))
      ),
    identifier: ($) => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    comment: ($) =>
      token(
        prec(4, seq("{{--", repeat(choice(/[^-]+/, /-[^-]/, /--[^}]/)), "--}}"))
      ),
    text_content: ($) => token(prec(-1, /[^<@{]+/)),
    
    // Special handling for style elements to properly parse CSS content
    style_element: ($) =>
      seq(
        "<",
        alias(token.immediate("style"), $.tag_name),
        repeat(choice($.attribute, $.standalone_expression)),
        ">",
        optional($.raw_text),
        "</",
        alias(token.immediate("style"), $.tag_name),
        ">"
      ),
      
    // Special handling for script elements to properly parse JavaScript content
    script_element: ($) =>
      seq(
        "<",
        alias(token.immediate("script"), $.tag_name),
        repeat(choice($.attribute, $.standalone_expression)),
        ">",
        optional($.raw_text),
        "</",
        alias(token.immediate("script"), $.tag_name),
        ">"
      ),
      
    // Raw text content for style and script tags
    raw_text: ($) => token.immediate(prec(-2, /[^<]+/)),
  },
});
