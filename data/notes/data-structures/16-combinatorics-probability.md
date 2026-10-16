# 🎲 Combinatorics & probability for coding rounds

*Counting problems come up more at Google than elsewhere: count without enumerating, recognise n-choose-k in disguise, and sample uniformly.*

## 🔢 Counting toolkit
<!-- related: ds-78, ds-77, ds-79 -->

| Need | Formula | Example |
|---|---|---|
| Orderings of n distinct items | n! | permutations of an array |
| Ordered pick of k from n | n! / (n−k)! | 3 podium places from 10 |
| Unordered pick of k from n | C(n, k) = n! / (k!(n−k)!) | choose a committee |
| With repetition, order matters | nᵏ | PIN codes |
| With repetition, order ignored | C(n+k−1, k) | donuts from n flavours |
| Subsets of an n-set | 2ⁿ | power set |
| Arrangements with duplicates | n! / (c₁! c₂! …) | anagrams of "BANANA" |

- **Rule of product**: independent choices multiply. **Rule of sum**: mutually exclusive cases add.
- **Complement**: count the total and subtract the bad cases (at least one → all minus none).
- **Inclusion–exclusion**: |A ∪ B| = |A| + |B| − |A ∩ B|; extend with alternating signs.

> 🔑 Ask: does order matter, and can items repeat? Those two answers pick the formula.

## 🧮 Computing C(n, k) without overflow

- Never compute factorials: 21! overflows `Long`. Multiply and divide incrementally, keeping the intermediate an exact integer:

```kotlin
fun choose(n: Int, k0: Int): Long {
    val k = minOf(k0, n - k0)
    var r = 1L
    for (i in 1..k) r = r * (n - k + i) / i   // r stays C(n-k+i, i)
    return r
}
```

- Many answers are asked **modulo 10⁹+7**: build Pascal's triangle with `C[i][j] = C[i-1][j-1] + C[i-1][j]`, or precompute factorials and inverse factorials (Fermat: `a^(p-2) mod p`) for O(1) queries after O(n) setup.
- Pascal's triangle **is** the DP: it counts lattice paths — unique paths in an m×n grid = C(m+n−2, m−1).

```kotlin
fun uniquePaths(m: Int, n: Int): Long = choose(m + n - 2, m - 1)
```

## 🌱 Counting with DP and recursion

- **Count, don't list**: if the question asks "how many", a DP over (index, state) beats generating every arrangement (compare climbing stairs: Fibonacci, not enumeration).
- **Backtracking enumerates** when you must output the objects; the count equals the number of leaves — use it to predict runtime (subsets 2ⁿ, permutations n!).
- Catalan numbers C(2n, n) / (n + 1) count balanced parentheses, binary-tree shapes and non-crossing pairings — recognise them by the "split into left and right" recurrence.
- Derangements, Stirling and partition numbers appear rarely; know they exist and derive by recurrence if asked.

## 🎯 Probability basics

- **Expected value** is linear even for dependent events: E[X+Y] = E[X] + E[Y]. Break a hard count into indicator variables and add their probabilities.
- **Conditional probability**: P(A|B) = P(A ∩ B) / P(B); **Bayes**: P(A|B) = P(B|A) P(A) / P(B).
- Independent events multiply; "at least one" is 1 − P(none).
- Geometric waiting time: with success probability p, expected trials = 1/p.

## 🔀 Random sampling patterns

| Task | Method | Cost |
|---|---|---|
| Shuffle an array uniformly | **Fisher–Yates**: for i from n−1 down, swap with random j in [0, i] | O(n), unbiased |
| Pick k of n | partial Fisher–Yates, or select with probability (k left)/(n left) | O(k) extra |
| Pick 1 from a stream of unknown length | **Reservoir**: replace the kept item with item i with probability 1/i | O(1) space |
| Pick k from a stream | reservoir of size k, replace a random slot with probability k/i | O(k) space |
| Weighted pick | prefix sums + binary search on a random number in [0, total) | O(log n) |

```kotlin
fun <T> reservoir(stream: Sequence<T>): T? {
    var pick: T? = null
    var i = 0
    for (x in stream) { i++; if (kotlin.random.Random.nextInt(i) == 0) pick = x }
    return pick
}
```

- Proof sketch: item i is kept with probability (1/i)·∏(1 − 1/j) for j > i = 1/n — uniform.
- **Rejection sampling**: to get uniform 1..7 from `rand5()`, build `5·(rand5()−1) + rand5()` (uniform 1..25), reject > 21, return `x % 7 + 1`.
- Sketches and approximate counting (Bloom filters, HyperLogLog, count-min) trade accuracy for space and rely on this same probability.

> 🚩 `Random.nextInt(n)` in a loop with `%` on a biased source, or shuffling by swapping with `random(0, n)` every time, produces a **biased** distribution.

> 📝 Practice: how many distinct arrangements of "MISSISSIPPI"? (11! / (4!·4!·2!) = 34 650.)
