use tree_sitter::Language;

extern "C" {
    fn tree_sitter_edge() -> Language;
}

pub fn language() -> Language {
    unsafe { tree_sitter_edge() }
}
