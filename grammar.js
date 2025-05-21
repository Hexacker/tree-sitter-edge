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
      $.output_expression,
      $.comment,
      $.raw_text
    ),

    // HTML elements (keep the same)
    element: $ => choice(
      seq(
        $.open_tag,
        repeat($._node),
        $.close_tag
      ),
      $.self_closing_tag
    ),

    // Keep all your HTML tag related rules...

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

    // Simple structure for raw directives - just parse the @ part for now
    raw_directive: $ => seq(
      '@',
      $.raw_directive_content
    ),

    // Use a regex to match the rest of the directive, to be split later for highlighting
    raw_directive_content: $ => /[a-zA-Z_$][a-zA-Z0-9_$\.]*(?:\([^)]*\))?/,

    // Keep all your other directives unchanged

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
      $.each_params,
      $.directive_content,
      '@end'
    ),

    each_params: $ => seq(
      '(',
      $.identifier,
      'in',
      $.expression,
      ')'
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
      optional($.expression),
      ')'
    ),

    directive_content: $ => repeat1($._node),

    // Output expressions with explicit bracket nodes
    output_expression: $ => choice(
      seq(
        alias('{{', $.output_open),
        optional($.expression),
        alias('}}', $.output_close)
      ),
      seq(
        alias('{{{', $.output_open_unescaped),
        optional($.expression),
        alias('}}}', $.output_close_unescaped)
      )
    ),

    // Expression system (keep the same)
    expression: $ => choice(
      $.member_expression,
      $.method_call,
      $.identifier,
      $.string,
      $.number
    ),

    member_expression: $ => prec.left(1, seq(
      choice(
        $.identifier,
        $.method_call,
        $.member_expression
      ),
      '.',
      $.identifier
    )),

    method_call: $ => seq(
      choice(
        $.identifier,
        $.member_expression
      ),
      '(',
      optional($.argument_list),
      ')'
    ),

    argument_list: $ => seq(
      $.expression,
      repeat(seq(',', $.expression))
    ),

    // Simple terms
    identifier: $ => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    string: $ => choice(
      seq("'", /[^']*/, "'"),
      seq('"', /[^"]*/, '"')
    ),
    number: $ => /\d+(\.\d+)?/,

    comment: $ => choice(
      seq('{{--', /[^-]*(-[^-}])*/, '--}}'),
      seq('<!--', /[^-]*(-[^-])*/, '-->')
    ),

    raw_text: $ => /[^<@{]+/
  }
});
