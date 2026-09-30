# 🥞 Stacks, Monotonic Stacks & Heaps

*Stack for match/undo/nearest-so-far, monotonic stack for next-greater and histogram problems, heap for top-k and running order statistics.*

## 🔎 Recognize it
<!-- related: ds-17, ds-24, ds-27 -->

| Phrase in the problem | Structure |
|---|---|
| matching / nesting (brackets, tags), undo | stack |
| next greater/smaller, nearest to the left/right | monotonic stack |
| k-th largest, top k, k closest | heap of size k |
| running median, stream | two heaps |
| window max/min | monotonic deque |

> 🔑 Heap beats sort when k ≪ n: O(n log k) vs O(n log n).

## 📚 Stack patterns
<!-- related: ds-17, ds-18, ds-41, ds-62 -->

- **Valid parentheses** — push openers; on a closer, top must match; stack empty at the end.
- **Min stack** — push `(value, minSoFar)` pairs → O(1) `getMin`.
- **Queue from two stacks** — push to `in`; pop from `out`, refilling from `in` only when `out` is empty → amortized O(1).
- **Stack from queues** — rotate the queue after each push so the newest is in front.

```kotlin
fun isValid(s: String): Boolean {
    val pair = mapOf(')' to '(', ']' to '[', '}' to '{')
    val st = ArrayDeque<Char>()
    for (c in s) {
        if (c !in pair) st.addLast(c)
        else if (st.removeLastOrNull() != pair[c]) return false
    }
    return st.isEmpty()
}
```

## 📉 Monotonic stack
<!-- related: ds-24, ds-33 -->

- Keep indices whose values are monotonic; when a new value breaks the order, the popped element has just found its **next greater/smaller**.
- Every index pushed and popped once → O(n).

```kotlin
fun nextGreater(a: IntArray): IntArray {
    val res = IntArray(a.size) { -1 }
    val st = ArrayDeque<Int>()               // indices, values decreasing
    for (i in a.indices) {
        while (st.isNotEmpty() && a[st.last()] < a[i]) res[st.removeLast()] = a[i]
        st.addLast(i)
    }
    return res
}
```

### 📊 Largest rectangle in histogram
- Increasing stack; when bar i is lower, pop bar h: width = `i - newTop - 1`, area = `h × width`.
- Append a sentinel 0 height to flush the stack.

> 💡 "Visible people in a queue" is the same idea: count pops, plus one if the stack is still non-empty.

## ⛰️ Heaps (priority queues)
<!-- related: ds-27, ds-40, ds-6 -->

| Operation | Binary heap |
|---|---|
| peek | O(1) |
| push / pop | O(log n) |
| build from array | O(n) |

- Array layout: children of i at `2i+1`, `2i+2`; parent `(i-1)/2`.
- **K-th largest** — min-heap of size k; pop when size > k; top is the answer. Quickselect is O(n) average.
- **Running median** — max-heap (low half) + min-heap (high half), sizes differ by ≤ 1.
- **K-sorted array** — min-heap of k+1 → O(n log k).

```kotlin
fun findKthLargest(nums: IntArray, k: Int): Int {
    val pq = java.util.PriorityQueue<Int>()
    for (x in nums) { pq.add(x); if (pq.size > k) pq.poll() }
    return pq.peek()
}
```

> 📝 Practice: [Valid Parentheses](https://leetcode.com/problems/valid-parentheses) · [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array) · [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram) · [Number of Visible People in a Queue](https://leetcode.com/problems/number-of-visible-people-in-a-queue) · [Implement Stack using Queues](https://leetcode.com/problems/implement-stack-using-queues) · Find Median from Data Stream.
