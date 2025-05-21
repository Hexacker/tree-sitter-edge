module.exports = grammar({
  name: 'edge',

  extras: $ => [
    /\s/,
    $.comment
  ],

  rules: {
    source_file: $ => repeat($._node),

    _node: $ => choice(
      $.doctype,
      $.element,
      $.directive,
      $.escaped_output,
      $.unescaped_output,
      $.comment,
      $.raw_text
    ),

    // HTML elements
    element: $ => choice(
      seq(
        $.open_tag,
        repeat($._node),
        $.close_tag
      ),
      $.self_closing_tag
    ),

    open_tag: $ => seq(
      '<',
      $.tag_name,
      repeat($.attribute),
      '>'
    ),

    close_tag: $ => seq(
      '</',
      $.tag_name,
      '>'
    ),

    self_closing_tag: $ => seq(
      '<',
      $.tag_name,
      repeat($.attribute),
      '/>'
    ),

    doctype: $ => seq(
      '<!DOCTYPE',
      /\s+/,
      'html',
      '>'
    ),

    tag_name: $ => /[a-zA-Z][a-zA-Z0-9_\-:]*/,

    attribute: $ => seq(
      $.attribute_name,
      optional(seq(
        '=',
        choice(
          $.quoted_attribute_value,
          $.attribute_value
        )
      ))
    ),

    attribute_name: $ => /[a-zA-Z_:][a-zA-Z0-9_:\-\.]*/,
    attribute_value: $ => /[^\s"'=<>`]+/,
    quoted_attribute_value: $ => choice(
      seq('"', optional($.attribute_content), '"'),
      seq("'", optional($.attribute_content), "'")
    ),
    attribute_content: $ => /[^"']*/,

    // Edge directives
    directive: $ => choice(
      $.if_directive,
      $.each_directive,
      $.component_directive,
      $.slot_directive,
      $.include_directive,
      $.let_directive,
      $.complex_directive
    ),

    // NEW: Complex directive for @layout.dashboard() style syntax
    complex_directive: $ => seq(
      '@',
      $.complex_expression
    ),

    if_directive: $ => seq(
      '@if',
      $.directive_params,
      $.directive_content,
      optional($.else_directive),
      '@end'
    ),

    else_directive: $ => choice(
      seq('@else', $.directive_content),
      seq('@elseif', $.directive_params, $.directive_content)
    ),

    each_directive: $ => seq(
      '@each',
      $.directive_params,
      $.directive_content,
      '@end'
    ),

    component_directive: $ => seq(
      '@component',
      $.directive_params,
      $.directive_content,
      '@end'
    ),

    slot_directive: $ => seq(
      '@slot',
      $.directive_params,
      $.directive_content,
      '@end'
    ),

    include_directive: $ => seq(
      '@include',
      $.directive_params
    ),

    let_directive: $ => seq(
      '@let',
      $.directive_params
    ),

    directive_params: $ => seq(
      '(',
      optional($.js_expression),
      ')'
    ),

    directive_content: $ => repeat1($._node),

    // Output expressions
    escaped_output: $ => seq(
      '{{',
      optional($.complex_expression),
      '}}'
    ),

    unescaped_output: $ => seq(
      '{{{',
      optional($.complex_expression),
      '}}}'
    ),

    // NEW: Enhanced expression handling
    complex_expression: $ => choice(
      $.method_chain,
      $.property_chain,
      $.method_call,
      $.identifier
    ),

    property_chain: $ => seq(
      choice($.identifier, $.method_call),
      '.',
      choice($.identifier, $.property_chain, $.method_call)
    ),

    method_chain: $ => seq(
      $.method_call,
      '.',
      choice($.identifier, $.method_call, $.property_chain)
    ),

    method_call: $ => seq(
      $.identifier,
      '(',
      optional($.call_arguments),
      ')'
    ),

    call_arguments: $ => seq(
      $.argument,
      repeat(seq(',', $.argument))
    ),

    argument: $ => choice(
      $.identifier,
      $.property_chain,
      $.method_call,
      $.string_literal,
      $.number_literal
    ),

    // Simple expressions for backward compatibility
    js_expression: $ => choice(
      $.complex_expression,
      /[^){}]+/
    ),

    identifier: $ => /[a-zA-Z_$][a-zA-Z0-9_$]*/,

    string_literal: $ => choice(
      seq("'", optional(/[^']*/), "'"),
      seq('"', optional(/[^"]*/), '"')
    ),

    number_literal: $ => /\d+(\.\d+)?/,

    comment: $ => choice(
      seq('{{--', /[^-]*(-[^-}])*/, '--}}'),
      seq('<!--', /[^-]*(-[^-])*/, '-->')
    ),

    raw_text: $ => /[^<@{]+/
  }
});
