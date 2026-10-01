# Worked example: Minimum Number of Platforms (DSA shape)

Question: given arrival and departure times of trains, find the minimum number of platforms so no train waits.
Example: arrival `[900, 940, 950, 1100, 1500, 1800]`, departure `[910, 1200, 1120, 1130, 1900, 2000]` gives 3.

1. **Restate**: n trains, `arrival[i] < departure[i]`, times as HHMM integers. Return the maximum number of trains present at once.
2. **Clarify** (and assume):
   - Departure at the same minute as another arrival: the platform is reused. If the answer is no, change `<` to `<=` in the arrival test.
   - Inputs are unsorted and not paired after sorting.
   - Every stay has positive length (`arrival < departure`). Zero-length stays would need a different tie rule.
   - Times stay within one day. An empty input returns 0.
3. **Examples**: the example above gives 3. `[]` gives 0. `[900]/[910]` gives 1. `[900, 910]/[910, 920]` gives 1 (platform reused). `[900, 900]/[910, 910]` gives 2.
4. **Brute force**: for each train count the trains whose interval covers its arrival. O(n²) time, O(1) space. Too slow around n = 10⁵.
5. **Insight** (sweep line, two pointers): the count only changes at an arrival (+1) or a departure (−1), and which departure belongs to which arrival does not matter. Sort the two arrays independently and merge them in time order.
6. **Optimised approach**:
   1. Sort `arrival` and `departure` separately.
   2. Set `i = 0`, `j = 0`, `current = 0`, `best = 0`.
   3. While `i < n`: if `arr[i] < dep[j]`, a train arrives before the earliest remaining departure, so `current++`, `i++`, `best = max(best, current)`. Otherwise a train leaves first: `current--`, `j++`.
   4. Return `best`.

   Trace on the sorted example (arr `900 940 950 1100 1500 1800`, dep `910 1120 1130 1200 1900 2000`):

   | arr[i] | dep[j] | action | current | best |
   |---|---|---|---|---|
   | 900 | 910 | arrive | 1 | 1 |
   | 940 | 910 | depart | 0 | 1 |
   | 940 | 1120 | arrive | 1 | 1 |
   | 950 | 1120 | arrive | 2 | 2 |
   | 1100 | 1120 | arrive | 3 | 3 |
   | 1500 | 1120 | depart | 2 | 3 |
   | 1500 | 1130 | depart | 1 | 3 |
   | 1500 | 1200 | depart | 0 | 3 |
   | 1500 | 1900 | arrive | 1 | 3 |
   | 1800 | 1900 | arrive | 2 | 3 |
7. **Complexity and edge cases**: O(n log n) for the sorts plus an O(n) sweep; O(n) extra space because `sorted()` copies (O(1) if sorted in place). Beats the O(n²) baseline. Each pointer only moves forward, so the loop is O(n), not O(n²). `j` cannot overrun: a departure is consumed only when `dep[j] <= arr[i]`, and that implies train j's arrival came earlier, so `j < i < n`. Pitfalls: using `<=` for the arrival test when the rule is "reuse"; sorting arrival/departure pairs together; allowing zero-length stays without changing the tie rule. Say it aloud: "Sort both arrays, then sweep with two pointers adding on arrival and removing on departure; the peak is the answer, in n log n." Follow-ups: streaming input (a min-heap of departure times, O(n log n)); also return which platform each train gets (heap of free platform ids).
8. **Kotlin solution**:

```kotlin
/** Minimum platforms so no train waits. O(n log n) time, O(n) space (copies from sorted()). */
fun minPlatforms(arrival: IntArray, departure: IntArray): Int {
    require(arrival.size == departure.size) { "arrival and departure sizes differ" }
    require(arrival.indices.all { arrival[it] < departure[it] }) { "every stay needs arrival < departure" }
    val arr = arrival.sorted()
    val dep = departure.sorted()
    var i = 0
    var j = 0
    var current = 0
    var best = 0
    while (i < arr.size) {
        // step 6.3: strict '<' means a departure at the same time as an arrival frees its platform first
        if (arr[i] < dep[j]) {
            current++
            i++
            best = maxOf(best, current)
        } else {
            current--
            j++
        }
    }
    return best
}

fun main() {
    check(minPlatforms(intArrayOf(900, 940, 950, 1100, 1500, 1800), intArrayOf(910, 1200, 1120, 1130, 1900, 2000)) == 3)
    check(minPlatforms(intArrayOf(), intArrayOf()) == 0)
    check(minPlatforms(intArrayOf(900), intArrayOf(910)) == 1)
    check(minPlatforms(intArrayOf(900, 910), intArrayOf(910, 920)) == 1)
    check(minPlatforms(intArrayOf(900, 900), intArrayOf(910, 910)) == 2)
    println("all ok")
}
```

Verification line: algorithm mirrored in Node and checked against the O(n²) brute force on 20,000 random inputs plus the five examples; Kotlin not compiled (no `kotlinc` on this machine).
