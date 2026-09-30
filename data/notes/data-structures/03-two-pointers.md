# ↔️ Two Pointers

*Two indices walking a sorted array or string — from both ends to converge on a pair, or slow/fast to compact in place.*

## 🔎 Recognize it
<!-- related: ds-54 -->

- Answer is a **pair or small fixed group** ("two numbers that…", 3Sum, area between two indices).
- Input is sorted, or sorting doesn't destroy the answer.
- Not a variable-size contiguous run — that's sliding window.

> 🔑 Move the pointer that **can't** improve the result.

## 🧭 Variants
<!-- related: ds-54, ds-35 -->

| Variant | Pointers | Use for |
|---|---|---|
| Opposite ends | `l = 0`, `r = n-1`, converge | pair sum on sorted, palindromes, container area |
| Read / write | `w` writes, `r` reads | remove element, dedupe in place |
| Fast / slow speed | 1 and 2 steps | cycle detection, middle node |
| Two inputs | one per array | merge sorted arrays |
| Three-way partition | `lo`, `mid`, `hi` | sort 0/1/2 (Dutch flag) |

```kotlin
fun removeDuplicates(a: IntArray): Int {
    if (a.isEmpty()) return 0
    var w = 1
    for (r in 1 until a.size) if (a[r] != a[w - 1]) a[w++] = a[r]
    return w
}
```

> 💡 Merge sorted arrays in place by filling from the **back**, so nothing unread is overwritten.

## 🎯 Classic reasoning
<!-- related: ds-29 -->

### 🔺 3Sum
- Sort; fix `i`; two-pointer the rest for `-a[i]`; skip duplicates at `i`, `l`, `r` → O(n²).

### 🪣 Container with most water
- Area = `min(h[l], h[r]) × (r - l)`; move the shorter side — moving the taller only loses width with no height gain.

### 🌧️ Trapping rain water
- Water at i = `min(maxLeft, maxRight) - h[i]`.
- Process the side with the smaller running max — that max is the binding bound → O(n) time, O(1) space.

```kotlin
fun trap(h: IntArray): Int {
    var l = 0; var r = h.size - 1; var lm = 0; var rm = 0; var w = 0
    while (l < r) {
        if (h[l] < h[r]) { lm = maxOf(lm, h[l]); w += lm - h[l]; l++ }
        else { rm = maxOf(rm, h[r]); w += rm - h[r]; r-- }
    }
    return w
}
```

> 📝 Practice: [3Sum](https://leetcode.com/problems/3sum) · [Container With Most Water](https://leetcode.com/problems/container-with-most-water) · [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water) · [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array) · [Remove Element](https://leetcode.com/problems/remove-element).
