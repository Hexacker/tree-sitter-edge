{
  "targets": [
    {
      "target_name": "tree_sitter_edge_binding",
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "src"
      ],
      "sources": [
        "bindings/node/binding.cc",
        "src/parser.c"
      ],
      "cflags_c": [
        "-std=c99",
      ]
    }
  ]
}
