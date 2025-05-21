try {
  module.exports = require("./bindings/node");
} catch (error) {
  try {
    module.exports = require("./build/Release/tree_sitter_edge_binding");
  } catch (_) {
    throw error;
  }
}

try {
  module.exports.nodeTypeInfo = require("./src/node-types.json");
} catch (_) {}
