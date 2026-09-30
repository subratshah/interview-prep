# 🔢 Arrays & Hashing

*Kill the nested loop with O(1) lookups: hash maps for membership and frequency, prefix sums for range queries, in-place tricks for O(1) space.*

## 🔎 Recognize it
<!-- related: ds-1, ds-2 -->

- No order/adjacency constraint on the answer — "does X exist / how often / which is missing".
- Brute force is an obvious nested loop; an O(1) lookup removes the inner loop.
- Given an array or string, but the question is about **membership or frequency**, not position.

> 🔑 Watch for O(n²) hiding in "find a pair / triplet" — one pass with a map usually fixes it.

### 📊 Array operation costs

| Operation | Static array | Dynamic array |
|---|---|---|
| Access by index | O(1) | O(1) |
| Search unsorted | O(n) | O(n) |
| Insert / delete middle | O(n) | O(n) |
| Append | n/a | O(1) amortized |

## 🗝️ Hash map and set patterns
<!-- related: ds-2, ds-61 -->

### 🧰 Templates
- **Complement lookup** — store `value → index`; check `target - x` before inserting x.
- **Frequency count** — `IntArray(26)` for lowercase letters beats a map.
- **Canonical key** — sorted string or count signature groups anagrams.
- **Set vs map** — a set when you only need "seen?"; a map when you need a count or index.

```kotlin
fun twoSum(nums: IntArray, target: Int): IntArray {
    val seen = HashMap<Int, Int>()
    for ((i, x) in nums.withIndex()) {
        seen[target - x]?.let { return intArrayOf(it, i) }
        seen[x] = i
    }
    return intArrayOf()
}
```

### 🔗 Longest consecutive sequence
- Put everything in a set; start counting only from x where `x - 1` is absent → O(n).

> 📝 Practice: [Two Sum](https://leetcode.com/problems/two-sum) · [Valid Anagram](https://leetcode.com/problems/valid-anagram) · Group Anagrams · [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence).

## ➕ Prefix sums and in-place tricks
<!-- related: ds-68, ds-36 -->

### 📐 Prefix sums
- `pre[i+1] = pre[i] + a[i]`; range sum `[l, r]` = `pre[r+1] - pre[l]` in O(1).
- **Subarray sum = k** → map of prefix-sum counts: add `count[pre - k]` at each step.
- Prefix and suffix products give "product except self" without division.

### 🔄 In place
- **Rotate by k** — reverse all, reverse first k, reverse the rest (`k %= n` first).
- **Majority element** — Boyer–Moore voting: candidate + counter, O(1) space.
- **Kadane** — `cur = max(x, cur + x)`; `best = max(best, cur)`.

> 💡 Offer the O(1)-extra-space version — it's the usual follow-up.

> 📝 Practice: [Rotate Array](https://leetcode.com/problems/rotate-array) · [Majority Element](https://leetcode.com/problems/majority-element) · Subarray Sum Equals K · Product of Array Except Self.

## 🏗️ How a hash table works
<!-- related: ds-10, ds-31, ds-51 -->

### ⚙️ Internals
- Bucket array; index = `hash(key) and (capacity - 1)` with power-of-two capacity.
- **Separate chaining** — each bucket is a list (the JVM HashMap treeifies long chains).
- **Open addressing** — probe linearly or quadratically; deletion needs tombstones; clusters form.
- **Load factor** (~0.75) → double and rehash; amortized O(1), worst case O(n).
- Keys need consistent `equals` + `hashCode`; mutating a key after insert loses it.

### 🛠️ Build one from arrays

```kotlin
class MyHashMap(private var cap: Int = 16) {
    private var buckets = Array(cap) { mutableListOf<Pair<Int, Int>>() }
    private var size = 0
    private fun idx(k: Int, c: Int = cap) = (k.hashCode() and Int.MAX_VALUE) % c

    fun put(k: Int, v: Int) {
        val b = buckets[idx(k)]
        val i = b.indexOfFirst { it.first == k }
        if (i >= 0) b[i] = k to v
        else { b.add(k to v); if (++size > cap * 3 / 4) resize() }
    }
    fun get(k: Int): Int = buckets[idx(k)].firstOrNull { it.first == k }?.second ?: -1
    fun remove(k: Int) { if (buckets[idx(k)].removeIf { it.first == k }) size-- }

    private fun resize() {
        val nc = cap * 2
        val nb = Array(nc) { mutableListOf<Pair<Int, Int>>() }
        buckets.forEach { b -> b.forEach { nb[idx(it.first, nc)].add(it) } }
        buckets = nb; cap = nc
    }
}
```

> 🔑 Be able to write this in ~15 minutes: bucket array, chaining, resize.
