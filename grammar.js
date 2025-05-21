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

    // HTML elements (keep unchanged)
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

    // Raw directive with simpler structure
    raw_directive: $ => seq(
      '@',
      $.directive_name,
      optional(choice(
        $.directive_property_access,
        $.directive_params
      ))
    ),

    directive_name: $ => $.identifier,

    directive_property_access: $ => seq(
      '.',
      $.property_name,
      optional($.directive_params)
    ),

    property_name: $ => $.identifier,

    directive_params: $ => seq(
      '(',
      optional($.params_content),
      ')'
    ),

    params_content: $ => /[^)]*/,

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

    // Fixed each directive for @each(item in items) syntax
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
        '{{',
        optional($.expression),
        '}}'
      ),
      seq(
        '{{{',
        optional($.expression),
        '}}}'
      )
    ),

    // Expression system
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
