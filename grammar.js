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
      $.escaped_output,    // Double curly braces {{ }}
      $.unescaped_output,  // Triple curly braces {{{ }}}
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
      $.raw_directive
    ),

    // Edge Helpers
    edge_helper: $ => choice(
      'layout',
      'flashMessage',
      'include',
      'component',
      // Add other built-in EdgeJS helpers
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

    output_expression: $ => choice(
      seq('{{', optional($.js_expression), '}}'),
      seq('{{{', optional($.js_expression), '}}}')
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

    raw_directive: $ => seq(
      '@',
      choice(
        $.full_expression,
        $.identifier
      )
    ),

    // Add this new rule
    full_expression: $ => choice(
      seq($.identifier, '.', $.identifier, optional($.directive_params)),
      seq($.identifier, $.directive_params)
    ),

    directive_content: $ => repeat1($._node),

    // Output expressions - separate rules for escaped and unescaped output
    escaped_output: $ => seq(
      '{{',
      optional($.js_expression),
      '}}'
    ),

    unescaped_output: $ => seq(
      '{{{',
      optional($.js_expression),
      '}}}'
    ),

    // JavaScript expressions
    js_expression: $ => choice(
      $.identifier,
      $.property_access,
      $.method_call,
      $.string_literal,
      $.number
    ),

    identifier: $ => /[a-zA-Z_$][a-zA-Z0-9_$]*/,

    property_access: $ => seq(
      choice($.identifier, $.property_access, $.method_call),
      '.',
      $.identifier
    ),

    method_call: $ => seq(
      choice($.identifier, $.property_access),
      '(',
      optional($.method_arguments),
      ')'
    ),

    method_arguments: $ => seq(
      choice(
        $.identifier,
        $.property_access,
        $.string_literal,
        $.number
      ),
      repeat(seq(
        ',',
        choice(
          $.identifier,
          $.property_access,
          $.string_literal,
          $.number
        )
      ))
    ),

    string_literal: $ => choice(
      seq("'", optional(/[^']*/), "'"),
      seq('"', optional(/[^"]*/), '"')
    ),

    number: $ => /\d+(\.\d+)?/,

    // Comments
    comment: $ => choice(
      seq('{{--', /[^-]*(-[^-}])*/, '--}}'),
      seq('<!--', /[^-]*(-[^-])*/, '-->')
    ),

    raw_text: $ => /[^<@{]+/
  }
});
