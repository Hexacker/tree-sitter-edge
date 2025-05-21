try {
  module.exports = require("../../build/Release/tree_sitter_edge_binding.node");
} catch (error) {
  try {
    module.exports = require("../../build/Debug/tree_sitter_edge_binding.node");
  } catch (_) {
    throw error;
  }
}

try {
  module.exports.nodeTypeInfo = require("../../src/node-types.json");
} catch (_) {}
