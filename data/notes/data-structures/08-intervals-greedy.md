# 📆 Intervals & Greedy

*Sort, then one pass: merge overlaps, count resources, pick non-overlapping sets — greedy works when a locally best choice never blocks a better global one.*

## 🔎 Recognize it
<!-- related: ds-39 -->

- Input is `[start, end]` ranges, or per-day/per-item values.
- Ask: merge, schedule, minimum resources, maximum non-overlapping, one-pass profit.
- Reaching for a DP table on intervals? First check whether sort + one pass already solves it.

> 🔑 Be ready to justify **why** greedy is optimal (exchange argument).

## 🧭 Sort by start or by end?
<!-- related: ds-39 -->

| Goal | Sort by | Pass |
|---|---|---|
| Merge overlapping | start | extend last if `cur.start <= last.end` |
| Max non-overlapping / min removals | end | keep if `start >= lastEnd` |
| Min arrows to burst balloons | end | new arrow when `start > arrowPos` |
| Min rooms / platforms | starts and ends separately | sweep, count concurrent |

```kotlin
fun merge(iv: Array<IntArray>): List<IntArray> {
    iv.sortBy { it[0] }
    val out = mutableListOf<IntArray>()
    for (cur in iv) {
        val last = out.lastOrNull()
        if (last != null && cur[0] <= last[1]) last[1] = maxOf(last[1], cur[1])
        else out.add(cur.copyOf())
    }
    return out
}
```

### 🏨 Meeting rooms (sweep line)
- Sort starts and ends; two pointers; start before the next end → room +1, else free one. Or a min-heap of end times.

> 💡 Clarify whether touching intervals (`[1,2]` and `[2,3]`) overlap — it flips `<` vs `<=`.

## 🤑 Greedy reasoning
<!-- related: ds-36 -->

- **Exchange argument** — take any optimal solution; swapping in the greedy choice doesn't make it worse.
- **Stays-ahead** — after each step greedy is at least as good as any other solution.
- **Buy/sell stock, unlimited trades** — sum every positive day-to-day difference.
- **Can place flowers** — plant whenever left, self and right are empty.
- **Rate limiter / logger** — map of message → next allowed time; one check per event.
- Greedy fails when choices interact (0/1 knapsack, coin change with odd denominations) → DP.

> 📝 Practice: [Merge Intervals](https://leetcode.com/problems/merge-intervals) · [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii) · [Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons) · [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii) · [Can Place Flowers](https://leetcode.com/problems/can-place-flowers) · [Logger Rate Limiter](https://leetcode.com/problems/logger-rate-limiter).
