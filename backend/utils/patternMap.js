function getPattern(tags) {
  if (!tags) return "General";

  if (tags.includes("Sliding Window")) return "Sliding Window";
  if (tags.includes("Two Pointers")) return "Two Pointers";
  if (tags.includes("Dynamic Programming")) return "DP";
  if (tags.includes("Graph")) return "Graph";
  if (tags.includes("Tree")) return "Tree";
  if (tags.includes("Array")) return "Array";

  return "General";
}

module.exports = { getPattern };