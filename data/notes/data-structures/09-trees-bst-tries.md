# 🌳 Trees, BSTs & Tries

*Recursion by default: define the base case and what each call returns. BST order is binary search at every node; tries index strings by prefix.*

## 🔎 Recognize it
<!-- related: ds-7, ds-8 -->

- Input is `TreeNode`, BST or trie; ask is about paths, depth, levels or subtree properties.
- Looks like a graph but edges only go parent→child with no cycles → tree; recursion beats explicit traversal.

> 🔑 Before coding, say: "this function returns ___ for the subtree rooted here".

## 🔁 Traversals
<!-- related: ds-7, ds-37 -->

| Order | Visit | Use when |
|---|---|---|
| Pre-order | node, left, right | copy / serialize, pass info down |
| In-order | left, node, right | BST → sorted sequence |
| Post-order | left, right, node | node needs children's results (height, path sums) |
| Level order | BFS with queue | per-level work, right view, min depth |

```kotlin
fun levelOrder(root: TreeNode?): List<List<Int>> {
    val out = mutableListOf<List<Int>>()
    val q = ArrayDeque<TreeNode>().apply { root?.let { add(it) } }
    while (q.isNotEmpty()) {
        out += List(q.size) {
            val n = q.removeFirst()
            n.left?.let(q::addLast); n.right?.let(q::addLast)
            n.`val`
        }
    }
    return out
}
```

> 💡 Recursion depth = height: O(log n) balanced, O(n) skewed — mention stack overflow risk.

## 🧮 Recursive patterns
<!-- related: ds-9, ds-38 -->

- **Same / symmetric tree** — compare pairs recursively (`a.left` vs `b.right` for symmetry).
- **Lowest common ancestor** — return the node if it's p or q; if both sides return non-null, current is the LCA.
- **Max path sum (tree DP)** — return best single downward branch; update global with `left + right + node`; clamp negatives to 0.
- **Delete nodes, return forest** — post-order; a deleted node's surviving children become roots.
- **Mirror** — swap children recursively.

```kotlin
var best = Int.MIN_VALUE
fun gain(n: TreeNode?): Int {
    if (n == null) return 0
    val l = maxOf(0, gain(n.left)); val r = maxOf(0, gain(n.right))
    best = maxOf(best, n.`val` + l + r)
    return n.`val` + maxOf(l, r)
}
```

## 🔢 BSTs and balancing
<!-- related: ds-8 -->

- Invariant: left subtree < node < right subtree — **entire** subtree, so validate with (min, max) bounds, not just children.
- Search / insert / delete O(h); h = O(log n) only if balanced.
- Delete with two children: replace with in-order successor, delete that.

| Balanced tree | Balance rule | Trade-off |
|---|---|---|
| AVL | subtree heights differ ≤ 1; single/double rotations | stricter → faster lookups |
| Red-black | colouring rules, ≤ 2× height ratio | fewer rotations → faster writes (TreeMap) |
| Splay | move accessed node to root | amortized O(log n), good locality |

> 🔑 Know one well enough to implement rotations: right-rotate(y) makes x = y.left the new root, y.left = x.right.

## 🔤 Tries
<!-- related: ds-22 -->

- Node = children (array of 26 or map) + `isEnd`. Insert/search O(L) for word length L.
- Wins over a hash set for **prefix** queries, autocomplete, word search on a board.

```kotlin
class Trie {
    private class Node { val next = arrayOfNulls<Node>(26); var end = false }
    private val root = Node()
    fun insert(w: String) {
        var n = root
        for (c in w) n = n.next[c - 'a'] ?: Node().also { n.next[c - 'a'] = it }
        n.end = true
    }
    private fun walk(p: String): Node? {
        var n: Node? = root
        for (c in p) n = n?.next?.get(c - 'a') ?: return null
        return n
    }
    fun search(w: String) = walk(w)?.end == true
    fun startsWith(p: String) = walk(p) != null
}
```

> 📝 Practice: [Search in a Binary Search Tree](https://leetcode.com/problems/search-in-a-binary-search-tree) · [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal) · [Same Tree](https://leetcode.com/problems/same-tree) · [Symmetric Tree](https://leetcode.com/problems/symmetric-tree) · [Delete Nodes And Return Forest](https://leetcode.com/problems/delete-nodes-and-return-forest) · [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum) · Implement Trie.
