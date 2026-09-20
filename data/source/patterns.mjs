/**
 * AlgoLadder — pattern library.
 *
 * Every problem in the roadmap is tagged with one `pattern` key. The hints,
 * approach write-up and default complexity shown on a problem page come from
 * the entry below.
 *
 * This is deliberately *pattern-level* teaching material, written from scratch
 * for AlgoLadder. It is not a per-problem editorial and it is not copied from
 * any course, sheet or site. The point is to nudge you toward the right shape
 * of solution without handing you the answer — and to let you replace or
 * extend any of it from the admin panel.
 *
 * Shape: key -> { name, family, hints: [3 strings], approach, tc, sc }
 */

export const PATTERNS = {
  // ---------------------------------------------------------------- basics
  'brute-force': {
    name: 'Exhaustive enumeration',
    family: 'Foundations',
    hints: [
      'Start by writing down, in words, every candidate answer you would check by hand.',
      'Turn that description into nested loops. Do not optimise yet — get a correct baseline first.',
      'Once it works, ask which of the loops is re-computing something you already knew.',
    ],
    approach:
      'Enumerate every candidate and test each one against the condition in the statement. This is almost never the intended solution, but it is the solution you should be able to write in under two minutes, because it defines what "correct" means. Keep it around as a reference implementation: a brute force you trust lets you stress-test a clever solution on random inputs and find the case where the clever one is wrong.',
    tc: 'O(n^2)',
    sc: 'O(1)',
  },
  hashing: {
    name: 'Hash map / hash set lookup',
    family: 'Foundations',
    hints: [
      'You are repeatedly asking "have I seen this value before?" — that question costs O(1) with a hash set.',
      'Decide what the key is and what the value is before you write any code. Usually the key is the thing you search by.',
      'Try to finish in a single pass: insert as you go, and query the structure for the partner you need right now.',
    ],
    approach:
      'Replace a scan-for-a-match with a constant-time lookup. Walk the input once; at each element, ask the map whether the complement or companion you need has already been recorded, and if not, record the current element. The single-pass version works because any valid pair has a later element, and that later element will find the earlier one already in the map. Watch out for duplicate keys — decide up front whether the map stores the first index, the last index, or a count.',
    tc: 'O(n)',
    sc: 'O(n)',
  },
  counting: {
    name: 'Frequency counting',
    family: 'Foundations',
    hints: [
      'Build a tally of how often each value appears before you try to answer anything.',
      'If the value range is small and fixed (lowercase letters, digits, 0..n), a fixed-size array beats a hash map.',
      'Many questions reduce to a property of the tally, not of the original order.',
    ],
    approach:
      'Collapse the input into a frequency table, then reason about the table instead of the sequence. Counting throws away order, which is exactly what you want when the question is about multiset equality, majority, parity or "can these be rearranged into". When the alphabet is bounded, use an array indexed by the value — it is faster and it makes the space bound explicit.',
    tc: 'O(n)',
    sc: 'O(k)',
  },
  'math-number-theory': {
    name: 'Number theory and arithmetic',
    family: 'Foundations',
    hints: [
      'Write out the first six or seven cases by hand. The pattern is usually visible before the proof is.',
      'Ask whether you can work with digits, divisors or remainders instead of the number itself.',
      'Guard against overflow: decide whether an intermediate product can exceed a 32-bit range.',
    ],
    approach:
      'Use arithmetic structure — divisibility, remainders, digit decomposition, prime factorisation — to avoid iterating over the whole range. Trial division only needs to run to the square root, because divisors come in pairs that straddle it. Sieves pay a one-off cost to answer many queries cheaply. Whenever you multiply two values that are each near the input bound, reach for a 64-bit type before you need it.',
    tc: 'O(sqrt(n))',
    sc: 'O(1)',
  },
  combinatorics: {
    name: 'Counting arguments',
    family: 'Foundations',
    hints: [
      'Count the objects, do not build them — the answer is usually a formula, not a loop over results.',
      'Decide whether order matters and whether repetition is allowed. Those two answers pick the formula.',
      'If direct counting is awkward, count the complement and subtract from the total.',
    ],
    approach:
      'Turn the question into a product or sum of independent choices. Build factorials and modular inverses once if you need many binomial coefficients. Inclusion–exclusion handles overlapping constraints: add the pieces, subtract the double-counted pairs, add back the triples. Always sanity-check a formula against a brute force on tiny inputs before trusting it.',
    tc: 'O(n)',
    sc: 'O(n)',
  },
  simulation: {
    name: 'Direct simulation',
    family: 'Foundations',
    hints: [
      'Model the state precisely — what exactly changes on each step?',
      'Write the transition for one step, then trust the loop to repeat it.',
      'Look for a cycle: if the state repeats, you can skip ahead instead of simulating every step.',
    ],
    approach:
      'Some problems really do want you to follow the rules literally. The craft is in choosing a state representation compact enough to advance cheaply, and in spotting when the process becomes periodic — once a state repeats, the whole future repeats, so you can take the remaining step count modulo the cycle length instead of looping billions of times.',
    tc: 'O(n)',
    sc: 'O(1)',
  },

  // ----------------------------------------------------------------- arrays
  'two-pointers': {
    name: 'Two pointers',
    family: 'Arrays & strings',
    hints: [
      'Place one index at each end, or both at the start moving at different speeds.',
      'Sorting first often makes the movement rule obvious — moving one pointer must strictly improve the candidate.',
      'The invariant matters: state in one sentence what is true about everything outside the pointers.',
    ],
    approach:
      'Maintain two indices and move exactly one of them per step, choosing which based on a comparison. This converts a quadratic double loop into a linear sweep, and it is valid whenever moving a pointer can only make the situation worse in one direction and better in the other — usually guaranteed by sortedness. Write down the invariant first ("everything left of `lo` is already placed correctly") and the loop body tends to write itself.',
    tc: 'O(n)',
    sc: 'O(1)',
  },
  'sliding-window': {
    name: 'Sliding window',
    family: 'Arrays & strings',
    hints: [
      'Ask whether the property you need is monotone: does extending the window ever make an invalid window valid again?',
      'Expand the right edge greedily; shrink from the left only while the window is invalid.',
      'Keep a running summary (sum, counts, distinct count) so each move is O(1) rather than a rescan.',
    ],
    approach:
      'Keep a contiguous range `[l, r]` and a cheap summary of it. Push `r` forward one element at a time, updating the summary in constant time. Whenever the window violates the constraint, advance `l` — also updating the summary — until it is valid again. Every index enters and leaves the window at most once, so the whole scan is linear despite the nested-looking loops. Fixed-size windows are the easy case; variable-size ones need the shrink condition stated carefully.',
    tc: 'O(n)',
    sc: 'O(k)',
  },
  'prefix-sum': {
    name: 'Prefix sums and difference arrays',
    family: 'Arrays & strings',
    hints: [
      'Precompute cumulative totals so any range sum becomes one subtraction.',
      'For "subarray with property X", store prefix values in a map and look for the partner prefix.',
      'For many range updates and one final read, update only the two endpoints and sweep once at the end.',
    ],
    approach:
      'Build `pre[i] = a[0] + ... + a[i-1]`, after which the sum over `[l, r]` is `pre[r+1] - pre[l]`. That identity converts "find a subarray summing to k" into "find two prefixes differing by k", which a hash map answers in one pass. The mirror image is the difference array: to add a value across a range many times, record `+v` at the start and `-v` just past the end, then take a running sum once at the very end.',
    tc: 'O(n)',
    sc: 'O(n)',
  },
  kadane: {
    name: "Kadane's running-best scan",
    family: 'Arrays & strings',
    hints: [
      'At each index ask one question: is it better to extend the previous run, or to start fresh here?',
      'Track the best answer seen so far separately from the best answer ending here.',
      'Handle the all-negative case explicitly — starting from zero quietly gives the wrong answer.',
    ],
    approach:
      'Carry a single number: the best value of a subarray that ends exactly at the current index. Extending is worth it only when the previous running value helps, so the update is "previous + current, or current alone, whichever is larger". A separate variable remembers the best seen anywhere. This is dynamic programming compressed to O(1) space, and the same shape solves maximum product and circular variants with small twists.',
    tc: 'O(n)',
    sc: 'O(1)',
  },
  'moore-voting': {
    name: "Boyer–Moore majority vote",
    family: 'Arrays & strings',
    hints: [
      'Pair up unequal elements and throw both away — a strict majority survives any such pairing.',
      'Track one candidate and one counter; reset the candidate when the counter hits zero.',
      'Always verify the survivor with a second pass unless the problem guarantees a majority exists.',
    ],
    approach:
      'Keep a candidate and a count. Matching elements increment the count, differing ones decrement it, and a count of zero means the candidate is replaced. Intuitively every decrement cancels one majority element against one non-majority element, and an element with more than n/2 copies cannot be fully cancelled. Generalising to "more than n/k times" needs k-1 candidates and the same cancellation rule.',
    tc: 'O(n)',
    sc: 'O(1)',
  },
  'dutch-flag': {
    name: 'Three-way partitioning',
    family: 'Arrays & strings',
    hints: [
      'Maintain three regions and one scanning index, so the array is split into low / mid / unknown / high.',
      'Only advance the scanner when you place something into the low or mid region.',
      'After a swap with the high region, re-examine the element you just received.',
    ],
    approach:
      'Keep boundaries `low`, `mid` and `high`. Everything before `low` is a small value, everything in `[low, mid)` is a middle value, everything after `high` is a large value, and `[mid, high]` is unclassified. Inspect `a[mid]`: a small value swaps to `low` and advances both, a middle value just advances `mid`, and a large value swaps to `high` and advances `high` backwards *without* moving `mid`, because the swapped-in element has not been looked at yet.',
    tc: 'O(n)',
    sc: 'O(1)',
  },
  'cyclic-sort': {
    name: 'Cyclic sort / index-as-hash',
    family: 'Arrays & strings',
    hints: [
      'The values are a permutation of a known range, so every value has a natural home index.',
      'Either swap each value home, or mark its home slot by negating or offsetting it.',
      'Whatever is out of place at the end is your missing, duplicate or extra element.',
    ],
    approach:
      'When the array holds values from 1..n, the array itself can act as the hash table. Either repeatedly swap `a[i]` to position `a[i]-1` until each slot holds its own value, or walk the array and flip the sign of `a[abs(a[i])-1]` to mark "this value was seen". Both give O(1) extra space. Restore the array afterwards if the caller still needs it.',
    tc: 'O(n)',
    sc: 'O(1)',
  },
  'matrix-manipulation': {
    name: 'Matrix traversal and in-place transforms',
    family: 'Arrays & strings',
    hints: [
      'Draw a 4x4 grid on paper and index the cells — off-by-one errors here are almost never visible in your head.',
      'A rotation is usually a transpose followed by a row or column reversal.',
      'For spiral order, track four shrinking boundaries rather than a direction vector.',
    ],
    approach:
      'Grid problems are mostly about disciplined bookkeeping. In-place rotation decomposes into two simple passes: reflect across a diagonal, then reverse each row. Spiral traversal keeps `top`, `bottom`, `left`, `right` and moves one of them inward after each edge is consumed, with a guard before the reverse passes so a single remaining row or column is not emitted twice. Marking rows and columns for zeroing is best done in the matrix\'s own first row and column to stay in O(1) space.',
    tc: 'O(n*m)',
    sc: 'O(1)',
  },
  intervals: {
    name: 'Interval sorting and merging',
    family: 'Arrays & strings',
    hints: [
      'Sort by start time when merging; sort by end time when you want to keep as many as possible.',
      'Two intervals overlap exactly when one starts before the other ends.',
      'Carry a single "current" interval and either extend it or flush it.',
    ],
    approach:
      'Sorting is what makes interval problems easy: once starts are ordered, you only ever have to compare the incoming interval against the one you are currently building. Extend the current end when the new start is not past it, otherwise emit the current interval and start a new one. For "remove fewest intervals to make them disjoint", sort by *end* and greedily keep the one that finishes earliest — it leaves the most room for everything after it.',
    tc: 'O(n log n)',
    sc: 'O(n)',
  },
  'sweep-line': {
    name: 'Sweep line / event ordering',
    family: 'Arrays & strings',
    hints: [
      'Turn each interval into two events: +1 where it starts, -1 where it ends.',
      'Sort the events by position, and settle ties deliberately — do ends come before starts?',
      'Sweep once, keeping a running count or an active set.',
    ],
    approach:
      'Instead of comparing every pair of intervals, flatten them into a timeline of start and end events, sort once, and walk left to right carrying a running tally of how many intervals are currently open. Peaks of that tally answer "maximum overlap" questions; transitions between zero and non-zero answer "total covered length". The only subtle part is tie-breaking at equal coordinates, which depends on whether touching intervals count as overlapping.',
    tc: 'O(n log n)',
    sc: 'O(n)',
  },
  sorting: {
    name: 'Comparison sorting and custom orders',
    family: 'Sorting',
    hints: [
      'Ask what order would make the answer obvious, then sort into that order.',
      'A custom comparator must be consistent: it has to define a strict total order or the sort is undefined.',
      'Stability matters when equal keys must keep their original relative order.',
    ],
    approach:
      'Most "sorting" problems are really "choose the right key" problems. Once the key is right, the library sort does the work in O(n log n). When you write a comparator, verify it is transitive — the classic trap is comparing concatenations or ratios in a way that is not a valid ordering. Counting sort and radix sort beat the comparison bound when keys are small integers.',
    tc: 'O(n log n)',
    sc: 'O(n)',
  },
  'sorting-algorithm': {
    name: 'Implementing a sort from scratch',
    family: 'Sorting',
    hints: [
      'Write the invariant of the outer loop first: after k iterations, what is guaranteed?',
      'Trace the algorithm on a five-element array by hand before you run it.',
      'Compare the algorithms on three axes: time, extra space, and stability.',
    ],
    approach:
      'Implementing sorts by hand is about internalising loop invariants. Selection sort fixes one final position per pass; insertion sort keeps a sorted prefix and slides the next element into it; bubble sort floats one extreme per pass and can stop early when a pass makes no swaps. Merge sort splits, recurses and merges in guaranteed O(n log n) with O(n) extra space; quicksort partitions around a pivot and is in-place but degrades to quadratic on bad pivot choices.',
    tc: 'O(n log n)',
    sc: 'O(n)',
  },
  quickselect: {
    name: 'Quickselect / partition-based selection',
    family: 'Sorting',
    hints: [
      'You need the k-th element, not the whole sorted order — so only recurse into the side that contains k.',
      'Partition exactly as quicksort does, then compare the pivot index against k.',
      'Randomise the pivot to avoid adversarial worst cases.',
    ],
    approach:
      'Partition the array around a pivot so that smaller elements land left and larger ones right. The pivot is then in its final sorted position, so comparing that position against k tells you which half to keep — and you discard the other half entirely. Halving the work each time gives expected linear time, versus O(n log n) for a full sort.',
    tc: 'O(n) average',
    sc: 'O(1)',
  },
  'divide-conquer': {
    name: 'Divide and conquer',
    family: 'Sorting',
    hints: [
      'Split the input in half, solve both halves, and ask what is left over: the cross-boundary cases.',
      'The cross-boundary merge step is where the real algorithm lives.',
      'Write the recurrence, then read the complexity off it.',
    ],
    approach:
      'Break the problem into independent halves, solve each recursively, then combine. The interesting work is always the combine step — counting pairs that straddle the midpoint, merging two sorted halves, or joining two partial answers. When the combine is linear, the recurrence T(n) = 2T(n/2) + O(n) gives O(n log n).',
    tc: 'O(n log n)',
    sc: 'O(n)',
  },

  // --------------------------------------------------------- binary search
  'binary-search': {
    name: 'Binary search on a sorted range',
    family: 'Binary search',
    hints: [
      'Confirm the search space is monotone — that is what makes halving safe.',
      'Fix your boundary convention and keep it: half-open `[lo, hi)` is the least error-prone.',
      'Compute the midpoint as `lo + (hi - lo) / 2` so it cannot overflow.',
    ],
    approach:
      'Maintain a range guaranteed to contain the answer and halve it each step by testing the midpoint. The discipline that removes bugs is picking one convention and never deviating: use `lo < hi` with a half-open range, never write `hi = mid - 1` in that convention, and make sure every branch strictly shrinks the range so the loop terminates. Lower-bound and upper-bound variants differ only in the comparison used.',
    tc: 'O(log n)',
    sc: 'O(1)',
  },
  'binary-search-answer': {
    name: 'Binary search on the answer',
    family: 'Binary search',
    hints: [
      'You are not searching the array — you are searching the range of possible answers.',
      'Write a boolean `feasible(x)`: can the task be done with capacity / speed / limit x?',
      'That predicate must be monotone: false, false, ..., false, true, true, ..., true.',
    ],
    approach:
      'When the answer is a number in a known range and checking a candidate is cheap, binary search the candidates instead of the data. Define `feasible(x)` so that it is false below the answer and true from the answer onwards, then find the boundary. Each check is typically a linear greedy sweep, giving O(n log(range)) overall. Getting the monotonicity argument right is the whole problem; the search itself is boilerplate.',
    tc: 'O(n log(range))',
    sc: 'O(1)',
  },
  'binary-search-2d': {
    name: 'Binary search on a matrix',
    family: 'Binary search',
    hints: [
      'If every row continues where the previous ended, treat the matrix as one flat sorted array.',
      'If rows and columns are each sorted but not globally, start at a corner where one move increases and the other decreases.',
      'Index conversion: flat index `i` is row `i / cols`, column `i % cols`.',
    ],
    approach:
      'A fully sorted matrix is just a sorted array with index arithmetic, so a single binary search over `[0, rows*cols)` works. A row-wise and column-wise sorted matrix is different: begin at the top-right corner, where moving left strictly decreases the value and moving down strictly increases it. Each comparison then eliminates an entire row or column, giving O(rows + cols).',
    tc: 'O(log(n*m))',
    sc: 'O(1)',
  },

  // ---------------------------------------------------------------- strings
  'string-manipulation': {
    name: 'String scanning and building',
    family: 'Arrays & strings',
    hints: [
      'Decide up front whether you can work in place or need a builder.',
      'Repeated concatenation in a loop is quadratic in most languages — collect pieces and join once.',
      'Enumerate the edge cases before coding: empty string, single character, all identical, leading and trailing spaces.',
    ],
    approach:
      'Walk the string once, maintaining whatever running state the task needs, and append to a builder rather than re-creating strings. Many of these problems are really about careful case analysis rather than a clever algorithm, so writing the edge cases down first is the highest-value step. Where the alphabet is bounded, a fixed-size count array is both faster and clearer than a map.',
    tc: 'O(n)',
    sc: 'O(n)',
  },
  'string-matching': {
    name: 'Pattern matching (KMP / Z-function)',
    family: 'Strings',
    hints: [
      'A naive restart after a mismatch throws away information you already paid for.',
      'Precompute, for every prefix, the length of its longest proper prefix that is also a suffix.',
      'On a mismatch, jump the pattern pointer using that table instead of resetting it to zero.',
    ],
    approach:
      'Build the prefix-function table for the pattern in linear time, then scan the text without ever moving the text pointer backwards. When characters disagree, fall back along the table to the longest border already matched, which is exactly the information a naive restart discards. The same table answers questions about periodicity and about the shortest repeating unit of a string.',
    tc: 'O(n + m)',
    sc: 'O(m)',
  },
  'string-hashing': {
    name: 'Rolling hash',
    family: 'Strings',
    hints: [
      'Treat a substring as a number in a large base, so a shift is one multiply and two adds.',
      'Precompute powers of the base and prefix hashes so any substring hash is O(1).',
      'Hashes can collide — use a large modulus, or two moduli, and verify on match if correctness must be exact.',
    ],
    approach:
      'Assign each substring a numeric fingerprint that can be updated in constant time as the window slides. With prefix hashes and precomputed powers, comparing any two substrings for equality becomes an O(1) integer comparison, which turns many quadratic substring problems into linear or log-linear ones. Use randomised or double hashing when an adversarial test set is possible.',
    tc: 'O(n)',
    sc: 'O(n)',
  },

  // ----------------------------------------------------------- linked lists
  'linked-list-traversal': {
    name: 'Linked list traversal and surgery',
    family: 'Linked lists',
    hints: [
      'A dummy head node removes almost every special case around the first element.',
      'Before you unlink a node, save the pointer you still need.',
      'Draw the three nodes around the operation on paper and label the pointers.',
    ],
    approach:
      'Pointer surgery is easy to get wrong and easy to get right, depending on discipline. Allocate a dummy node in front of the real head so that deleting or inserting at position zero uses the same code as everywhere else. Keep a `prev` pointer when you need to unlink. Re-read your loop asking "after this line, which nodes are still reachable?" — that catches almost every bug.',
    tc: 'O(n)',
    sc: 'O(1)',
  },
  'fast-slow-pointers': {
    name: "Fast and slow pointers (Floyd's)",
    family: 'Linked lists',
    hints: [
      'Move one pointer one step and the other two steps per iteration.',
      'If they ever meet, there is a cycle; if the fast one reaches the end, there is not.',
      'To find where the cycle starts, reset one pointer to the head and advance both one step at a time.',
    ],
    approach:
      'Two pointers moving at different speeds detect cycles in O(1) space, and the same trick finds the middle of a list in a single pass — when the fast pointer reaches the end, the slow one is halfway. For cycle entry, the algebra works out so that the distance from the head to the cycle start equals the distance from the meeting point to the cycle start, which is why resetting one pointer to the head and stepping both in lockstep lands them exactly on the entry node.',
    tc: 'O(n)',
    sc: 'O(1)',
  },
  'linked-list-reversal': {
    name: 'In-place list reversal',
    family: 'Linked lists',
    hints: [
      'Carry three pointers: previous, current, and the next you are about to lose.',
      'Reverse the link, then shuffle all three forward — in that order.',
      'For reversal in groups, first check that a full group remains before touching anything.',
    ],
    approach:
      'Walk the list re-pointing each `next` backwards, keeping `prev`, `curr` and `nxt` so you never lose the rest of the list. The loop body is always the same four lines. Group reversal wraps this in an outer loop that reverses exactly k nodes and stitches the reversed block between the previous block\'s tail and the remaining list — check the group is complete before reversing, or a trailing partial group gets mangled.',
    tc: 'O(n)',
    sc: 'O(1)',
  },
  'merge-lists': {
    name: 'Merging sorted lists',
    family: 'Linked lists',
    hints: [
      'A dummy head plus a tail pointer makes the merge loop trivial.',
      'Attach the smaller head, advance that list, repeat; then attach whatever remains.',
      'For k lists, either merge pairwise in rounds or keep the k heads in a min-heap.',
    ],
    approach:
      'Repeatedly take the smaller of the two current heads and append it to a growing result whose tail you track. Two lists merge in linear time with no extra allocation. For k lists, pairwise merging in log k rounds, or a min-heap of the k current heads, both give O(N log k) — the heap is better when k is large and the lists are long.',
    tc: 'O(n + m)',
    sc: 'O(1)',
  },

  // ------------------------------------------------------------- recursion
  recursion: {
    name: 'Recursive decomposition',
    family: 'Recursion',
    hints: [
      'Write the base case first and make sure every recursive call moves strictly towards it.',
      'Assume the recursive call already works — then you only have to handle the current step.',
      'Sketch the call tree for n = 3 or 4 to see the order things actually happen in.',
    ],
    approach:
      'Define the function by what it promises to return, not by how it loops. Handle the smallest input directly, then express the answer for size n in terms of one or more smaller instances. The mental trick that makes recursion click is the leap of faith: trust that the recursive call is correct, and only verify the combination step. Track the recursion depth — it is your space complexity.',
    tc: 'O(2^n)',
    sc: 'O(n)',
  },
  backtracking: {
    name: 'Backtracking / controlled search',
    family: 'Recursion',
    hints: [
      'Three questions: what is a choice, what makes a choice legal, and when is a solution complete?',
      'Undo every change on the way out of the recursive call, in the exact reverse order.',
      'Prune as early as you can — an impossible branch abandoned at depth 2 saves the whole subtree.',
    ],
    approach:
      'Build a candidate solution one decision at a time. At each level, loop over the legal choices, apply one, recurse, then undo it. Completeness is checked at the top of the call. The difference between a working solution and a timeout is almost always pruning: check feasibility before recursing, and skip duplicate choices at the same level by sorting first and ignoring a value equal to its predecessor.',
    tc: 'O(n!)',
    sc: 'O(n)',
  },

  // --------------------------------------------------------- bits
  'bit-tricks': {
    name: 'Bit manipulation',
    family: 'Bit manipulation',
    hints: [
      'Write the numbers in binary for the first few cases — the pattern is usually a single operator.',
      'Remember the four workhorses: `x & 1`, `x >> 1`, `x & (x - 1)`, `x & -x`.',
      'XOR is its own inverse, so anything appearing twice cancels itself out.',
    ],
    approach:
      'Operate on the binary representation directly. `x & (x - 1)` clears the lowest set bit, so looping on it counts set bits in as many steps as there are ones. `x & -x` isolates that lowest set bit. XOR cancels duplicates, which is why it finds the single unpaired element in linear time and constant space. Be careful with signed shifts and with the sign bit when the language does not have an unsigned right shift.',
    tc: 'O(1)',
    sc: 'O(1)',
  },
  bitmask: {
    name: 'Bitmask over subsets',
    family: 'Bit manipulation',
    hints: [
      'An n-element subset is an n-bit integer; iterate masks from 0 to 2^n - 1.',
      'Bit i of the mask means "element i is chosen".',
      'Only viable when n is small — roughly 20 or fewer.',
    ],
    approach:
      'Encode a subset as an integer and enumerate all of them with a single loop. Membership is `mask & (1 << i)`, adding an element is `mask | (1 << i)`, and iterating the submasks of a mask has the neat idiom `for (s = mask; s; s = (s - 1) & mask)`. This is the backbone of subset dynamic programming, where the state is "which items have been used so far".',
    tc: 'O(2^n * n)',
    sc: 'O(2^n)',
  },

  // ------------------------------------------------------ stacks and queues
  'stack-basic': {
    name: 'Stack fundamentals',
    family: 'Stacks & queues',
    hints: [
      'Reach for a stack when the most recent unresolved item is the one you need next.',
      'Push the opening or pending thing; pop when its partner or resolution arrives.',
      'Check for an empty stack before every pop.',
    ],
    approach:
      'A stack captures "last opened, first closed" structure. Matching brackets, evaluating expressions and undo histories all have that shape: push the thing that is still waiting for a partner, and pop when the partner shows up. Validity usually means two things — every pop finds a matching top, and the stack is empty at the end.',
    tc: 'O(n)',
    sc: 'O(n)',
  },
  'stack-monotonic': {
    name: 'Monotonic stack',
    family: 'Stacks & queues',
    hints: [
      'You are asking "what is the nearest larger (or smaller) element in some direction?"',
      'Keep the stack sorted; before pushing, pop everything that the new element dominates.',
      'Each index is pushed once and popped once, so the whole sweep is linear.',
    ],
    approach:
      'Maintain a stack whose values are increasing or decreasing from bottom to top. When a new element arrives, pop every element it beats — and the moment you pop an element, the new one is precisely its nearest greater or smaller neighbour, so that is where you record the answer. This single idea solves next-greater-element, daily temperatures, stock spans, largest rectangle in a histogram and trapping rain water.',
    tc: 'O(n)',
    sc: 'O(n)',
  },
  'queue-basic': {
    name: 'Queue fundamentals',
    family: 'Stacks & queues',
    hints: [
      'Use a queue when items must be handled in arrival order.',
      'A circular buffer gives O(1) enqueue and dequeue without shifting.',
      'Two stacks simulate a queue: push onto one, and pour into the other only when it is empty.',
    ],
    approach:
      'First in, first out. Implemented over an array, the trick is to wrap the head and tail indices modulo the capacity so no element ever moves. Implemented over two stacks, amortised O(1) comes from only transferring when the output stack runs dry — each element is moved across at most once.',
    tc: 'O(1)',
    sc: 'O(n)',
  },
  'deque-window': {
    name: 'Monotonic deque',
    family: 'Stacks & queues',
    hints: [
      'You need the extreme value of a sliding window, and it must survive the window moving.',
      'Store indices, not values, so you can tell when the front has slid out of range.',
      'Before pushing at the back, discard everything smaller (or larger) — it can never be the answer again.',
    ],
    approach:
      'Keep a double-ended queue of indices whose values are monotonic. Pop from the front when the index falls out of the window, and pop from the back everything that the incoming element dominates, since a newer and better element makes them permanently irrelevant. The front is then always the window maximum, and every index is pushed and popped once for O(n) total.',
    tc: 'O(n)',
    sc: 'O(k)',
  },
  'design-ds': {
    name: 'Data-structure design',
    family: 'Design',
    hints: [
      'List the operations and the required complexity for each before picking structures.',
      'When one structure cannot hit every bound, combine two and keep them in sync.',
      'The usual pairing is a hash map for O(1) lookup plus a list, heap or tree for ordering.',
    ],
    approach:
      'Design questions are about composing primitives. A hash map gives O(1) access but no order; a doubly linked list gives O(1) splicing but no search; together they give an LRU cache. A hash map plus an array gives O(1) insert, delete and random access. Write down each operation and which structure serves it, then make sure every mutation updates both sides.',
    tc: 'O(1)',
    sc: 'O(n)',
  },

  // ----------------------------------------------------------------- heaps
  heap: {
    name: 'Binary heap / priority queue',
    family: 'Heaps',
    hints: [
      'Use a heap when you repeatedly need the smallest or largest item from a changing set.',
      'Peek is O(1); push and pop are O(log n). Heaps do not give you sorted order for free.',
      'To get the k largest, keep a min-heap of size k — not a max-heap of size n.',
    ],
    approach:
      'A heap keeps the extreme element at the root with only a partial order elsewhere, which is why it is cheaper than a fully sorted structure. Push by appending and sifting up; pop by swapping the last element to the root and sifting down. The counter-intuitive but important idiom: for "k largest", maintain a *min*-heap capped at size k and evict the root whenever it grows past k, giving O(n log k).',
    tc: 'O(n log k)',
    sc: 'O(k)',
  },
  'two-heaps': {
    name: 'Two heaps (running median)',
    family: 'Heaps',
    hints: [
      'Split the data at the median: a max-heap for the lower half, a min-heap for the upper half.',
      'After every insert, rebalance so the sizes differ by at most one.',
      'The median is then a root, or the average of the two roots.',
    ],
    approach:
      'Maintain two heaps facing each other. Everything at or below the median lives in a max-heap, everything above in a min-heap; the two roots are the elements straddling the middle. Insert into whichever side the new value belongs, then move one element across if the sizes differ by more than one. Every operation is O(log n) and the median read is O(1).',
    tc: 'O(log n)',
    sc: 'O(n)',
  },
  'top-k': {
    name: 'Top-k selection',
    family: 'Heaps',
    hints: [
      'Do you actually need them sorted, or just the set of k? That changes the tool.',
      'Bounded-size heap for streaming data; quickselect when everything is in memory.',
      'Bucketing by frequency gives O(n) when the key range is bounded by n.',
    ],
    approach:
      'Three tools, three situations. A size-k heap handles streams and gives O(n log k). Quickselect handles in-memory arrays in expected O(n) but destroys order. Bucket sort by frequency is O(n) when frequencies are bounded by n — build an array of buckets indexed by count, then read it from the high end.',
    tc: 'O(n log k)',
    sc: 'O(k)',
  },

  // ---------------------------------------------------------------- greedy
  greedy: {
    name: 'Greedy choice',
    family: 'Greedy',
    hints: [
      'Name the local rule: at each step, which single choice looks best?',
      'Then try to break it — find an input where the locally best choice loses globally.',
      'Sorting by the right key is usually what makes the greedy rule correct.',
    ],
    approach:
      'Commit to the locally best option at every step and never revisit it. That is only valid when an exchange argument holds: any optimal solution can be rewritten, choice by choice, to agree with the greedy one without getting worse. Before coding, spend thirty seconds trying to construct a counterexample — if you cannot, the greedy rule is probably right; if you can, you likely need dynamic programming instead.',
    tc: 'O(n log n)',
    sc: 'O(1)',
  },

  // ----------------------------------------------------------------- trees
  'tree-dfs': {
    name: 'Depth-first tree traversal',
    family: 'Binary trees',
    hints: [
      'Ask what each child needs to report upward, and what the parent must pass downward.',
      'Preorder, inorder and postorder differ only in where you do the work relative to the recursive calls.',
      'The recursion depth is the tree height — O(n) on a degenerate tree.',
    ],
    approach:
      'Recurse into the children and combine their results. The whole design decision is what the recursive function returns: a height, a sum, a boolean, or a small struct carrying several facts at once. Bottom-up (postorder) suits problems where the answer at a node depends on its subtrees; top-down (preorder) suits problems where a node needs context from its ancestors. Iterative versions replace the call stack with an explicit one.',
    tc: 'O(n)',
    sc: 'O(h)',
  },
  'tree-bfs': {
    name: 'Level-order traversal',
    family: 'Binary trees',
    hints: [
      'Use a queue and process one whole level per outer iteration.',
      'Record the queue size at the top of the loop — that is exactly the number of nodes in this level.',
      'Levels make "leftmost", "rightmost", "per-level aggregate" and "shortest depth" questions easy.',
    ],
    approach:
      'Push the root, then repeatedly take a snapshot of the queue size, pop exactly that many nodes as one level, and enqueue their children. Fixing the level size up front is what separates the levels cleanly. Zigzag order is the same loop with alternating insertion direction; views from the side are the first or last node of each level.',
    tc: 'O(n)',
    sc: 'O(w)',
  },
  'tree-construction': {
    name: 'Building a tree from traversals',
    family: 'Binary trees',
    hints: [
      'Preorder and postorder tell you the root; inorder tells you how the rest splits around it.',
      'Index the inorder positions in a hash map so locating the root is O(1).',
      'Pass index ranges down the recursion rather than slicing arrays.',
    ],
    approach:
      'The first element of preorder (or last of postorder) is the root. Finding that value in the inorder sequence splits the remaining nodes into the left and right subtrees, and the sizes of those pieces tell you how to split the preorder range too. Recurse on both sides with explicit index bounds. A value-to-index map turns the search from O(n) into O(1), giving overall linear time.',
    tc: 'O(n)',
    sc: 'O(n)',
  },
  'tree-lca': {
    name: 'Lowest common ancestor and path queries',
    family: 'Binary trees',
    hints: [
      'Recurse; if a node finds one target in each subtree, that node is the answer.',
      'If both targets are in the same subtree, the answer is inside that subtree.',
      'In a BST you can do better — descend while both targets are on the same side.',
    ],
    approach:
      'A single postorder pass suffices: return the node itself if it matches a target, otherwise return whichever child search succeeded — and if both children succeed, this node is the split point, so return it. Path-related problems reuse this shape by having the recursion return the best downward path while a shared variable tracks the best path that bends at some node.',
    tc: 'O(n)',
    sc: 'O(h)',
  },
  'bst-property': {
    name: 'Exploiting the BST ordering',
    family: 'Binary search trees',
    hints: [
      'Every comparison at a node lets you discard an entire subtree.',
      'Carry a valid range down the tree when you need to check the BST property.',
      'Deletion has three cases: no child, one child, two children.',
    ],
    approach:
      'A BST turns tree traversal into binary search: compare with the node, then go left or right. Validating a BST is not a local check — it needs a (min, max) window narrowed as you descend, because a node must respect every ancestor, not just its parent. Deleting a node with two children means replacing it with its inorder predecessor or successor and then deleting that node from the subtree.',
    tc: 'O(h)',
    sc: 'O(h)',
  },
  'bst-inorder': {
    name: 'Inorder as a sorted sequence',
    family: 'Binary search trees',
    hints: [
      'Inorder traversal of a BST yields the values in ascending order.',
      'So any "sorted array" technique becomes available — just consume the traversal lazily.',
      'A controlled iterator uses a stack of left-spine nodes and yields one value per call.',
    ],
    approach:
      'Because inorder gives sorted output, k-th smallest is the k-th emitted value, validation is "is the sequence strictly increasing", and the two swapped nodes in a corrupted BST are the endpoints of the one or two descents in that sequence. An iterator implementation pushes the entire left spine, then on each `next()` pops one node and pushes the left spine of its right child, giving amortised O(1) per call and O(h) memory.',
    tc: 'O(n)',
    sc: 'O(h)',
  },

  // ---------------------------------------------------------------- graphs
  'graph-dfs': {
    name: 'Depth-first search on graphs',
    family: 'Graphs',
    hints: [
      'Mark a node visited when you first reach it, not when you finish it — that prevents re-entry.',
      'For grids, the graph is implicit: neighbours are the four or eight adjacent cells.',
      'Recursion depth can reach the node count, so consider an explicit stack on large inputs.',
    ],
    approach:
      'Go as deep as possible before backtracking, using a visited set to avoid revisiting. DFS naturally answers connectivity, component counting, flood fill and cycle detection. In a directed graph, cycle detection needs three states rather than two — unvisited, currently on the recursion stack, and fully finished — because meeting a finished node is fine but meeting one still on the stack is a back edge.',
    tc: 'O(V + E)',
    sc: 'O(V)',
  },
  'graph-bfs': {
    name: 'Breadth-first search',
    family: 'Graphs',
    hints: [
      'BFS gives the shortest path when every edge costs the same.',
      'Mark nodes visited as you enqueue them, otherwise duplicates flood the queue.',
      'Multi-source BFS just means pushing every source before the loop starts.',
    ],
    approach:
      'Explore in rings of increasing distance using a queue, which makes the first time you reach a node also the shortest way to reach it — provided all edges have equal weight. Multi-source BFS seeds the queue with every starting cell at once and computes, for every node, the distance to the nearest source in one sweep. A 0-1 weighted graph is handled by a deque, pushing zero-weight moves to the front.',
    tc: 'O(V + E)',
    sc: 'O(V)',
  },
  'topological-sort': {
    name: 'Topological ordering',
    family: 'Graphs',
    hints: [
      'Only directed acyclic graphs have a topological order — so this also detects cycles.',
      "Kahn's algorithm: repeatedly take a node with in-degree zero and remove its out-edges.",
      'If you cannot place every node, a cycle exists.',
    ],
    approach:
      'Order the vertices so that every edge points forward. Kahn\'s method keeps a queue of in-degree-zero vertices, emits one, and decrements its neighbours\' in-degrees, enqueueing any that hit zero. If fewer than V vertices are emitted, the leftover ones form a cycle — which is why course-scheduling and dependency-resolution problems are really cycle-detection problems. The DFS variant pushes each vertex after its descendants finish and reverses the result.',
    tc: 'O(V + E)',
    sc: 'O(V)',
  },
  'union-find': {
    name: 'Disjoint set union',
    family: 'Graphs',
    hints: [
      'Use DSU when you merge groups and ask "are these two in the same group?"',
      'Path compression plus union by size or rank gives near-constant amortised time.',
      'Edges processed in sorted order plus DSU is the shape of most minimum-spanning-tree solutions.',
    ],
    approach:
      'Represent each component by a root. `find` walks to the root and flattens the path on the way back; `union` attaches the smaller tree under the larger. Together these give inverse-Ackermann amortised cost, which is constant for any realistic input. DSU shines when edges arrive incrementally — it answers connectivity online, which plain DFS cannot do without re-running.',
    tc: 'O(E * alpha(V))',
    sc: 'O(V)',
  },
  dijkstra: {
    name: "Dijkstra's shortest path",
    family: 'Graphs',
    hints: [
      'Non-negative edge weights only — a single negative edge breaks the argument.',
      'Use a min-heap keyed on the current best distance.',
      'Skip a popped entry whose recorded distance is worse than the best you already know.',
    ],
    approach:
      'Grow a set of finalised vertices, always finalising the unfinalised vertex with the smallest tentative distance. A min-heap supplies that vertex in O(log V), and relaxing each edge pushes at most one new entry, giving O(E log V). Correctness relies on non-negative weights: once a vertex is popped with the minimum tentative distance, no longer path could ever improve it.',
    tc: 'O(E log V)',
    sc: 'O(V)',
  },
  'bellman-ford': {
    name: 'Bellman–Ford relaxation',
    family: 'Graphs',
    hints: [
      'Relax every edge, V - 1 times. That is the whole algorithm.',
      'A shortest path visits at most V - 1 edges, which is why V - 1 rounds suffice.',
      'One more round that still improves something proves a negative cycle exists.',
    ],
    approach:
      'Unlike Dijkstra, this tolerates negative edge weights. After k rounds of relaxing all edges, every shortest path using at most k edges is correct, so V - 1 rounds settle everything in a graph without negative cycles. Running a V-th round is the detector: any further improvement means some cycle has negative total weight and no shortest path exists.',
    tc: 'O(V * E)',
    sc: 'O(V)',
  },
  'floyd-warshall': {
    name: 'All-pairs shortest paths',
    family: 'Graphs',
    hints: [
      'Three nested loops, and the intermediate vertex must be the outermost one.',
      'Interpretation: `dist[i][j]` using only vertices 0..k as waypoints.',
      'A negative value on the diagonal afterwards means a negative cycle.',
    ],
    approach:
      'Consider each vertex k in turn as a permitted waypoint and ask whether routing i to j through k beats the current best. Because the k loop is outermost, the table always holds the answer restricted to the waypoints considered so far, and after the final k it holds the unrestricted answer. Cubic time, quadratic space — the right tool when the graph is dense and small and you need every pair.',
    tc: 'O(V^3)',
    sc: 'O(V^2)',
  },
  mst: {
    name: 'Minimum spanning tree',
    family: 'Graphs',
    hints: [
      'Kruskal: sort edges by weight, add an edge whenever it joins two different components.',
      'Prim: grow one tree, always attaching the cheapest edge leaving it.',
      'Kruskal suits sparse edge lists; Prim with a heap suits dense graphs.',
    ],
    approach:
      'Both algorithms rely on the cut property: for any split of the vertices into two sides, the cheapest edge crossing it belongs to some minimum spanning tree. Kruskal applies it globally by sorting all edges and using disjoint-set union to reject the ones that would close a cycle. Prim applies it locally, maintaining a heap of edges leaving the tree built so far.',
    tc: 'O(E log E)',
    sc: 'O(V)',
  },
  scc: {
    name: 'Strongly connected components',
    family: 'Graphs',
    hints: [
      'Two vertices are in the same component when each can reach the other.',
      "Kosaraju: DFS to record finish times, reverse every edge, then DFS in reverse finish order.",
      'Contracting each component yields a directed acyclic graph.',
    ],
    approach:
      'Kosaraju runs two passes. The first records vertices by decreasing finish time; the second explores the transposed graph in that order, and each tree it produces is exactly one strongly connected component. Tarjan achieves the same in a single pass using discovery indices and low-link values. Either way, condensing the components gives a DAG you can then run ordinary DAG algorithms on.',
    tc: 'O(V + E)',
    sc: 'O(V)',
  },
  'bridges-articulation': {
    name: 'Bridges and articulation points',
    family: 'Graphs',
    hints: [
      'Run a DFS and record, for each node, its discovery time and the earliest time reachable from its subtree.',
      'An edge is a bridge when the child subtree cannot reach the parent or above without it.',
      'The DFS root is an articulation point exactly when it has more than one DFS child.',
    ],
    approach:
      'During a DFS, give every vertex a discovery index and a low-link value equal to the smallest index reachable from its subtree using at most one back edge. If a child\'s low-link strictly exceeds the parent\'s index, the connecting edge is a bridge; if it merely reaches the parent\'s index, the parent is an articulation point. The root needs the separate two-children rule because it has no parent edge.',
    tc: 'O(V + E)',
    sc: 'O(V)',
  },

  // ------------------------------------------------------ dynamic programming
  'dp-1d': {
    name: 'One-dimensional dynamic programming',
    family: 'Dynamic programming',
    hints: [
      'Define the state in one sentence: "dp[i] is the best answer considering the first i items."',
      'Write the recurrence, confirm it only refers to smaller indices, then choose memo or table.',
      'If the recurrence only looks back a constant number of steps, you can drop the array entirely.',
    ],
    approach:
      'Start from the recursion, add memoisation, then flip it into a bottom-up loop. The state definition is the whole battle — once `dp[i]` has an unambiguous meaning, the transition follows from asking "what is the last decision made to reach state i?". When the transition reads only `dp[i-1]` and `dp[i-2]`, replace the array with two variables and the space drops to O(1).',
    tc: 'O(n)',
    sc: 'O(n)',
  },
  'dp-2d-grid': {
    name: 'Grid dynamic programming',
    family: 'Dynamic programming',
    hints: [
      'A cell\'s answer depends on the cells you are allowed to arrive from.',
      'Fill in an order that guarantees those predecessors are already computed.',
      'Obstacles are just cells whose value is forced to zero or infinity.',
    ],
    approach:
      'Each cell stores the best value for paths ending there, computed from the legal predecessor cells — usually the one above and the one to the left. Initialise the first row and column carefully, since they have only one predecessor. Because each row depends only on the previous one, a rolling array reduces space from O(n*m) to O(m).',
    tc: 'O(n*m)',
    sc: 'O(n*m)',
  },
  'dp-knapsack': {
    name: 'Knapsack-style subset DP',
    family: 'Dynamic programming',
    hints: [
      'Every item poses one question: take it or skip it.',
      'The state is (index considered, capacity remaining).',
      'Unlimited copies means recursing on the same index after taking; 0/1 means moving on.',
    ],
    approach:
      'Process items one at a time, carrying the remaining budget as the second dimension. `dp[i][c] = max(skip, take)` where taking is allowed only when the item fits. For 0/1 knapsack in one dimension, iterate the capacity downwards so each item is used at most once; for unbounded knapsack, iterate upwards so it can be reused. Subset-sum, partition and coin-change are all this recurrence with a different objective.',
    tc: 'O(n*W)',
    sc: 'O(W)',
  },
  'dp-subsequence': {
    name: 'Subsequence dynamic programming',
    family: 'Dynamic programming',
    hints: [
      'For two sequences, the state is a pair of prefix lengths.',
      'If the current characters match, both pointers advance together; otherwise branch on which to skip.',
      'Recover the actual subsequence by walking the table backwards from the end.',
    ],
    approach:
      'Compare prefixes of two sequences. When the last characters agree they can be paired, so the answer is one plus the answer for both shorter prefixes; when they disagree, take the better of dropping one character from either side. The same table yields edit distance by charging a cost for insert, delete and replace, and yields the longest palindromic subsequence by comparing a string against its own reverse.',
    tc: 'O(n*m)',
    sc: 'O(n*m)',
  },
  'dp-lis': {
    name: 'Longest increasing subsequence',
    family: 'Dynamic programming',
    hints: [
      'Quadratic version: `dp[i]` is the best subsequence ending at i, found by scanning all j < i.',
      'Faster version: keep the smallest possible tail for each achievable length.',
      'That tails array is sorted, so binary search finds where the new element belongs.',
    ],
    approach:
      'The O(n^2) formulation is the one to understand: for each index, look back at every smaller index with a smaller value and extend the best chain found. The O(n log n) version maintains an array where position k holds the minimum possible tail of an increasing subsequence of length k+1; each new element either extends the array or replaces the first tail that is not smaller than it, located by binary search.',
    tc: 'O(n log n)',
    sc: 'O(n)',
  },
  'dp-strings': {
    name: 'String dynamic programming',
    family: 'Dynamic programming',
    hints: [
      'State is usually a pair of indices into the two strings, or a substring range.',
      'Match, insert, delete, replace — decide which operations the problem allows.',
      'Wildcards need care: a star can match zero characters, which is the case people forget.',
    ],
    approach:
      'Align two strings character by character, with a table indexed by the two prefix lengths. Base rows and columns encode "one string is exhausted", which normally costs the length of the remainder. Pattern-matching variants add a branch for each wildcard: `?` consumes exactly one character, while `*` either consumes one character and stays, or consumes nothing and advances the pattern.',
    tc: 'O(n*m)',
    sc: 'O(n*m)',
  },
  'dp-stocks': {
    name: 'State-machine DP (buy and sell)',
    family: 'Dynamic programming',
    hints: [
      'Model it as a small state machine: holding, not holding, in cooldown.',
      'On each day, either stay in the current state or take the transition.',
      'Transaction limits add one more dimension to the state.',
    ],
    approach:
      'Track the best cash balance in each state at the end of each day. With no limit, two states suffice: holding a share or not. A cooldown adds a third state; a cap of k transactions multiplies the states by k. Because day i depends only on day i-1, the whole thing collapses to a handful of scalar variables updated in order.',
    tc: 'O(n*k)',
    sc: 'O(k)',
  },
  'dp-partition-mcm': {
    name: 'Interval / partition DP',
    family: 'Dynamic programming',
    hints: [
      'The state is a range `[i, j]`, and you choose a split point inside it.',
      'Loop over every split, combining the two sub-answers plus the cost of the merge.',
      'Solve short ranges before long ones — length must be the outer loop.',
    ],
    approach:
      'For each interval, try every position as the last operation performed and take the best. The cost of that final operation typically depends on the endpoints of the interval rather than its interior, which is what makes the decomposition work. Matrix-chain multiplication, burst balloons, palindrome partitioning and boolean parenthesisation are all this recurrence, and all run in O(n^3).',
    tc: 'O(n^3)',
    sc: 'O(n^2)',
  },
  'dp-squares': {
    name: 'DP on submatrices',
    family: 'Dynamic programming',
    hints: [
      'A cell stores the size of the best shape whose bottom-right corner sits there.',
      'For squares, take the minimum of the three neighbours above and to the left, plus one.',
      'For maximal rectangles, reduce each row to a histogram and reuse the monotonic-stack solution.',
    ],
    approach:
      'Anchor the shape at its bottom-right cell. A square of side s can end there only if squares of side s-1 end at the cell above, the cell to the left, and the cell diagonally up-left — hence the minimum-plus-one recurrence. Rectangles are handled differently: build, for each row, the height of consecutive ones above each column, then run largest-rectangle-in-histogram on that array.',
    tc: 'O(n*m)',
    sc: 'O(n*m)',
  },
  'dp-bitmask': {
    name: 'Bitmask dynamic programming',
    family: 'Dynamic programming',
    hints: [
      'The state includes "which elements have been used", encoded as an integer.',
      'Feasible only for roughly n <= 20, since the table has 2^n entries.',
      'Iterate masks in increasing order so every submask is already computed.',
    ],
    approach:
      'When the recurrence needs to know exactly which subset has been consumed, store that subset as a bitmask. Transitions add one unused element at a time, so the table is filled in order of increasing popcount or simply increasing mask value. Travelling-salesman-style problems pair the mask with the current position, giving O(2^n * n^2).',
    tc: 'O(2^n * n)',
    sc: 'O(2^n)',
  },

  // ----------------------------------------------------------------- tries
  trie: {
    name: 'Trie / prefix tree',
    family: 'Tries',
    hints: [
      'Each edge is a character, so a path from the root spells a prefix.',
      'Mark end-of-word on nodes; prefix search and full-word search differ only in checking that flag.',
      'For integers, walk the 32 bits from the most significant downwards.',
    ],
    approach:
      'Store a set of strings as a tree where shared prefixes share nodes, giving lookup proportional to the word length rather than the dictionary size. Insert by walking or creating child nodes per character and flagging the final node. Binary tries over the bit representation of integers solve maximum-XOR queries greedily: at each bit, try to take the opposite branch, because that sets the current bit of the result.',
    tc: 'O(L)',
    sc: 'O(N*L)',
  },

  // ------------------------------------------------------------- advanced
  'segment-tree': {
    name: 'Segment tree',
    family: 'Advanced',
    hints: [
      'Each node owns a range and stores an aggregate over it.',
      'A query splits into O(log n) fully-covered nodes.',
      'Range updates need lazy propagation — push the pending update down only when you descend.',
    ],
    approach:
      'Build a binary tree over the array where each node caches an aggregate — sum, min, max, gcd — of its range. Point updates walk one root-to-leaf path and recompute on the way back up. Range queries recurse, returning immediately for fully covered nodes and stopping at disjoint ones. Lazy propagation stores a pending modification at a node and applies it to children only when the recursion needs to go deeper.',
    tc: 'O(log n)',
    sc: 'O(n)',
  },
  fenwick: {
    name: 'Fenwick tree (binary indexed tree)',
    family: 'Advanced',
    hints: [
      'Index i is responsible for a block whose length is the lowest set bit of i.',
      'Moving up: `i += i & -i`. Moving down: `i -= i & -i`.',
      'Simpler and smaller than a segment tree, but only for invertible operations.',
    ],
    approach:
      'A compact structure for prefix aggregates with point updates, both in O(log n). The index arithmetic encodes an implicit tree: each position stores the aggregate of a range whose length is its lowest set bit. Because queries are prefix-based, range sums come from subtracting two prefixes — which is why it works for sums but not for minimums.',
    tc: 'O(log n)',
    sc: 'O(n)',
  },
  'sqrt-decomposition': {
    name: 'Square-root decomposition',
    family: 'Advanced',
    hints: [
      'Split the array into blocks of size about sqrt(n) and cache an aggregate per block.',
      'A query touches at most two partial blocks and the whole blocks between them.',
      'Simpler to write than a segment tree, and fast enough surprisingly often.',
    ],
    approach:
      'Precompute an aggregate for each block of roughly sqrt(n) consecutive elements. Answering a range query means summing the whole blocks strictly inside the range plus iterating the leftover elements at each end, which costs O(sqrt(n)). Updates touch one element and one block aggregate. The same idea underlies Mo\'s algorithm for offline range queries.',
    tc: 'O(sqrt(n))',
    sc: 'O(n)',
  },
  'binary-lifting': {
    name: 'Binary lifting',
    family: 'Advanced',
    hints: [
      'Precompute the 2^k-th ancestor of every node.',
      'Any jump of length L decomposes into the set bits of L.',
      'Table size is n log n, and each query is O(log n).',
    ],
    approach:
      'Store `up[k][v]`, the ancestor of v reached by 2^k steps, built from `up[k][v] = up[k-1][up[k-1][v]]`. To lift a node by an arbitrary amount, walk the binary representation of that amount and take the corresponding jumps. Lowest common ancestor follows: raise the deeper node to the other\'s depth, then lift both together by the largest jumps that keep them apart.',
    tc: 'O(log n)',
    sc: 'O(n log n)',
  },
};

/** Ordered list of the distinct pattern families, for grouping in the UI. */
export const PATTERN_FAMILIES = [
  'Foundations',
  'Sorting',
  'Arrays & strings',
  'Strings',
  'Binary search',
  'Linked lists',
  'Recursion',
  'Bit manipulation',
  'Stacks & queues',
  'Heaps',
  'Greedy',
  'Binary trees',
  'Binary search trees',
  'Graphs',
  'Dynamic programming',
  'Tries',
  'Design',
  'Advanced',
];
