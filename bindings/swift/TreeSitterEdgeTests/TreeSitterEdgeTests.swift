import XCTest
import SwiftTreeSitter
import TreeSitterEdge

final class TreeSitterEdgeTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_edge())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Edge grammar")
    }
}
