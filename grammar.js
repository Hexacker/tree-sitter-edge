// tree-sitter-edge/grammar.js
module.exports = grammar({
  name: 'edge',

  extras: $ => [/\s/, $.comment],

  rules: {
    source_file: $ => repeat($._node),

    _node: $ => choice(
      $.directive,
      $.output_expression,
      $.html_element,
      $.comment,
      $.text
    ),

    // DIRECTIVES
    directive: $ => choice(
      $.special_directive,
      $.raw_directive
    ),

    // IMPORTANT: Raw directive now handles full expressions
    raw_directive: $ => seq(
      '@',
      choice(
        // Property access: @layout.dashboard()
        seq($.identifier, '.', $.identifier, optional($.param_list)),
        // Method call: @flashMessage('notification')
        seq($.identifier, $.param_list)
      )
    ),

    special_directive: $ => choice(
      $.if_directive,
      $.each_directive,
      // [Other directives...]
    ),

    // [Other directive definitions]

    param_list: $ => seq(
      '(',
      optional($.expression_list),
      ')'
    ),

    expression_list: $ => seq(
      $.expression,
      repeat(seq(',', $.expression))
    ),

    // OUTPUT EXPRESSIONS
    output_expression: $ => choice(
      seq('{{', optional($.expression), '}}'),
      seq('{{{', optional($.expression), '}}}')
    ),

    // EXPRESSIONS
    expression: $ => choice(
      $.property_expression,
      $.method_call,
      $.identifier,
      $.string
    ),

    property_expression: $ => seq(
      choice($.identifier, $.method_call),
      '.',
      $.identifier
    ),

    method_call: $ => seq(
      $.identifier,
      '(',
      optional($.expression_list),
      ')'
    ),

    // BASIC ELEMENTS
    identifier: $ => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    string: $ => choice(
      seq("'", /[^']*/, "'"),
      seq('"', /[^"]*/, '"')
    ),
    text: $ => /[^<@{]+/,
    comment: $ => choice(
      seq('{{--', /.*/, '--}}'),
      seq('<!--', /.*/, '-->')
    ),

    // [HTML element rules...]
    html_element: $ => /[^@{}]+/  // Simplified for testing
  }
});
