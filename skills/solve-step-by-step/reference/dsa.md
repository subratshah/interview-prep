# DSA / coding questions

Produce these steps in this order, each as its own labelled step.

1. **Restate**: the problem in one or two lines; inputs, outputs, constraints.
2. **Clarify**: 2 to 4 questions an interviewer expects (size, sortedness, duplicates, negatives, empty input, **ties and boundaries**, memory, threading). Give the assumption taken for each. Pin every tie or boundary rule here (for example "a departure at the same minute as an arrival frees the platform"). Steps 3, 6 and 8 reuse that exact rule.
3. **Examples**: one normal case, one edge case (empty, single, duplicates, ties, overflow, null), each with its expected output.
4. **Brute force**: the obvious solution with time and space, and why it falls short at the stated size.
5. **Insight**: the observation or structure that removes the bottleneck. Name the pattern: two pointers, sliding window, hash map, prefix sums, monotonic stack, heap, binary search on the answer, BFS/DFS, DP, greedy with an exchange argument, union-find, trie.
6. **Optimised approach**: numbered algorithm steps in plain language. For a small case add a dry-run trace table of the state per step, built with the same comparison operators the code uses. For DP also give the state, the recurrence, the base cases and the fill order. For greedy give the one-line proof idea.
7. **Complexity and edge cases**: time and space of the final approach, counting sorts and copies, compared with the brute force. Then the edge cases the code must handle, the common candidate mistakes, and a one-line "say it aloud" summary. Finish with the two likeliest follow-ups, each with a one-line answer (for example "what if the input is a stream", "what if it does not fit in memory", "how would you make it thread-safe").
8. **Kotlin solution**: the last section. One complete, runnable block, plus one line stating how it was verified (see the verification rules in `SKILL.md`).

## Pattern prompts (use to find the insight)

- Sorted or sortable input: two pointers, binary search, merge intervals, sweep over events.
- "Subarray or substring with a property": sliding window or prefix sums with a hash map.
- "Next greater or smaller": monotonic stack. "Top k or k-th": heap or quickselect.
- "Count ways, min cost, can you reach": DP; first write the brute-force recursion, then memoise.
- "Shortest path, levels, connected components": BFS, union-find, Dijkstra when weights differ.
- "All combinations or permutations": backtracking with pruning.

## Verification specifics

- Always compare against the step-4 brute force on random small inputs, including duplicates and ties.
- Include `require(...)` for any precondition the algorithm needs, or state it in step 2.
- Check that the loop's pointer arithmetic cannot run past the arrays; give the argument in step 7 if it is not obvious.
