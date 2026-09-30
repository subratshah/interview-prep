# 🔤 Strings, Math & Bits

*Digit-by-digit arithmetic, overflow guards, fast power and XOR tricks — encoding logic rather than a search over a structure.*

## 🔎 Recognize it
<!-- related: ds-44 -->

- Input is a number processed digit by digit (reverse, palindrome number, atoi).
- Bit phrases: "without + or −", "single element", "count set bits", "power of two".
- String transform (parse, reverse, compress, interleave) with no window or traversal order to manage.

> 🔑 State your substring convention (`[start, end)` vs inclusive) once and stick to it.

## 🔢 Digit math and overflow

- Extract: `d = x % 10; x /= 10`. Build: `r = r * 10 + d`.
- Guard **before** multiplying: `if (r > (Int.MAX_VALUE - d) / 10) overflow`.
- Negative modulo in Kotlin keeps the sign (`-7 % 10 == -7`).
- Palindrome number without strings: reverse only half, stop when `rev >= x`.

```kotlin
fun reverse(x0: Int): Int {
    var x = x0; var r = 0
    while (x != 0) {
        val d = x % 10; x /= 10
        if (r > Int.MAX_VALUE / 10 || r < Int.MIN_VALUE / 10) return 0
        r = r * 10 + d
    }
    return r
}
```

### ⚡ Fast power
- `x^n` by squaring → O(log n); negative n → `1 / x^(-n)` (use `Long` for `-Int.MIN_VALUE`).

```kotlin
fun myPow(x: Double, n: Int): Double {
    var b = if (n < 0) 1 / x else x; var e = kotlin.math.abs(n.toLong()); var r = 1.0
    while (e > 0) { if (e and 1L == 1L) r *= b; b *= b; e = e shr 1 }
    return r
}
```

## 🧮 Bit manipulation
<!-- related: ds-44 -->

| Trick | Expression |
|---|---|
| Test bit i | `(x shr i) and 1` |
| Set / clear bit i | `x or (1 shl i)` / `x and (1 shl i).inv()` |
| Drop lowest set bit | `x and (x - 1)` |
| Isolate lowest set bit | `x and -x` |
| Power of two | `x > 0 && x and (x - 1) == 0` |
| Gray code | `i xor (i shr 1)` |

- **XOR** — `a xor a = 0`, `a xor 0 = a` → single number among pairs.
- **Count bits** — loop `x and (x-1)` (Kernighan) or DP `bits[i] = bits[i shr 1] + (i and 1)`.
- **Subsets as masks** — iterate `0 until (1 shl n)` for n ≤ 20.
- Use `ushr` for logical right shift on negatives.

## 🧵 String handling

- Strings are immutable → build with `StringBuilder` / `buildString`; `+=` in a loop is O(n²).
- **Longest common prefix** — shrink a candidate against each string, or compare column by column.
- **Merge alternately** — one index to `max(len)`, append when in range.
- Palindrome checks: two pointers; expand-around-centre for longest palindromic substring (O(n²)).

> 📝 Practice: [Palindrome Number](https://leetcode.com/problems/palindrome-number) · [Reverse Integer](https://leetcode.com/problems/reverse-integer) · [Pow(x, n)](https://leetcode.com/problems/powx-n) · [Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix) · [Merge Strings Alternately](https://leetcode.com/problems/merge-strings-alternately) · Single Number · Counting Bits.
