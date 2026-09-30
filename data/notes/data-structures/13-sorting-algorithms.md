# 🗂️ Sorting Algorithms

*Know one O(n log n) sort cold — quicksort and merge sort — and when stability, worst case, or input shape picks a different one.*

## 📊 Comparison
<!-- related: ds-15 -->

| Sort | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Quicksort | n log n | n log n | n² | log n | no |
| Merge sort | n log n | n log n | n log n | n | yes |
| Heapsort | n log n | n log n | n log n | 1 | no |
| Insertion | n | n² | n² | 1 | yes |
| Counting / radix | n + k | n + k | n + k | n + k | yes |
| Bubble | n | n² | n² | 1 | yes |

> 🔑 Comparison sorts can't beat Ω(n log n); counting/radix escape it by not comparing. Overview: [Sorting Algorithms](https://www.geeksforgeeks.org/dsa/sorting-algorithms/).

## ⚡ Quicksort
<!-- related: ds-15, ds-27 -->

- Pick pivot, partition (< pivot left, > right), recurse on both sides.
- Worst case O(n²) on sorted input with a first/last pivot → randomize the pivot.
- Many duplicates → three-way partition (Dutch flag).
- **Quickselect** — recurse into one side only → k-th element in O(n) average.

```kotlin
fun quickSort(a: IntArray, lo: Int = 0, hi: Int = a.size - 1) {
    if (lo >= hi) return
    val p = a[(lo..hi).random()]
    var i = lo; var j = hi
    while (i <= j) {
        while (a[i] < p) i++
        while (a[j] > p) j--
        if (i <= j) { val t = a[i]; a[i] = a[j]; a[j] = t; i++; j-- }
    }
    quickSort(a, lo, j); quickSort(a, i, hi)
}
```

## 🔀 Merge sort
<!-- related: ds-67 -->

- Split in half, sort each, merge two sorted halves.
- Guaranteed O(n log n), stable, natural for **linked lists** (O(1) extra space) and external sorting.
- Merge step counts inversions: when taking from the right, add remaining-left count.

| Prefer merge sort when | Prefer quicksort when |
|---|---|
| stability matters | in-memory arrays, cache locality |
| worst case must be bounded | memory is tight |
| linked list or external data | average speed matters most |

## 🧷 Special inputs and comparators
<!-- related: ds-40, ds-45 -->

- **Nearly sorted** — insertion sort O(n·k), or min-heap of k+1 → O(n log k).
- **Bounded integer range** — counting sort; fixed-width keys → radix sort.
- **Custom order** — map each char to its rank, compare with `compareBy` / `Comparator`.
- Kotlin: `sortWith(compareBy({ it.a }, { -it.b }))`; `sortedBy` returns a new list, `sortBy` sorts in place.
- JVM: primitives use dual-pivot quicksort, objects use TimSort (stable).

> 📝 Practice: Sort an Array (implement both) · Sort Colors · Kth Largest Element · Count Inversions · Sort a Nearly Sorted Array · Custom Sort String.
