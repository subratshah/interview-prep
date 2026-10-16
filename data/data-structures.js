QuestionDB.register('data-structures', [
  {
    id: 'ds-1',
    type: 'data-structures',
    num: 1,
    difficulty: 'E',
    star: true,
    section: 'Arrays & Strings',
    title: 'What is the time complexity of common array operations?',
    tags: [ 'arrays', 'complexity', 'basics' ],
    related: [ 'ds-2', 'ds-3' ],
    keyPoints: `- **Access by index — O(1):** elements sit in one contiguous block, so the address is \`base + index × elementSize\`; no traversal needed
- **Search by value — O(n):** unsorted data needs a linear scan; sorted data drops to O(log n) with binary search (\`ds-16\`)
- **Insert / delete at an index — O(n):** every later element shifts one slot; at index 0 that is all n elements
- **Append / pop the tail — O(1) amortized:** a dynamic array (\`ArrayList\`, Kotlin \`MutableList\`) doubles its capacity when full, so the occasional O(n) copy is spread over n cheap appends
- Static \`IntArray\` cannot grow at all; \`IntArray\` also avoids boxing, which \`List<Int>\` pays per element

\`\`\`kotlin
val list = ArrayList<Int>(16)   // pre-size when n is known: skips the regrow copies
list.add(7)                     // O(1) amortized append
list.add(0, 3)                  // O(n): shifts everything right
list.removeAt(list.lastIndex)   // O(1): nothing to shift
val x = list[1]                 // O(1) random access
\`\`\`

- Why doubling (not +1) gives amortized O(1): total copy work over n appends is n + n/2 + n/4 + … < 2n
- Cache locality is the hidden win over linked lists: a sequential scan of an array streams through cache lines, a list chases pointers`,
    complexity: `- Access: O(1) — offset = base + index × size
- Search: O(n) unsorted, O(log n) sorted
- Insert/delete at index: O(n) shift; at the end: O(1) amortized
- Space: O(n), plus up to ~2× capacity slack for a dynamic array`,
    followUp: '**Follow-up:** Why is random access O(1)?\n> Contiguous memory — compute address directly from index.',
    redFlags: '- Thinks search is O(1)\n- Doesn\'t know why access is constant time',
    answer: '- Index access is `O(1)`: the slot is base plus index × element size in contiguous storage.\n- Lookup by value means a linear scan, `O(n)`; appending or dropping the tail is `O(1) amortized`.\n- Prefer appending or popping the tail over inserting at an index — a mid-array insert forces every later element to shift.'
  },
  {
    id: 'ds-2',
    type: 'data-structures',
    num: 2,
    difficulty: 'M',
    star: true,
    section: 'Arrays & Strings',
    title: 'Two Sum — find indices of two numbers that add to a target.',
    tags: [ 'arrays', 'hash-map', 'two-pointers' ],
    related: [ 'ds-1', 'ds-7' ],
    keyPoints: `- Brute force: check every pair with nested loops — O(n²) time, O(1) space; say it, then improve
- Optimal: one pass with a \`value → index\` map. For each \`x\`, look up \`target - x\` FIRST, then store \`x\` — checking before storing is what prevents pairing an element with itself

\`\`\`kotlin
fun twoSum(nums: IntArray, target: Int): IntArray {
    val seen = HashMap<Int, Int>()             // value -> index
    for ((i, x) in nums.withIndex()) {
        seen[target - x]?.let { return intArrayOf(it, i) }
        seen[x] = i
    }
    return intArrayOf()                        // or throw: clarify "exactly one answer?"
}
\`\`\`

- Duplicates work for free: \`[3, 3]\`, target 6 — the first 3 is stored, the second finds it
- Sorted-input variant (LC 167): two pointers from both ends, O(1) space — the reason this question carries the two-pointers tag
- Clarify: exactly one solution? return indices or values? may the same index be used twice? overflow on \`target - x\` (use Long if values are near Int bounds)`,
    complexity: '- Time: O(n²) naive nested loops; O(n) optimal single pass\n- Space: O(1) naive; O(n) for the HashMap',
    followUp: '**Follow-up:** How do you handle duplicates?\n> Map stores last seen index; check before storing to avoid self-match.',
    redFlags: '- Only knows brute force\n- Doesn\'t think of HashMap',
    answer: '- One pass over a `value → index` map: test for `target - num` first, store the value otherwise.\n- Nested-loop brute force is the fallback only when a hashmap is off the table — otherwise go straight to the map.\n- The answer is the pair of indices, not the two numbers.'
  },
  {
    id: 'ds-3',
    type: 'data-structures',
    num: 3,
    difficulty: 'M',
    star: false,
    section: 'Arrays & Strings',
    title: 'Explain the sliding window technique. Give an example.',
    tags: [ 'arrays', 'sliding-window', 'strings' ],
    related: [ 'ds-2', 'ds-1' ],
    keyPoints: `- A window \`[left, right]\` over a contiguous run: grow \`right\` one step at a time, shrink \`left\` while the window violates the constraint, record the answer when it is valid
- Works because both pointers only move forward — each index enters and leaves once, so O(n) replaces the O(n²) enumeration of every subarray
- Precondition: the constraint must be monotone in window size (shrinking a bad window eventually makes it good). Negative numbers break "sum ≥ target" windows — switch to prefix sums + map
- Example — longest substring without repeating characters (LC 3): remember each char's last index and jump \`left\` past a repeat

\`\`\`kotlin
fun lengthOfLongestSubstring(s: String): Int {
    val last = HashMap<Char, Int>()
    var left = 0; var best = 0
    for (right in s.indices) {
        val prev = last[s[right]]
        if (prev != null && prev >= left) left = prev + 1   // only jump forward
        last[s[right]] = right
        best = maxOf(best, right - left + 1)
    }
    return best
}
\`\`\`

- The \`prev >= left\` check matters: a stale index from before the window must not drag \`left\` backward
- Family: fixed size k (\`ds-55\`), at most k distinct (\`ds-32\`), minimum window substring (\`ds-70\`), window max with a deque (\`ds-63\`)`,
    complexity: `- Time: O(n) — each index enters and leaves the window at most once
- Space: O(min(n, alphabet)) for the last-seen map`,
    followUp: '**Follow-up:** When is sliding window applicable?\n> Problems asking for optimal subarray/substring satisfying a condition.',
    redFlags: '- Uses nested loops for every subarray problem',
    answer: '- Hold a window `[left, right]`: grow `right`, then pull `left` inward once the constraint breaks.\n- Reach for it whenever the instinct is to re-scan every subarray from scratch.\n- Longest substring without repeats: jump `left` past the earlier occurrence, remember the best span.'
  },
  {
    id: 'ds-4',
    type: 'data-structures',
    num: 4,
    difficulty: 'M',
    star: true,
    section: 'Linked Lists',
    title: 'How do you detect a cycle in a linked list?',
    tags: [ 'linked-list', 'two-pointers' ],
    related: [ 'ds-5', 'ds-6' ],
    keyPoints: `- Floyd's tortoise and hare: \`slow\` moves 1 node, \`fast\` moves 2. Without a cycle \`fast\` falls off the end; with one, \`fast\` gains one node per step inside the loop, so it must land on \`slow\`
- Alternative: a \`HashSet\` of visited nodes — simpler to explain, O(n) memory

\`\`\`kotlin
class ListNode(var \`val\`: Int, var next: ListNode? = null)

fun hasCycle(head: ListNode?): Boolean {
    var slow = head; var fast = head
    while (fast?.next != null) {
        slow = slow!!.next
        fast = fast.next!!.next
        if (slow === fast) return true      // identity, not value equality
    }
    return false
}

fun cycleStart(head: ListNode?): ListNode? {
    var slow = head; var fast = head
    while (fast?.next != null) {
        slow = slow!!.next; fast = fast.next!!.next
        if (slow === fast) {
            var p = head
            while (p !== slow) { p = p!!.next; slow = slow!!.next }
            return p
        }
    }
    return null
}
\`\`\`

- Why resetting one pointer to head finds the entry: if the tail before the loop has length a and they meet b nodes into a loop of length c, then 2(a + b) = a + b + kc, so a = kc − b — walking a more steps from the meeting point lands on the entry
- Compare nodes with \`===\` (reference), never by value — two different nodes can hold equal values
- Loop length: after meeting, keep one pointer still and count steps until the other returns`,
    complexity: '- Time: O(n) — Floyd\'s and the HashSet approach both\n- Space: O(1) Floyd\'s (two pointers); O(n) HashSet alternative',
    followUp: '**Follow-up:** How do you find the start of the cycle?\n> After detection, reset slow to head. Move both 1 step — they meet at cycle start.',
    redFlags: '- Only knows HashSet approach\n- Doesn\'t know Floyd\'s algorithm',
    answer: '- Floyd\'s pairing: `slow` takes 1 step, `fast` takes 2 — meeting means a loop exists.\n- Prefer it over a HashSet when memory is tight — no bookkeeping of visited nodes required.'
  },
  {
    id: 'ds-5',
    type: 'data-structures',
    num: 5,
    difficulty: 'M',
    star: false,
    section: 'Linked Lists',
    title: 'How do you reverse a linked list iteratively and recursively?',
    tags: [ 'linked-list', 'recursion' ],
    related: [ 'ds-4', 'ds-6' ],
    keyPoints: `- Iterative: \`prev = null\`, \`cur = head\`; per node save \`next\`, point \`cur.next\` at \`prev\`, advance both. \`prev\` is the new head
- Recursive: reverse the tail first, then hook the current node behind its old successor: \`head.next.next = head\`, \`head.next = null\`

\`\`\`kotlin
fun reverse(head: ListNode?): ListNode? {
    var prev: ListNode? = null
    var cur = head
    while (cur != null) {
        val next = cur.next      // save before overwriting
        cur.next = prev
        prev = cur
        cur = next
    }
    return prev
}

fun reverseRec(head: ListNode?): ListNode? {
    if (head?.next == null) return head
    val newHead = reverseRec(head.next)
    head.next!!.next = head      // old successor now points back
    head.next = null             // old head becomes the tail
    return newHead
}
\`\`\`

- Edge cases: empty list, single node — both return the input unchanged
- Recursion depth is n: a 100k-node list can throw \`StackOverflowError\` on the JVM (and the main-thread stack on Android is small), which is the practical reason the loop form is the default
- Building blocks it unlocks: reverse between m and n (LC 92), reverse in k-groups (\`ds-58\`), palindrome check (\`ds-57\`), add numbers stored MSD-first (\`ds-43\`)`,
    complexity: '- Time: O(n) — each node visited once (iterative or recursive)\n- Space: O(1) iterative (three pointers); O(n) recursive call stack',
    followUp: '**Follow-up:** Space complexity of recursive approach?\n> O(n) call stack.',
    redFlags: '- Can\'t reverse without extra space\n- Fumbles pointer manipulation under pressure',
    answer: '- Iterative relinking of `prev`/`curr`/`next` is the default — prefer it over recursion when stack depth matters.\n- Recursive: stop at null or a lone node, then set `head.next.next = head` and `head.next = null`.\n- Each node is touched once either way; recursion pays a stack cost the loop form avoids.'
  },
  {
    id: 'ds-6',
    type: 'data-structures',
    num: 6,
    difficulty: 'H',
    star: false,
    section: 'Linked Lists',
    title: 'Merge K sorted linked lists.',
    tags: [ 'linked-list', 'heap', 'divide-and-conquer' ],
    related: [ 'ds-4', 'ds-5' ],
    keyPoints: `- Min-heap keyed on node value holding at most one node per list (≤ K entries). Seed it with every non-null head; pop the smallest, append to the result, push that node's \`next\`
- A dummy head + tail pointer keeps the append branch-free

\`\`\`kotlin
import java.util.PriorityQueue

fun mergeKLists(lists: Array<ListNode?>): ListNode? {
    val heap = PriorityQueue<ListNode>(compareBy { it.\`val\` })
    lists.forEach { it?.let(heap::add) }       // skip empty lists
    val dummy = ListNode(0)
    var tail = dummy
    while (heap.isNotEmpty()) {
        val node = heap.poll()
        tail.next = node
        tail = node
        node.next?.let(heap::add)
    }
    return dummy.next
}
\`\`\`

- Each of the n total nodes is pushed and popped once at O(log K) → O(n log K)
- Divide and conquer is the equal-complexity alternative: merge lists pairwise in rounds (K → K/2 → …), log K rounds of O(n) work, no heap, O(log K) recursion or O(1) iterative
- Sequential merging (merge list 1 with 2, the result with 3, …) re-walks the growing result every time → O(nK)
- Edge cases: empty array, all lists null, lists of very different lengths`,
    complexity: '- Time: O(n log K) — n total nodes across K lists; each node enters and leaves the heap once\n- Space: O(K) for the min-heap',
    followUp: '**Follow-up:** Why is this better than sequential merging?\n> Sequential pair merging is O(nK). Heap keeps the comparison cost to O(log K) per element.',
    redFlags: '- Proposes O(nK) naive solution\n- Doesn\'t think of heap for multi-way merge',
    answer: '- Priority queue of the current head from each list: pop the minimum, append it, push that node\'s successor.\n- Prefer this over pairwise sequential merges — the heap keeps the per-element cost logarithmic in `K`, not `K` itself.'
  },
  {
    id: 'ds-7',
    type: 'data-structures',
    num: 7,
    difficulty: 'M',
    star: true,
    section: 'Trees & Graphs',
    title: 'What are BFS and DFS? When do you use each?',
    tags: [ 'trees', 'graphs', 'bfs', 'dfs' ],
    related: [ 'ds-8', 'ds-9' ],
    keyPoints: `- **BFS** (queue): visits nodes in order of distance from the source, one level at a time. First time you reach a node = fewest edges → shortest path in an UNWEIGHTED graph, level-order output, "minimum moves" puzzles, multi-source spread (\`ds-76\`)
- **DFS** (stack or recursion): goes as deep as possible, then backtracks. Use for reachability, connected components, cycle detection (three colours in a directed graph), topological order (post-order reversed), tree pre/in/post-order, backtracking
- Mark visited when you ENQUEUE in BFS — marking on dequeue lets the same node enter the queue many times

\`\`\`kotlin
fun bfs(adj: List<List<Int>>, src: Int): IntArray {
    val dist = IntArray(adj.size) { -1 }
    val q = ArrayDeque<Int>()
    dist[src] = 0; q.addLast(src)
    while (q.isNotEmpty()) {
        val u = q.removeFirst()
        for (v in adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.addLast(v) }
    }
    return dist                                 // -1 = unreachable
}

fun dfs(adj: List<List<Int>>, u: Int, seen: BooleanArray) {
    seen[u] = true
    for (v in adj[u]) if (!seen[v]) dfs(adj, v, seen)
}
\`\`\`

- Both are O(V + E) with an adjacency list (O(V²) with a matrix)
- Space: BFS holds a whole frontier — up to the widest level; DFS holds the current path — up to the depth. On a tree: BFS O(w), DFS O(h)
- Deep graphs (a 10⁵-node chain) overflow the recursion stack: switch DFS to an explicit \`ArrayDeque\` stack
- Weighted edges break BFS's shortest-path guarantee → Dijkstra (\`ds-21\`), or 0-1 BFS with a deque when weights are 0/1`,
    complexity: '- Time: O(V + E) for both BFS and DFS\n- Space: BFS O(w) queue (max width); DFS O(h) stack/recursion (max depth)',
    followUp: '**Follow-up:** Space complexity of BFS vs DFS on a tree?\n> BFS: O(w) max width. DFS: O(h) height. Balanced tree favors DFS; wide shallow tree favors BFS.',
    redFlags: '- Can implement only one\n- Doesn\'t know when to choose each',
    answer: '- BFS drives a queue outward per level — best for unweighted shortest paths and level-order output.\n- DFS uses a stack or recursion — cycle checks, topological order, reachability, pre/in/post-order.\n- Pick DFS for a deep, narrow graph and BFS for a wide, shallow one — the space profile decides, not raw speed.'
  },
  {
    id: 'ds-8',
    type: 'data-structures',
    num: 8,
    difficulty: 'M',
    star: true,
    section: 'Trees & Graphs',
    title: 'Validate a Binary Search Tree.',
    tags: [ 'trees', 'bst', 'recursion' ],
    related: [ 'ds-7', 'ds-9' ],
    keyPoints: `- Wrong: compare each node only with its two children — a deep node can still violate a bound set by a grandparent
- Correct: carry an open interval \`(min, max)\` down the tree. Going left tightens \`max\` to the node's value; going right tightens \`min\`. Every node must satisfy \`min < val < max\`
- Use \`Long\` bounds (or nullable bounds) so a node holding \`Int.MIN_VALUE\` / \`Int.MAX_VALUE\` is not rejected by the sentinel

\`\`\`kotlin
class TreeNode(var \`val\`: Int, var left: TreeNode? = null, var right: TreeNode? = null)

fun isValidBST(root: TreeNode?): Boolean {
    fun ok(n: TreeNode?, lo: Long, hi: Long): Boolean {
        if (n == null) return true
        val v = n.\`val\`.toLong()
        if (v <= lo || v >= hi) return false
        return ok(n.left, lo, v) && ok(n.right, v, hi)
    }
    return ok(root, Long.MIN_VALUE, Long.MAX_VALUE)
}
\`\`\`

- Alternative: an in-order traversal of a valid BST is strictly increasing — track the previous value and fail on \`prev >= cur\`; same O(n)/O(h)
- Clarify duplicates: LC 98 treats equal values as invalid (strict \`<\`); some definitions allow equals on one side
- Counterexample to quote: root 10, left 5, and 5's right child 12 — 12 > 5 passes the child check but 12 > 10 breaks the root's bound`,
    complexity: '- Time: O(n) — every node visited once\n- Space: O(h) recursion for min/max bounds; O(n) worst case for a skewed tree',
    followUp: '**Follow-up:** Why doesn\'t comparing only children work?\n> A right-subtree node must be greater than ALL ancestors, not just its parent.',
    redFlags: '- Uses the naive children-only comparison\n- Misses subtree-bound violations: with [10,5,15] give 5 a right child 12 — children-only checks pass (12 > 5) but 12 < 10 violates the root\'s bound',
    answer: '- Thread a `min`/`max` window down the tree: going left lowers max, going right raises min.\n- Trap: comparing a node with only its two children misses limits imposed further up.\n- Flag unprompted that a skewed tree turns the recursion stack linear — that is the complexity story interviewers probe for.'
  },
  {
    id: 'ds-9',
    type: 'data-structures',
    num: 9,
    difficulty: 'H',
    star: false,
    section: 'Trees & Graphs',
    title: 'Find the Lowest Common Ancestor of two nodes in a binary tree.',
    tags: [ 'trees', 'recursion', 'bst' ],
    related: [ 'ds-7', 'ds-8' ],
    keyPoints: `- Define what the call returns: "p, q, or their LCA if found in this subtree, else null"
- Base case: \`root\` is null, \`p\` or \`q\` → return \`root\`. Recurse both sides. Both non-null → \`p\` and \`q\` split here, so \`root\` is the LCA. One non-null → pass it up
- The ancestor case falls out naturally: if \`p\` is an ancestor of \`q\`, the search returns \`p\` before ever reaching \`q\`, and \`p\` is the right answer

\`\`\`kotlin
fun lca(root: TreeNode?, p: TreeNode, q: TreeNode): TreeNode? {
    if (root == null || root === p || root === q) return root
    val l = lca(root.left, p, q)
    val r = lca(root.right, p, q)
    return when {
        l != null && r != null -> root
        else -> l ?: r
    }
}

fun lcaBst(root: TreeNode?, p: TreeNode, q: TreeNode): TreeNode? {
    var n = root
    while (n != null) {
        n = when {
            p.\`val\` < n.\`val\` && q.\`val\` < n.\`val\` -> n.left
            p.\`val\` > n.\`val\` && q.\`val\` > n.\`val\` -> n.right
            else -> return n                    // values split here
        }
    }
    return null
}
\`\`\`

- Assumption to state: both nodes exist in the tree. If they might not, count how many of p/q were actually found and return null unless both were (LC 1644)
- Parent-pointer variant (LC 1650): walk ancestors of p into a set, then climb from q — or the two-pointer "switch heads" trick, O(1) space
- BST form is O(h) iterative and O(1) space`,
    complexity: '- Time: O(n) — full traversal in the worst case\n- Space: O(h) recursion stack; the BST variant descends once, O(h)',
    followUp: '**Follow-up:** How does this differ for a BST?\n> Use BST property: if both p,q < root go left; if both > root go right; else root is LCA. O(h) instead of O(n).',
    redFlags: '- Can\'t handle case where one node is ancestor of the other',
    answer: '- Base case: null `root`, or `root` matching `p` or `q` — return it, and otherwise search both sides.\n- Both halves non-null means this node is the answer; a single non-null half passes that side up.\n- On a BST, skip the full traversal — the ordering property alone picks which single branch to descend.'
  },
  {
    id: 'ds-10',
    type: 'data-structures',
    num: 10,
    difficulty: 'E',
    star: true,
    section: 'Hash Maps',
    title: 'How does a HashMap work internally?',
    tags: [ 'hash-map', 'data-structures', 'java' ],
    related: [ 'ds-2', 'ds-11' ],
    keyPoints: `- Storage: an array of buckets (\`table\`), capacity always a power of two (default 16)
- Index: \`h = key.hashCode()\`, then the JDK spreads the high bits down (\`h ^ (h >>> 16)\`) and masks: \`index = (capacity - 1) & h\` — a cheap \`% capacity\` that only works because capacity is a power of two
- Collisions: separate chaining. A bucket holds a linked list of nodes; since Java 8 a bucket with ≥ 8 nodes is converted to a red-black tree (only once the table has ≥ 64 slots — smaller tables resize instead), so a bad bucket costs O(log n) instead of O(n)
- \`get\`/\`put\`: find the bucket, then walk it comparing \`hash\` first and \`equals\` second
- Resize: when \`size > capacity × loadFactor\` (0.75), capacity doubles and every entry is redistributed — each entry either stays at index i or moves to i + oldCapacity, decided by one bit of the hash
- Contract: equal objects MUST have equal \`hashCode\`s; a key mutated after insertion (its hash changed) becomes unreachable — use immutable keys (Kotlin \`data class\` with \`val\`s)

\`\`\`kotlin
data class Point(val x: Int, val y: Int)        // equals + hashCode generated together
val grid = HashMap<Point, Int>(expectedSize * 4 / 3 + 1) // pre-size to avoid resizes
\`\`\`

- \`null\` key allowed in \`HashMap\` (stored at bucket 0), not in \`ConcurrentHashMap\`; not thread-safe — concurrent writes can lose entries
- Android note: \`ArrayMap\` / \`SparseArray\` trade O(log n) binary search for far less memory than \`HashMap\` on small maps (hundreds of entries)
- Implementing one from scratch is \`ds-31\`; chaining vs open addressing trade-offs are \`ds-51\``,
    complexity: '- Time: O(1) average get/put; O(log n) per op once a chain treeifies (Java 8+, chain length > 8); O(n) worst case under adversarial hashes\n- Space: O(n) for n entries plus load-factor headroom (default 0.75)',
    followUp: '**Follow-up:** Why is the default load factor 0.75?\n> Balances time (fewer collisions) vs space. 1.0 causes too many collisions; 0.5 wastes memory.',
    redFlags: '- Thinks HashMap is always O(1) — it is O(1) on average (expected), with a worse case under collisions\n- Doesn\'t know about collision handling\n- Mutates a key after inserting it, or overrides equals without hashCode',
    answer: '- Bucket array: `hashCode()`, bit-spread, then `(capacity - 1) & hash` picks the slot; `get`/`put` average `O(1)`.\n- Collisions chain in a list per bucket, treeified to a red-black tree at 8+ nodes (Java 8+, table ≥ 64).\n- Past load factor 0.75 capacity doubles and entries are redistributed; hostile keys degrade an op toward `O(log n)`/`O(n)`.'
  },
  {
    id: 'ds-11',
    type: 'data-structures',
    num: 11,
    difficulty: 'M',
    star: false,
    section: 'Hash Maps',
    title: 'What is the difference between HashMap, LinkedHashMap, and TreeMap?',
    tags: [ 'hash-map', 'trees', 'data-structures' ],
    related: [ 'ds-10', 'ds-12' ],
    keyPoints: `- **HashMap**: bucket array, no iteration-order guarantee (order can change after a resize). O(1) average get/put
- **LinkedHashMap**: HashMap plus a doubly linked list threading every entry. Iterates in insertion order by default, or in ACCESS order with \`LinkedHashMap(cap, 0.75f, true)\` — the basis of an LRU cache (\`ds-23\`, override \`removeEldestEntry\`). Same O(1), a little more memory per entry
- **TreeMap**: red-black tree ordered by \`compareTo\` / a \`Comparator\`. O(log n) get/put, but unlocks navigation: \`firstKey\`, \`floorKey\`, \`ceilingKey\`, \`headMap\`, \`tailMap\`, \`subMap\`
- Kotlin: \`mutableMapOf()\` and \`linkedMapOf()\` return a \`LinkedHashMap\` (insertion order preserved), \`hashMapOf()\` a \`HashMap\`, \`sortedMapOf()\` a \`TreeMap\`

\`\`\`kotlin
val byTime = java.util.TreeMap<Long, String>()
byTime[100] = "a"; byTime[250] = "b"; byTime[400] = "c"
byTime.floorKey(300)          // 250 — latest event at or before t=300
byTime.subMap(100, 400)       // {100=a, 250=b} — half-open range query
\`\`\`

- TreeMap keys need a consistent ordering (\`compareTo == 0\` is treated as the same key, regardless of \`equals\`); null keys are rejected with natural ordering
- None of the three is thread-safe: \`ConcurrentHashMap\` for concurrent hashing, \`ConcurrentSkipListMap\` for a concurrent sorted map
- Rule: pick the cheapest map whose ordering guarantee you actually use — sorting a HashMap's entries after the fact is O(n log n) per read`,
    complexity: '- Time: HashMap O(1) average; LinkedHashMap O(1) average; TreeMap O(log n)\n- Space: O(n) for all three; TreeMap adds Red-Black Tree node overhead',
    followUp: '**Follow-up:** When would you use TreeMap?\n> Range queries (subMap, headMap, tailMap), finding nearest keys (floorKey, ceilingKey).',
    redFlags: '- Doesn\'t know TreeMap is sorted\n- Sorts a HashMap after the fact instead of using TreeMap',
    answer: '- Use `HashMap` when order doesn\'t matter and raw speed does.\n- Use `LinkedHashMap` to preserve insertion order at the same cost.\n- Use `TreeMap` only when sorted iteration or range queries are needed — ordering is what you pay the log-n tax for.'
  },
  {
    id: 'ds-12',
    type: 'data-structures',
    num: 12,
    difficulty: 'M',
    star: true,
    section: 'Dynamic Programming',
    title: 'What is dynamic programming? Explain with an example.',
    tags: [ 'dynamic-programming', 'recursion' ],
    related: [ 'ds-13', 'ds-14' ],
    keyPoints: `- DP = recursion over subproblems + a cache, so each distinct subproblem is solved once
- Two required properties: **optimal substructure** (the best answer is built from best answers to smaller states) and **overlapping subproblems** (the naive recursion recomputes the same arguments). Without the overlap, plain divide and conquer is enough; when a greedy choice is provably safe, greedy is enough
- Recipe: define the state (what varies), write the transition, fix base cases, choose the order, then shrink the table to the rows you still read
- Example — Fibonacci: \`fib(n) = fib(n-1) + fib(n-2)\` recomputes \`fib(n-2)\` twice, \`fib(n-3)\` three times… → O(2ⁿ) calls (more precisely O(φⁿ)). Caching makes it O(n)

\`\`\`kotlin
// Top-down: memoization — natural recursion, solves only the states reached
fun fibMemo(n: Int, memo: LongArray = LongArray(n + 1) { -1L }): Long {
    if (n < 2) return n.toLong()
    if (memo[n] != -1L) return memo[n]
    return (fibMemo(n - 1, memo) + fibMemo(n - 2, memo)).also { memo[n] = it }
}

// Bottom-up: tabulation, then rolled to two variables — O(1) space, no stack
fun fib(n: Int): Long {
    var a = 0L; var b = 1L
    repeat(n) { val t = a + b; a = b; b = t }
    return a
}
\`\`\`

- Memoization: easy to derive from the recursion; pays recursion depth (stack overflow risk for large n)
- Tabulation: needs a valid fill order, but no recursion and easy space rolling
- Better examples to reach for after Fibonacci: coin change (\`ds-25\`), LCS (\`ds-13\`), house robber (\`ds-30\`), knapsack (\`ds-14\`)`,
    complexity: `- Time: (number of states) × (work per transition) — Fibonacci: O(2ⁿ) naive, O(n) with DP
- Space: O(states) for the table or memo; often rolled down to O(1) or one row`,
    followUp: '**Follow-up:** Memoization vs tabulation?\n> Memoization: natural recursion, computes only needed subproblems. Tabulation: avoids recursion stack, easier to optimize space.',
    redFlags: '- Can\'t explain overlapping subproblems\n- Only knows Fibonacci as an example',
    answer: '- Split into overlapping subproblems and cache each result: memoize top-down, tabulate bottom-up.\n- Two signals justify it: optimal substructure plus subproblems that repeat.\n- Reach for DP only when both signals hold — optimal substructure alone just wants plain recursion or greedy.'
  },
  {
    id: 'ds-13',
    type: 'data-structures',
    num: 13,
    difficulty: 'H',
    star: true,
    section: 'Dynamic Programming',
    title: 'Explain the DP solution for Longest Common Subsequence (LCS).',
    tags: [ 'dynamic-programming', 'strings', 'advanced' ],
    related: [ 'ds-12', 'ds-14' ],
    keyPoints: `- State: \`dp[i][j]\` = LCS length of \`a[0 until i]\` and \`b[0 until j]\`; row 0 and column 0 are 0 (empty prefix)
- Transition: last characters equal → they can both end the LCS: \`dp[i-1][j-1] + 1\`. Different → drop one of them: \`max(dp[i-1][j], dp[i][j-1])\`

\`\`\`kotlin
fun longestCommonSubsequence(a: String, b: String): Int {
    val dp = Array(a.length + 1) { IntArray(b.length + 1) }
    for (i in 1..a.length) for (j in 1..b.length) {
        dp[i][j] = if (a[i - 1] == b[j - 1]) dp[i - 1][j - 1] + 1
                   else maxOf(dp[i - 1][j], dp[i][j - 1])
    }
    return dp[a.length][b.length]
}
\`\`\`

- Space: each row reads only the row above, so two rows (or one row plus a saved diagonal) suffice — put the SHORTER string on the columns for O(min(m, n))
- Reconstruction: keep the full table and walk back from \`(m, n)\`: on a match step diagonally and emit the char, otherwise step toward the larger neighbour — this is why the space optimization is only for "length only"
- Subsequence ≠ substring: longest common SUBSTRING resets to 0 on a mismatch and tracks a global max
- Relatives: edit distance (\`ds-83\`) uses the same grid with insert/delete/replace costs; shortest common supersequence = m + n − LCS; diff tools are LCS on lines`,
    complexity: `- Time: O(m·n) — every cell computed once in O(1)
- Space: O(m·n) for the table; O(min(m, n)) with two rolling rows when only the length is needed`,
    followUp: '**Follow-up:** How is LCS related to Edit Distance?\n> Both use 2D DP with similar recurrences. Edit Distance adds insertion/deletion/substitution costs.',
    redFlags: '- Tries brute force recursion without memoization\n- Can\'t write the recurrence',
    answer: '- `dp[i][j]` holds the LCS length across the first `i` characters of one string and `j` of the other.\n- Match: `dp[i-1][j-1] + 1`; no match: `max(dp[i-1][j], dp[i][j-1])`.\n- Roll the table down to two rows when only the length is asked for — reconstructing the sequence itself is what forces keeping the full grid.'
  },
  {
    id: 'ds-14',
    type: 'data-structures',
    num: 14,
    difficulty: 'H',
    star: false,
    section: 'Dynamic Programming',
    title: 'Explain the 0/1 Knapsack DP approach.',
    tags: [ 'dynamic-programming', 'advanced' ],
    related: [ 'ds-12', 'ds-13' ],
    keyPoints: `- State: \`dp[i][w]\` = best value using only the first i items within capacity w
- Transition per item: skip it → \`dp[i-1][w]\`; take it (if \`weight[i] <= w\`) → \`dp[i-1][w - weight[i]] + value[i]\`; keep the max
- 1-D rolling form: iterate capacity DOWNWARD so \`dp[w - weight]\` still holds the previous item's row — iterating upward reuses the same item and turns it into the unbounded knapsack

\`\`\`kotlin
fun knapsack(weights: IntArray, values: IntArray, cap: Int): Int {
    val dp = IntArray(cap + 1)
    for (i in weights.indices) {
        for (w in cap downTo weights[i]) {          // downward = each item at most once
            dp[w] = maxOf(dp[w], dp[w - weights[i]] + values[i])
        }
    }
    return dp[cap]
}
\`\`\`

- Why greedy by value/weight ratio fails for 0/1: items are indivisible — cap 50, items (10kg, 60), (20kg, 100), (30kg, 120): ratio-greedy takes 60 + 100 = 160, optimal is 100 + 120 = 220. Greedy IS optimal for the fractional variant
- Pseudo-polynomial: O(n·W) is polynomial in the VALUE of W, exponential in its bit length — 0/1 knapsack is NP-hard, so a huge W calls for a different state (dp over value) or meet-in-the-middle
- Variants built on the same table: subset sum / partition equal subset sum (boolean dp), count of subsets with a given sum, target sum (±)
- Reconstruction needs the 2-D table: walk back from \`(n, W)\`; if \`dp[i][w] != dp[i-1][w]\` item i was taken`,
    complexity: `- Time: O(n·W) — n items × W capacities
- Space: O(n·W) for the 2-D table; O(W) with the 1-D downward-iterating array`,
    followUp: '**Follow-up:** How do you reconstruct which items were taken?\n> Trace back: if dp[i][w] != dp[i-1][w], item i was included.',
    redFlags: '- Uses greedy (wrong for 0/1 variant)\n- Doesn\'t know the recurrence',
    answer: '- `dp[i][w]` = best value reachable from the first `i` items inside capacity `w`.\n- Branch per item: skip via `dp[i-1][w]`, or add `dp[i-1][w-weight[i]] + value[i]` when the item fits.\n- Collapse to a 1D array iterated right-to-left over weight when only the value is needed — the space optimization interviewers expect.'
  },
  {
    id: 'ds-15',
    type: 'data-structures',
    num: 15,
    difficulty: 'M',
    star: true,
    section: 'Sorting & Searching',
    title: 'Explain QuickSort. What are its average and worst-case complexities?',
    tags: [ 'sorting', 'divide-and-conquer' ],
    related: [ 'ds-16', 'ds-7' ],
    keyPoints: `- Divide and conquer: pick a pivot, partition so smaller elements end up left and larger right, recurse on both parts. All the work is in the partition; there is no merge step
- Average O(n log n): a random pivot splits roughly in proportion, giving ~log n levels of O(n) partitioning
- Worst O(n²): the pivot is repeatedly the min or max (already-sorted input with a first/last-element pivot, or all-equal keys with a two-way partition) → n levels
- Fixes: random pivot or median-of-three; three-way partition (\`<\`, \`==\`, \`>\`) for many duplicates (\`ds-35\`); recurse into the SMALLER side and loop on the larger to cap the stack at O(log n)

\`\`\`kotlin
fun quickSort(a: IntArray, lo: Int = 0, hi: Int = a.size - 1) {
    if (lo >= hi) return
    val p = partition(a, lo, hi)
    quickSort(a, lo, p - 1)
    quickSort(a, p + 1, hi)
}

// Lomuto with a random pivot moved to the end
fun partition(a: IntArray, lo: Int, hi: Int): Int {
    val r = (lo..hi).random()
    a.swap(r, hi)
    val pivot = a[hi]
    var store = lo
    for (i in lo until hi) if (a[i] < pivot) a.swap(i, store++)
    a.swap(store, hi)
    return store                              // pivot's final index
}

fun IntArray.swap(i: Int, j: Int) { val t = this[i]; this[i] = this[j]; this[j] = t }
\`\`\`

- Not stable; in place apart from the recursion stack
- Quickselect reuses \`partition\` and recurses into one side only → k-th element in O(n) average (\`ds-27\`)
- What the platform uses: JVM \`Arrays.sort\` on primitives (so Kotlin \`IntArray.sort()\`) is dual-pivot quicksort; object arrays and \`sortWith\` on lists use TimSort (stable, O(n log n) worst)`,
    complexity: '- Time: O(n log n) average; O(n²) worst case (sorted input with naive first/last-element pivot)\n- Space: O(log n) average recursion depth; O(n) worst case; partitioning is in-place',
    followUp: '**Follow-up:** How does TimSort (Java/Kotlin) differ?\n> Hybrid MergeSort + InsertionSort using natural runs. Worst case O(n log n) guaranteed, stable.',
    redFlags: '- Thinks QuickSort is always O(n log n)\n- Doesn\'t know worst-case scenario',
    answer: '- Choose a pivot, split into below and above it, recurse on both parts; the split happens in place.\n- `O(n log n)` average, but `O(n²)` when the pivot keeps landing on the extreme value.\n- Space is the recursion: `O(log n)` average, `O(n)` worst — sorted input with a first/last pivot.'
  },
  {
    id: 'ds-16',
    type: 'data-structures',
    num: 16,
    difficulty: 'M',
    star: true,
    section: 'Sorting & Searching',
    title: 'Binary Search — explain and common pitfalls.',
    tags: [ 'searching', 'arrays', 'basics' ],
    related: [ 'ds-15', 'ds-1' ],
    keyPoints: `- Precondition: the array is sorted (or, more generally, a predicate over the index is monotone — see \`ds-66\`)
- Invariant for the exact-match form: if the target exists, it lies in \`[lo, hi]\` (inclusive). Loop \`while (lo <= hi)\`; each step discards the half that cannot contain it

\`\`\`kotlin
fun binarySearch(a: IntArray, target: Int): Int {
    var lo = 0
    var hi = a.size - 1
    while (lo <= hi) {
        val mid = lo + (hi - lo) / 2          // or (lo + hi) ushr 1
        when {
            a[mid] == target -> return mid
            a[mid] < target -> lo = mid + 1
            else -> hi = mid - 1
        }
    }
    return -1                                 // lo is now the insertion point
}
\`\`\`

- Pitfalls interviewers look for:
  - \`(lo + hi) / 2\` overflows when both are near \`Int.MAX_VALUE\` — use \`lo + (hi - lo) / 2\` or an unsigned shift
  - Mixing shapes: \`while (lo < hi)\` with \`hi = mid\` is the lower-bound form; \`lo <= hi\` with \`mid ± 1\` is exact match. Mixing them skips the answer or loops forever
  - \`lo = mid\` with a floor mid never shrinks a 2-element range → infinite loop; use a ceiling mid (\`lo + (hi - lo + 1) / 2\`) for "last true"
  - Duplicates: exact match returns ANY occurrence; first/last occurrence needs the boundary form
  - Empty array: \`hi = -1\`, loop never runs — fine, but check it out loud
- Library: Kotlin \`IntArray.binarySearch(x)\` / \`List.binarySearch\` return \`-(insertionPoint) - 1\` when absent — the result is only defined on sorted input
- Generalizations: rotated array (\`ds-56\`), first bad version / lower bound (\`ds-66\`), binary search on the answer (\`ds-74\`)`,
    complexity: `- Time: O(log n) — the range halves each iteration
- Space: O(1) iterative; O(log n) if written recursively`,
    followUp: '**Follow-up:** Why `left + (right - left) / 2` not `(left + right) / 2`?\n> Avoids integer overflow when left + right exceeds Int.MAX_VALUE.',
    redFlags: '- Uses (left + right) / 2 without knowing overflow risk\n- Off-by-one errors in boundary conditions',
    answer: '- On sorted data, halve the span via `right = mid - 1` or `left = mid + 1`: `O(log n)`.\n- Compute `mid = left + (right - left) / 2` — averaging the bounds directly can overflow.\n- Return on `target == mid`; otherwise narrow the bounds before recomputing `mid`.'
  },
  {
    id: 'ds-17',
    type: 'data-structures',
    num: 17,
    difficulty: 'M',
    star: false,
    section: 'Stacks & Queues',
    title: 'Valid Parentheses — solve using a stack.',
    tags: [ 'stacks', 'strings' ],
    related: [ 'ds-18', 'ds-16' ],
    keyPoints: `- Brackets nest, so the most recent unmatched opener is the only one a closer may match — that is exactly LIFO
- Push every opener. On a closer, the stack must be non-empty AND its top must be the matching opener; pop it. At the end the stack must be empty (no unclosed openers)

\`\`\`kotlin
fun isValid(s: String): Boolean {
    val match = mapOf(')' to '(', ']' to '[', '}' to '{')
    val stack = ArrayDeque<Char>()
    for (c in s) {
        val open = match[c]
        if (open == null) stack.addLast(c)                        // opener
        else if (stack.removeLastOrNull() != open) return false   // empty or mismatch
    }
    return stack.isEmpty()
}
\`\`\`

- \`removeLastOrNull()\` folds the empty-stack check into the comparison
- Early exit: an odd-length string can never be valid
- A single counter works only for ONE bracket type; with several types it accepts \`([)]\`
- Use Kotlin \`ArrayDeque\` (or \`java.util.ArrayDeque\`), not the legacy synchronized \`java.util.Stack\`
- Variants: minimum removals to make it valid (\`ds-41\`), generate all valid strings (\`ds-80\`), longest valid substring (stack of indices seeded with -1)`,
    complexity: '- Time: O(n) — one pass over the string\n- Space: O(n) worst case — all opening brackets pushed',
    followUp: '**Follow-up:** How would you find the longest valid parentheses substring?\n> DP or stack storing indices. O(n).',
    redFlags: '- Uses counter (breaks on interleaved types like `([)]`)\n- Doesn\'t handle empty stack case',
    answer: '- Push each opener; a closer has to match the stack top or the string is rejected.\n- Reject a closer arriving at an empty stack, and accept only if nothing is left at the end.'
  },
  {
    id: 'ds-18',
    type: 'data-structures',
    num: 18,
    difficulty: 'H',
    star: true,
    section: 'Stacks & Queues',
    title: 'Design a stack that supports push, pop, and getMin in O(1).',
    tags: [ 'stacks', 'design', 'advanced' ],
    related: [ 'ds-17', 'ds-10' ],
    keyPoints: `- The minimum changes only on push or pop, so remember it per stack depth instead of recomputing
- Two stacks: \`main\` holds every value; \`mins\` holds the running minimum. Push onto \`mins\` when the value is ≤ its top (or it is empty); on pop, pop \`mins\` too when the removed value equals its top
- The \`≤\` (not \`<\`) matters: with duplicate minimums, \`<\` would pop the only copy of the min while another equal value is still on the main stack

\`\`\`kotlin
class MinStack {
    private val main = ArrayDeque<Int>()
    private val mins = ArrayDeque<Int>()

    fun push(x: Int) {
        main.addLast(x)
        if (mins.isEmpty() || x <= mins.last()) mins.addLast(x)
    }
    fun pop() {
        val x = main.removeLast()
        if (x == mins.last()) mins.removeLast()
    }
    fun top(): Int = main.last()
    fun getMin(): Int = mins.last()
}
\`\`\`

- Simpler alternative: one stack of pairs \`(value, minSoFar)\` — always O(n) extra, but no equality subtlety
- O(1)-extra-space trick: store \`2x − min\` encoded values when pushing a new minimum and decode on pop — clever but overflow-prone; mention, do not lead with it
- \`getMax\` too: a parallel max stack with the mirrored rule. A min-QUEUE needs a monotonic deque instead (\`ds-63\`)`,
    complexity: '- Time: O(1) push, pop, and getMin\n- Space: O(n) worst case for the parallel min stack (strictly decreasing input)',
    followUp: '**Follow-up:** What if you also need getMax?\n> Add a parallel max stack with same logic.',
    redFlags: '- Uses sorting or linear scan for getMin\n- Pops from min stack unconditionally',
    answer: '- Pair the main stack with a min stack: push there when the value ≤ that top, or when it is empty.\n- Pop the min stack only when the removed value equals its top.\n- Two stacks beat re-scanning for the min on every call — the min stack trades a little extra memory for a live running minimum.'
  },
  {
    id: 'ds-19',
    type: 'data-structures',
    num: 19,
    difficulty: 'M',
    star: true,
    section: 'Trees & Graphs',
    title: 'Number of Islands — solve with BFS and DFS.',
    tags: [ 'graphs', 'bfs', 'dfs', 'grid' ],
    related: [ 'ds-7', 'ds-20' ],
    keyPoints: `- The grid is an implicit graph: cells are nodes, 4-directional neighbours are edges. An island is a connected component
- Scan every cell; each unvisited \`'1'\` starts a new island — count it and flood-fill the whole component so it is never counted again
- Mark visited by overwriting with \`'0'\` (ask if mutating the input is OK; otherwise keep a \`BooleanArray\`)

\`\`\`kotlin
private val DIRS = arrayOf(intArrayOf(1, 0), intArrayOf(-1, 0), intArrayOf(0, 1), intArrayOf(0, -1))

fun numIslands(grid: Array<CharArray>): Int {
    if (grid.isEmpty()) return 0
    val rows = grid.size; val cols = grid[0].size
    var count = 0
    for (r in 0 until rows) for (c in 0 until cols) {
        if (grid[r][c] != '1') continue
        count++
        val q = ArrayDeque<Int>()                    // BFS: encode (r, c) as r * cols + c
        grid[r][c] = '0'; q.addLast(r * cols + c)    // mark on ENQUEUE
        while (q.isNotEmpty()) {
            val cell = q.removeFirst()
            val cr = cell / cols; val cc = cell % cols
            for ((dr, dc) in DIRS) {
                val nr = cr + dr; val nc = cc + dc
                if (nr in 0 until rows && nc in 0 until cols && grid[nr][nc] == '1') {
                    grid[nr][nc] = '0'; q.addLast(nr * cols + nc)
                }
            }
        }
    }
    return count
}
\`\`\`

- DFS version: recursive \`sink(r, c)\` into 4 directions — shorter, but recursion depth can reach m·n on a snake-shaped island (a 1000×1000 grid overflows the JVM stack), so BFS or an explicit stack is the safe default
- Union-Find alternative (\`ds-26\`): union adjacent land cells, count roots — the right tool when land is ADDED over time (Number of Islands II, LC 305)
- 8-directional connectivity: add the four diagonals to \`DIRS\` — clarify which one is meant`,
    complexity: `- Time: O(m·n) — every cell is visited a constant number of times
- Space: BFS queue O(min(m, n)) for a flood fill started from the scan order; DFS recursion O(m·n) worst case; O(m·n) if a separate visited array is used`,
    followUp: '**Follow-up:** How would you count islands if the grid wraps around (toroidal)?\n> Treat left/right and top/bottom edges as connected — use modular arithmetic for neighbor indices.',
    redFlags: '- Modifies input without acknowledging it (okay to ask)\n- Doesn\'t handle 4-directional vs 8-directional distinction',
    answer: '- Walk the grid; each fresh `\'1\'` bumps the tally and triggers a flood fill of its connected land.\n- BFS enqueues 4-way neighbours and marks on enqueue; DFS recurses 4 ways, blanking cells to `\'0\'`.\n- Prefer DFS when recursion depth is a non-issue — it skips the BFS queue\'s extra bookkeeping entirely.'
  },
  {
    id: 'ds-20',
    type: 'data-structures',
    num: 20,
    difficulty: 'H',
    star: false,
    section: 'Trees & Graphs',
    title: 'Topological sort — explain Kahn\'s algorithm.',
    tags: [ 'graphs', 'topological-sort', 'advanced' ],
    related: [ 'ds-7', 'ds-19' ],
    keyPoints: `- A topological order lists every node before all nodes it points to; it exists only for a DAG
- Kahn's algorithm: compute in-degrees, queue every node with in-degree 0 (no unmet prerequisites). Repeatedly dequeue a node, append it, and decrement its neighbours' in-degrees; a neighbour reaching 0 joins the queue
- Cycle check is free: nodes on a cycle never reach in-degree 0, so \`order.size < n\` means no valid order

\`\`\`kotlin
fun topoSort(n: Int, edges: Array<IntArray>): IntArray? {   // edge [u, v]: u before v
    val adj = List(n) { mutableListOf<Int>() }
    val indeg = IntArray(n)
    for ((u, v) in edges) { adj[u].add(v); indeg[v]++ }
    val q = ArrayDeque<Int>()
    for (i in 0 until n) if (indeg[i] == 0) q.addLast(i)
    val order = IntArray(n); var k = 0
    while (q.isNotEmpty()) {
        val u = q.removeFirst()
        order[k++] = u
        for (v in adj[u]) if (--indeg[v] == 0) q.addLast(v)
    }
    return if (k == n) order else null       // null = cycle
}
\`\`\`

- Many valid orders may exist; a min-heap instead of the queue gives the lexicographically smallest one
- Counting BFS layers gives the minimum number of "semesters" when independent tasks run in parallel (LC 1136)
- DFS alternative: post-order DFS, then reverse; detect cycles with three colours (white/grey/black) — a grey neighbour is a back edge
- Practice: course schedule (\`ds-75\`); alien dictionary (build edges from adjacent word pairs)`,
    complexity: `- Time: O(V + E) — each node is dequeued once, each edge relaxed once
- Space: O(V + E) for the adjacency list, in-degree array and queue`,
    followUp: '**Follow-up:** How does DFS-based topological sort work?\n> Post-order DFS: push node to stack after visiting all descendants. Reverse the stack.\n\n**Follow-up:** When would you use topological sort in Android?\n> Dependency resolution (build systems, module init order), task scheduling with prerequisites.',
    redFlags: '- Can\'t detect cycles with Kahn\'s (result shorter than node count)\n- Confuses topological sort with BFS level order',
    answer: '- Build the adjacency list and in-degree map, then queue every node whose in-degree is 0.\n- Dequeue into the result and decrement neighbours, queueing any that reach 0.\n- Fewer results than nodes means a cycle, so no ordering exists — that check is the whole point of Kahn\'s over a plain DFS order.'
  },
  {
    id: 'ds-21',
    type: 'data-structures',
    num: 21,
    difficulty: 'M',
    star: true,
    section: 'Trees & Graphs',
    title: 'Dijkstra\'s shortest path — when does it apply and how does it work?',
    tags: [ 'graphs', 'shortest-path', 'heap', 'advanced' ],
    related: [ 'ds-7', 'ds-6' ],
    keyPoints: `- Single-source shortest paths when every edge weight is ≥ 0
- Greedy invariant: the unvisited node with the smallest tentative distance is final — any other route to it passes through a node at least as far away and can only add non-negative weight
- Min-heap of \`(dist, node)\`; \`dist[src] = 0\`, others ∞. Pop the closest node, skip it if the entry is stale, relax each edge: if \`dist[u] + w < dist[v]\`, update and push

\`\`\`kotlin
import java.util.PriorityQueue

fun dijkstra(n: Int, adj: List<List<IntArray>>, src: Int): LongArray {  // adj[u] = [v, w]
    val dist = LongArray(n) { Long.MAX_VALUE }
    dist[src] = 0
    val pq = PriorityQueue<LongArray>(compareBy { it[0] })   // [dist, node]
    pq.add(longArrayOf(0, src.toLong()))
    while (pq.isNotEmpty()) {
        val (d, uL) = pq.poll()
        val u = uL.toInt()
        if (d > dist[u]) continue                              // stale entry: lazy deletion
        for ((v, w) in adj[u]) {
            val nd = d + w
            if (nd < dist[v]) { dist[v] = nd; pq.add(longArrayOf(nd, v.toLong())) }
        }
    }
    return dist
}
\`\`\`

- \`java.util.PriorityQueue\` has no decrease-key, so push duplicates and skip stale ones — the heap can hold O(E) entries, still O(E log V)
- \`Long\` distances avoid overflow when summing many large weights
- Variants: path reconstruction via a \`parent\` array; early exit when the target is popped; on a grid, cells are nodes — e.g. path with minimum effort, LC 1631; "network delay time" = max over \`dist\` (LC 743)
- Which algorithm: unweighted → BFS; weights 0/1 → 0-1 BFS with a deque; negative weights → Bellman-Ford O(V·E); all pairs on small V → Floyd-Warshall O(V³); single target with a good heuristic → A*`,
    complexity: `- Time: O((V + E) log V) with a binary heap (O(E log V) with lazy deletion); O(V²) with an array scan, better for dense graphs
- Space: O(V + E) for the graph, distances and heap`,
    followUp: '**Follow-up:** Why doesn\'t Dijkstra work with negative weights?\n> Once a node is popped, its distance is finalized. A negative edge could later provide a shorter path — use Bellman-Ford instead.\n\n**Follow-up:** What\'s the difference between Dijkstra and A*?\n> A* adds a heuristic (estimated distance to goal) to prioritize promising paths — faster in practice for point-to-point search.',
    redFlags: '- Uses BFS for weighted graphs\n- Doesn\'t know about the min-heap requirement',
    answer: '- Applies to single-source shortest paths only when edge weights are non-negative.\n- Heap of `(distance, node)`: seed `dist[source]` at 0 and the rest ∞, pop the nearest, relax edges.\n- Relax when `dist[node] + weight` beats `dist[neighbor]`, then push. `O((V + E) log V)`.'
  },
  {
    id: 'ds-22',
    type: 'data-structures',
    num: 22,
    difficulty: 'M',
    star: false,
    section: 'Trees & Graphs',
    title: 'Implement a Trie (prefix tree). Insert and search.',
    tags: [ 'trie', 'trees', 'strings', 'advanced' ],
    related: [ 'ds-7', 'ds-3' ],
    keyPoints: '```kotlin\nclass TrieNode { val children = HashMap<Char, TrieNode>(); var isEnd = false }\nclass Trie {\n  val root = TrieNode()\n  fun insert(word: String) {\n    var cur = root\n    for (c in word) cur = cur.children.getOrPut(c) { TrieNode() }\n    cur.isEnd = true\n  }\n  fun search(word: String): Boolean {\n    var cur = root\n    for (c in word) cur = cur.children[c] ?: return false\n    return cur.isEnd\n  }\n  fun startsWith(prefix: String): Boolean {\n    var cur = root\n    for (c in prefix) cur = cur.children[c] ?: return false\n    return true\n  }\n}\n```',
    complexity: `- Time: O(m) per insert, search or startsWith, m = length of the word or prefix
- Space: O(total characters inserted) nodes in the worst case (no shared prefixes); each node costs a map or a 26-slot array`,
    followUp: '**Follow-up:** How would you implement autocomplete with a Trie?\n> startsWith to find the prefix node, then DFS from that node collecting all isEnd paths.',
    redFlags: '- Stores full words in each node (not prefix sharing)\n- Doesn\'t know how to traverse for autocomplete',
    answer: '- Each node keeps a `children` map and an `isEnd` flag; `insert` creates one node per character.\n- `search` demands `isEnd` at the final character, while `startsWith` only needs the path to exist.\n- Shared prefixes are the whole win — a trie beats a hashset of words whenever prefix queries matter, not just exact lookups.'
  },
  {
    id: 'ds-23',
    type: 'data-structures',
    num: 23,
    difficulty: 'M',
    star: true,
    section: 'Hash Maps',
    title: 'Design an LRU Cache.',
    tags: [ 'hash-map', 'design', 'linked-list', 'caching' ],
    related: [ 'ds-10', 'ds-11', 'ds-4', 'sd-3', 'sd-64', 'sd-7', 'tech-97' ],
    keyPoints: '- Use LinkedHashMap with accessOrder=true in Java/Kotlin — automatically moves recently accessed entries to tail.\n- Or: HashMap + Doubly Linked List. HashMap: key → node. DLL: maintains access order (head=LRU, tail=MRU).\n- get: O(1) — look up in map, move node to tail. put: O(1) — insert at tail; if over capacity, evict head.\n\n```kotlin\nclass LRUCache(private val capacity: Int) {\n  private val map = LinkedHashMap<Int, Int>(capacity, 0.75f, true)\n  fun get(key: Int) = map.getOrDefault(key, -1)\n  fun put(key: Int, value: Int) {\n    map[key] = value\n    if (map.size > capacity) map.remove(map.keys.iterator().next())\n  }\n}\n```\n\n- `getOrDefault` and `get` both count as an access in access-order mode; iteration does not. Idiomatic alternative: subclass and override `removeEldestEntry(eldest) = size > capacity`\n- Hand-rolled version (what most interviewers actually ask for) — sentinel head/tail remove every null check:\n\n```kotlin\nclass LRUCache(private val capacity: Int) {\n    private class Node(val key: Int, var value: Int) { var prev: Node? = null; var next: Node? = null }\n    private val map = HashMap<Int, Node>()\n    private val head = Node(0, 0)   // most recent side\n    private val tail = Node(0, 0)   // least recent side\n    init { head.next = tail; tail.prev = head }\n\n    fun get(key: Int): Int {\n        val n = map[key] ?: return -1\n        unlink(n); addFront(n)\n        return n.value\n    }\n\n    fun put(key: Int, value: Int) {\n        map[key]?.let { it.value = value; unlink(it); addFront(it); return }\n        if (map.size == capacity) {\n            val lru = tail.prev!!\n            unlink(lru); map.remove(lru.key)   // node stores its key so eviction can clean the map\n        }\n        val n = Node(key, value)\n        map[key] = n; addFront(n)\n    }\n\n    private fun unlink(n: Node) { n.prev!!.next = n.next; n.next!!.prev = n.prev }\n    private fun addFront(n: Node) {\n        n.next = head.next; n.prev = head\n        head.next!!.prev = n; head.next = n\n    }\n}\n```\n\n- Thread safety: a plain `synchronized` around get/put is correct (every get mutates order, so a read-write lock does not help); Android ships `android.util.LruCache` (synchronized, size-aware via `sizeOf`) — mention it for bitmap/memory caches',
    complexity: '- Time: O(1) get and put — HashMap lookup plus O(1) doubly-linked-list relink\n- Space: O(capacity) for the map and linked list',
    followUp: '**Follow-up:** How do you make it thread-safe?\n> Wrap with synchronized block or use Guava\'s CacheBuilder / Caffeine.',
    redFlags: '- Uses an array + linear scan for eviction O(n)\n- Doesn\'t know LinkedHashMap supports access order',
    answer: '- `LinkedHashMap` with `accessOrder=true` re-inserts on touch, so the oldest key is first to evict.\n- Hand-rolled: `HashMap` key → node plus a doubly linked list, head holding LRU and tail MRU.\n- Default to `LinkedHashMap` unless asked to hand-roll it — the interview value is in explaining the pointer relinking, not in typing it out unprompted.'
  },
  {
    id: 'ds-24',
    type: 'data-structures',
    num: 24,
    difficulty: 'M',
    star: false,
    section: 'Stacks & Queues',
    title: 'Next Greater Element — solve with a monotonic stack.',
    tags: [ 'stacks', 'monotonic', 'arrays', 'advanced' ],
    related: [ 'ds-17', 'ds-18' ],
    keyPoints: '- For each element, we want the first element to its right that is greater.\n- Maintain a stack of indices in decreasing order of their values.\n- Iterate left to right: while stack non-empty and current element > stack top element, pop — current is the NGE for the popped index.\n- O(n) time — each element pushed/popped once.\n\n```kotlin\nfun nextGreaterElement(nums: IntArray): IntArray {\n    val result = IntArray(nums.size) { -1 }\n    val stack = ArrayDeque<Int>() // stores indices\n    for (i in nums.indices) {\n        while (stack.isNotEmpty() && nums[i] > nums[stack.last()]) {\n            result[stack.removeLast()] = nums[i]\n        }\n        stack.addLast(i)\n    }\n    return result\n}\n```',
    complexity: '- Time: O(n) — each index is pushed and popped at most once\n- Space: O(n) worst case for the stack (strictly decreasing input)',
    followUp: '**Follow-up:** When else do you use a monotonic stack?\n> Largest rectangle in histogram, daily temperatures, trapping rain water.',
    redFlags: '- Uses nested loops O(n²)\n- Can\'t explain why the stack stays monotonically decreasing',
    answer: '- Target: the first larger value to the right of each element.\n- Stack indices whose values decrease; while the current value beats the top, pop and assign it as that NGE.\n- Every index enters and leaves the stack once, so `O(n)` time; stack space `O(n)` worst case.'
  },
  {
    id: 'ds-25',
    type: 'data-structures',
    num: 25,
    difficulty: 'M',
    star: true,
    section: 'Dynamic Programming',
    title: 'Coin Change — minimum number of coins.',
    tags: [ 'dynamic-programming', 'greedy' ],
    related: [ 'ds-12', 'ds-13' ],
    keyPoints: '- dp[i] = min coins to make amount i. dp[0]=0, dp[i]=MAX initially.\n- For each amount i from 1..target, for each coin c: if c <= i and dp[i-c] != MAX, dp[i] = min(dp[i], dp[i-c]+1).\n\n```kotlin\nfun coinChange(coins: IntArray, amount: Int): Int {\n    val dp = IntArray(amount + 1) { Int.MAX_VALUE }\n    dp[0] = 0\n    for (i in 1..amount)\n        for (c in coins)\n            if (c <= i && dp[i - c] != Int.MAX_VALUE)\n                dp[i] = minOf(dp[i], dp[i - c] + 1)\n    return if (dp[amount] == Int.MAX_VALUE) -1 else dp[amount]\n}\n```',
    complexity: '- O(amount × coins) time, O(amount) space.',
    followUp: '**Follow-up:** Why doesn\'t greedy work for Coin Change?\n> Greedy always picks the largest coin. Fails for coins=[1,3,4], amount=6: greedy picks 4+1+1=3 coins, optimal is 3+3=2.',
    redFlags: '- Proposes greedy without knowing it fails\n- Doesn\'t handle the -1 (impossible) case',
    answer: '- `dp[i]` = fewest coins to reach amount `i`; `dp[0]` is 0, all others start at MAX.\n- Each amount re-tests every coin — that nested cost is the price of an exact optimum over greedy.\n- Return -1 for an unreachable target, and do not propose greedy first.'
  },
  {
    id: 'ds-26',
    type: 'data-structures',
    num: 26,
    difficulty: 'H',
    star: false,
    section: 'Trees & Graphs',
    title: 'Union-Find (Disjoint Set Union) — explain and implement.',
    tags: [ 'graphs', 'union-find', 'advanced' ],
    related: [ 'ds-19', 'ds-7' ],
    keyPoints: '- Supports: find(x) — which set does x belong to, and union(x, y) — merge sets.\n- Path compression: find flattens the tree by pointing every node directly to the root.\n- Union by rank: merge smaller tree under larger to keep height O(log n).\n- With both: near O(1) amortized per operation (inverse Ackermann).\n\n```kotlin\nclass DSU(n: Int) {\n    private val parent = IntArray(n) { it }\n    private val rank = IntArray(n)\n    fun find(x: Int): Int {\n        if (parent[x] != x) parent[x] = find(parent[x])\n        return parent[x]\n    }\n    fun union(x: Int, y: Int): Boolean {\n        val px = find(x); val py = find(y)\n        if (px == py) return false\n        if (rank[px] < rank[py]) parent[px] = py\n        else if (rank[px] > rank[py]) parent[py] = px\n        else { parent[py] = px; rank[px]++ }\n        return true\n    }\n}\n```',
    complexity: '- Time: O(α(n)) amortized per find/union with path compression + union by rank (α = inverse Ackermann, effectively constant); O(log n) per op with rank alone; O(n) worst without both\n- Space: O(n) for the parent and rank arrays',
    followUp: '**Follow-up:** Where is Union-Find used?\n> Connected components, Kruskal\'s MST, cycle detection in undirected graphs.',
    redFlags: '- No path compression (degenerates to O(n) per op)\n- Can\'t implement without prompting',
    answer: '- Two operations: `find(x)` reports which set holds `x`, `union(x, y)` merges two sets.\n- Compression re-points walked nodes at the root; by rank, the shallower tree goes under the deeper one.\n- Together `O(α(n))` amortized per op (inverse Ackermann), `O(log n)` with rank only, `O(n)` without both.'
  },
  {
    id: 'ds-27',
    type: 'data-structures',
    num: 27,
    difficulty: 'M',
    star: true,
    section: 'Sorting & Searching',
    title: 'Find the k-th largest element in an array.',
    tags: [ 'heap', 'sorting', 'arrays' ],
    related: [ 'ds-15', 'ds-6' ],
    keyPoints: '- Approach 1: Min-heap of size k. Add all elements; pop smallest when heap exceeds k. Root is k-th largest.\n- Approach 2: QuickSelect — partition like QuickSort, recurse only on the side containing target index.\n\n```kotlin\nimport java.util.PriorityQueue\n\nfun findKthLargest(nums: IntArray, k: Int): Int {\n    val heap = PriorityQueue<Int>() // min-heap\n    for (n in nums) {\n        heap.offer(n)\n        if (heap.size > k) heap.poll()\n    }\n    return heap.peek()\n}\n```',
    complexity: '- Time: O(n log k) min-heap of size k; O(n) average QuickSelect (O(n²) worst); O(n log n) full sort\n- Space: O(k) for the heap; QuickSelect O(1) extra with in-place partitioning',
    followUp: '**Follow-up:** When would you prefer QuickSelect over heap?\n> QuickSelect needs less extra space and is typically faster in practice — better for large n and large k (see complexity for the worst-case caveat).',
    redFlags: '- Sorts the entire array unnecessarily\n- Confuses k-th largest with k-th smallest',
    answer: '- Min-heap capped at `k` is the safe default: offer every element, drop the smallest on overflow, the root is the answer.\n- QuickSelect trades worst-case guarantees for less extra space — pick it when average-case behavior is acceptable and memory is tight.'
  },
  {
    id: 'ds-28',
    type: 'data-structures',
    num: 28,
    difficulty: 'H',
    star: false,
    section: 'Dynamic Programming',
    title: 'Longest Increasing Subsequence (LIS) — O(n log n) solution.',
    tags: [ 'dynamic-programming', 'binary-search', 'advanced' ],
    related: [ 'ds-13', 'ds-16' ],
    keyPoints: '- Naive DP: dp[i] = length of LIS ending at index i. O(n²).\n- Optimal O(n log n): maintain a tails array where tails[i] = smallest tail for all LIS of length i+1. For each num, binary search for first tail >= num and replace (or append if larger than all).\n\n```kotlin\nfun lengthOfLIS(nums: IntArray): Int {\n    val tails = mutableListOf<Int>()\n    for (n in nums) {\n        var lo = 0; var hi = tails.size\n        while (lo < hi) { val mid = (lo + hi) / 2; if (tails[mid] < n) lo = mid + 1 else hi = mid }\n        if (lo == tails.size) tails.add(n) else tails[lo] = n\n    }\n    return tails.size\n}\n```',
    complexity: '- Time: O(n log n) with the tails array + binary search; O(n²) naive DP\n- Space: O(n) for the tails array (or dp)',
    followUp: '**Follow-up:** Does the tails array represent an actual valid LIS?\n> No — its values may not form a valid subsequence. Only the length is correct. Track a parent array during DP to reconstruct the actual sequence.',
    redFlags: '- Only knows O(n²) solution\n- Claims tails array is the actual LIS',
    answer: '- Naive form is `dp[i]` = LIS ending at `i`, which retests every earlier index.\n- Better: `tails[i]` stores the smallest end value among runs of length `i+1`.\n- Binary-search the first tail ≥ `num` and overwrite it, append if none — the binary search is what drops the quadratic retest.'
  },
  {
    id: 'ds-29',
    type: 'data-structures',
    num: 29,
    difficulty: 'H',
    star: true,
    section: 'Stacks & Queues',
    title: 'Trapping Rain Water — compute how much water an elevation map traps after raining (LC 42).',
    tags: [ 'walmart', 'arrays', 'two-pointers', 'stack' ],
    related: [ 'ds-24', 'ds-33', 'ds-2' ],
    complexity: `- Time: O(n) for two pointers, prefix-max arrays and the monotonic stack alike
- Space: O(1) two pointers; O(n) for prefix/suffix max arrays or the stack`,
    followUp: '**Follow-up:** Why is moving the smaller side safe?\n> min(leftMax, rightMax) is bounded by the smaller max — that side\'s water is already determined regardless of what lies beyond',
    redFlags: '- Only knows brute force O(n^2)\n- Can\'t state the two-pointer invariant',
    keyPoints: `- Water above bar i = \`min(maxLeft(i), maxRight(i)) − height[i]\` (never negative, since both maxima include i)
- Step 1 (say it): prefix-max and suffix-max arrays, then one pass summing the formula — O(n) time, O(n) space
- Step 2 (optimal): two pointers. Keep running \`leftMax\` and \`rightMax\`; whichever side currently has the smaller bar is bounded by its own running max — the far side is already known to be at least as tall — so settle that cell and move inward

\`\`\`kotlin
fun trap(h: IntArray): Int {
    var l = 0; var r = h.size - 1
    var leftMax = 0; var rightMax = 0; var water = 0
    while (l < r) {
        if (h[l] < h[r]) {
            leftMax = maxOf(leftMax, h[l])
            water += leftMax - h[l]
            l++
        } else {
            rightMax = maxOf(rightMax, h[r])
            water += rightMax - h[r]
            r--
        }
    }
    return water
}
\`\`\`

- Monotonic-stack alternative: keep a decreasing stack of indices; when a taller bar arrives, pop the bottom, and the water layer between the new top and the current bar is \`(min(h[top], h[i]) − h[bottom]) × (i − top − 1)\` — fills horizontally, layer by layer
- Edge cases: fewer than 3 bars → 0; flat or strictly monotone terrain → 0
- 2-D version (LC 407, trapping rain water II) needs a min-heap flood from the border — a different algorithm`,
    answer: '- Two pointers with running `leftMax` and `rightMax`; a cell holds `min(leftMax, rightMax) - height[i]`.\n- Advance whichever side has the smaller running max, since that side fixes the bound.\n- Two-pointer is the space-tightest form; prefix-max arrays or a per-layer stack also solve it if a second pass is acceptable.'
  },
  {
    id: 'ds-30',
    type: 'data-structures',
    num: 30,
    difficulty: 'M',
    star: true,
    section: 'Dynamic Programming',
    title: 'House Robber — maximize loot without robbing adjacent houses (LC 198; asked as \'thief problem DP\' in Walmart SDE-III).',
    tags: [ 'walmart', 'dynamic-programming' ],
    related: [ 'ds-12', 'ds-14', 'ds-34' ],
    complexity: `- Time: O(n) — one pass (two passes for the circular variant)
- Space: O(1) with two rolling values; O(n) for the explicit table`,
    followUp: '**Follow-up:** How does this generalize?\n> Same select/skip pattern as Knapsack and max non-adjacent subsequence — state the recurrence before coding',
    redFlags: '- Alternates houses instead of using the recurrence (fails on [2,1,1,2]: alternating gives 2+1 or 1+2 = 3, optimal is houses 1+4 = 4)\n- Can\'t handle the circular variant',
    keyPoints: `- State: \`dp[i]\` = most loot from houses \`0..i\`. Decision at house i: skip it (\`dp[i-1]\`) or rob it, which forbids i−1 (\`dp[i-2] + nums[i]\`)
- Recurrence: \`dp[i] = max(dp[i-1], dp[i-2] + nums[i])\` with \`dp[-1] = dp[-2] = 0\`
- Only the last two states are read, so roll them into two variables

\`\`\`kotlin
fun rob(nums: IntArray): Int {
    var prev2 = 0; var prev1 = 0                  // dp[i-2], dp[i-1]
    for (x in nums) {
        val cur = maxOf(prev1, prev2 + x)
        prev2 = prev1; prev1 = cur
    }
    return prev1
}

// LC 213: houses in a circle — first and last are adjacent
fun robCircle(nums: IntArray): Int = when (nums.size) {
    0 -> 0
    1 -> nums[0]
    else -> maxOf(
        rob(nums.copyOfRange(0, nums.size - 1)),  // exclude the last house
        rob(nums.copyOfRange(1, nums.size)),      // exclude the first house
    )
}
\`\`\`

- Circular case: the two runs cover every legal choice, because an optimal plan can never use both the first and the last house
- Single house is the edge case the circular split mishandles if you forget it (both slices would be empty)
- Tree variant (LC 337): post-order returning a pair \`(robThis, skipThis)\` per node — same skip/take decision on a tree`,
    answer: '- `dp[i] = max(dp[i-1], dp[i-2] + nums[i])`: leave house `i` alone, or take it on top of `i-2`.\n- Two running values replace the table — the standard shrink for any 1-D DP recurrence.\n- Circular version (LC 213): solve twice, once skipping the first house and once the last.'
  },
  {
    id: 'ds-31',
    type: 'data-structures',
    num: 31,
    difficulty: 'M',
    star: true,
    section: 'Hash Maps',
    title: 'Design and implement a HashMap from scratch — put/get/remove with collision handling (LC 706; asked at both Walmart SDE-III and Senior SWE).',
    tags: [ 'walmart', 'hash-map', 'design' ],
    related: [ 'ds-10', 'ds-11', 'ds-23' ],
    complexity: 'Time: O(1) average, O(n) worst; Space: O(n)',
    followUp: '**Follow-up:** How do you make it thread-safe?\n> Coarse locking, or striped/segment locks (ConcurrentHashMap pre-8), or CAS-based lock-free buckets',
    redFlags: '- Forgets the equals/hashCode contract\n- No resize story, or breaks iteration during rehash',
    keyPoints: '- Backing array of buckets + separate chaining (linked list or dynamic array per bucket)\n- put: hash key → index = hash % capacity → append or overwrite in bucket; get/remove walk the chain comparing keys (equals)\n- Resize when load factor > 0.75: double capacity, rehash all entries\n- Discuss Java 8 change: chains treeify to red-black trees beyond 8 nodes\n\n```kotlin\nclass MyHashMap<K, V>(initialCapacity: Int = 16) {\n    private class Entry<K, V>(val key: K, var value: V, var next: Entry<K, V>?)\n    private var table = arrayOfNulls<Entry<K, V>>(initialCapacity.coerceAtLeast(1))\n    var size = 0\n        private set\n\n    private fun index(key: K, cap: Int = table.size) = ((key?.hashCode() ?: 0) and Int.MAX_VALUE) % cap\n\n    fun put(key: K, value: V) {\n        val i = index(key)\n        var e = table[i]\n        while (e != null) { if (e.key == key) { e.value = value; return }; e = e.next }\n        table[i] = Entry(key, value, table[i])            // prepend to the chain\n        if (++size > table.size * 3 / 4) resize()\n    }\n\n    fun get(key: K): V? {\n        var e = table[index(key)]\n        while (e != null) { if (e.key == key) return e.value; e = e.next }\n        return null\n    }\n\n    fun remove(key: K): V? {\n        val i = index(key)\n        var prev: Entry<K, V>? = null; var e = table[i]\n        while (e != null) {\n            if (e.key == key) {\n                if (prev == null) table[i] = e.next else prev.next = e.next\n                size--\n                return e.value\n            }\n            prev = e; e = e.next\n        }\n        return null\n    }\n\n    private fun resize() {\n        val old = table\n        table = arrayOfNulls(old.size * 2)\n        for (head in old) {\n            var e = head\n            while (e != null) {\n                val next = e.next\n                val i = index(e.key)\n                e.next = table[i]; table[i] = e            // relink, no new allocations\n                e = next\n            }\n        }\n    }\n}\n```\n\n- `and Int.MAX_VALUE` clears the sign bit — a negative `hashCode()` would otherwise give a negative index. The JDK instead uses a power-of-two capacity and `(cap - 1) and hash`\n- Generic `V?` return conflates "absent" with a stored null; LC 706 sidesteps it with Int keys/values and -1, and `containsKey` resolves it in a real API\n- Iteration during resize is unsafe single-threaded too (concurrent modification); a real map tracks a `modCount` and fails fast',
    answer: '- Bucket array with separate chaining — a list or growable array per slot.\n- `put` maps `hash % capacity` to a bucket to append or overwrite; `get`/`remove` scan it with `equals`.\n- Rehash into doubled capacity beyond load factor 0.75; `O(1)` average, `O(n)` worst, `O(n)` space.'
  },
  {
    id: 'ds-32',
    type: 'data-structures',
    num: 32,
    difficulty: 'M',
    star: true,
    section: 'Arrays & Strings',
    title: 'Longest substring with at most k distinct characters (LC 340 — Walmart SDE-III sliding-window round).',
    tags: [ 'walmart', 'strings', 'sliding-window', 'hash-map' ],
    related: [ 'ds-3', 'ds-2' ],
    complexity: `- Time: O(n) — each character enters and leaves the window at most once
- Space: O(k) — the map never holds more than k + 1 keys`,
    followUp: '**Follow-up:** Exactly k distinct characters?\n> exactly(k) = atMost(k) − atMost(k − 1): two passes of the same routine. Counting subarrays with exactly k distinct integers (LC 992) uses the identical trick.',
    redFlags: '- Recomputes distinct count by scanning the map each step\n- Off-by-one on window length',
    keyPoints: `- Variable-size window over a \`char → count\` map; \`map.size\` IS the distinct count, as long as zero-count keys are removed
- Expand \`right\`, add its char. While \`map.size > k\`, decrement \`s[left]\`, drop the key when it hits 0, advance \`left\`. The window is now valid — record its length

\`\`\`kotlin
fun lengthOfLongestSubstringKDistinct(s: String, k: Int): Int {
    if (k == 0) return 0
    val count = HashMap<Char, Int>()
    var left = 0; var best = 0
    for (right in s.indices) {
        count.merge(s[right], 1, Int::plus)
        while (count.size > k) {
            val c = s[left++]
            if (count.merge(c, -1, Int::plus) == 0) count.remove(c)
        }
        best = maxOf(best, right - left + 1)
    }
    return best
}
\`\`\`

- \`k == 0\` and empty string both return 0; \`k ≥ distinct chars\` returns \`s.length\`
- Track \`bestStart\` alongside \`best\` if the substring itself is wanted
- Same skeleton: fruit into baskets (k = 2, LC 904), longest substring without repeats (\`ds-3\`), longest repeating character replacement (LC 424: window valid while \`len − maxFreq ≤ k\`)
- For lowercase-only input an \`IntArray(26)\` plus a distinct counter beats a HashMap`,
    answer: '- Window over a `char → count` map: extend `right`, then pull `left` while distinct keys exceed `k`.\n- Drop keys that reach count 0, otherwise the distinct tally inflates.\n- Track the max window length as you go rather than recomputing it at the end.'
  },
  {
    id: 'ds-33',
    type: 'data-structures',
    num: 33,
    difficulty: 'H',
    star: true,
    section: 'Stacks & Queues',
    title: 'Largest rectangle in a histogram (LC 84 — Walmart SDE-III monotonic-stack round).',
    tags: [ 'walmart', 'stack', 'monotonic-stack', 'arrays' ],
    related: [ 'ds-24', 'ds-29' ],
    complexity: `- Time: O(n) — every index is pushed and popped once
- Space: O(n) for the stack (strictly increasing heights)`,
    followUp: '**Follow-up:** Where else does this pattern appear?\n> Maximal rectangle in a binary matrix (LC 85) — build a per-row histogram and run this routine',
    redFlags: '- Wrong width formula (off-by-one on boundaries)\n- Stuck at O(n^2) brute force',
    keyPoints: `- The best rectangle uses some bar's full height and extends left and right until a SHORTER bar blocks it. So for each bar we need its previous-smaller and next-smaller indices — a monotonic stack gives both
- Keep a stack of indices with increasing heights. When bar i is shorter than the top, the top has found its right boundary (i); after popping, the new top is its left boundary. Width = \`i − newTop − 1\` (or \`i\` if the stack is now empty)
- A sentinel height 0 at index n flushes every remaining bar without a second loop

\`\`\`kotlin
fun largestRectangleArea(heights: IntArray): Int {
    val stack = ArrayDeque<Int>()                    // indices, heights increasing
    var best = 0
    for (i in 0..heights.size) {
        val h = if (i == heights.size) 0 else heights[i]   // sentinel
        while (stack.isNotEmpty() && heights[stack.last()] > h) {
            val height = heights[stack.removeLast()]
            val width = if (stack.isEmpty()) i else i - stack.last() - 1
            best = maxOf(best, height * width)
        }
        stack.addLast(i)
    }
    return best
}
\`\`\`

- Equal heights: popping on \`>\` (not \`>=\`) is fine — the last of a run of equal bars computes the full width
- Brute force for comparison: expand from every bar, O(n²)
- Overflow: height × width fits in Int for LC limits (10⁴ × 10⁵); say Long otherwise`,
    answer: '- Keep indices in a stack of increasing heights; a shorter bar pops the taller ones above it.\n- Each pop scores that bar\'s height × width, where width = current index minus the new top minus 1.\n- Draining leftovers at the end the same way is what catches the tallest bars — don\'t stop at the last real index.'
  },
  {
    id: 'ds-34',
    type: 'data-structures',
    num: 34,
    difficulty: 'H',
    star: true,
    section: 'Dynamic Programming',
    title: 'Longest increasing path in a matrix (LC 329 — asked as \'longest path in a matrix\' in Walmart SDE-III).',
    tags: [ 'walmart', 'dynamic-programming', 'dfs', 'graph' ],
    related: [ 'ds-12', 'ds-7', 'ds-19' ],
    complexity: 'Time: O(m·n), Space: O(m·n)',
    followUp: '**Follow-up:** Why is memoized DFS correct here?\n> The state graph is acyclic (values strictly increase along edges), so recursion terminates and memoized results are final',
    redFlags: '- Recomputes paths without memo (exponential)\n- Allows equal or decreasing moves',
    keyPoints: '- DFS + memoization: memo[i][j] = longest path starting at (i,j); move to 4 neighbors with strictly greater values; answer = max over all cells\n- Equivalent to longest path in a DAG (cells are nodes, edges go to strictly greater values) — Kahn\'s topological order also works\n- Plain row-order DP does not work because move direction depends on values',
    answer: '- Memoized DFS: `memo[i][j]` = longest run beginning at `(i,j)`, stepping only onto strictly greater cells.\n- Take the maximum across all starting cells. `O(m·n)` time and space.\n- Trap: ordinary row-order DP breaks because direction follows values; it is a DAG path, so Kahn also fits.'
  },
  {
    id: 'ds-35',
    type: 'data-structures',
    num: 35,
    difficulty: 'M',
    star: true,
    section: 'Arrays & Strings',
    title: 'Sort an array of 0s, 1s and 2s in one pass (Dutch national flag — Walmart senior loop).',
    tags: [ 'walmart', 'arrays', 'two-pointers', 'sorting' ],
    related: [ 'ds-16', 'ds-2' ],
    complexity: `- Time: O(n) — one pass; every step advances mid or shrinks high
- Space: O(1) — three indices, swaps in place`,
    followUp: '**Follow-up:** How would you extend to k colors?\n> Count-then-overwrite for small fixed k, or generalized three-way partitioning',
    redFlags: '- Forgets to re-examine the element swapped in from high\n- Two-pass counting sort when one pass was asked',
    keyPoints: `- Invariant over four regions: \`[0, low)\` = 0s, \`[low, mid)\` = 1s, \`[mid, high]\` = unknown, \`(high, n)\` = 2s. Loop while \`mid <= high\`
- \`nums[mid] == 0\` → swap with \`low\`, advance both (the value coming from \`low\` is a known 1, so it is safe to step past)
- \`== 1\` → just \`mid++\`
- \`== 2\` → swap with \`high\`, \`high--\`, and do NOT advance \`mid\` — the value swapped in from the unknown region has not been examined

\`\`\`kotlin
fun sortColors(nums: IntArray) {
    var low = 0; var mid = 0; var high = nums.size - 1
    while (mid <= high) {
        when (nums[mid]) {
            0 -> { nums.swap(low++, mid++) }
            1 -> mid++
            else -> nums.swap(mid, high--)
        }
    }
}

fun IntArray.swap(i: Int, j: Int) { val t = this[i]; this[i] = this[j]; this[j] = t }
\`\`\`

- Two-pass alternative: count 0s/1s/2s, then overwrite — also O(n)/O(1), but two passes and it only works because the values ARE the keys (no satellite data)
- This is Dijkstra's three-way partition; it is also how quicksort survives many duplicate keys (\`ds-15\`)
- Edge cases: empty array, all one colour, already sorted`,
    answer: '- Pointers `low`, `mid`, `high`: a 0 swaps down past `low`, a 2 swaps up past `high`, a 1 only moves `mid`.\n- Trap: after swapping a 2, leave `mid` put — the incoming value has not been seen yet.\n- One sweep beats a two-pass count-then-overwrite when only a single traversal is allowed.'
  },
  {
    id: 'ds-36',
    type: 'data-structures',
    num: 36,
    difficulty: 'M',
    star: false,
    section: 'Arrays & Strings',
    title: 'Maximum-sum subarray (Kadane\'s algorithm — Walmart coding-test staple).',
    tags: [ 'walmart', 'arrays', 'dynamic-programming' ],
    related: [ 'ds-12', 'ds-3' ],
    complexity: `- Time: O(n) — one pass
- Space: O(1) — two running values`,
    followUp: '**Follow-up:** How do you return the indices?\n> Restart start at i when current restarts at nums[i]; update end whenever best improves',
    redFlags: '- Fails on all-negative arrays\n- Confuses max-sum with longest positive subarray',
    keyPoints: `- DP view: \`cur\` = best sum of a subarray ENDING at i. Either extend the previous run or start fresh at i: \`cur = max(x, cur + x)\`. The answer is the max \`cur\` ever seen
- Seed both with \`nums[0]\` (not 0), or an all-negative array wrongly returns 0

\`\`\`kotlin
fun maxSubArray(nums: IntArray): Int {
    var cur = nums[0]; var best = nums[0]
    for (i in 1 until nums.size) {
        cur = maxOf(nums[i], cur + nums[i])
        best = maxOf(best, cur)
    }
    return best
}
\`\`\`

- Indices: remember \`start = i\` whenever \`cur\` restarts; copy \`(start, i)\` into \`(bestL, bestR)\` whenever \`best\` improves
- Max PRODUCT subarray (LC 152): carry both the max and the min ending at i — multiplying by a negative swaps them; zeros reset
- Circular (LC 918): max of the normal answer and \`total − minSubarray\`; if every element is negative, \`total − min\` would be the empty array, so return the normal answer
- Divide and conquer O(n log n) exists (best crossing the midpoint) — mention as the "why Kadane wins" contrast`,
    answer: '- `current = max(nums[i], current + nums[i])`, and `best` tracks the largest `current` seen.\n- Start and end positions can be recorded alongside without changing the pass count.\n- Named variants: max product carries both extremes; the circular case uses `total - min subarray`.'
  },
  {
    id: 'ds-37',
    type: 'data-structures',
    num: 37,
    difficulty: 'M',
    star: false,
    section: 'Trees & Graphs',
    title: 'Print the right view of a binary tree (Walmart SDE-III tree round).',
    tags: [ 'walmart', 'trees', 'bfs', 'dfs' ],
    related: [ 'ds-7', 'ds-6' ],
    complexity: `- Time: O(n) — every node visited once
- Space: BFS O(w) for the widest level; DFS O(h) recursion (O(n) on a skewed tree)`,
    followUp: '**Follow-up:** Left view?\n> Same ideas mirrored: left-first DFS or first node of each BFS level',
    redFlags: '- Confuses right view with the rightmost path\n- DFS version forgets depth tracking',
    keyPoints: `- The right view is the LAST node of every level — not the chain of right children. A left subtree that is deeper than the right one shows through
- BFS: process the queue one level at a time (snapshot \`q.size\`); the last node dequeued in each level goes into the result
- DFS: visit right before left, passing the depth; the first node reached at a new depth (\`depth == result.size\`) is visible

\`\`\`kotlin
fun rightSideView(root: TreeNode?): List<Int> {
    val out = mutableListOf<Int>()
    val q = ArrayDeque<TreeNode>()
    root?.let(q::addLast)
    while (q.isNotEmpty()) {
        val size = q.size
        repeat(size) { i ->
            val n = q.removeFirst()
            if (i == size - 1) out += n.\`val\`        // last in this level
            n.left?.let(q::addLast)
            n.right?.let(q::addLast)
        }
    }
    return out
}

fun rightSideViewDfs(root: TreeNode?): List<Int> {
    val out = mutableListOf<Int>()
    fun go(n: TreeNode?, depth: Int) {
        if (n == null) return
        if (depth == out.size) out += n.\`val\`        // first visit at this depth
        go(n.right, depth + 1)
        go(n.left, depth + 1)
    }
    go(root, 0)
    return out
}
\`\`\`

- Counterexample for "follow right children": root 1 with left child 2 whose child is 4, and right child 3 with no children — the view is [1, 3, 4]
- Same level-order skeleton gives left view, level averages, zigzag order, and per-level max`,
    answer: '- BFS by level, keeping the final node encountered at each depth.\n- Or DFS that tries the right child first, with a depth → value map where the first writer wins.\n- Pick BFS when the tree is shallow and wide, DFS when it\'s deep and narrow — same trade-off as any BFS/DFS choice.'
  },
  {
    id: 'ds-38',
    type: 'data-structures',
    num: 38,
    difficulty: 'M',
    star: false,
    section: 'Trees & Graphs',
    title: 'Mirror an n-ary tree (Walmart senior recursion round).',
    tags: [ 'walmart', 'trees', 'recursion' ],
    related: [ 'ds-6', 'ds-7' ],
    complexity: `- Time: O(n) — every node visited once; reversing a node's children is O(its child count), O(n) in total
- Space: O(h) recursion (O(n) for a degenerate chain); O(w) for the BFS variant`,
    followUp: '**Follow-up:** Iterative version?\n> Stack-based DFS or queue BFS; swap each node\'s children list when visited',
    redFlags: '- Treats it like a binary left/right swap\n- Breaks on empty children lists',
    keyPoints: `- Mirroring an n-ary tree = reversing the order of every node's children, at every level
- Order does not matter: reverse a node's list before or after recursing — each list is reversed exactly once either way
- Clarify in place vs a new tree. In place: the caller's tree changes; copy: allocate new nodes with reversed, mirrored children

\`\`\`kotlin
class NaryNode(val value: Int, val children: MutableList<NaryNode> = mutableListOf())

fun mirror(root: NaryNode?) {                       // in place
    if (root == null) return
    root.children.reverse()
    root.children.forEach(::mirror)
}

fun mirroredCopy(n: NaryNode): NaryNode =           // input untouched
    NaryNode(n.value, n.children.asReversed().mapTo(mutableListOf()) { mirroredCopy(it) })

fun mirrorIterative(root: NaryNode?) {
    val stack = ArrayDeque<NaryNode>()
    root?.let(stack::addLast)
    while (stack.isNotEmpty()) {
        val n = stack.removeLast()
        n.children.reverse()
        n.children.forEach(stack::addLast)
    }
}
\`\`\`

- Empty children list is the natural base case — \`reverse()\` on it is a no-op
- Binary tree special case: swap \`left\` and \`right\` (LC 226, invert binary tree)
- Check: mirroring twice returns the original tree; a level-order print of the mirror is each level reversed`,
    answer: '- Post-order: mirror every child subtree, then reverse the `children` collection; reversing first also works.\n- Nodes expose a `children[]` array rather than left/right — settle in-place versus a returned copy.\n- State the in-place-vs-copy decision out loud before coding; it changes whether the caller\'s tree is still valid afterward.'
  },
  {
    id: 'ds-39',
    type: 'data-structures',
    num: 39,
    difficulty: 'M',
    star: true,
    section: 'Sorting & Searching',
    title: 'Minimum number of platforms for a railway station (Walmart SDE-III greedy round).',
    tags: [ 'walmart', 'greedy', 'sorting', 'prefix-sum', 'palo-alto' ],
    related: [ 'ds-27', 'ds-19' ],
    complexity: `- Time: O(n log n) for the two sorts; the sweep is O(n)
- Space: O(1) extra if the input arrays may be sorted in place, O(n) for sorted copies (or for the min-heap variant)`,
    followUp: '**Follow-up:** What if a train arrives exactly when another departs?\n> Clarify tie-breaking — the usual convention needs an extra platform on equality',
    redFlags: '- Sorts (arrival, departure) pairs and single-passes (breaks on interleaving)\n- Off-by-one on the equality tie',
    keyPoints: `- The answer is the maximum number of trains present at the same moment — which train uses which platform does not matter, so arrivals and departures can be sorted INDEPENDENTLY
- Sweep both sorted arrays: if the next event is an arrival (\`arr[i] <= dep[j]\`), occupy a platform; otherwise a departure frees one. Track the peak

\`\`\`kotlin
fun minPlatforms(arr: IntArray, dep: IntArray): Int {
    val a = arr.sortedArray(); val d = dep.sortedArray()
    var i = 0; var j = 0; var inUse = 0; var peak = 0
    while (i < a.size) {
        if (a[i] <= d[j]) { inUse++; i++; peak = maxOf(peak, inUse) }   // <= : arrival at a departure instant needs its own platform
        else { inUse--; j++ }
    }
    return peak
}
\`\`\`

- \`<=\` vs \`<\` encodes the tie rule: with \`<=\` a train arriving at 10:00 cannot reuse a platform freed at 10:00; use \`<\` if it can — ask
- Same problem as meeting rooms II (LC 253). Min-heap alternative: sort by start, keep a heap of end times, pop every end ≤ the current start, push the current end — heap size peak is the answer; it also tells you WHICH room to assign
- Sweep-line form: events \`(time, +1)\` / \`(time, −1)\`, sort with departures before arrivals at equal times (or after, per the tie rule), running sum max
- Bounded times (minutes in a day): difference array of size 1440 + prefix sum → O(n + T), no sort`,
    answer: '- Sort arrivals and departures as separate arrays, then walk both with two pointers.\n- `arrival <= departure` consumes a platform (count++); otherwise one frees (count--) — keep the peak.\n- Same idea as a sweep line: +1 on arrivals, -1 on departures, running max is the answer either way.'
  },
  {
    id: 'ds-40',
    type: 'data-structures',
    num: 40,
    difficulty: 'M',
    star: false,
    section: 'Sorting & Searching',
    title: 'Sort a nearly-sorted (k-sorted) array — every element is at most k from its target position (Walmart screen, InterviewBit-confirmed).',
    tags: [ 'walmart', 'heap', 'sorting' ],
    related: [ 'ds-27', 'ds-16' ],
    complexity: `- Time: O(n log k) — n pushes and pops on a heap of at most k + 1 elements
- Space: O(k) for the heap; output written back in place`,
    followUp: '**Follow-up:** Why k+1?\n> The correct next output element is at most k positions ahead, so a window of k+1 suffices',
    redFlags: '- Full heapsort (misses the point of the constraint)\n- Heap of size k instead of k+1',
    keyPoints: `- The element that belongs at position i sits somewhere in \`[i, i + k]\` (it moved at most k), so a min-heap over that k + 1 wide window always contains it
- Seed the heap with the first k + 1 elements; then for each output slot pop the min, write it, and push the next unread element; drain at the end

\`\`\`kotlin
import java.util.PriorityQueue

fun sortKSorted(a: IntArray, k: Int) {
    val heap = PriorityQueue<Int>()
    var write = 0
    for (x in a) {                  // reading runs ahead of writing, so overwriting is safe
        heap.add(x)
        if (heap.size > k) a[write++] = heap.poll()   // heap holds k + 1 here before the poll
    }
    while (heap.isNotEmpty()) a[write++] = heap.poll()
}
\`\`\`

- Writing back in place is safe: the write index always trails the read index by k
- Insertion sort is the other honest answer: each element shifts at most k places → O(n·k), O(1) space — better when k is tiny
- k ≥ n degenerates to a plain heap sort, O(n log n)
- Real-world shape: merging slightly out-of-order event timestamps (network jitter) before processing`,
    answer: '- Seed a min-heap with the first `k+1` items, then pop-min to output while pushing each next element.\n- Sound because each element lands within `k` of its final slot, so the heap holds the true successor.\n- A heap sized `k+1`, not `k`, is what makes this correct — undersizing it drops the actual next element.'
  },
  {
    id: 'ds-41',
    type: 'data-structures',
    num: 41,
    difficulty: 'M',
    star: false,
    section: 'Stacks & Queues',
    title: 'Minimum removals to make parentheses valid (Walmart coding test string round).',
    tags: [ 'walmart', 'strings', 'stack' ],
    related: [ 'ds-17', 'ds-31' ],
    complexity: `- Time: O(n) — two linear passes
- Space: O(n) for the removal marks and the rebuilt string`,
    followUp: '**Follow-up:** Return ALL valid results (LC 301)?\n> BFS over removal states or DFS with dedup — the hard generalization',
    redFlags: '- Handles only unmatched \'(\'\n- O(n) string concatenation per character when rebuilding',
    keyPoints: `- Two kinds of bad characters: a \`)\` with no open \`(\` before it, and a \`(\` never closed. Both are found in one left-to-right pass
- Pass 1: \`balance\` counts open \`(\`. A \`)\` at balance 0 is marked for removal. Remember the indices of open \`(\` on a stack; whatever is left on it at the end is unmatched
- Pass 2: rebuild with a \`StringBuilder\`, skipping marked indices. Count only (LC 921): the answer is \`strayClosers + balance\`

\`\`\`kotlin
fun minRemoveToMakeValid(s: String): String {
    val remove = BooleanArray(s.length)
    val open = ArrayDeque<Int>()                    // indices of unmatched '('
    for ((i, c) in s.withIndex()) {
        when (c) {
            '(' -> open.addLast(i)
            ')' -> if (open.isEmpty()) remove[i] = true else open.removeLast()
        }
    }
    for (i in open) remove[i] = true                // never closed
    return buildString { for (i in s.indices) if (!remove[i]) append(s[i]) }
}
\`\`\`

- Non-bracket characters (LC 1249 allows letters) pass through untouched
- The removal set is minimal: every removed char is unmatched under any pairing, so no smaller set can work
- Single counter version without a stack: pass left-to-right dropping stray \`)\`, then right-to-left dropping excess \`(\` — two passes, O(1) extra beyond the output
- Never build the result with \`+=\` on a \`String\` in a loop — that is O(n²) copying`,
    answer: '- Single sweep with a balance counter: `(` raises it; a `)` seen at balance 0 is flagged for deletion.\n- Whatever balance remains is unmatched `(` to strip from the tail; rebuild skipping flagged indices.\n- Alternative: stack of open indices plus a set of stray closers. `O(n)` time, `O(n)` space.'
  },
  {
    id: 'ds-42',
    type: 'data-structures',
    num: 42,
    difficulty: 'M',
    star: false,
    section: 'Backtracking',
    title: 'Custom digit mapping — letter combinations of a phone number (LC 17; Walmart \'custom mapping\' coding test).',
    tags: [ 'walmart', 'backtracking', 'strings' ],
    related: [ 'ds-22', 'ds-45' ],
    complexity: 'Time: O(4^n · n), Space: O(n) recursion depth',
    followUp: '**Follow-up:** \'Custom mapping\' variant — an array maps digits to arbitrary letter sets?\n> Same algorithm; source letters from the provided mapping instead of the fixed keypad',
    redFlags: '- Deeply nested loops instead of recursion\n- mishandles digits with no letters (0/1)',
    keyPoints: `- Decision tree: depth = number of digits, branching = letters for that digit (3 or 4 on a keypad). Every leaf is an answer, so there is nothing to prune — the work IS the output size
- Backtracking: one shared \`StringBuilder\`; append a letter, recurse to the next digit, delete it on the way back. Emit when the buffer length equals the number of digits

\`\`\`kotlin
private val KEYPAD = mapOf(
    '2' to "abc", '3' to "def", '4' to "ghi", '5' to "jkl",
    '6' to "mno", '7' to "pqrs", '8' to "tuv", '9' to "wxyz",
)

fun letterCombinations(digits: String, mapping: Map<Char, String> = KEYPAD): List<String> {
    val letters = digits.mapNotNull { mapping[it]?.takeIf(String::isNotEmpty) }  // skip 0/1
    if (letters.isEmpty()) return emptyList()
    val out = mutableListOf<String>()
    val sb = StringBuilder()
    fun go(i: Int) {
        if (i == letters.size) { out += sb.toString(); return }
        for (c in letters[i]) {
            sb.append(c)
            go(i + 1)
            sb.deleteCharAt(sb.length - 1)          // undo
        }
    }
    go(0)
    return out
}
\`\`\`

- The "custom mapping" variant is the \`mapping\` parameter — the algorithm is unchanged
- Iterative alternative: start from \`[""]\` and, for each digit, replace the list with every string × every letter — no recursion, but holds all partial results at once
- Empty input returns an empty list (LC 17), not \`[""]\` — state it
- Complexity reasoning: up to 4ⁿ leaves, each costing O(n) to copy into the output`,
    answer: '- Table digit → letters, then recurse one position at a time into a buffer, emitting once it is full length.\n- Iterative route: expand the accumulated partial strings digit by digit — trades recursion depth for holding every partial result at once.\n- Skip digits with no letters (0/1) rather than mapping them to an empty branch.'
  },
  {
    id: 'ds-43',
    type: 'data-structures',
    num: 43,
    difficulty: 'M',
    star: false,
    section: 'Linked Lists',
    title: 'Add two numbers represented as linked lists (Walmart coding test: \'sum of numbers in a linked list\').',
    tags: [ 'walmart', 'linked-list', 'math' ],
    related: [ 'ds-4', 'ds-5' ],
    complexity: `- Time: O(max(m, n)) — one walk over both lists (plus reversals for MSD-first)
- Space: O(1) extra beyond the O(max(m, n)) output list; O(m + n) if stacks are used for MSD-first`,
    followUp: '**Follow-up:** Numbers stored as huge strings?\n> Same schoolbook addition on reversed strings',
    redFlags: '- Drops the final carry\n- Mutates inputs when told not to',
    keyPoints: `- Schoolbook addition: digit sum = a + b + carry, write \`sum % 10\`, carry \`sum / 10\`
- LSD-first (LC 2): the lists are already in addition order. Keep going while EITHER list or the carry remains — that one loop condition handles unequal lengths and the final carry

\`\`\`kotlin
fun addTwoNumbers(l1: ListNode?, l2: ListNode?): ListNode? {
    val dummy = ListNode(0)
    var tail = dummy
    var a = l1; var b = l2; var carry = 0
    while (a != null || b != null || carry != 0) {
        val sum = (a?.\`val\` ?: 0) + (b?.\`val\` ?: 0) + carry
        tail.next = ListNode(sum % 10)
        tail = tail.next!!
        carry = sum / 10
        a = a?.next; b = b?.next
    }
    return dummy.next
}
\`\`\`

- MSD-first (LC 445): push both lists' digits onto two stacks (input untouched), pop and add, and PREPEND each result node — no final reversal needed. Or reverse both inputs (\`ds-5\`), add as above, reverse the result
- Never convert to Int/Long: lists can be 100 digits long
- Edge cases: 0 + 0, lengths 1 and 100, 999 + 1 (the carry creates a new leading node)`,
    answer: '- LSD-first: walk both lists together carrying overflow (LC 2) — the natural direction when digits are already stored least-significant-first.\n- MSD-first: flip both lists, or stage them on stacks, add, then flip the sum back (LC 445).\n- Traps: unequal lengths, plus a final carry that grows an extra leading node.'
  },
  {
    id: 'ds-44',
    type: 'data-structures',
    num: 44,
    difficulty: 'M',
    star: false,
    section: 'Arrays & Strings',
    title: 'Circular Permutation in Binary Representation — Gray-code sequence starting from a given number (LC 1238).',
    tags: [ 'walmart', 'bit-manipulation' ],
    related: [ 'ds-16', 'ds-1' ],
    complexity: `- Time: O(2ⁿ) — one O(1) XOR per output element
- Space: O(1) extra beyond the 2ⁿ-element output`,
    followUp: '**Follow-up:** Why do consecutive Gray codes differ in exactly one bit?\n> i and i+1 differ in a trailing-ones suffix plus one carry bit; XOR with i>>1 cancels all but that single bit',
    redFlags: '- Generates then rotates the array (O(2^n) extra) when per-element XOR exists\n- Off-by-one on sequence length',
    keyPoints: `- Task: output a permutation of \`0 until 2ⁿ\` that starts at \`start\`, where neighbours (including last → first) differ in exactly one bit
- Reflected Gray code \`g(i) = i xor (i shr 1)\` already has the one-bit property and wraps around (\`g(2ⁿ − 1)\` and \`g(0)\` differ in the top bit only)
- XOR-ing every element with the same constant preserves pairwise differences: \`(x xor s) xor (y xor s) = x xor y\`. Since \`g(0) = 0\`, XOR with \`start\` makes the sequence begin at \`start\` — no rotation needed

\`\`\`kotlin
fun circularPermutation(n: Int, start: Int): List<Int> =
    List(1 shl n) { i -> start xor i xor (i shr 1) }
\`\`\`

- Still a permutation: XOR with a constant is a bijection on n-bit values
- Kotlin bit operators are infix functions (\`xor\`, \`shr\`, \`shl\`, \`and\`) with LOWER precedence than \`==\` and arithmetic — parenthesise when mixing (\`(x and 1) == 1\`)
- Plain Gray code (LC 89) is the \`start = 0\` case; the decoder is a prefix XOR of the bits from high to low
- Real uses: rotary encoders and Karnaugh maps — only one bit changes per step, so a mid-transition read is off by at most one`,
    answer: '- Emit Gray codes via `g(i) = i XOR (i >> 1)` across `[0, 2^n)`.\n- Then XOR each entry with `start`: single-bit adjacency survives, yielding the rotated cycle.\n- Prefer the per-element XOR over generating then rotating the array — it skips a second full pass.'
  },
  {
    id: 'ds-45',
    type: 'data-structures',
    num: 45,
    difficulty: 'H',
    star: true,
    section: 'Sorting & Searching',
    title: 'Sort strings by a custom alphabet order (comparator sort; Walmart senior round with an O(1)-space extension).',
    tags: [ 'walmart', 'sorting', 'strings', 'comparator' ],
    related: [ 'ds-15', 'ds-16', 'ds-42' ],
    complexity: '- Time: O(n·L log n) — O(n log n) comparisons, each up to O(L) characters\n- Space: O(26) for the rank table, plus the sort\'s own buffer — TimSort on objects (Kotlin `sortedWith`) uses up to O(n) extra',
    followUp: '**Follow-up:** How do you validate the alphabet itself?\n> It must be a permutation of the same character set — no repeats, no omissions',
    redFlags: '- Rebuilds rank lookups inside the comparator per character (hoist the rank array)\n- Forgets the prefix rule',
    keyPoints: `- Build \`rank[26]\` once from the custom alphabet (\`rank[order[i] - 'a'] = i\`); hoist it out of the comparator
- Comparator: walk both strings to the first differing character and compare ranks; if one string runs out first it is a prefix and sorts first

\`\`\`kotlin
fun sortByAlphabet(words: List<String>, order: String): List<String> {
    val rank = IntArray(26)
    order.forEachIndexed { i, c -> rank[c - 'a'] = i }
    val cmp = Comparator<String> { a, b ->
        val n = minOf(a.length, b.length)
        for (i in 0 until n) {
            if (a[i] != b[i]) return@Comparator rank[a[i] - 'a'] - rank[b[i] - 'a']
        }
        a.length - b.length                          // prefix sorts first
    }
    return words.sortedWith(cmp)
}

fun isAlienSorted(words: Array<String>, order: String): Boolean {   // LC 953
    val rank = IntArray(26)
    order.forEachIndexed { i, c -> rank[c - 'a'] = i }
    for (w in 0 until words.size - 1) {
        val a = words[w]; val b = words[w + 1]
        val i = a.indices.firstOrNull { it >= b.length || a[it] != b[it] } ?: continue  // a is a prefix of b
        if (i >= b.length || rank[a[i] - 'a'] > rank[b[i] - 'a']) return false
    }
    return true
}
\`\`\`

- The sortedness check needs one pass over adjacent pairs — O(total characters) — because order is transitive
- Alternative key-based sort: map each word to its rank-translated string once (\`sortedBy\`), so comparisons become plain string compares — O(n·L) extra memory, fewer lookups
- Validate the alphabet: exactly the 26 letters, each once; otherwise ranks collide or are missing
- Related: alien dictionary (derive the order FROM sorted words) is topological sort (\`ds-20\`)`,
    answer: '- Derive `rank[26]` from the supplied alphabet and sort with a comparator matching characters by rank.\n- Trap: a string that merely prefixes another must come out first.\n- `O(n·L log n)` time, `O(1)` extra past the table; the sortedness check (LC 953) needs one pass.'
  },
  {
    id: 'ds-46',
    type: 'data-structures',
    num: 46,
    difficulty: 'M',
    star: false,
    section: 'Concurrency',
    title: 'Print even and odd numbers alternately using two threads (Walmart senior concurrency round).',
    tags: [ 'walmart', 'concurrency', 'multithreading', 'java' ],
    related: [ 'ds-1', 'tech-136' ],
    complexity: `- Time: O(n) prints, each paying a thread hand-off (context switch) — this is a coordination exercise, not a fast one
- Space: O(1) — one counter and one lock`,
    followUp: '**Follow-up:** Extend to N threads?\n> Counter modulo N with notifyAll, or a condition per turn; discuss throughput vs simplicity',
    redFlags: '- Busy-waiting instead of wait/notify\n- Deadlock from notify without condition re-check',
    keyPoints: `- Shared state: one counter guarded by one lock. Each thread loops: lock, WAIT while it is not its turn (\`counter % 2\` ≠ its parity), print, increment, wake the other, unlock
- The wait is in a \`while\`, never an \`if\`: wakeups can be spurious, and with more threads the condition may be false again by the time you hold the lock
- Termination: both threads must also exit when \`counter > n\`, or the last one waits forever

\`\`\`kotlin
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.thread
import kotlin.concurrent.withLock

class EvenOddPrinter(private val n: Int) {
    private val lock = ReentrantLock()
    private val turn = lock.newCondition()
    private var counter = 1

    private fun run(parity: Int) {
        while (true) {
            lock.withLock {
                while (counter <= n && counter % 2 != parity) turn.await()
                if (counter > n) { turn.signalAll(); return }
                println("\${Thread.currentThread().name}: $counter")
                counter++
                turn.signalAll()
            }
        }
    }

    fun start() {
        thread(name = "odd") { run(1) }
        thread(name = "even") { run(0) }
    }
}
\`\`\`

- Java-monitor version: \`synchronized(lock) { while (...) lock.wait(); ...; lock.notifyAll() }\` — the same protocol
- Semaphore version: \`odd = Semaphore(1)\`, \`even = Semaphore(0)\`; odd thread does \`odd.acquire(); print; even.release()\` and vice versa — the permits encode whose turn it is
- Coroutines alternative (Android-friendly): two coroutines ping-ponging over a rendezvous \`Channel<Unit>\`, or a single \`Mutex\` + state — no blocked OS threads
- N threads: same counter, each waits for \`counter % N == id\`; \`signalAll\` wakes everyone, so per-thread \`Condition\`s scale better`,
    answer: '- One shared counter under a monitor: print only when `counter % 2` is your parity, increment, `notifyAll()`.\n- `wait()` whenever the parity is not yours, re-tested inside a `while` loop rather than an `if` — guards against spurious wakeups.\n- Or pass a token with two binary semaphores instead of a monitor.'
  },
  {
    id: 'ds-47',
    type: 'data-structures',
    num: 47,
    difficulty: 'E',
    star: false,
    section: 'Concurrency',
    title: 'Why might one thread never see another thread\'s write? Memory visibility and what volatile fixes (primer).',
    tags: [ 'concurrency', 'memory-model', 'java', 'basics' ],
    related: [ 'ds-46', 'ds-48', 'ds-49' ],
    source: 'interview',
    complexity: 'Time: volatile read/write O(1) plus memory-barrier cost; Space: O(1) — correctness fix, not a speed fix',
    followUp: '**Follow-up:** Is volatile enough for `count++`?\n> No — read-modify-write is not atomic; use AtomicInteger (CAS) or synchronize the increment.',
    redFlags: '- Assumes CPU caches are automatically coherent between threads\n- Claims volatile makes compound operations atomic\n- Has never heard of happens-before',
    keyPoints: '- Without a happens-before edge, the compiler/CPU may reorder writes and the reading thread may serve a stale value from cache or a register — forever\n- Classic symptom: `while (!stop) { }` never exits because the JIT hoists the plain field read out of the loop\n```java\n// Thread A                     // Thread B\nboolean stop = false;           while (!stop) { work(); }\nvoid shutdown() { stop = true; } // may NEVER be seen: no happens-before\nvolatile boolean stop = false;   // now a write flushes and a read cannot hoist\n```\n- volatile guarantees visibility + ordering for that field; synchronized and lock acquire/release give the same guarantee via the monitor\n- It does NOT make `i++` atomic — that needs AtomicInteger or a lock',
    answer: '- A plain field written by one thread may never become visible to another: reordering plus cached/register reads give no happens-before edge.\n- `volatile` forces writes out and reads in with ordering — the stop-flag loop then terminates; locks provide the same guarantee.\n- Visibility ≠ atomicity: `count++` still races; reach for `AtomicInteger` or `synchronized`.'
  },
  {
    id: 'ds-48',
    type: 'data-structures',
    num: 48,
    difficulty: 'M',
    star: true,
    section: 'Concurrency',
    title: 'Design a bounded-buffer producer–consumer: how do put() and take() block correctly?',
    tags: [ 'concurrency', 'producer-consumer', 'queues', 'java' ],
    related: [ 'ds-46', 'ds-47', 'ds-50' ],
    source: 'interview',
    complexity: 'Time: O(1) per put/take when uncontended; blocking moves threads between runnable and waiting sets\nSpace: O(capacity) for the buffer — the bound is the whole point',
    followUp: '**Follow-up:** Why while() and never if() around await()?\n> Spurious wakeups plus lost-wakeup races: another consumer may take the item between signal and your resume, so re-check the condition.',
    redFlags: '- Guards wait()/await with `if` instead of a `while` loop\n- Uses a single condition (notifyAll) so producers wake producers\n- Unbounded queue — "solved" by dropping the bound',
    keyPoints: '- Shared fixed array/deque + lock + TWO conditions: notFull for producers, notEmpty for consumers\n- put: lock, `while (size == cap) notFull.await()`, insert, notEmpty.signal(); take mirrors it. Always signal AFTER mutating state, unlock in finally\n```java\nclass BoundedBuffer<T> {\n    private final Queue<T> q = new ArrayDeque<>();\n    private final int cap; private final Lock lock = new ReentrantLock();\n    private final Condition notFull = lock.newCondition(), notEmpty = lock.newCondition();\n    BoundedBuffer(int cap) { this.cap = cap; }\n    public void put(T x) throws InterruptedException {\n        lock.lock();\n        try {\n            while (q.size() == cap) notFull.await();\n            q.add(x); notEmpty.signal();\n        } finally { lock.unlock(); }\n    }\n    public T take() throws InterruptedException {\n        lock.lock();\n        try {\n            while (q.isEmpty()) notEmpty.await();\n            T x = q.remove(); notFull.signal(); return x;\n        } finally { lock.unlock(); }\n    }\n}\n```\n- Simpler correct form: `BlockingQueue` (LinkedBlockingQueue/ArrayBlockingQueue) — same protocol built in; interviewers want to see you know the hand-rolled version\n- Shutdown: poison pill, or interrupt awaiting consumers; back-pressure = producer naturally blocks when the buffer fills',
    answer: '- Bounded buffer with a lock plus two conditions: producers `while (full) notFull.await()`, consumers `while (empty) notEmpty.await()`, signal the opposite condition after mutating.\n- The bound gives back-pressure; `ArrayBlockingQueue` is exactly this protocol in the JDK — reach for it before hand-rolling.\n- Shutdown via poison pill or interrupting awaiting consumers, not by killing the thread.'
  },
  {
    id: 'ds-49',
    type: 'data-structures',
    num: 49,
    difficulty: 'M',
    star: false,
    section: 'Concurrency',
    title: 'Readers–writer locks: what trade-off do they make, and when do they lose to a plain mutex?',
    tags: [ 'concurrency', 'locks', 'readers-writers', 'java' ],
    related: [ 'ds-48', 'ds-47', 'ds-50' ],
    source: 'interview',
    complexity: 'Time: O(1) uncontended lock bookkeeping; n readers run their critical sections concurrently, writers exclusive\nSpace: O(1) state (counter + waiters)',
    redFlags: '- Claims an RWMutex is always faster than a plain mutex\n- Tries to upgrade a held read lock to a write lock (deadlock)\n- Forgets unlock in finally, or ignores writer starvation policy',
    keyPoints: '- Rule: many readers OR exactly one writer, never both — matches read-mostly data (config maps, caches)\n- Implementation: mutex + condition + readerCount; readers wait only while a writer holds/waits; writer waits for count == 0\n- Java `ReentrantReadWriteLock`, Go `sync.RWMutex`, C++ `shared_mutex` — readLock/writeLock\n```java\nprivate final ReadWriteLock rw = new ReentrantReadWriteLock();\nString get(String k) {\n    rw.readLock().lock();\n    try { return map.get(k); } finally { rw.readLock().unlock(); }\n}\nvoid put(String k, String v) {\n    rw.writeLock().lock();\n    try { map.put(k, v); } finally { rw.writeLock().unlock(); }\n}\n```\n- Policy matters: read-preferring starves writers; write-preferring starves readers — know which yours is\n- Loses to a plain mutex when critical sections are short (counter bookkeeping + cache-line ping-pong exceeds the exclusion saved); read-heavy with long reads is the win\n- Alternatives: copy-on-write / atomic snapshot swap (no lock on read at all), StampedLock optimistic reads',
    answer: '- Shared-read / exclusive-write: multiple readers at once, one writer alone — ideal for read-mostly state.\n- Cost is bookkeeping; short critical sections make it slower than a plain mutex, so measure before reaching for it.\n- Pick a fairness policy explicitly (writer- or reader-preferring) or you inherit silent starvation.'
  },
  {
    id: 'ds-50',
    type: 'data-structures',
    num: 50,
    difficulty: 'H',
    star: false,
    section: 'Concurrency',
    title: 'Implement a thread-safe rate limiter (token bucket) for a multi-threaded service.',
    tags: [ 'concurrency', 'rate-limiting', 'locks', 'design' ],
    related: [ 'ds-49', 'ds-48', 'ds-46' ],
    source: 'interview',
    complexity: 'Time: O(1) per tryAcquire — lazy refill does constant work; Space: O(1) for token bucket vs O(requests) for sliding log',
    followUp: '**Follow-up:** How do you enforce one limit across a fleet of pods?\n> Shared store with atomic ops — Redis Lua (INCR+EXPIRE, or token refill with timestamps) — accepting the extra RTT and clock skew.',
    redFlags: '- Read-modify-write on tokens OUTSIDE the lock (classic race)\n- Sliding-log unbounded — memory grows with the traffic it is limiting\n- Presents a per-JVM limiter as a global limit',
    keyPoints: '- Token bucket: capacity (burst) + refillRate; allow iff at least one token is available after refill\n- Do the whole update — compute elapsed, add tokens, cap at capacity, decrement — inside ONE critical section; that is the thread-safety point\n```kotlin\nclass TokenBucket(private val capacity: Double, private val refillPerSec: Double) {\n    private var tokens = capacity\n    private var lastNs = System.nanoTime()\n    @Synchronized fun tryAcquire(): Boolean {\n        val now = System.nanoTime()\n        tokens = minOf(capacity, tokens + (now - lastNs) / 1e9 * refillPerSec)\n        lastNs = now\n        if (tokens < 1.0) return false\n        tokens -= 1.0\n        return true\n    }\n}\n```\n- Fractional tokens are deliberate: with integer math, `elapsed * rate / 1e9` floors to 0 on frequent calls while `lastNs` still advances, so a busy caller starves the bucket forever. Either keep a Double, or advance `lastNs` only by the time actually converted into whole tokens\n- `System.nanoTime()` (monotonic), never `currentTimeMillis()` — wall-clock jumps would mint or burn tokens\n- Lock-free variant: pack (tokens, timestamp) in one long and CAS-loop, or use a Semaphore whose permits refill on a scheduler\n- Compare algorithms: fixed window (cheap, burst at boundary), sliding log (exact, heavy), sliding counter (approx), leaky bucket (smooths output) — token bucket allows controlled bursts\n- Mention multi-instance reality: local bucket is per-process; global needs Redis or a sidecar',
    answer: '- Keep capacity, refill rate, token count and last-refill timestamp; refill lazily on each tryAcquire and allow only if a token remains.\n- The refill+consume must be one atomic step — `@Synchronized`/CAS — or two threads drain the bucket negative.\n- `O(1)` time and space per call vs `O(requests)` for a sliding log; one JVM\'s bucket is not a fleet-wide limit.'
  },
  {
    id: 'ds-51',
    type: 'data-structures',
    num: 51,
    difficulty: 'M',
    star: false,
    section: 'Hash Maps',
    title: 'Hash collisions: separate chaining vs open addressing — memory, clustering, and deletion trade-offs.',
    tags: [ 'hash-map', 'collisions', 'memory', 'data-structures' ],
    related: [ 'ds-10', 'ds-31', 'ds-23' ],
    source: 'interview',
    complexity: 'Chaining: O(1) avg ops, chain scan O(α) with load factor α = n/m, α may exceed 1\nOpen addressing: O(1) only while α < ~0.7; expected probes ≈ 1/(1−α), diverging as α → 1',
    followUp: '**Follow-up:** Why can chaining run with load factor > 1 but open addressing cannot?\n> Every key needs a free slot in the shared array; as the table fills, probe sequences span it. Chaining just grows each bucket\'s list.',
    redFlags: '- Deletes from open addressing without tombstones (severs probe chains)\n- Cannot explain primary clustering from linear probing\n- Says chaining is always slower — misses the cache-locality argument',
    keyPoints: '- Chaining: each bucket owns a list (or RB-tree once a chain > 8 in Java 8 HashMap); insertion order survives, deletion is a plain list remove\n- Open addressing: entries live IN the array; collision → probe (linear, quadratic, double hashing); all keys probe the same slots → primary clustering with linear probing\n- Deletion in open addressing needs a TOMBSTONE so later probes do not stop early; tombstones count against load factor\n- Memory: open addressing is one big array (cache-friendly, no pointers) vs chaining\'s pointer-chasing per bucket\n- Who uses what: Java HashMap/LinkedHashMap chain; Python dict and Go map probe/tombstone-style\n- Failure mode for both: adversarial hashCodes → every key in one bucket/chain; salt or treeify the chain',
    answer: '- Chaining keeps collisions in per-bucket lists: load factor may exceed 1, deletion is trivial, but nodes scatter in memory.\n- Open addressing probes within one array: cache-friendly and pointer-free, yet needs load factor < ~0.7, clusters, and tombstones for delete.\n- Expected probes for open addressing grow like `1/(1−α)` — the resize policy is the difference between O(1) and crawling.'
  },
  {
    id: 'ds-52',
    type: 'data-structures',
    num: 52,
    difficulty: 'M',
    star: false,
    section: 'Hash Maps',
    title: 'What is consistent hashing, and why does it fix naive mod-N sharding?',
    tags: [ 'hashing', 'sharding', 'caching', 'distributed' ],
    related: [ 'ds-23', 'ds-10', 'sd-3' ],
    source: 'interview',
    complexity: 'Lookup: O(log N) binary search on the sorted ring; rebalance moves ~K/N keys vs ~K·(N−1)/N for mod-N\nSpace: O(N × vnodes) ring entries',
    redFlags: '- Says "only new keys hit the new server" without the ring argument for why\n- Ships no virtual nodes and gets wildly uneven load\n- Cannot say where consistent hashing is actually used (memcached, Dynamo, Cassandra)',
    keyPoints: '- Naive `hash(key) % N`: change N at all and nearly every key remaps — cache storms and full data reshuffle\n- Ring: hash both keys and nodes onto one 32/64-bit circle; a key lives at the FIRST node clockwise from its hash\n- Adding a node steals keys only from its counter-clockwise neighbour (~1/N of all keys); removing returns just that slice\n- Virtual nodes: each physical node plants 100–250 points on the ring → balances load and spreads hot-key risk\n- Replicas: look at the next N distinct physical nodes (vnodes collapse onto one machine otherwise)\n- Rendezvous (HRW) hashing is the no-ring alternative: score = hash(key, node), take max — O(N) per lookup, trivially rebalanced',
    answer: '- `hash(key) % N` moves almost every key when N changes; consistent hashing maps keys AND nodes onto one circle instead.\n- Each key belongs to the first node clockwise, so joining or leaving touches only ~1/N of the keyspace.\n- Virtual nodes fix skew; Dynamo/Cassandra/memcached clients use it, and rendezvous hashing is the ring-free, O(N)-per-lookup alternative.'
  },
  {
    id: 'ds-53',
    type: 'data-structures',
    num: 53,
    difficulty: 'M',
    star: true,
    section: 'Linked Lists',
    title: 'Deep-copy a linked list where every node also carries a random pointer (LC 138).',
    tags: [ 'linked-list', 'hash-map', 'copy', 'advanced' ],
    related: [ 'ds-5', 'ds-43', 'ds-4' ],
    source: 'interview',
    complexity: 'Time: O(n) — two passes either way\nSpace: O(n) for the map; O(1) extra for the interleaving trick (but it mutates the input)',
    followUp: '**Follow-up:** How do you drop the hashmap?\n> Interleave A→A\'→B→B\'…, set clone.random = orig.random.next, then unweave — O(1) extra, at the cost of touching the input.',
    redFlags: '- Assigns clone.random from the ORIGINAL list\'s nodes (mixes old and new)\n- Breaks when random points backward or at the node itself\n- Map version: forgets the null cases for next/random',
    keyPoints: '- Node(val, next, random); random may be null or any earlier/later node — a full traversal order does not exist, which is what breaks the naive single pass\n- Approach 1: map original → clone for every node first, second pass links next/random through the map. Two clean passes, no input mutation\n```kotlin\nclass Node(var `val`: Int, var next: Node? = null, var random: Node? = null)\nfun copyRandomList(head: Node?): Node? {\n    if (head == null) return null\n    val map = HashMap<Node, Node>()\n    var cur: Node? = head\n    while (cur != null) { map[cur] = Node(cur.`val`); cur = cur.next }\n    cur = head\n    while (cur != null) {\n        map[cur]!!.next = cur.next?.let { map[it] }\n        map[cur]!!.random = cur.random?.let { map[it] }\n        cur = cur.next\n    }\n    return map[head]\n}\n```\n- Approach 2 (O(1) extra): weave each clone behind its original, wire `clone.random = orig.random?.next`, then unweave; restore orig.next as you go',
    answer: '- Pass one builds `original → clone` for every node; pass two relinks next/random through that map. `O(n)`/`O(n)`.\n- The trap is wiring `clone.random` to the clone, not the original — random pointers have no traversal order to exploit.\n- Interviewer\'s stretch: interleave A→A\'→B→B\' and unweave for `O(1)` extra space (mutates input).'
  },
  {
    id: 'ds-54',
    type: 'data-structures',
    num: 54,
    difficulty: 'E',
    star: false,
    section: 'Arrays & Strings',
    title: 'Two-pointer primer: remove duplicates from a sorted array in place (LC 26).',
    tags: [ 'arrays', 'two-pointers', 'basics' ],
    related: [ 'ds-35', 'ds-36', 'ds-1' ],
    source: 'interview',
    complexity: 'Time: O(n) — single sweep\nSpace: O(1) — overwrites in place',
    redFlags: '- Calls removeAt inside the loop (O(n²) shifting)\n- Returns the array length instead of the unique count\n- Assumes "sorted" without stating it — unsorted input breaks the scheme',
    keyPoints: '- Fast pointer reads every slot, slow pointer marks the last WRITTEN unique — the classic read/write pair\n```kotlin\nfun removeDuplicates(nums: IntArray): Int {\n    if (nums.isEmpty()) return 0\n    var slow = 0\n    for (fast in 1 until nums.size) {\n        if (nums[fast] != nums[slow]) {\n            slow++\n            nums[slow] = nums[fast]\n        }\n    }\n    return slow + 1\n}\n```\n- Contract: return the count; elements past it are leftovers by convention (LC 26)\n- The two-pointer family to name in the same breath: opposite ends (pair sum on sorted input, reverse, container-with-most-water) vs same direction like this dedup / move zeroes',
    answer: '- Read/write split: `fast` scans, `slow` trails the last kept value; copy `nums[fast]` up whenever they differ.\n- Return `slow + 1` — the tail is untouched garbage, and that is the agreed contract.\n- `O(n)` time, `O(1)` space; the same-direction-pointer pattern LC 26 uses and move-zeroes reuses.'
  },
  {
    id: 'ds-55',
    type: 'data-structures',
    num: 55,
    difficulty: 'E',
    star: false,
    section: 'Arrays & Strings',
    title: 'Sliding-window primer: maximum sum of any contiguous subarray of fixed size k.',
    tags: [ 'arrays', 'sliding-window', 'basics' ],
    related: [ 'ds-3', 'ds-32', 'ds-36' ],
    source: 'interview',
    complexity: 'Time: O(n) — each element enters and leaves the window once\nSpace: O(1) — one running sum',
    redFlags: '- Recomputes the whole window sum per position (O(n·k))\n- Off-by-one: subtracts a[i−k+1] instead of the element actually leaving\n- No guard for k > n',
    keyPoints: '- Seed sum over the first k, then slide: add a[i], drop a[i − k] — constant work per step replaces the O(k) re-scan\n```kotlin\nfun maxSumOfSizeK(a: IntArray, k: Int): Long {\n    require(k in 1..a.size)\n    var sum = 0L\n    for (i in 0 until k) sum += a[i]\n    var best = sum\n    for (i in k until a.size) {\n        sum += a[i] - a[i - k].toLong()\n        if (sum > best) best = sum\n    }\n    return best                                 // Long: k values near Int.MAX_VALUE overflow Int\n}\n```\n- Fixed window = this template; variable window (longest valid run) needs expand-right/shrink-left with an invariant\n- Everything "best k-length substring/subarray/average" reuses it: swap the sum for a count map, max, or hash',
    answer: '- Compute the first window once, then per step: `sum += a[i] − a[i−k]` and keep the running best.\n- Constant work per slide beats re-summing the whole window at every position.\n- Fixed-size is the template; the expand/shrink variable-window form is `ds-3` and `ds-32`.'
  },
  {
    id: 'ds-56',
    type: 'data-structures',
    num: 56,
    difficulty: 'M',
    star: true,
    section: 'Sorting & Searching',
    title: 'Search in a rotated sorted array in O(log n) (LC 33).',
    tags: [ 'binary-search', 'arrays', 'sorting' ],
    related: [ 'ds-16', 'ds-28', 'ds-15' ],
    source: 'interview',
    complexity: 'Time: O(log n) — one binary-search step per halving; O(n) with duplicates (LC 81)\nSpace: O(1) iterative',
    followUp: '**Follow-up:** Find the rotation pivot / smallest element?\n> Same shape: if nums[mid] > nums[hi] the min is right of mid, else at-or-left; O(log n).',
    redFlags: '- Branches without first proving which half is sorted\n- Uses nums[lo] < nums[mid] (strict) and loses the single-element sorted half\n- Hits duplicates (LC 81) and silently breaks instead of falling back to lo++/hi--',
    keyPoints: '- A rotated sorted array = two sorted runs; at every mid, ONE of [lo..mid] / [mid..hi] is fully sorted: `nums[lo] <= nums[mid]` proves the left\n- If the target lies inside the sorted half\'s range, binary-search there; otherwise it can only be in the other half\n```kotlin\nfun search(nums: IntArray, target: Int): Int {\n    var lo = 0; var hi = nums.size - 1\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        if (nums[mid] == target) return mid\n        if (nums[lo] <= nums[mid]) {                    // left half sorted\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1 else lo = mid + 1\n        } else {                                        // right half sorted\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1 else hi = mid - 1\n        }\n    }\n    return -1\n}\n```\n- Duplicates (LC 81): `nums[lo] == nums[mid]` proves nothing — shrink `lo++` and continue, worst case `O(n)`\n- Alternatives to name: find the pivot first then plain binary search (two-pass, same O(log n)); or binary-search the implicit index `(pivot + i) % n`',
    answer: '- At each mid exactly one half is sorted (`nums[lo] <= nums[mid]` for the left); range-check the target against that half and go there, else go the other way.\n- Standard `<=` on the sorted-side test — a strict `<` drops the single-element half and mis-branches.\n- Duplicates (LC 81) break the one-sorted-half guarantee — fall back to `lo++` when `nums[lo] == nums[mid]` proves nothing.'
  },
  {
    id: 'ds-57',
    type: 'data-structures',
    num: 57,
    difficulty: 'E',
    star: true,
    section: 'Linked Lists',
    title: 'How do you check whether a singly linked list is a palindrome in O(1) extra space? (LC 234).',
    tags: [ 'linked-list', 'two-pointers', 'in-place' ],
    related: [ 'ds-5', 'ds-4', 'ds-53' ],
    source: 'interview',
    complexity: '- Time: O(n) — one walk to the middle, one reversal, one comparison pass\n- Space: O(1) — pointers only; the array and recursive forms cost O(n)',
    followUp: '**Follow-up:** Why restore the list, and how would you do it for a doubly linked list?\n> The caller still owns the input: a half-reversed list breaks anything that traverses it later. Restore by reversing the second half again and re-linking `mid.next`. A doubly linked list needs the reversal to fix both `next` and `prev`, or you can compare with one pointer walking forward and one walking backward from the tail.',
    redFlags: '- Copies the values into an array and calls that O(1) space\n- Uses recursion for the backward walk — the call stack is the hidden O(n)\n- Picks a fast-loop condition that leaves `slow` one node off the middle, then mis-compares odd lengths\n- Returns early and leaves the list half-reversed',
    keyPoints: '- Baseline to state first, then beat: copy values into a list and compare from both ends — O(n) time, O(n) space\n- O(1)-space plan: find the middle with slow/fast, reverse the SECOND half in place, walk both halves forward, restore the list\n```kotlin\nfun isPalindrome(head: Node?): Boolean {\n    if (head?.next == null) return true\n    var slow = head; var fast = head\n    while (fast?.next != null && fast.next!!.next != null) {\n        slow = slow!!.next; fast = fast.next!!.next\n    }\n    val mid = slow!!                          // last node of the first half\n    var second = reverse(mid.next)            // the ds-5 three-pointer reversal\n    var p = head; var q = second; var ok = true\n    while (ok && q != null) {\n        if (p!!.`val` != q.`val`) ok = false\n        p = p.next; q = q.next\n    }\n    mid.next = reverse(second)                // restore before returning\n    return ok\n}\n```\n- Loop bound `fast.next != null && fast.next.next != null` puts `slow` on the exact middle for odd n and on the last node of the first half for even n\n- Odd length costs nothing extra: the compare loop is bounded by `second`, so the middle node is never paired with itself\n- Reversing the second half is what lets both pointers walk FORWARD — comparing backwards would need a stack or recursion\n- Restore the list on every path (finally, or before each return) — "is the input still valid?" is the standard follow-up',
    answer: '- Walk slow/fast to the middle, reverse the second half, then compare the two halves forward. `O(n)` time, `O(1)` space.\n- Odd n is free: the shorter reversed half bounds the comparison, so the middle node is never mis-paired.\n- Reverse the second half back before returning — an interviewer treats a mutated input as a bug.'
  },
  {
    id: 'ds-58',
    type: 'data-structures',
    num: 58,
    difficulty: 'M',
    star: false,
    section: 'Linked Lists',
    title: 'How do you reverse a linked list in groups of k nodes? (LC 25).',
    tags: [ 'linked-list', 'recursion', 'pointer-manipulation' ],
    related: [ 'ds-5', 'ds-43', 'ds-53' ],
    source: 'interview',
    complexity: '- Time: O(n) — every node is relinked once, plus one counting pass per group (still linear)\n- Space: O(1) iterative; O(n/k) call stack for the recursive form',
    redFlags: '- Reverses per node and never reconnects the group boundaries (the list splits apart)\n- Mutates a trailing group shorter than k when the spec says leave it alone\n- Loses the group\'s ORIGINAL head, which is the node that must point at the rest\n- Writes the recursive version without being able to give the O(1)-space loop form',
    keyPoints: '- Per group: walk k nodes first to PROVE the group is complete; if fewer than k remain, return the head untouched\n- Then run the plain three-pointer reversal exactly k times and splice: previous group\'s tail → new head of the segment, segment\'s old head (now its tail) → result of the rest\n```kotlin\nfun reverseKGroup(head: Node?, k: Int): Node? {\n    var count = 0; var cur = head\n    while (cur != null && count < k) { cur = cur.next; count++ }\n    if (count < k) return head                        // partial group keeps its order\n    var prev: Node? = null; var node = head\n    for (step in 0 until k) {\n        val cur = node!!                              // non-null: the count proved k nodes exist\n        node = cur.next\n        cur.next = prev\n        prev = cur\n    }\n    head!!.next = reverseKGroup(node, k)              // head is now the segment tail\n    return prev\n}\n```\n- The line `head.next = reverseKGroup(node, k)` is the whole trick: after reversal the ORIGINAL head is the TAIL, and `node` is where the next group starts\n- In-place variant: `dummy` head + `groupPrev`; reverse k nodes, then `groupPrev.next = newHead` and advance `groupPrev` to the old head — same O(n), no stack\n- k > length is the boundary case interviewers probe (LC 25 leaves a short trailing group as is; some variants reverse the leftover group too — ask)\n- Do not confuse it with reversing between positions m and n (LC 92): one pass, head-insert after the m−1 node, no counting step',
    answer: '- Count k ahead; a short group is returned as-is. Otherwise reverse exactly those k nodes and relink `prevTail → newHead` and `oldHead → rest`.\n- The original head becomes the segment tail, which is what makes the one-line recursive splice correct.\n- Prefer the dummy-head iterative loop over recursion when stack depth on long lists is a concern.'
  },
  {
    id: 'ds-59',
    type: 'data-structures',
    num: 59,
    difficulty: 'M',
    star: false,
    section: 'Linked Lists',
    title: 'How would you flatten a multilevel doubly linked list into a single level? (LC 430).',
    tags: [ 'linked-list', 'dfs', 'stack' ],
    related: [ 'ds-5', 'ds-6', 'ds-7' ],
    source: 'interview',
    complexity: '- Time: O(n·d) for the walk-to-tail version, O(n) for the stack/recursion version (n = total nodes, d = nesting depth)\n- Space: O(1) walk-to-tail; O(d) for the explicit stack or recursion frames',
    redFlags: '- Overwrites `cur.next` before saving it, losing the rest of the current level\n- Links the child list forward only, so `prev` pointers are wrong in a doubly linked list\n- Recursive version returns nothing, so the caller cannot re-attach the sibling it saved\n- Leaves `child` set on flattened nodes',
    keyPoints: '- Node carries prev, next AND child; flattening = depth-first splice: the whole child list goes between `cur` and the saved `cur.next`\n- Save `nxt = cur.next` BEFORE touching any pointer, then re-attach it at the child list\'s tail\n```kotlin\nfun flatten(head: Node?): Node? {\n    var cur = head\n    while (cur != null) {\n        if (cur.child != null) {\n            val nxt = cur.next\n            cur.next = cur.child; cur.child!!.prev = cur; cur.child = null\n            var tail: Node = cur\n            while (tail.next != null) tail = tail.next!!   // walk to child-list tail\n            tail.next = nxt; nxt?.prev = tail\n        }\n        cur = cur.next\n    }\n    return head\n}\n```\n- Ordering rule: a node\'s own `next` comes AFTER its whole child subtree — the preorder of a tree where "left" = child and "right" = next\n- Stack form of the same DFS: when a child exists, push `nxt` then link the child in; pop when a list runs out — every push is a level you must return to, so the order is exactly preorder\n- The walk-to-tail version is O(1) space but O(n·d) time; deep single-node children make it quadratic. The stack version is linear with O(d) space — say both, then pick\n- Recursive contract that actually works: `flatten(child)` RETURNS the child list\'s tail so the caller can attach `nxt`; `child = null` on the way out',
    answer: '- For each node with a child: save `next`, splice the child list in with both `next` and `prev` wired, clear `child`, then attach the saved node at the child list\'s tail.\n- Preorder is the rule — child subtree first, then the sibling — and it is DFS on a tree whose left is child and right is next.\n- Walk-to-tail is `O(1)` space but `O(n·d)` time; an explicit stack or a recursion that returns the tail gives `O(n)` with `O(d)` space.'
  },
  {
    id: 'ds-60',
    type: 'data-structures',
    num: 60,
    difficulty: 'H',
    star: false,
    section: 'Hash Maps',
    title: 'Design an LFU cache — least-frequently-used eviction with O(1) get and put (LC 460).',
    tags: [ 'hash-map', 'design', 'doubly-linked-list', 'cache-eviction' ],
    related: [ 'ds-23', 'ds-31', 'ds-10' ],
    source: 'interview',
    complexity: '- Time: O(1) get and put — hash lookups plus constant-time list remove/addFirst\n- Space: O(capacity) nodes + O(distinct frequencies) buckets, bounded by O(capacity)',
    followUp: '**Follow-up:** When does LFU beat LRU, and what extra policy does it need to stay usable?\n> LFU keeps entries that are hot but idle and drops cold-but-recent ones — good for stable "hit-item" workloads (recommendation lists, config), bad for load spikes. Real caches add AGING: decay counts periodically, or use a window (W-TinyLFU / LIRS) so frequency is measured over a recent interval. Also state the tiebreak: LFU without recency-as-tiebreak evicts arbitrarily among equals.',
    redFlags: '- Searches all entries for the minimum frequency, making eviction O(n)\n- Sorts entries by count on each access instead of moving a node between buckets\n- Forgets the recency tiebreak inside a frequency bucket\n- Does not reset minFreq when the min bucket empties, or on insert, and then evicts from the wrong list',
    keyPoints: '- LRU (`ds-23`) orders by recency; LFU orders by access COUNT with least-recent-used as tiebreak. Keeping both O(1) is the whole problem\n- Layout: `map: key → Node(value, freq)`, plus one bucket per frequency holding keys in recency order — a `LinkedHashSet` (hash + doubly linked list: O(1) remove by key, O(1) oldest) — plus a `minFreq` field\n- A touch removes the key from bucket f and appends it to bucket f+1 (newest at the end); if bucket f is now empty and f == minFreq, minFreq becomes f+1\n- Insert of a NEW key always starts at freq 1 and resets minFreq = 1; eviction is then the OLDEST key of bucket minFreq, which is why no search is needed\n```kotlin\nclass LFUCache(private val capacity: Int) {\n    private class Node(var value: Int, var freq: Int = 1)\n    private val map = HashMap<Int, Node>()\n    private val buckets = HashMap<Int, LinkedHashSet<Int>>()   // freq -> keys, oldest first\n    private var minFreq = 0\n\n    fun get(key: Int): Int {\n        val n = map[key] ?: return -1\n        touch(key, n)\n        return n.value\n    }\n\n    fun put(key: Int, value: Int) {\n        if (capacity <= 0) return\n        map[key]?.let { it.value = value; touch(key, it); return }\n        if (map.size == capacity) {\n            val bucket = buckets.getValue(minFreq)\n            val victim = bucket.first()                  // least recent among least frequent\n            bucket.remove(victim)\n            if (bucket.isEmpty()) buckets.remove(minFreq)\n            map.remove(victim)\n        }\n        map[key] = Node(value)\n        buckets.getOrPut(1) { LinkedHashSet() }.add(key)\n        minFreq = 1\n    }\n\n    private fun touch(key: Int, n: Node) {\n        val bucket = buckets.getValue(n.freq)\n        bucket.remove(key)\n        if (bucket.isEmpty()) {\n            buckets.remove(n.freq)\n            if (minFreq == n.freq) minFreq++\n        }\n        n.freq++\n        buckets.getOrPut(n.freq) { LinkedHashSet() }.add(key)\n    }\n}\n```\n- Why not `ArrayDeque` per bucket: removing an arbitrary element from it is O(bucket size), which silently breaks the O(1) claim. The bucket must support O(1) removal by key or by node reference — `LinkedHashSet`, a hand-rolled doubly linked list with sentinels, or `list::splice` in C++\n- Contrast the cousin designs: TTL + LRU eviction reuses this exact shape but orders by expiry time (a time-ordered queue, or lazy validation on read), not by count\n- Interviewers accept "frequency with aging" as the real-world answer; they reject the version that never decays counts and therefore never evicts an old hit item',
    answer: '- `key → Node(value, freq)` plus one recency-ordered bucket (`LinkedHashSet`) per frequency, and a `minFreq` pointer; a touch moves the key from bucket f to the end of bucket f+1.\n- Insert sets `minFreq = 1`; an emptied min bucket bumps `minFreq`. Evicting is the oldest key of `minFreq` — constant time because it is tracked, never searched.\n- `O(1)` get/put with `O(capacity)` space; LFU needs one more index than LRU and an aging policy to stay useful.'
  },
  {
    id: 'ds-61',
    type: 'data-structures',
    num: 61,
    difficulty: 'M',
    star: false,
    section: 'Hash Maps',
    title: 'Group anagrams — what key makes two words collide in a hashmap? (LC 49).',
    tags: [ 'hash-map', 'strings', 'sorting', 'signature' ],
    related: [ 'ds-10', 'ds-31', 'ds-45' ],
    source: 'interview',
    complexity: '- Time: O(n·k log k) with a sorted-string key; O(n·k) with a 26-slot count signature (n words, max length k)\n- Space: O(n·k) for the groups plus the key strings; O(k) scratch per word',
    redFlags: '- Compares words pairwise in O(n²k) instead of bucketing on a canonical key\n- Picks a key that is not order-independent (first letter + length, sum of char codes) and gets false collisions\n- Sorts the input words in place and loses the original spelling the output must contain\n- Concatenates raw counts without a separator and cannot spot the collision that creates',
    keyPoints: '- Every member of a group must hash to the SAME key, so the key is a canonical form of the character MULTISET, independent of order\n- Key 1 — sorted copy: "eat", "tea", "ate" all become "aet". One line, but O(k log k) per word\n- Key 2 — count signature: 26 counts in fixed order joined with a delimiter ("a1e1t1"). O(k) per word, and it wins when words are long\n```kotlin\nfun groupAnagrams(words: Array<String>): List<List<String>> {\n    val map = HashMap<String, MutableList<String>>()\n    for (w in words) {\n        val cnt = IntArray(26)\n        for (c in w) cnt[c - \'a\']++\n        val key = buildString { for (n in cnt) { append(n); append(\'#\') } }\n        map.getOrPut(key) { mutableListOf() }.add(w)\n    }\n    return map.values.toList()\n}\n```\n- The delimiter is load-bearing: counts run past 9, and `"111"` is ambiguous between (11,1) and (1,11) — a separator or a fixed-width encoding makes the key injective\n- Alternatives worth naming: a 26-int array wrapped as a list is the same key without string building; prime-product keys (`2^a·3^b·…`) are unique in theory and overflow in practice — do not recommend them\n- Normalization decides correctness: mixed case, accents and non-`[a-z]` alphabets need an explicit rule, and the interviewer is checking whether you state one\n- The output must hold the ORIGINAL words — the key is scaffolding, never payload',
    answer: '- Bucket on a canonical key for the character multiset: a sorted copy (`O(k log k)`) or a delimited 26-count signature (`O(k)`); one pass gives `O(n·k)`–`O(n·k log k)`.\n- Counts need a separator or fixed width, or multi-digit counts make two different multisets share a key.\n- Space `O(n·k)`; the groups store the untouched input strings, not the key.'
  },
  {
    id: 'ds-62',
    type: 'data-structures',
    num: 62,
    difficulty: 'E',
    star: true,
    section: 'Stacks & Queues',
    title: 'How do you implement a queue using only two stacks? (LC 232).',
    tags: [ 'stack', 'queue', 'amortized-analysis' ],
    related: [ 'ds-17', 'ds-18', 'ds-48' ],
    source: 'interview',
    complexity: '- Time: O(1) amortized per add/remove — each element is moved between the stacks at most once; O(n) worst case on one pop\n- Space: O(n) across the two stacks',
    followUp: '**Follow-up:** Why "amortized" and not "O(1)"? And what does the mirror question cost?\n> One pop can drain `n` elements, so a single operation is O(n); over n operations each element pays at most three constant steps, so the average is O(1) — that is the accounting argument, not a hand-wave. The mirror (a stack from two queues) is the opposite trade: push enqueues into the empty queue and moves everything back, so push is O(n) and pop is O(1). You are asked which operation you want slow.',
    redFlags: '- Transfers on every operation instead of only when the pop stack is empty\n- Pops from the source stack while the destination stack still holds items, returning the wrong element\n- Claims O(1) pop without the amortized argument or the O(n) worst case\n- Sneaks in a real queue or a linked list "to help" the two stacks',
    keyPoints: '- Push goes to `src`. For pop/peek, take from `dst`; only when `dst` is EMPTY, drain `src` into `dst` — that reverses the order once and the oldest element lands on top\n```kotlin\nclass MyQueue<T> {\n    private val src = ArrayDeque<T>()        // push side\n    private val dst = ArrayDeque<T>()        // pop side, oldest on top\n    fun add(x: T) { src.addLast(x) }\n    private fun shift() {\n        if (dst.isEmpty()) while (src.isNotEmpty()) dst.addLast(src.removeLast())\n    }\n    fun remove(): T { shift(); return dst.removeLast() }\n    fun peek(): T { shift(); return dst.last() }\n    fun isEmpty() = src.isEmpty() && dst.isEmpty()\n}\n```\n- The intuition in one line: two LIFOs back to back are a FIFO — stacking the reversed copy puts the oldest element at the top\n- Amortized proof: an element is pushed onto `src` once, moved to `dst` once, popped once — at most 3 constant operations in its lifetime, so n operations cost O(n) total\n- The `if (dst.isEmpty())` guard is the correctness point: transferring while `dst` still holds items would drop them out of order\n- `peek` must trigger the same transfer as `remove`, or a later `remove` sees a stale top — a classic missed edge case\n- Mirror question (stack from two queues): push into the empty queue, move the other queue over, swap names — O(n) per push, O(1) pop; circular-buffer and deque designs beat both when you actually own the data structure',
    answer: '- Push to `src`; on pop/peek, if `dst` is empty move every element from `src` to `dst`. The double reversal turns LIFO into FIFO.\n- Each element moves once in its lifetime, so operations are `O(1)` amortized (`O(n)` for the unlucky pop), `O(n)` space.\n- The mirror (stack via two queues) shifts the cost to push — name which end you chose to make expensive.'
  },
  {
    id: 'ds-63',
    type: 'data-structures',
    num: 63,
    difficulty: 'M',
    star: false,
    section: 'Stacks & Queues',
    title: 'Sliding window maximum — how do you return every window\'s max in O(n)? (LC 239).',
    tags: [ 'monotonic-deque', 'sliding-window', 'queue' ],
    related: [ 'ds-55', 'ds-24', 'ds-3' ],
    source: 'interview',
    complexity: '- Time: O(n) — each index is pushed and popped from the deque at most once\n- Space: O(k) for the deque, plus the O(n − k + 1) answer array',
    redFlags: '- Recomputes the maximum for each window (O(n·k)) or brings a max-heap in without the lazy-deletion step\n- Stores VALUES, so it cannot tell which entries have left the window\n- Forgets the front-expiry check and reports a max from outside the window\n- Emits answers before the first full window exists (i < k − 1)',
    keyPoints: '- A plain deque fails both ways: you must read the maximum from one end AND drop a specific element that expired at the other. A MONOTONIC deque fixes it — indices whose values are strictly decreasing\n- Front of the deque is the current window max. Before pushing index i, pop from the back while `nums[back] <= nums[i]` — those can never be a maximum again\n- Then expire the front (`if (front <= i - k) popFirst`) and emit `nums[front]` once `i >= k - 1`\n```kotlin\nfun maxSlidingWindow(nums: IntArray, k: Int): IntArray {\n    val dq = ArrayDeque<Int>(); val res = IntArray(nums.size - k + 1)\n    for (i in nums.indices) {\n        while (dq.isNotEmpty() && nums[dq.last()] <= nums[i]) dq.removeLast()\n        dq.addLast(i)\n        if (dq.first() <= i - k) dq.removeFirst()\n        if (i >= k - 1) res[i - k + 1] = nums[dq.first()]\n    }\n    return res\n}\n```\n- Store INDICES not values: that single choice makes expiry-by-position possible and keeps the two ends independent\n- Why back-popping is safe: a smaller-or-equal element standing behind a bigger one is shadowed for as long as the bigger one is in the window, and the bigger one always leaves first\n- Linear-time argument identical to `ds-24`: n pushes, at most n pops, so O(n) despite the inner while\n- Heap alternative: priority queue of (value, index), lazily popping tops whose index is out of window — O(n log n), and the honest fallback when you need a MEDIAN (two heaps, LC 480) rather than a max\n- Same skeleton solves shortest subarray with sum at least k (LC 862) and bounded-window min/max in streaming code',
    answer: '- Keep a deque of indices with strictly decreasing values: pop smaller-or-equal from the back as you advance, expire out-of-window indices from the front, emit the front from index k−1 on.\n- Storing indices is what makes both ends work; every index enters and leaves once, so it is `O(n)`.\n- `O(k)` extra space; the max-heap with lazy deletion is `O(n log n)` and is the path to window medians.'
  },
  {
    id: 'ds-64',
    type: 'data-structures',
    num: 64,
    difficulty: 'E',
    star: false,
    section: 'Dynamic Programming',
    title: 'Climbing stairs — how many distinct ways to reach step n taking 1 or 2 steps at a time? (LC 70).',
    tags: [ 'dynamic-programming', 'fibonacci', 'space-optimization' ],
    related: [ 'ds-12', 'ds-30', 'ds-14' ],
    source: 'interview',
    complexity: '- Time: O(n) iterative; O(log n) with matrix exponentiation; O(2^n) unmemoized recursion\n- Space: O(1) with two rolling values, O(n) for the table or the recursion stack',
    redFlags: '- Answers 2^(n−1), or counts step SETS instead of ordered sequences\n- Keeps the whole array when only the last two values are live\n- Cannot extend the same recurrence to 1..k steps\n- Silently overflows `Int` around n = 46 and never mentions Long or modulo',
    keyPoints: '- Say the recurrence out loud from the LAST move: to stand on step i you came from i−1 or i−2, and those two path sets are disjoint, so ways(i) = ways(i−1) + ways(i−2)\n- Base cases: ways(0) = 1 (already at the top, take nothing) and ways(1) = 1 — this is Fibonacci shifted by one index\n```kotlin\nfun climb(n: Int): Long {\n    var a = 1L; var b = 1L                 // ways(0), ways(1)\n    repeat(n - 1) { val t = a + b; a = b; b = t }\n    return b\n}\n```\n- Two rolling variables turn the O(n) table into O(1) space: the "only the last k states are live" reduction that every 1-D DP uses\n- Generalize to steps of 1..k: dp[i] = sum over j of dp[i−j] — O(nk), or O(n) by keeping a running window sum and subtracting the term falling out\n- Recognize the neighbours: min-cost climbing (weights per step, take min instead of sum), Tribonacci (k = 3), and the COUNTING variant where order does not matter — that one is the coin-change-combinations problem (`ds-25`), not this one\n- Large n: Int overflows near n = 46, so use Long, or state modulo 1e9+7; matrix exponentiation of the Fibonacci recurrence gets O(log n)',
    answer: '- ways(i) = ways(i−1) + ways(i−2): the final step is 1 or 2 long and the two path sets are disjoint. `ways(0) = ways(1) = 1`.\n- Two rolling values give `O(n)` time, `O(1)` space — the standard shrink of any 1-D DP table.\n- Steps of 1..k sum the previous k states (`O(nk)`, or `O(n)` with a window sum); past n ≈ 45 switch to `Long`/modulo or matrix exponentiation.'
  },
  {
    id: 'ds-65',
    type: 'data-structures',
    num: 65,
    difficulty: 'M',
    star: false,
    section: 'Dynamic Programming',
    title: 'Word Break — can a string be segmented into dictionary words? (LC 139).',
    tags: [ 'dynamic-programming', 'strings', 'hash-map', 'memoization' ],
    related: [ 'ds-12', 'ds-22', 'ds-25' ],
    source: 'interview',
    complexity: '- Time: O(n·L) substring tests bounded by the longest word, each test costing O(L) — call it O(n·L²) worst case; O(n²·L) without the bound\n- Space: O(n) for the dp bits, plus O(n) parent lists if the sentences must be printed',
    followUp: '**Follow-up:** Now return EVERY sentence — what changes? (LC 140)\n> Keep a list of split points per reachable index during the DP, then DFS from index n back to 0 to emit the sentences; memoizing can(start) by start index prunes re-exploration, but the output itself is exponential — state that bound.',
    redFlags: '- Greedily takes the longest matching prefix and cannot produce a counterexample\n- Tests substrings starting from positions that are not reachable, so the OR is wrong\n- Keeps the dictionary in a List and does O(L) scans per lookup\n- Claims the recursion is linear while ignoring substring copy cost',
    keyPoints: '- Definition that makes the recurrence work: dp[i] = "the first i characters can be segmented". dp[0] = true (empty prefix segments fine). dp[i] = OR over j < i of (dp[j] AND dict.contains(s[j..i]))\n- Two bounds matter: only extend from a position already TRUE, and never look back further than the longest dictionary word\n```kotlin\nfun wordBreak(s: String, words: Set<String>): Boolean {\n    val maxLen = words.maxOfOrNull { it.length } ?: 0\n    val dp = BooleanArray(s.length + 1)\n    dp[0] = true\n    for (i in 1..s.length) {\n        for (j in maxOf(0, i - maxLen) until i) {\n            if (dp[j] && words.contains(s.substring(j, i))) { dp[i] = true; break }\n        }\n    }\n    return dp[s.length]\n}\n```\n- Top-down mirror: `can(start)` is true if some word matches at start and `can(start + word.length)` holds, memoized by start index — n states, same work\n- The boolean cannot be turned back into sentences: keep a `parents[i]` list of split points during the DP, then DFS from n back to 0 to emit every segmentation (LC 140)\n- Dictionary as a TRIE (`ds-22`) lets one forward walk from each reachable index test every prefix at once — the direction interviewers push when the word list is huge\n- Counterexample to memorize for the greedy trap: "catsanddog" with ["cat","cats","and","sand","dog"] — the longest prefix "cats" leaves "anddog", which fails\n- On the JVM `substring` copies, so each contains-test carries its own O(length) cost; that is why the maxLen bound is stated as complexity, not decoration',
    answer: '- `dp[i]` = the first i characters are segmentable; `dp[i] = OR(dp[j] && dict.contains(s.substring(j, i)))` with `dp[0] = true`. Answer: `dp[n]`.\n- Extend only from reachable positions and at most `maxWordLen` back — that bound is what keeps it off a full O(n²) scan.\n- Print the sentences by recording split points per index and DFS-ing them; a trie tests all prefixes in one forward walk.'
  },
  {
    id: 'ds-66',
    type: 'data-structures',
    num: 66,
    difficulty: 'E',
    star: false,
    section: 'Sorting & Searching',
    title: 'First Bad Version — how do you binary-search a monotone predicate instead of a value? (LC 278).',
    tags: [ 'binary-search', 'divide-and-conquer', 'basics' ],
    related: [ 'ds-16', 'ds-56', 'ds-27' ],
    source: 'interview',
    complexity: '- Time: O(log n) calls to isBadVersion — the API is the expensive part, so the call count is the complexity\n- Space: O(1) — two bounds and a midpoint',
    redFlags: '- Writes `(lo + hi) / 2` and does not see the overflow\n- Uses `hi = mid - 1` in the lower-bound shape and skips the answer, or `lo = mid` and loops forever\n- Returns `lo` without being able to state the invariant that makes it the first true\n- Probes linearly from version 1 because "n is small"',
    keyPoints: '- Versions look like `false false … true true … true` — a monotone boolean array. There is no value to compare against; you are searching for the FIRST true\n- Invariant: everything before `lo` is known false, `hi` is still a candidate. Loop `while (lo < hi)`; `isBad(mid)` means the answer is at or left of mid (`hi = mid`), otherwise `lo = mid + 1`\n```kotlin\nfun firstBadVersion(n: Int): Int {\n    var lo = 1; var hi = n\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2          // never (lo + hi) / 2\n        if (isBadVersion(mid)) hi = mid else lo = mid + 1\n    }\n    return lo\n}\n```\n- The two shapes to keep straight: `lo < hi` with `hi = mid` is lower_bound (keeps the candidate); `lo <= hi` with `lo = mid + 1 / hi = mid - 1` is exact-match search\n- This is the same predicate search as "smallest capacity/speed that works" (LC 1011, LC 875), search-insert position, and the square root / integer-median tricks — if you can compute a yes/no monotone function of an index, stop linear scanning\n- Cost model: `isBadVersion` is remote, so counting calls IS the answer; a memoized probe table is the answer if they make repeated queries\n- State the assumption: monotonicity is what makes it correct. A reverted fix or a build that fails then passes again breaks the predicate and needs a different search',
    answer: '- Binary-search the predicate: `isBad(mid)` true means the first bad version is at or before mid (`hi = mid`); false means strictly after (`lo = mid + 1`).\n- Loop `while (lo < hi)` and return `lo` — the lower_bound shape, so the candidate is never dropped.\n- `O(log n)` API calls, `O(1)` space; the same template covers minimum-feasible-capacity and insertion-position searches.'
  },
  {
    id: 'ds-67',
    type: 'data-structures',
    num: 67,
    difficulty: 'M',
    star: false,
    section: 'Sorting & Searching',
    title: 'Count the inversions in an array — how does a modified merge sort do it in O(n log n)?',
    tags: [ 'merge-sort', 'divide-and-conquer', 'counting' ],
    related: [ 'ds-15', 'ds-16', 'ds-35' ],
    source: 'interview',
    complexity: '- Time: O(n log n) — the merge pass adds constant work per element\n- Space: O(n) for the scratch buffer (and the count needs Long for large n)',
    followUp: '**Follow-up:** Can a Fenwick tree count inversions, and why would you pick it?\n> Sweep right to left over rank-compressed values: query how many already-seen ranks are smaller than a[i], add, then update. O(n log n) time, O(n) space, and the input array is never mutated — which is also what you need for "count smaller elements to the right" (LC 315) or online/streaming counts.',
    redFlags: '- Presents the O(n²) double loop as the answer (it is a fine starting point, not a finish)\n- Adds `mid - i` off by one, or counts equal pairs as inversions\n- Counts inside a QuickSort partition and cannot argue each pair is covered exactly once\n- Returns an `Int` for n = 10^5 (max inversions ≈ 5×10^9)',
    keyPoints: '- An inversion is a pair i < j with a[i] > a[j]; the count is exactly how many adjacent swaps a bubble sort needs — a "sortedness" metric with real uses (rank correlation, edit distance variants)\n- Split in half: inversions are left-only, right-only, or CROSS the midpoint. Recursion returns the first two; the merge step counts the third\n- While merging two sorted halves, whenever you take an element from the RIGHT half while `i` still points at unconsumed left elements, it forms an inversion with all of them: `mid - i`\n```kotlin\nfun countInversions(a: IntArray): Long {\n    val tmp = IntArray(a.size)\n    fun sort(lo: Int, hi: Int): Long {                    // [lo, hi)\n        if (hi - lo <= 1) return 0\n        val mid = (lo + hi) / 2\n        var cnt = sort(lo, mid) + sort(mid, hi)\n        var i = lo; var j = mid; var k = lo\n        while (i < mid && j < hi) {\n            if (a[i] <= a[j]) tmp[k++] = a[i++]            // equal ⇒ NOT an inversion\n            else { cnt += (mid - i).toLong(); tmp[k++] = a[j++] }\n        }\n        while (i < mid) tmp[k++] = a[i++]\n        while (j < hi) tmp[k++] = a[j++]\n        for (m in lo until hi) a[m] = tmp[m]\n        return cnt\n    }\n    return sort(0, a.size)\n}\n```\n- `a[i] <= a[j]` on ties keeps stability and makes equal values non-inversions; flip to `<` only if the problem asks for strict pairs\n- This is the guaranteed O(n log n), stable half of `ds-15`\'s QuickSort comparison — merge sort\'s worst case is O(n log n) because the split is by index, never by value, and it is the only one where a cross-half statistic rides along cleanly\n- Also worth naming: a Fenwick tree over compressed ranks, sweeping right to left — same O(n log n), no mutation of the input',
    answer: '- Divide: inversions are left-only, right-only, or cross-half; recursion handles the first two. In the merge, taking a right element while `mid - i` left elements remain adds exactly `mid - i`.\n- Ties must go from the left first (`a[i] <= a[j]`) so equal pairs are not counted, and the total needs `Long`.\n- `O(n log n)` time and `O(n)` scratch — and the same merge step is what makes merge sort stable with a guaranteed bound.'
  },
  {
    id: 'ds-68',
    type: 'data-structures',
    num: 68,
    difficulty: 'M',
    star: true,
    section: 'Arrays & Strings',
    title: 'Product of array except self — how do you compute it in O(n) without division? (LC 238).',
    tags: [ 'arrays', 'prefix-products', 'suffix-products', 'in-place' ],
    related: [ 'ds-36', 'ds-55', 'ds-54' ],
    source: 'interview',
    complexity: '- Time: O(n) — one left-to-right and one right-to-left pass\n- Space: O(1) extra excluding the output array (O(n) if you keep explicit prefix and suffix tables)',
    redFlags: '- Divides the total product by a[i] and cannot handle one zero, let alone two\n- Allocates prefix AND suffix arrays when the output can hold one side\n- Multiplies a[i] into its own answer (off-by-one on the running product)\n- Never states what changes under overflow or modular arithmetic',
    keyPoints: '- The answer is `out[i] = (product of everything strictly left of i) × (product of everything strictly right of i)` — prefix and suffix products of the same array\n- Pass 1 writes the running left product into out[i] BEFORE consuming nums[i]; pass 2 walks back multiplying in the running right product, so no extra array is needed\n```kotlin\nfun productExceptSelf(nums: IntArray): IntArray {\n    val out = IntArray(nums.size) { 1 }\n    var left = 1\n    for (i in nums.indices) { out[i] = left; left *= nums[i] }\n    var right = 1\n    for (i in nums.indices.reversed()) { out[i] *= right; right *= nums[i] }\n    return out\n}\n```\n- Division (`total / nums[i]`) is the tempting wrong answer: it dies on a zero, and patching it needs a zero COUNT — one zero makes exactly one position non-zero, two or more make all zero\n- LC 238 excludes the output array from the space bound, which is why the second pass multiplies INTO out instead of using another buffer; say that explicitly, it is the point of the question\n- Same prefix/suffix family: trapping rain water (`ds-29`) is min(leftMax, rightMax) per cell, product of the last k numbers, range-sum/range-product queries after point updates (prefix arrays, then a Fenwick tree)\n- Overflow: 10^5 values near 10^9 blow past Long — ask for the modulus (then no division without a modular inverse, and zeros break that too) or BigInteger\n- Order of the two passes is interchangeable; running both in a single loop with two accumulators is the O(n)/O(1) flourish some interviewers ask for',
    answer: '- Two sweeps: left-to-right writes the running product of everything before i; right-to-left multiplies in the running product of everything after i.\n- `O(n)` time, `O(1)` extra space because the output array carries the prefix side — that exclusion is the trick the question is testing.\n- Total÷a[i] fails on zeros and needs a zero-count special case; prefix/suffix never divides and generalizes to `ds-29`-style left/right sweeps.'
  },
  {
    id: 'ds-69',
    type: 'data-structures',
    num: 69,
    difficulty: 'M',
    star: true,
    section: 'Arrays & Strings',
    title: '3Sum — find every unique triplet that sums to zero (LC 15).',
    tags: [ 'arrays', 'two-pointers', 'sorting' ],
    related: [ 'ds-2', 'ds-54', 'ds-35' ],
    keyPoints: `- Brute force tries every triple: O(n³). Fixing one element turns the rest into Two Sum (\`ds-2\`) on the remaining suffix — and once the array is sorted, Two Sum needs no map, just two pointers
- **Insight:** sort once (O(n log n)), then for each anchor \`a[i]\` run \`lo = i + 1\`, \`hi = n - 1\` inward. Sum too small → \`lo++\` (the only way to grow it); too big → \`hi--\`
- **Uniqueness without a Set:** sorting puts equal values side by side, so skip an anchor equal to the previous anchor, and after recording a hit step \`lo\` and \`hi\` past their duplicates
- **Early exit:** if the anchor is already positive, every later value is too, so no triple can reach 0

\`\`\`kotlin
fun threeSum(nums: IntArray): List<List<Int>> {
    val a = nums.sortedArray()                      // keep the caller's array intact
    val res = mutableListOf<List<Int>>()
    for (i in 0 until a.size - 2) {
        if (a[i] > 0) break                         // smallest of the triple is positive
        if (i > 0 && a[i] == a[i - 1]) continue     // same anchor ⇒ same triplets
        var lo = i + 1
        var hi = a.size - 1
        while (lo < hi) {
            val sum = a[i] + a[lo] + a[hi]
            when {
                sum < 0 -> lo++
                sum > 0 -> hi--
                else -> {
                    res.add(listOf(a[i], a[lo], a[hi]))
                    while (lo < hi && a[lo] == a[lo + 1]) lo++
                    while (lo < hi && a[hi] == a[hi - 1]) hi--
                    lo++
                    hi--
                }
            }
        }
    }
    return res
}
\`\`\`

- **Dry run** \`[-1, 0, 1, 2, -1, -4]\` → sorted \`[-4, -1, -1, 0, 1, 2]\`. Anchor -4 never reaches 0. Anchor -1 (i=1): -1-1+2 = 0 → \`[-1,-1,2]\`; move inward, -1+0+1 = 0 → \`[-1,0,1]\`. Anchor -1 (i=2) is skipped as a duplicate. Anchor 0: 0+1+2 > 0, pointers cross. Result: two triplets
- **Edge cases:** fewer than 3 elements (\`0 until size - 2\` is empty), all zeros \`[0,0,0,0]\` → exactly one \`[0,0,0]\`, no solution → empty list. Values near \`Int.MAX_VALUE\` overflow the sum — widen to \`Long\` if the range is not bounded
- **Generalisation:** k-Sum = recurse down to 2-Sum with two pointers, O(n^(k-1)). 3Sum Closest (LC 16) is the same loop tracking \`|sum - target|\` instead of collecting hits`,
    complexity: `- Time: O(n²) — the O(n log n) sort is dominated by n anchors × an O(n) two-pointer sweep; brute force is O(n³)
- Space: O(n) for the sorted copy (O(log n) sort stack if sorting in place is allowed), excluding the output`,
    followUp: `**Follow-up:** Why not a HashSet of triplets on top of the Two Sum map?
> It works in O(n²) too, but deduplication by hashing sorted triplets costs extra memory and constant factors; sorted two pointers get uniqueness for free by skipping equal neighbours.

**Follow-up:** What if you must not reorder or copy the input?
> Fall back to anchor + hash-set Two Sum per anchor (O(n²) time, O(n) space) and dedupe with a set of sorted triples.`,
    redFlags: `- Collects duplicates and then dedupes with \`distinct()\` instead of skipping equal neighbours
- Moves both pointers on a non-zero sum, or moves the wrong one
- Forgets the anchor-duplicate skip and emits the same triplet twice
- Stays at O(n³) or reaches for a HashSet without noticing sorting is allowed`,
    answer: `- Sort, then fix each anchor \`a[i]\` and run two pointers on the suffix: sum < 0 → \`lo++\`, sum > 0 → \`hi--\`, sum = 0 → record.
- Uniqueness comes from skipping equal anchors and stepping both pointers past duplicates after a hit.
- \`O(n²)\` time, break as soon as the anchor turns positive.`,
  },
  {
    id: 'ds-70',
    type: 'data-structures',
    num: 70,
    difficulty: 'H',
    star: true,
    section: 'Arrays & Strings',
    title: 'Minimum Window Substring — smallest window of s that contains every character of t (LC 76).',
    tags: [ 'strings', 'sliding-window', 'hashing' ],
    related: [ 'ds-3', 'ds-32', 'ds-55' ],
    keyPoints: `- Brute force checks every window: O(n²) windows × O(|t|) check. The variable-size sliding window (\`ds-3\`) makes it linear: grow \`right\` until the window is valid, then shrink \`left\` as far as it stays valid, recording the best
- **Bookkeeping:** \`need[c]\` = how many more copies of \`c\` the window still owes; characters outside \`t\` simply go negative. \`missing\` = total owed (with multiplicity). The window is valid exactly when \`missing == 0\`, so validity is an O(1) check instead of comparing two maps
- **Algorithm**
  1. Count \`t\` into \`need\`; \`missing = t.length\`
  2. For each \`right\`: if \`need[s[right]]\` was positive, that character was owed → \`missing--\`; decrement it either way
  3. While \`missing == 0\`: record the window if shorter, then give back \`s[left]\` (\`need++\`); if it becomes positive the window now owes it → \`missing++\`; \`left++\`

\`\`\`kotlin
fun minWindow(s: String, t: String): String {
    if (t.isEmpty() || s.length < t.length) return ""
    val need = IntArray(128)                       // ASCII; use a HashMap<Char, Int> for Unicode
    for (c in t) need[c.code]++
    var missing = t.length
    var left = 0
    var bestStart = 0
    var bestLen = Int.MAX_VALUE
    for (right in s.indices) {
        if (need[s[right].code]-- > 0) missing--   // this char was still owed
        while (missing == 0) {                     // valid: shrink as far as possible
            if (right - left + 1 < bestLen) {
                bestStart = left
                bestLen = right - left + 1
            }
            if (++need[s[left].code] > 0) missing++ // dropped a char the window needed
            left++
        }
    }
    return if (bestLen == Int.MAX_VALUE) "" else s.substring(bestStart, bestStart + bestLen)
}
\`\`\`

- **Dry run** \`s = "ADOBECODEBANC"\`, \`t = "ABC"\`: first valid at \`right = 5\` ("ADOBEC", len 6); dropping A breaks it. Next valid at \`right = 10\` ("DOBECODEBA" shrinks to "CODEBA", len 6). At \`right = 12\` it shrinks to "BANC", len 4 — the answer
- **Multiplicity matters:** \`t = "AA"\` needs two A's; a set-based check would accept one. The counter handles it because \`need['A']\` starts at 2
- **Edge cases:** \`t\` longer than \`s\` → "", no valid window → "", \`s == t\` → \`s\`. Store start + length, not a substring, inside the loop — building strings per step makes it O(n²)`,
    complexity: `- Time: O(|s| + |t|) — each index of s enters the window once (right) and leaves once (left); validity is an O(1) counter check
- Space: O(alphabet) — a 128-int array (O(1)), or O(distinct chars of t) with a HashMap`,
    followUp: `**Follow-up:** What if s is huge and t is tiny?
> Filter s to the positions whose char appears in t first and slide over that list; the work becomes O(|filtered|) instead of O(|s|) for the shrinking phase.

**Follow-up:** How is this different from "longest substring with at most k distinct" (ds-32)?
> That one maximises a window that stays valid (shrink when it breaks); this one minimises a window that is valid (shrink while it holds). Same two pointers, the record step moves inside the shrink loop.`,
    redFlags: `- Compares two frequency maps on every step (O(|alphabet|) per step, or worse with map equality)
- Uses a Set and ignores repeated characters in t
- Records the answer outside the shrink loop and misses the shortest window
- Calls \`substring\` on every candidate instead of storing indices`,
    answer: `- Sliding window with a \`need\` count per char and a single \`missing\` counter: the window is valid when \`missing == 0\`.
- Grow \`right\` until valid, then shrink \`left\` while still valid, recording the shortest span.
- \`O(|s| + |t|)\` time, \`O(alphabet)\` space; track start + length, build the substring once.`,
  },
  {
    id: 'ds-71',
    type: 'data-structures',
    num: 71,
    difficulty: 'M',
    star: true,
    section: 'Hash Maps',
    title: 'Subarray Sum Equals K — count contiguous subarrays summing to k, negatives allowed (LC 560).',
    tags: [ 'prefix-sums', 'hashing', 'arrays' ],
    related: [ 'ds-2', 'ds-3', 'ds-68' ],
    keyPoints: `- **Why not a sliding window:** with negative numbers, growing the window can shrink the sum, so "shrink while too big" loses its monotonicity (\`ds-3\` precondition). Brute force over all (i, j) pairs is O(n²)
- **Insight — prefix sums:** let \`P[j]\` be the sum of the first j elements. The subarray \`(i, j]\` sums to k exactly when \`P[j] - P[i] = k\`, i.e. \`P[i] = P[j] - k\`. So at each j, the number of good subarrays ending there is how many earlier prefixes equal \`P[j] - k\` — a Two Sum (\`ds-2\`) lookup over prefixes
- **Algorithm:** map \`prefix → occurrences\`, seeded with \`{0: 1}\` for the empty prefix (a subarray starting at index 0). For each element: extend the prefix, add \`count[prefix - k]\`, then record the prefix. Query before insert so k = 0 does not count the empty subarray

\`\`\`kotlin
fun subarraySum(nums: IntArray, k: Int): Int {
    val seen = HashMap<Int, Int>()
    seen[0] = 1                          // the empty prefix
    var prefix = 0
    var count = 0
    for (x in nums) {
        prefix += x
        count += seen[prefix - k] ?: 0   // earlier prefixes that leave exactly k
        seen[prefix] = (seen[prefix] ?: 0) + 1
    }
    return count
}
\`\`\`

- **Dry run** \`[1, 1, 1]\`, k = 2: prefixes 1, 2, 3. At prefix 2, \`2 - 2 = 0\` seen once → 1. At prefix 3, \`3 - 2 = 1\` seen once → 2. Answer 2
- **Edge cases:** without the \`{0: 1}\` seed, subarrays that start at index 0 are missed. Zeros and negatives produce repeated prefixes — that is why the map counts occurrences, not just presence. Use \`Long\` prefixes if n × max|value| can exceed \`Int\` range
- **Same family:** longest subarray with sum k (store the FIRST index of each prefix instead of a count), subarray sums divisible by k (key by \`((prefix % k) + k) % k\`), contiguous array with equal 0s and 1s (map 0 → -1, find sum 0)`,
    complexity: `- Time: O(n) — one pass, O(1) average map operations; brute force is O(n²)
- Space: O(n) — up to n + 1 distinct prefixes in the map`,
    followUp: `**Follow-up:** All numbers are positive — can you avoid the map?
> Yes: the sum is now monotone in window size, so a sliding window counts in O(n) time and O(1) space.

**Follow-up:** Return the longest such subarray instead of the count.
> Map each prefix to its earliest index (putIfAbsent) and maximise j - first[prefix - k].`,
    redFlags: `- Reaches for a sliding window without noticing negatives break it
- Forgets the \`{0: 1}\` seed and misses prefix subarrays
- Inserts the current prefix before querying (counts empty subarrays when k = 0)
- Stores presence (a Set) instead of counts and undercounts repeated prefixes`,
    answer: `- A subarray \`(i, j]\` sums to k iff \`prefix[j] - prefix[i] = k\`, so count earlier prefixes equal to \`prefix - k\`.
- One pass with a \`prefix → occurrences\` map seeded with \`{0: 1}\`; query before insert.
- \`O(n)\` time and space; a sliding window fails because negatives break monotonicity.`,
  },
  {
    id: 'ds-72',
    type: 'data-structures',
    num: 72,
    difficulty: 'M',
    star: true,
    section: 'Hash Maps',
    title: 'Top K Frequent Elements — return the k most frequent values faster than sorting (LC 347).',
    tags: [ 'hashing', 'heap', 'bucket-sort', 'top-k' ],
    related: [ 'ds-27', 'ds-61', 'ds-10' ],
    keyPoints: `- Step 1 is always a frequency map, O(n). The question is how to pick the top k of the m distinct values without sorting all of them (O(m log m))
- **Option A — min-heap of size k** (same idea as \`ds-27\`): push each distinct value keyed by its count; when the heap exceeds k, pop the least frequent. What remains is the top k. O(m log k) — the right default when k ≪ m or the data streams
- **Option B — bucket sort:** a frequency is at most n, so make \`n + 1\` buckets indexed by count and walk them from high to low until k values are collected. O(n) and no comparisons

\`\`\`kotlin
import java.util.PriorityQueue

fun topKFrequent(nums: IntArray, k: Int): IntArray {
    val freq = HashMap<Int, Int>()
    for (x in nums) freq[x] = (freq[x] ?: 0) + 1
    val buckets = Array(nums.size + 1) { mutableListOf<Int>() }   // index = frequency
    for ((value, f) in freq) buckets[f].add(value)
    val out = IntArray(k)
    var i = 0
    for (f in nums.size downTo 1) {
        for (v in buckets[f]) {
            if (i == k) return out
            out[i++] = v
        }
    }
    return out
}

fun topKFrequentHeap(nums: IntArray, k: Int): IntArray {
    val freq = HashMap<Int, Int>()
    for (x in nums) freq[x] = (freq[x] ?: 0) + 1
    val heap = PriorityQueue<Int>(compareBy<Int> { freq.getValue(it) })   // least frequent on top
    for (v in freq.keys) {
        heap.offer(v)
        if (heap.size > k) heap.poll()
    }
    return IntArray(k) { heap.poll() }
}
\`\`\`

- **Dry run** \`[1,1,1,2,2,3]\`, k = 2: freq \`{1:3, 2:2, 3:1}\`; buckets[3] = [1], buckets[2] = [2], buckets[1] = [3]; walking down collects 1 then 2
- **Edge cases:** k equal to the number of distinct values returns all of them; ties at the k-th position are unspecified unless the interviewer asks (then add a secondary key, e.g. smaller value first). The problem guarantees \`1 ≤ k ≤ distinct\` — say so, or \`require\` it
- **Top-k words (LC 692):** same heap, but the comparator is count ascending then word DESCENDING, so the alphabetically larger word is evicted first; reverse the output at the end`,
    complexity: `- Time: O(n) for counting plus O(n) bucket walk (bucket sort), or O(n + m log k) with the size-k heap (m = distinct values); full sort is O(n + m log m)
- Space: O(n) for the map and buckets; the heap version holds O(k) beyond the map`,
    followUp: `**Follow-up:** The input is a stream that never ends.
> Keep the counts (or a Count-Min Sketch when memory is bounded) and a size-k min-heap keyed by count, updating an element's heap entry when its count changes; heavy-hitter algorithms (Misra-Gries) give approximate answers in O(k) memory.

**Follow-up:** Can QuickSelect do it?
> Yes: QuickSelect over the distinct values by frequency gives average O(m), worst O(m²).`,
    redFlags: `- Sorts the whole frequency map and calls it optimal
- Uses a max-heap of all m values (O(m log m)) instead of a min-heap bounded at k
- Inverts the heap order and evicts the most frequent element
- Does not mention the bucket bound (count ≤ n) that makes O(n) possible`,
    answer: `- Count frequencies in a map, then select: a min-heap capped at k (\`O(n + m log k)\`) or buckets indexed by frequency (\`O(n)\`).
- Buckets work because a frequency can never exceed n; walk them from high to low until k values are taken.
- Heap is the streaming-friendly choice; bucket sort is the fastest offline one.`,
  },
  {
    id: 'ds-73',
    type: 'data-structures',
    num: 73,
    difficulty: 'M',
    star: true,
    section: 'Sorting & Searching',
    title: 'Merge overlapping intervals, and insert a new interval into a sorted list (LC 56, LC 57).',
    tags: [ 'intervals', 'sorting', 'greedy' ],
    related: [ 'ds-39', 'ds-15' ],
    keyPoints: `- **Clarify the boundary first:** do \`[1,4]\` and \`[4,5]\` overlap? In LC 56 they do (touching merges) — that decides \`<=\` vs \`<\` below
- **Insight:** after sorting by start, any interval that overlaps the current merged block must come right after it — an interval starting later than the block's end can never overlap anything earlier. So one linear sweep with a "last merged" block suffices
- **Algorithm (merge):** sort by start; push the first interval; for each next one, if \`start <= last.end\` extend \`last.end = max(last.end, end)\` (the max matters: \`[1,10]\` swallows \`[2,3]\`), otherwise push it as a new block

\`\`\`kotlin
fun merge(intervals: Array<IntArray>): Array<IntArray> {
    if (intervals.isEmpty()) return intervals
    val sorted = intervals.sortedBy { it[0] }
    val out = mutableListOf(sorted[0].copyOf())          // copy: we mutate the end
    for (i in 1 until sorted.size) {
        val cur = sorted[i]
        val last = out.last()
        if (cur[0] <= last[1]) last[1] = maxOf(last[1], cur[1])   // touching counts as overlap
        else out.add(cur.copyOf())
    }
    return out.toTypedArray()
}

// LC 57: intervals already sorted and non-overlapping — O(n), no sort needed
fun insert(intervals: Array<IntArray>, newInterval: IntArray): Array<IntArray> {
    val out = mutableListOf<IntArray>()
    var i = 0
    var start = newInterval[0]
    var end = newInterval[1]
    while (i < intervals.size && intervals[i][1] < start) out.add(intervals[i++])   // fully left
    while (i < intervals.size && intervals[i][0] <= end) {                         // overlapping
        start = minOf(start, intervals[i][0])
        end = maxOf(end, intervals[i][1])
        i++
    }
    out.add(intArrayOf(start, end))
    while (i < intervals.size) out.add(intervals[i++])                             // fully right
    return out.toTypedArray()
}
\`\`\`

- **Dry run (merge)** \`[[1,3],[8,10],[2,6],[15,18]]\` → sorted \`[1,3],[2,6],[8,10],[15,18]\`: 2 ≤ 3 → \`[1,6]\`; 8 > 6 → new; 15 > 10 → new. Result \`[[1,6],[8,10],[15,18]]\`
- **Edge cases:** empty input, a single interval, one interval containing all others, identical intervals. Copy before mutating so the caller's arrays are not changed behind their back
- **Interval family:** meeting rooms I (sort, any \`start < prevEnd\` → conflict), meeting rooms II / minimum platforms (\`ds-39\`: min-heap of end times or sorted start/end sweep), non-overlapping intervals LC 435 (sort by END, greedy keep the earliest finisher — the exchange argument), interval list intersections (two pointers)`,
    complexity: `- Time: O(n log n) for merge — the sort dominates the O(n) sweep; insert is O(n) because the input is already sorted
- Space: O(n) for the sorted copy and the output (O(log n) sort stack if sorting in place)`,
    followUp: `**Follow-up:** Intervals arrive one at a time and you must answer "merged list so far" after each.
> Keep a TreeMap<start, end>; on insert, look at floorEntry(start) and the entries from start up to end, merge them into one, and remove the swallowed keys — O(log n) amortised per insert.

**Follow-up:** Minimum meeting rooms?
> Sort by start and keep a min-heap of end times; pop while the earliest end <= current start, push the current end; the max heap size is the answer (see ds-39).`,
    redFlags: `- Forgets to sort, or sorts by end for the merge problem
- Sets \`last.end = cur.end\` instead of the max and shrinks a containing interval
- Never asks whether touching intervals merge
- Sorts in LC 57 even though the input is already sorted`,
    answer: `- Sort by start, then sweep: if the next start is \`<=\` the last block's end, extend the end to the max; otherwise start a new block.
- Insert into an already-sorted list in \`O(n)\`: copy everything fully left, absorb every overlap into one block, copy the rest.
- \`O(n log n)\` for merge because of the sort; clarify whether touching intervals merge.`,
  },
  {
    id: 'ds-74',
    type: 'data-structures',
    num: 74,
    difficulty: 'M',
    star: true,
    section: 'Sorting & Searching',
    title: 'Koko Eating Bananas — binary search on the answer: the minimum speed that finishes within h hours (LC 875).',
    tags: [ 'binary-search', 'binary-search-on-answer', 'arrays' ],
    related: [ 'ds-16', 'ds-66', 'ds-56' ],
    keyPoints: `- Koko eats at speed s bananas/hour, one pile per hour at most (a pile of p takes \`ceil(p / s)\` hours). Find the smallest s with total hours ≤ h. Precondition: \`h >= piles.size\`, otherwise no speed works
- **Brute force:** try s = 1, 2, 3 … max(pile): O(n · max). With piles up to 10^9 that is hopeless
- **Insight:** \`hours(s)\` never increases as s grows, so the predicate \`hours(s) <= h\` is monotone: \`false false … true true\`. That is exactly the first-bad-version shape (\`ds-66\`) — binary-search the answer space \`[1, max(piles)]\` instead of an array
- **Algorithm:** \`lo = 1\`, \`hi = max(piles)\` (that speed always takes exactly n ≤ h hours). While \`lo < hi\`: if \`mid\` is feasible keep it (\`hi = mid\`), else \`lo = mid + 1\`. Return \`lo\`

\`\`\`kotlin
fun minEatingSpeed(piles: IntArray, h: Int): Int {
    require(piles.isNotEmpty() && h >= piles.size) { "no speed can finish" }
    var lo = 1
    var hi = piles.max()
    while (lo < hi) {
        val mid = lo + (hi - lo) / 2
        if (hoursAt(piles, mid) <= h) hi = mid else lo = mid + 1
    }
    return lo
}

// ceil(p / s) without floating point; Long because n piles × up to 10^9 hours overflows Int
private fun hoursAt(piles: IntArray, speed: Int): Long =
    piles.sumOf { (it - 1L + speed) / speed }      // widen BEFORE adding: it + speed can exceed Int
\`\`\`

- **Dry run** \`[3, 6, 7, 11]\`, h = 8: range [1, 11]. mid 6 → 1+1+2+2 = 6 ≤ 8, hi = 6. mid 3 → 1+2+3+4 = 10 > 8, lo = 4. mid 5 → 1+2+2+3 = 8, hi = 5. mid 4 → 1+2+2+3 = 8, hi = 4. lo = hi = 4
- **Edge cases:** h == piles.size forces speed = max pile; one pile; huge piles (\`it + speed - 1\` must be computed in Long, or use \`(it - 1) / speed + 1\` for positive values). Float \`ceil\` is a classic precision bug
- **Recognise the pattern:** "minimise the maximum" or "smallest capacity / speed / days such that it is feasible" — ship packages within D days (LC 1011), split array largest sum (LC 410), minimum days to make bouquets (LC 1482). Write the feasibility check first, then wrap it in the lower-bound loop`,
    complexity: `- Time: O(n log M) — log M binary-search steps (M = max pile) each running an O(n) feasibility check; brute force is O(n · M)
- Space: O(1) extra`,
    followUp: `**Follow-up:** How do you know binary search on the answer applies?
> The feasibility predicate must be monotone in the answer — if speed s works, every s' > s works. State that explicitly; without it the search is wrong.

**Follow-up:** Can you tighten the lower bound?
> lo = ceil(sum / h) is a valid lower bound (she must eat everything in h hours), which shrinks the range but not the complexity class.`,
    redFlags: `- Linear scan over speeds
- Uses floating-point \`ceil\` or Int sums that overflow
- Searches over the piles array instead of the speed range
- Uses \`lo <= hi\` with \`hi = mid\` and loops forever, or cannot state the invariant`,
    answer: `- The predicate "speed s finishes within h hours" is monotone, so binary-search s over \`[1, max(piles)]\` for the first feasible value.
- Feasibility = \`sum(ceil(p / s)) <= h\`, computed in integer Long arithmetic.
- \`O(n log max)\` time, \`O(1)\` space — the template for every "minimum capacity that works" problem.`,
  },
  {
    id: 'ds-75',
    type: 'data-structures',
    num: 75,
    difficulty: 'M',
    star: true,
    section: 'Trees & Graphs',
    title: 'Course Schedule — can all courses be finished, and in what order? Cycle detection with DFS colours (LC 207, LC 210).',
    tags: [ 'graphs', 'topological-sort', 'dfs', 'cycle-detection' ],
    related: [ 'ds-20', 'ds-7' ],
    keyPoints: `- Model: course → node, prerequisite pair \`[course, pre]\` → edge \`pre → course\`. All courses can be finished iff the graph has no directed cycle; LC 210 wants a valid order = a topological sort
- Two standard answers: Kahn's BFS on in-degrees (\`ds-20\` — a result shorter than n means a cycle) or DFS with three colours, shown here
- **Three colours:** 0 = unvisited, 1 = on the current DFS path, 2 = fully explained. Meeting a colour-1 node means an edge back into the current path → cycle. A colour-2 node is safe and is not re-explored, which keeps it O(V + E). Two colours are not enough: a node reached twice through different branches (a diamond) is not a cycle
- **Order:** a node is appended after all its descendants (post-order), so reversing the post-order puts every prerequisite before its course

\`\`\`kotlin
fun findOrder(numCourses: Int, prerequisites: Array<IntArray>): IntArray {
    val adj = List(numCourses) { mutableListOf<Int>() }
    for ((course, pre) in prerequisites) adj[pre].add(course)   // pre must come first
    val state = IntArray(numCourses)          // 0 unvisited, 1 on path, 2 done
    val post = ArrayList<Int>(numCourses)

    fun dfs(u: Int): Boolean {                // false = cycle
        state[u] = 1
        for (v in adj[u]) {
            if (state[v] == 1) return false   // back edge
            if (state[v] == 0 && !dfs(v)) return false
        }
        state[u] = 2
        post.add(u)
        return true
    }

    for (u in 0 until numCourses) {
        if (state[u] == 0 && !dfs(u)) return IntArray(0)
    }
    return post.asReversed().toIntArray()
}

fun canFinish(numCourses: Int, prerequisites: Array<IntArray>): Boolean =
    numCourses == 0 || findOrder(numCourses, prerequisites).isNotEmpty()
\`\`\`

- **Dry run** n = 4, \`[[1,0],[2,0],[3,1],[3,2]]\`: dfs(0) → dfs(1) → dfs(3) post [3] → post [3,1] → dfs(2) sees 3 done → post [3,1,2] → post [3,1,2,0]. Reversed: \`[0,2,1,3]\` — valid. Add \`[0,3]\` and dfs reaches 0 while it is still colour 1 → cycle → empty array
- **Edge cases:** no prerequisites (any order, e.g. 0..n-1), self-loop \`[a, a]\` (immediate cycle), duplicate edges (harmless), disconnected components (the outer loop starts a DFS in each)
- **Kahn vs DFS:** Kahn is iterative — no stack-depth risk on a 10^5-node chain (recursion would overflow the default thread stack, a real concern on Android). DFS is shorter to write and the same colours also find WHICH nodes form the cycle`,
    complexity: `- Time: O(V + E) — each node is coloured once and each edge examined once
- Space: O(V + E) for the adjacency list, plus O(V) for colours, the post-order list and the recursion stack (O(V) deep on a chain)`,
    followUp: `**Follow-up:** Return one cycle when the order is impossible.
> Keep a parent array; when a back edge u → v is found, walk parents from u back to v.

**Follow-up:** What is the minimum number of semesters if independent courses run in parallel?
> Kahn's algorithm level by level: the number of BFS layers (LC 1136).`,
    redFlags: `- Uses a single visited set and reports a cycle on a diamond-shaped DAG
- Reverses the edge direction and returns the order backwards without noticing
- Recurses with no awareness of stack depth on large inputs
- Forgets disconnected components (only starts DFS from node 0)`,
    answer: `- Edges \`pre → course\`; finishing everything is possible iff the graph has no directed cycle.
- DFS with three colours (unvisited / on path / done): a neighbour still "on path" is a back edge; reversed post-order is a valid schedule.
- \`O(V + E)\`; Kahn's in-degree BFS (\`ds-20\`) is the iterative alternative with no recursion-depth risk.`,
  },
  {
    id: 'ds-76',
    type: 'data-structures',
    num: 76,
    difficulty: 'M',
    star: false,
    section: 'Trees & Graphs',
    title: 'Rotting Oranges — multi-source BFS: how many minutes until every orange rots? (LC 994).',
    tags: [ 'graphs', 'bfs', 'multi-source-bfs', 'grid' ],
    related: [ 'ds-19', 'ds-7' ],
    keyPoints: `- Grid: 0 empty, 1 fresh, 2 rotten. Each minute every rotten orange rots its 4-neighbours. Return the minutes until no fresh orange remains, or -1 if some never rot
- **Brute force:** simulate minute by minute rescanning the whole grid: O((rows·cols)²) in the worst case
- **Insight — multi-source BFS:** put ALL initially rotten cells in the queue at distance 0. BFS then expands from every source in lock-step, and each BFS layer is exactly one minute. Running a separate BFS per source and taking the min is the slow version of the same thing
- **Algorithm:** enqueue every 2, count every 1. While the queue is non-empty and fresh oranges remain, process one full layer (\`repeat(q.size)\`), rotting fresh neighbours as they are enqueued, then \`minutes++\`. Finish with \`fresh == 0 ? minutes : -1\`

\`\`\`kotlin
fun orangesRotting(grid: Array<IntArray>): Int {
    val rows = grid.size
    val cols = grid[0].size
    val q = ArrayDeque<IntArray>()
    var fresh = 0
    for (r in 0 until rows) for (c in 0 until cols) {
        when (grid[r][c]) {
            2 -> q.addLast(intArrayOf(r, c))
            1 -> fresh++
        }
    }
    val dirs = arrayOf(intArrayOf(1, 0), intArrayOf(-1, 0), intArrayOf(0, 1), intArrayOf(0, -1))
    var minutes = 0
    while (q.isNotEmpty() && fresh > 0) {
        repeat(q.size) {                          // one layer = one minute
            val (r, c) = q.removeFirst()
            for ((dr, dc) in dirs) {
                val nr = r + dr
                val nc = c + dc
                if (nr in 0 until rows && nc in 0 until cols && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2              // mark when enqueued, never twice
                    fresh--
                    q.addLast(intArrayOf(nr, nc))
                }
            }
        }
        minutes++
    }
    return if (fresh == 0) minutes else -1
}
\`\`\`

- **Dry run** \`[[2,1,1],[1,1,0],[0,1,1]]\`: minute 1 rots (0,1),(1,0); minute 2 rots (0,2),(1,1); minute 3 rots (2,1); minute 4 rots (2,2) → 4. In \`[[2,1,1],[0,1,1],[1,0,1]]\` the orange at (2,0) is walled off by zeros, so the answer is -1
- **Edge cases:** no fresh oranges at all → 0 (the \`fresh > 0\` guard stops an extra minute being counted); fresh but no rotten → -1; the code mutates the grid — copy it if the caller needs it back
- **Mark on enqueue, not dequeue:** otherwise the same cell is enqueued by several neighbours and counted twice, which corrupts \`fresh\`
- **Same pattern:** walls and gates / distance to nearest 0 (LC 286, LC 542), shortest bridge, fire spreading in a maze — any "distance to the nearest of many sources"`,
    complexity: `- Time: O(rows · cols) — every cell is enqueued at most once and checks 4 neighbours
- Space: O(rows · cols) for the queue in the worst case (all cells rotten at start)`,
    followUp: `**Follow-up:** Why does one BFS from all sources give the right answer?
> Equivalent to adding a virtual super-source joined to every rotten cell with an edge of weight 0; BFS from it gives each cell its distance to the nearest source.

**Follow-up:** What if rotting a neighbour takes a different time per cell?
> Layers no longer equal time — switch to Dijkstra (ds-21) with all sources at distance 0.`,
    redFlags: `- Runs a BFS from every rotten orange separately
- Counts minutes per dequeued cell instead of per layer
- Returns 1 (or -1) on a grid that has no fresh oranges
- Marks visited on dequeue and double-counts cells`,
    answer: `- Multi-source BFS: enqueue every rotten orange at time 0 and count the fresh ones.
- Process the queue one layer per minute, rotting fresh neighbours as they are enqueued.
- Answer = layers until \`fresh == 0\`, else -1; \`O(rows · cols)\` time and space.`,
  },
  {
    id: 'ds-77',
    type: 'data-structures',
    num: 77,
    difficulty: 'M',
    star: true,
    section: 'Backtracking',
    title: 'Subsets — generate the power set of distinct integers, then handle duplicates (LC 78, LC 90).',
    tags: [ 'backtracking', 'recursion', 'bit-manipulation' ],
    related: [ 'ds-42', 'ds-78', 'ds-79' ],
    keyPoints: `- n distinct numbers have 2ⁿ subsets — the output itself is exponential, so the goal is to generate each exactly once with O(n) work per subset
- **Backtracking template:** a recursion tree where each node is a partial choice. For subsets, EVERY node is an answer: record the current path, then for each index \`i\` from \`start\` onward, choose \`nums[i]\`, recurse with \`start = i + 1\`, and un-choose. Using \`start\` (never looking back) is what stops \`[1,2]\` and \`[2,1]\` both appearing

\`\`\`kotlin
fun subsets(nums: IntArray): List<List<Int>> {
    val res = mutableListOf<List<Int>>()
    val path = ArrayList<Int>()
    fun backtrack(start: Int) {
        res.add(ArrayList(path))              // snapshot: path keeps mutating
        for (i in start until nums.size) {
            path.add(nums[i])                 // choose
            backtrack(i + 1)                  // explore
            path.removeAt(path.lastIndex)     // un-choose
        }
    }
    backtrack(0)
    return res
}

// LC 90: input may contain duplicates — sort, then skip equal siblings at the same depth
fun subsetsWithDup(nums: IntArray): List<List<Int>> {
    val a = nums.sortedArray()
    val res = mutableListOf<List<Int>>()
    val path = ArrayList<Int>()
    fun backtrack(start: Int) {
        res.add(ArrayList(path))
        for (i in start until a.size) {
            if (i > start && a[i] == a[i - 1]) continue   // same value already tried at this depth
            path.add(a[i])
            backtrack(i + 1)
            path.removeAt(path.lastIndex)
        }
    }
    backtrack(0)
    return res
}
\`\`\`

- **Dry run** \`[1,2,3]\`: [], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3] — 8 = 2³ subsets
- **Duplicates** \`[1,2,2]\`: \`i > start\` (not \`i > 0\`) skips the second 2 only as a SIBLING; taking both 2s down one branch is still allowed, giving [], [1], [1,2], [1,2,2], [2], [2,2] — 6 subsets
- **Kotlin pitfalls:** add a COPY (\`ArrayList(path)\`), never \`path\` itself, or every entry ends up as the same empty list. Prefer \`removeAt(lastIndex)\` over \`removeLast()\` on a \`MutableList\`: with JDK 21 APIs the call can bind to Java's \`List.removeLast()\`, which crashes on Android versions below 15
- **Iterative alternatives:** bitmask over \`0 until (1 shl n)\` (bit i set ⇒ include nums[i]; fine for n ≤ 30), or cascading — start with [[]] and for each number append it to a copy of every existing subset`,
    complexity: `- Time: O(n · 2ⁿ) — 2ⁿ subsets, each copied in O(n)
- Space: O(n) recursion depth and path, excluding the O(n · 2ⁿ) output`,
    followUp: `**Follow-up:** Only subsets of size k (combinations, LC 77)?
> Same tree; record only when path.size == k and prune when the remaining elements cannot fill the path (n - i < k - path.size).

**Follow-up:** Why sort for LC 90?
> Sorting places equal values next to each other, so "same value as the previous sibling" is a constant-time check instead of a set of seen subsets.`,
    redFlags: `- Adds \`path\` without copying it
- Loops from 0 instead of \`start\` and produces permutations of each subset
- Dedupes duplicates by hashing every finished subset instead of skipping siblings
- Cannot say why the complexity is exponential (the output size)`,
    answer: `- Backtrack with a \`start\` index: record the path at every node, then choose each \`nums[i]\` for \`i >= start\`, recurse with \`i + 1\`, undo.
- With duplicates, sort and skip \`a[i] == a[i-1]\` when \`i > start\` — siblings only, not depth.
- \`O(n · 2ⁿ)\` because the output is 2ⁿ subsets; a bitmask loop is the iterative equivalent.`,
  },
  {
    id: 'ds-78',
    type: 'data-structures',
    num: 78,
    difficulty: 'M',
    star: false,
    section: 'Backtracking',
    title: 'Permutations — generate every ordering of distinct integers, then handle duplicates (LC 46, LC 47).',
    tags: [ 'backtracking', 'recursion' ],
    related: [ 'ds-77', 'ds-79', 'ds-42' ],
    keyPoints: `- n distinct values have n! orderings. Unlike subsets (\`ds-77\`), order matters, so every position may take ANY unused value — a \`used\` flag replaces the \`start\` index, and only leaves (full-length paths) are answers
- **Algorithm:** if \`path.size == n\`, record a copy. Otherwise for every index \`i\` not yet used: mark it, append, recurse, then pop and unmark

\`\`\`kotlin
fun permute(nums: IntArray): List<List<Int>> {
    val res = mutableListOf<List<Int>>()
    val path = ArrayList<Int>(nums.size)
    val used = BooleanArray(nums.size)
    fun backtrack() {
        if (path.size == nums.size) {
            res.add(ArrayList(path))
            return
        }
        for (i in nums.indices) {
            if (used[i]) continue
            used[i] = true
            path.add(nums[i])
            backtrack()
            path.removeAt(path.lastIndex)
            used[i] = false
        }
    }
    backtrack()
    return res
}

// LC 47: duplicates allowed — sort, then use equal values strictly left to right
fun permuteUnique(nums: IntArray): List<List<Int>> {
    val a = nums.sortedArray()
    val res = mutableListOf<List<Int>>()
    val path = ArrayList<Int>(a.size)
    val used = BooleanArray(a.size)
    fun backtrack() {
        if (path.size == a.size) {
            res.add(ArrayList(path))
            return
        }
        for (i in a.indices) {
            if (used[i]) continue
            if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue   // twin not placed yet ⇒ skip
            used[i] = true
            path.add(a[i])
            backtrack()
            path.removeAt(path.lastIndex)
            used[i] = false
        }
    }
    backtrack()
    return res
}
\`\`\`

- **Dry run** \`[1,2,3]\` → [1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1] — 3! = 6
- **The LC 47 rule:** among equal values, only allow the copy at index i if its left twin is already in the path. That forces equal values to appear in one fixed relative order, so each distinct permutation is built once: \`[1,1,2]\` → [1,1,2], [1,2,1], [2,1,1]
- **Edge cases:** empty input → one empty permutation \`[[]]\`; a single element → itself. n beyond ~10 is infeasible (10! = 3.6M lists), say so before coding
- **Swap-based variant:** permute in place by swapping \`a[start]\` with each \`a[i]\`, recursing on \`start + 1\`, swapping back — no \`used\` array, but the output order is not lexicographic. "Next permutation" (LC 31) is the O(n) iterative step if only the following order is needed`,
    complexity: `- Time: O(n · n!) — n! leaves, each copied in O(n) (internal nodes add at most a constant factor)
- Space: O(n) for the path, the \`used\` array and the recursion stack, excluding the O(n · n!) output`,
    followUp: `**Follow-up:** Return only the k-th permutation (LC 60).
> Do not generate them: with factorial number system, the first digit is index (k-1) / (n-1)! among the remaining values, and so on — O(n²) with a list, O(n log n) with a Fenwick tree.

**Follow-up:** Why \`!used[i - 1]\` and not \`used[i - 1]\`?
> Both prune correctly, but !used[i-1] cuts the duplicate branch at the shallowest level and explores far fewer nodes.`,
    redFlags: `- Uses \`path.contains(x)\` to test usage — O(n) per check and wrong with duplicates
- Records partial paths, mixing subsets into the output
- Dedupes LC 47 with a HashSet of finished lists instead of pruning
- Forgets to unmark \`used[i]\` on the way back`,
    answer: `- Backtrack with a \`used\` array: at each depth try every unused index, recurse, then undo; record only full-length paths.
- With duplicates, sort and skip \`a[i]\` when it equals \`a[i-1]\` and the twin is not used yet.
- \`O(n · n!)\` time — bounded by the output size; \`O(n)\` extra space.`,
  },
  {
    id: 'ds-79',
    type: 'data-structures',
    num: 79,
    difficulty: 'M',
    star: true,
    section: 'Backtracking',
    title: 'Combination Sum — all combinations of candidates (reuse allowed) that sum to a target (LC 39, LC 40).',
    tags: [ 'backtracking', 'recursion', 'pruning' ],
    related: [ 'ds-77', 'ds-78', 'ds-25' ],
    keyPoints: `- Candidates are distinct positive integers and each may be used any number of times; return every multiset that sums to \`target\` (order inside a combination does not matter)
- **Tree shape:** like subsets (\`ds-77\`) a \`start\` index forbids looking back, so \`[2,2,3]\` and \`[3,2,2]\` are not both produced. The one change: recurse with \`i\`, not \`i + 1\`, because the same candidate may be picked again
- **Pruning:** sort the candidates; once \`c[i] > remaining\`, every later candidate is larger too, so \`break\` instead of \`continue\`. Positivity is what makes this valid — with zeros or negatives the recursion need not terminate

\`\`\`kotlin
fun combinationSum(candidates: IntArray, target: Int): List<List<Int>> {
    val c = candidates.sortedArray()
    val res = mutableListOf<List<Int>>()
    val path = ArrayList<Int>()
    fun backtrack(start: Int, remaining: Int) {
        if (remaining == 0) {
            res.add(ArrayList(path))
            return
        }
        for (i in start until c.size) {
            if (c[i] > remaining) break          // sorted ⇒ nothing later fits either
            path.add(c[i])
            backtrack(i, remaining - c[i])       // i, not i + 1: reuse allowed
            path.removeAt(path.lastIndex)
        }
    }
    backtrack(0, target)
    return res
}

// LC 40: each candidate used at most once, candidates may repeat
fun combinationSum2(candidates: IntArray, target: Int): List<List<Int>> {
    val c = candidates.sortedArray()
    val res = mutableListOf<List<Int>>()
    val path = ArrayList<Int>()
    fun backtrack(start: Int, remaining: Int) {
        if (remaining == 0) {
            res.add(ArrayList(path))
            return
        }
        for (i in start until c.size) {
            if (c[i] > remaining) break
            if (i > start && c[i] == c[i - 1]) continue   // equal sibling ⇒ same combinations
            path.add(c[i])
            backtrack(i + 1, remaining - c[i])
            path.removeAt(path.lastIndex)
        }
    }
    backtrack(0, target)
    return res
}
\`\`\`

- **Dry run** \`[2,3,6,7]\`, target 7: 2 → 2 → 2 leaves 1, every candidate > 1 → back up; 2,2,3 hits 0 ✓; 2,3 leaves 2, 3 > 2 break; 3,3 leaves 1 → break; 6 leaves 1 → break; 7 hits 0 ✓. Result \`[[2,2,3],[7]]\`
- **Edge cases:** no combination → empty list; target smaller than every candidate → empty; target 0 → one empty combination \`[[]]\` (clarify what the interviewer expects)
- **When only the COUNT is needed:** that is the unbounded-knapsack DP (Coin Change 2, LC 518): \`ways[s] += ways[s - coin]\` with coins in the outer loop — O(n · target) instead of exponential. Coin Change (\`ds-25\`) is the min-count sibling`,
    complexity: `- Time: exponential — O(n^(T/m + 1)) as a loose bound, where T = target and m = the smallest candidate (the tree is at most T/m deep with up to n branches); each recorded combination also costs O(T/m) to copy
- Space: O(T/m) for the recursion depth and the path, excluding the output`,
    followUp: `**Follow-up:** Why does sorting help beyond deduplication?
> It turns the over-target check into a break that cuts every remaining sibling at once, which prunes most of the tree in practice.

**Follow-up:** Exactly k numbers from 1..9 that sum to n (LC 216)?
> Same template with candidates 1..9, i + 1 recursion, and an extra stop when path.size == k.`,
    redFlags: `- Recurses with \`i + 1\` and loses reuse, or from 0 and produces permutations
- Uses \`continue\` instead of \`break\` after sorting (correct, but misses the pruning)
- Dedupes LC 40 with a Set of sorted lists instead of skipping equal siblings
- Generates combinations when the question only asks for the count`,
    answer: `- Sort, then backtrack with a \`start\` index and the remaining target; recurse with \`i\` (reuse allowed) and \`break\` once a candidate exceeds the remainder.
- Single-use variant: recurse with \`i + 1\` and skip equal siblings (\`i > start && c[i] == c[i-1]\`).
- Exponential in target / smallest candidate; if only the count matters, use the knapsack DP.`,
  },
  {
    id: 'ds-80',
    type: 'data-structures',
    num: 80,
    difficulty: 'M',
    star: false,
    section: 'Backtracking',
    title: 'Generate Parentheses — every well-formed string of n pairs (LC 22).',
    tags: [ 'backtracking', 'recursion', 'strings', 'catalan' ],
    related: [ 'ds-17', 'ds-41', 'ds-77' ],
    keyPoints: `- **Brute force:** build all 2^(2n) strings of '(' and ')' and filter with the stack check from \`ds-17\`. Most of them are invalid, so almost all the work is wasted
- **Insight:** only generate valid prefixes. A prefix can still become valid exactly when \`open ≤ n\` and \`close ≤ open\`. So at each step: add '(' if \`open < n\`; add ')' if \`close < open\`. Every leaf of length 2n is then valid — no filtering
- One shared \`StringBuilder\` with append / truncate avoids allocating a new string per node

\`\`\`kotlin
fun generateParenthesis(n: Int): List<String> {
    val res = mutableListOf<String>()
    val sb = StringBuilder(2 * n)
    fun backtrack(open: Int, close: Int) {
        if (sb.length == 2 * n) {
            res.add(sb.toString())
            return
        }
        if (open < n) {
            sb.append('(')
            backtrack(open + 1, close)
            sb.setLength(sb.length - 1)
        }
        if (close < open) {                  // a ')' must close something already open
            sb.append(')')
            backtrack(open, close + 1)
            sb.setLength(sb.length - 1)
        }
    }
    backtrack(0, 0)
    return res
}
\`\`\`

- **Dry run** n = 3 → \`((()))\`, \`(()())\`, \`(())()\`, \`()(())\`, \`()()()\` — 5 strings, the 3rd Catalan number. n = 4 gives 14
- **Edge cases:** n = 0 → \`[""]\` (one empty string); n = 1 → \`["()"]\`. Trying ')' first would still be correct but changes the output order — '(' first yields lexicographic order
- **Why this is correct:** a string is balanced iff no prefix has more ')' than '(' and the totals match; the two guards enforce exactly those conditions, so the tree contains every valid string and nothing else`,
    complexity: `- Time: O(4ⁿ / √n) — the n-th Catalan number Cₙ ~ 4ⁿ / (n^1.5 √π) results, each costing O(n) to build and copy
- Space: O(n) for the recursion depth and the builder, excluding the output`,
    followUp: `**Follow-up:** Only the count, not the strings?
> Catalan DP: C(0) = 1, C(n) = Σ C(i) · C(n-1-i) — the first '(' matches a ')' that splits the string into an inside and an outside part.

**Follow-up:** Multiple bracket types?
> Track a stack of open types instead of a counter; a closing bracket must match the top.`,
    redFlags: `- Generates all 2^(2n) strings and filters them
- Allows ')' whenever \`close < n\` and produces invalid strings like \`())(()\`
- Concatenates new Strings per call without saying it costs extra allocations
- Cannot name the result count (Catalan)`,
    answer: `- Backtrack on two counters: append '(' while \`open < n\`, append ')' while \`close < open\`.
- Every leaf of length 2n is valid by construction, so nothing is filtered.
- Output size is the n-th Catalan number, \`O(4ⁿ / √n)\`; \`O(n)\` extra space.`,
  },
  {
    id: 'ds-81',
    type: 'data-structures',
    num: 81,
    difficulty: 'H',
    star: false,
    section: 'Backtracking',
    title: 'N-Queens — place n queens on an n×n board so none attack each other (LC 51, LC 52).',
    tags: [ 'backtracking', 'recursion', 'pruning', 'matrix' ],
    related: [ 'ds-78', 'ds-77' ],
    keyPoints: `- **Shrink the search:** each row holds exactly one queen, so place row by row and only choose a column — n choices per row instead of n² per queen. That alone reduces the space to n! column orders
- **O(1) conflict checks:** a queen at (r, c) blocks its column, its "/" diagonal (\`r + c\` constant, 2n-1 values) and its "\\\\" diagonal (\`r - c\` constant; shift by n-1 to index an array). Three boolean arrays replace scanning the board
- **Algorithm:** \`place(r)\`: if \`r == n\`, record the board. For each column whose three flags are clear, set them, remember the column, recurse to \`r + 1\`, clear them

\`\`\`kotlin
fun solveNQueens(n: Int): List<List<String>> {
    require(n >= 1)
    val res = mutableListOf<List<String>>()
    val colAt = IntArray(n)                     // colAt[row] = column of that row's queen
    val cols = BooleanArray(n)
    val sumDiag = BooleanArray(2 * n - 1)       // r + c
    val diffDiag = BooleanArray(2 * n - 1)      // r - c + n - 1
    fun place(r: Int) {
        if (r == n) {
            res.add(List(n) { row -> ".".repeat(colAt[row]) + "Q" + ".".repeat(n - 1 - colAt[row]) })
            return
        }
        for (c in 0 until n) {
            val d1 = r + c
            val d2 = r - c + n - 1
            if (cols[c] || sumDiag[d1] || diffDiag[d2]) continue
            cols[c] = true; sumDiag[d1] = true; diffDiag[d2] = true
            colAt[r] = c
            place(r + 1)
            cols[c] = false; sumDiag[d1] = false; diffDiag[d2] = false
        }
    }
    place(0)
    return res
}
\`\`\`

- **Dry run** n = 4: row 0 col 0 → row 1 col 2 → row 2 has no safe column → backtrack; row 1 col 3 → row 2 col 1 → row 3 dead end → backtrack… The two solutions are \`[".Q..","...Q","Q...","..Q."]\` and its mirror \`["..Q.","Q...","...Q",".Q.."]\`
- **Known counts** (useful sanity check): n = 1 → 1, n = 2 and 3 → 0, n = 4 → 2, n = 5 → 10, n = 6 → 4, n = 8 → 92
- **LC 52 (count only):** drop the board building and return a counter. The fastest form uses bitmasks: \`avail = ~(cols | d1 | d2) & ((1 shl n) - 1)\`, take the lowest bit \`avail and -avail\`, and shift the diagonal masks by one each row
- **Edge cases:** n = 2 or 3 returns an empty list, not an error`,
    complexity: `- Time: O(n!) upper bound — row r has at most n - r unblocked columns — plus O(n²) to build each recorded board
- Space: O(n) for the three flag arrays, \`colAt\` and the recursion stack, excluding the output`,
    followUp: `**Follow-up:** Can symmetry halve the work?
> For the count, only try columns in the left half of row 0 and double the result (handle the middle column separately when n is odd).

**Follow-up:** Sudoku solver (LC 37)?
> Same template: pick the next empty cell, try digits not used in its row, column and box (three sets of flags), recurse, undo.`,
    redFlags: `- Tries every cell for every queen (n² branching) instead of one queen per row
- Scans the board to check attacks (O(n) per check) instead of keeping diagonal flags
- Mixes up the diagonal formulas or forgets the n-1 offset and indexes negative positions
- Cannot explain why n = 2 and n = 3 have no solution`,
    answer: `- One queen per row; backtrack over columns, checking column, \`r + c\` and \`r - c\` diagonals with three boolean arrays in \`O(1)\`.
- Record the board when row n is reached, undo the flags on the way back.
- \`O(n!)\` upper bound, \`O(n)\` extra space; bitmasks make the count-only variant fastest.`,
  },
  {
    id: 'ds-82',
    type: 'data-structures',
    num: 82,
    difficulty: 'H',
    star: true,
    section: 'Backtracking',
    title: 'Word Search II — find every dictionary word in a letter grid using a trie plus DFS (LC 212).',
    tags: [ 'backtracking', 'trie', 'dfs', 'matrix' ],
    related: [ 'ds-22', 'ds-19', 'ds-77' ],
    keyPoints: `- **Single word (LC 79):** DFS from every cell, marking cells on the current path so a letter is not reused. Repeating that per word costs O(words × cells × 4^L) and re-walks the same prefixes again and again
- **Insight:** put all words in a trie (\`ds-22\`) and run ONE DFS per starting cell that walks the grid and the trie in lock-step. A grid path whose letters are not a trie prefix is abandoned immediately — every word sharing that prefix is pruned at once
- **Algorithm:** build the trie, storing the full word on its terminal node. For each cell, \`dfs(r, c, root)\`: step to the child for \`board[r][c]\` (stop if absent); if the child holds a word, report it and clear it (no duplicates); mark the cell \`'#'\`; recurse in four directions; restore the letter. Optionally prune the trie node once it has no word and no children, so later searches skip dead branches

\`\`\`kotlin
class TrieNode {
    val next = arrayOfNulls<TrieNode>(26)
    var word: String? = null                     // set on the node that ends a word
}

fun findWords(board: Array<CharArray>, words: Array<String>): List<String> {
    val root = TrieNode()
    for (w in words) {
        var node = root
        for (ch in w) {
            val i = ch - 'a'
            node = node.next[i] ?: TrieNode().also { node.next[i] = it }
        }
        node.word = w
    }
    val rows = board.size
    val cols = board[0].size
    val res = mutableListOf<String>()

    fun dfs(r: Int, c: Int, parent: TrieNode) {
        val ch = board[r][c]
        if (ch == '#') return                                // already on this path
        val node = parent.next[ch - 'a'] ?: return           // no word continues this way
        node.word?.let { res.add(it); node.word = null }     // report each word once
        board[r][c] = '#'
        if (r > 0) dfs(r - 1, c, node)
        if (r < rows - 1) dfs(r + 1, c, node)
        if (c > 0) dfs(r, c - 1, node)
        if (c < cols - 1) dfs(r, c + 1, node)
        board[r][c] = ch                                     // restore
        if (node.word == null && node.next.all { it == null }) {
            parent.next[ch - 'a'] = null                     // prune the exhausted branch
        }
    }

    for (r in 0 until rows) for (c in 0 until cols) dfs(r, c, root)
    return res
}
\`\`\`

- **Dry run** board \`[[o,a,a,n],[e,t,a,e],[i,h,k,r],[i,f,l,v]]\`, words \`[oath, pea, eat, rain]\` → \`oath\` (o→a→t→h) and \`eat\` (e→a→t); \`pea\` has no p, \`rain\` no adjacent path
- **Edge cases:** duplicate words in the dictionary (the trie merges them; clearing \`word\` prevents double reporting), a word that is a prefix of another (\`app\`, \`apple\` — keep searching after reporting), a 1×1 board. The board is restored, so it is unchanged on return
- **Why store the word on the node:** no StringBuilder to maintain along the path, and reporting is O(1)`,
    complexity: `- Time: O(cells × 4 × 3^(L-1)) worst case, where L = longest word — after the first step each move has at most 3 unvisited directions; building the trie is O(total word letters). In practice trie pruning cuts most branches
- Space: O(total word letters × 26) for the trie nodes plus O(L) recursion depth`,
    followUp: `**Follow-up:** Why not search each word separately?
> Words sharing a prefix redo the same grid walk; the trie shares that work, and pruning removes found words so the search speeds up as it proceeds.

**Follow-up:** The alphabet is not a–z.
> Replace the 26-slot array with a HashMap<Char, TrieNode> per node — less memory for sparse alphabets, slightly slower lookups.`,
    redFlags: `- Runs the single-word search once per dictionary word
- Forgets to restore the cell after the DFS, corrupting later searches
- Stops at the first match and misses longer words that share the prefix
- Reports the same word twice when it can be found along two paths`,
    answer: `- Build a trie of the words, then DFS from every cell, walking the grid and the trie together; stop as soon as the path is not a trie prefix.
- Mark cells on the path (\`'#'\`), restore on return, report a word once by clearing it from its node, and prune empty trie branches.
- Roughly \`O(cells × 3^L)\` worst case; the trie is what lets one search serve every word.`,
  },
  {
    id: 'ds-83',
    type: 'data-structures',
    num: 83,
    difficulty: 'H',
    star: true,
    section: 'Dynamic Programming',
    title: 'Edit Distance — minimum inserts, deletes and replaces to turn one string into another (LC 72).',
    tags: [ 'dynamic-programming', 'strings', '2d-dp' ],
    related: [ 'ds-13', 'ds-12' ],
    keyPoints: `- **Brute force:** recurse on the first mismatch, trying all three operations: O(3^(m+n)). The subproblems are just "suffix/prefix pairs", so there are only (m+1)(n+1) distinct ones — memoise or tabulate
- **State:** \`dp[i][j]\` = edits to turn the first i chars of \`a\` into the first j chars of \`b\`
- **Base cases:** \`dp[i][0] = i\` (delete all i), \`dp[0][j] = j\` (insert all j)
- **Recurrence:** if \`a[i-1] == b[j-1]\`, \`dp[i][j] = dp[i-1][j-1]\` (free). Otherwise \`1 + min(dp[i-1][j-1]\` replace, \`dp[i-1][j]\` delete from a, \`dp[i][j-1]\` insert into a\`)\`
- **Fill order:** row by row, left to right — each cell needs the row above and the cell to its left, so two rows (or one row plus a saved diagonal) are enough

\`\`\`kotlin
fun minDistance(a: String, b: String): Int {
    val n = b.length
    var prev = IntArray(n + 1) { it }        // row 0: j inserts
    var cur = IntArray(n + 1)
    for (i in 1..a.length) {
        cur[0] = i                           // i deletes
        for (j in 1..n) {
            cur[j] = if (a[i - 1] == b[j - 1]) {
                prev[j - 1]
            } else {
                1 + minOf(prev[j - 1], prev[j], cur[j - 1])   // replace, delete, insert
            }
        }
        val t = prev; prev = cur; cur = t    // swap rows, no allocation
    }
    return prev[n]
}
\`\`\`

- **Dry run** \`horse → ros\` = 3: replace h→r (rorse), delete r (rose), delete e (ros). \`intention → execution\` = 5. \`"" → "ab"\` = 2, \`"ab" → ""\` = 2 — the empty strings fall out of the base row/column with no special case
- **Relationship to LCS (\`ds-13\`):** same grid. With only insert/delete allowed (no replace), the distance is \`m + n - 2·LCS\`
- **Edge cases:** identical strings → 0; one empty string → the other's length. Swap so the shorter string indexes the row if memory matters: O(min(m, n)) space
- **Reconstructing the edits** needs the full table (or Hirschberg's divide-and-conquer to keep linear space): walk back from \`dp[m][n]\` choosing whichever neighbour produced the value`,
    complexity: `- Time: O(m · n) — one O(1) cell per (i, j) pair; the naive recursion is O(3^(m+n))
- Space: O(n) with two rolling rows (O(min(m, n)) after swapping arguments); O(m · n) if the full table is kept for reconstruction`,
    followUp: `**Follow-up:** Only check whether two strings are one edit apart (LC 161)?
> No DP: walk both strings, allow a single mismatch (skip one char in the longer string or both on equal length) — O(n), O(1).

**Follow-up:** Where does this show up in practice?
> Spell-check and fuzzy search (Levenshtein distance), diff tools (LCS-based), DNA alignment with weighted costs.`,
    redFlags: `- Mixes up which neighbour means insert vs delete and cannot justify the recurrence
- Off-by-one between string indices (i-1) and table indices (i)
- Forgets the base row/column and special-cases empty strings
- Keeps the full m×n table when only the distance is asked and memory was a stated constraint`,
    answer: `- \`dp[i][j]\` = edits to turn \`a[0..i)\` into \`b[0..j)\`; base row/column are \`j\` and \`i\`.
- Equal chars copy the diagonal; otherwise \`1 + min(diagonal = replace, up = delete, left = insert)\`.
- \`O(m · n)\` time, \`O(min(m, n))\` space with two rolling rows.`,
  },
  {
    id: 'ds-84',
    type: 'data-structures',
    num: 84,
    difficulty: 'M',
    star: true,
    section: 'Dynamic Programming',
    title: 'Partition Equal Subset Sum — can the array split into two halves of equal sum? (0/1 knapsack, LC 416).',
    tags: [ 'dynamic-programming', 'knapsack', 'subset-sum' ],
    related: [ 'ds-14', 'ds-25', 'ds-77' ],
    keyPoints: `- **Reduce first:** two equal halves exist iff some subset sums to \`total / 2\`. An odd total is an immediate no. This is subset sum — 0/1 knapsack (\`ds-14\`) where the value is just "reachable"
- **Brute force:** try every subset, O(2ⁿ)
- **State:** \`dp[s]\` = some subset of the numbers processed so far sums to \`s\`. Base: \`dp[0] = true\` (the empty subset)
- **Transition:** for each number x, \`dp[s] = dp[s] || dp[s - x]\` for every s ≥ x
- **Fill order — the whole point:** iterate s DOWNWARDS from target to x. Going upwards would read \`dp[s - x]\` already updated in this same pass, i.e. use x twice — which is the unbounded knapsack / Coin Change (\`ds-25\`) loop

\`\`\`kotlin
fun canPartition(nums: IntArray): Boolean {
    val total = nums.sum()
    if (total % 2 != 0) return false
    val target = total / 2
    val dp = BooleanArray(target + 1)
    dp[0] = true
    for (x in nums) {
        for (s in target downTo x) {         // downwards: each number used at most once
            if (dp[s - x]) dp[s] = true
        }
        if (dp[target]) return true          // early exit
    }
    return dp[target]
}
\`\`\`

- **Dry run** \`[1, 5, 11, 5]\`: total 22, target 11. After 1: {0,1}. After 5: {0,1,5,6}. After 11: {…, 11} → true (\`[11]\` vs \`[1,5,5]\`). \`[1, 2, 3, 5]\`: total 11 is odd → false
- **Edge cases:** a single element (only true if it is 0); any number greater than target simply never fits (the \`downTo\` range is empty). The DP assumes non-negative numbers — negatives break the array indexing and need an offset or a HashSet of reachable sums
- **Bitset speed-up:** keep the reachable sums as bits and do \`bits = bits or (bits shl x)\` per number (\`java.util.BitSet\` or a LongArray) — same O(n · target) but ~64× fewer operations
- **Pseudo-polynomial:** the cost depends on the VALUE of target, not just n — if the sum can be 10^9 the DP is unusable and meet-in-the-middle over 2^(n/2) subsets is the fallback`,
    complexity: `- Time: O(n · target) where target = sum / 2 — pseudo-polynomial; brute force is O(2ⁿ)
- Space: O(target) for the 1-D boolean array (O(n · target) for the 2-D table it replaces)`,
    followUp: `**Follow-up:** Minimise the difference between the two halves (LC 1049-style)?
> Same DP, then pick the largest reachable s ≤ total / 2; the answer is total - 2s.

**Follow-up:** Count the subsets reaching a target sum, or target sum with +/- signs (LC 494)?
> Replace booleans with counts: ways[s] += ways[s - x], still iterating s downwards; LC 494 reduces to subset sum (total + target) / 2.`,
    redFlags: `- Iterates the sum upwards and silently reuses numbers
- Misses the odd-total shortcut
- Recursion without memoisation (exponential)
- Calls the DP polynomial without noting it depends on the sum's magnitude`,
    answer: `- Reduce to subset sum: an odd total fails, otherwise ask whether some subset reaches \`total / 2\`.
- 1-D boolean DP from \`dp[0] = true\`; for each number iterate the sum DOWNWARDS so each number is used at most once.
- \`O(n · sum)\` time, \`O(sum)\` space — pseudo-polynomial, a 0/1 knapsack.`,
  },
  {
    id: 'ds-85',
    type: 'data-structures',
    num: 85,
    difficulty: 'E',
    star: false,
    section: 'Arrays & Strings',
    title: 'Single Number — find the element that appears once when every other appears twice, using XOR (LC 136, LC 260, LC 338).',
    tags: [ 'bit-manipulation', 'xor', 'arrays' ],
    related: [ 'ds-44', 'ds-2' ],
    keyPoints: `- **Hash map/set answer:** count or toggle membership — O(n) time but O(n) space. The interviewer wants O(1) space
- **XOR facts:** \`x xor x = 0\`, \`x xor 0 = x\`, and XOR is commutative and associative. XOR-ing the whole array cancels every pair regardless of order, leaving the single value
- **Two singles (LC 260):** XOR everything to get \`d = a xor b\` (non-zero because a ≠ b). Any set bit of d is a bit where a and b differ; \`d and -d\` isolates the lowest one. Split the numbers by that bit — each group contains exactly one single plus whole pairs — and XOR each group

\`\`\`kotlin
fun singleNumber(nums: IntArray): Int = nums.fold(0) { acc, x -> acc xor x }

fun singleNumberIII(nums: IntArray): IntArray {
    val d = nums.fold(0) { acc, x -> acc xor x }    // a xor b
    val bit = d and -d                              // lowest bit where a and b differ
    var a = 0
    for (x in nums) if ((x and bit) != 0) a = a xor x
    return intArrayOf(a, d xor a)
}

// LC 338: number of 1-bits for every i in 0..n — DP on the binary representation
fun countBits(n: Int): IntArray {
    val bits = IntArray(n + 1)
    for (i in 1..n) bits[i] = bits[i shr 1] + (i and 1)   // drop the last bit, add it back
    return bits
}
\`\`\`

- **Dry run** \`[4, 1, 2, 1, 2]\` → 4 xor 1 xor 2 xor 1 xor 2 = 4. LC 260 \`[1,2,1,3,2,5]\`: d = 3 xor 5 = 6 (110), lowest bit 2 (010); group with bit set {2, 3, 2} → 3; other → 5
- **\`d and -d\` with Int.MIN_VALUE:** -MIN_VALUE overflows to itself, which still isolates the top bit — the trick holds for every non-zero Int
- **Every other appears THREE times (LC 137):** XOR no longer cancels. Count set bits per position mod 3, or use the \`ones\`/\`twos\` state machine: \`ones = (ones xor x) and twos.inv()\`, \`twos = (twos xor x) and ones.inv()\`
- **Bit toolkit worth saying aloud:** \`x and (x - 1)\` clears the lowest set bit (power of two check, Kernighan popcount), \`Integer.bitCount(x)\` / \`x.countOneBits()\` in Kotlin, \`shr\` vs \`ushr\` for negative numbers (arithmetic vs logical shift)`,
    complexity: `- Time: O(n) — one pass (two for LC 260); countBits is O(n) for n + 1 outputs
- Space: O(1) extra — a single accumulator (the hash-set version is O(n))`,
    followUp: `**Follow-up:** Find the missing number in 0..n (LC 268)?
> XOR all indices 0..n with all values; every present number cancels and the missing one remains — no overflow, unlike the sum formula with Int.

**Follow-up:** Why is countBits a DP?
> bits[i] reuses bits[i / 2], an already-computed smaller subproblem; i and (i - 1) gives a second recurrence: bits[i] = bits[i and (i - 1)] + 1.`,
    redFlags: `- Sorts the array (O(n log n)) or uses a set when O(1) space is asked
- Uses the sum trick 2·sum(set) − sum(array) and ignores overflow
- Cannot explain why XOR order does not matter
- Writes \`x and bit != 0\` without parentheses and cannot say how Kotlin parses it`,
    answer: `- XOR every element: pairs cancel (\`x xor x = 0\`), order does not matter, the single value remains — \`O(n)\` time, \`O(1)\` space.
- Two singles: XOR all to get \`a xor b\`, split the numbers on its lowest set bit (\`d and -d\`), XOR each group.
- Counting bits for 0..n is the DP \`bits[i] = bits[i shr 1] + (i and 1)\`.`,
  },
  {
    id: 'ds-86',
    type: 'data-structures',
    num: 86,
    difficulty: 'H',
    star: true,
    section: 'Trees & Graphs',
    title: 'Binary Tree Maximum Path Sum — best path between any two nodes, negatives allowed (LC 124).',
    tags: [ 'trees', 'dfs', 'recursion', 'tree-dp' ],
    related: [ 'ds-9', 'ds-8', 'ds-36' ],
    keyPoints: `- A path is any chain of parent-child edges, visiting each node at most once; it need not pass through the root. Node values can be negative, so the answer may be a single node
- **Brute force:** treat every node as the top of the path and compute the best downward legs separately: O(n²)
- **Insight — return one thing, record another:** a post-order DFS returns the best DOWNWARD path starting at a node (it can continue upward only through one child). At the same node it records the best path that BENDS there: \`node + leftGain + rightGain\`. Negative gains are clamped to 0 — dropping a leg is always allowed
- This "return a single-branch value, update a global with the two-branch value" shape also solves tree diameter (LC 543) and longest univalue path (LC 687)

\`\`\`kotlin
class TreeNode(var \`val\`: Int, var left: TreeNode? = null, var right: TreeNode? = null)

fun maxPathSum(root: TreeNode?): Int {
    requireNotNull(root) { "path needs at least one node" }
    var best = Int.MIN_VALUE
    fun gain(node: TreeNode?): Int {           // best downward path starting at node, or 0
        if (node == null) return 0
        val left = maxOf(gain(node.left), 0)   // a negative leg is dropped
        val right = maxOf(gain(node.right), 0)
        best = maxOf(best, node.\`val\` + left + right)   // path that bends here
        return node.\`val\` + maxOf(left, right)          // only one side may continue upward
    }
    gain(root)
    return best
}
\`\`\`

- **Dry run** \`[-10, 9, 20, null, null, 15, 7]\`: gain(9) = 9; gain(15) = 15, gain(7) = 7; at 20 best = 20 + 15 + 7 = 42, returns 35; at -10 the bend is -10 + 9 + 35 = 34 < 42. Answer 42
- **Edge cases:** a single negative node \`[-3]\` → -3 (\`best\` must start at \`Int.MIN_VALUE\`, not 0); all negative → the largest single value; values up to ±1000 on 3·10^4 nodes stay well inside Int, but say "Long" if the bounds are unknown
- **Common bug:** returning \`node + left + right\` upward — a parent cannot use both legs, that would fork the path
- **Recursion depth:** a degenerate 10^5-node chain overflows the default stack; convert to an iterative post-order with an explicit stack if depth is unbounded (on Android, a background thread with a larger stack is another fix)`,
    complexity: `- Time: O(n) — every node is visited once in the post-order DFS; the per-node brute force is O(n²)
- Space: O(h) recursion stack — O(log n) for a balanced tree, O(n) for a chain`,
    followUp: `**Follow-up:** Return the path itself, not just the sum.
> Record the node where the best bend happened, along with which children contributed, then walk down each contributing leg following the child with the larger gain.

**Follow-up:** Diameter of a binary tree (LC 543)?
> Same shape with heights instead of sums: return 1 + max(lh, rh), update best with lh + rh; no clamping needed because heights are non-negative.`,
    redFlags: `- Initialises the best to 0 and fails on all-negative trees
- Returns the two-legged value to the parent
- Forgets to clamp negative child gains to 0
- Assumes the path must include the root or a leaf`,
    answer: `- Post-order DFS returns the best downward gain from each node (\`val + max(left, right)\`, with negative legs clamped to 0).
- At every node update a global best with the bending path \`val + left + right\`.
- \`O(n)\` time, \`O(h)\` stack; start the best at \`Int.MIN_VALUE\` for all-negative trees.`,
  },
  ]);
