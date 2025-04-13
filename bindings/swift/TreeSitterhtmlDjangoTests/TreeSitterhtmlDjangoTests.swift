import XCTest
import SwiftTreeSitter
import TreeSitterHtmldjango

final class TreeSitterHtmldjangoTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_htmldjango())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Htmldjango grammar")
    }
}
