/**
 * AlgoLadder — the roadmap source of truth.
 * =========================================
 *
 * This file is the ONE place problem curation lives. `npm run dataset:build`
 * expands it into data/topics.json, data/subtopics.json and data/problems.json,
 * which is what the app and the seed script read.
 *
 * ROW FORMAT
 *   'Title[@override]|Difficulty|pattern|tags|companies|description'
 *
 *   Title       Real, publicly known problem title.
 *   @override   Optional. How to build the external URL:
 *                 (omitted)     -> https://leetcode.com/problems/<kebab(title)>/
 *                 @lc:slug      -> https://leetcode.com/problems/slug/
 *                 @gfg:path     -> https://www.geeksforgeeks.org/problems/path
 *                 @url:https... -> used verbatim
 *   Difficulty  E | M | H
 *   pattern     A key from data/source/patterns.mjs (hints + approach come from there)
 *   tags        Comma separated
 *   companies   Comma separated, or '-' for none
 *   description One original sentence describing the task. Written for
 *               AlgoLadder — not copied from the host platform.
 *
 * IMPORTANT — what you must verify (see README "What you must check yourself"):
 * the titles and the algorithmic classification here are ours, but the URLs are
 * generated from title slugs. Run `npm run dataset:check-urls` to confirm every
 * link resolves before you publish this anywhere.
 */

export const ROADMAP = [
  // ======================================================================
  {
    slug: 'basics',
    name: 'Basics',
    icon: 'sprout',
    description:
      'Warm up the muscles every later topic assumes: loops, arithmetic on digits, a first taste of recursion, and the hash map you will reach for hundreds of times from here on.',
    subtopics: [
      {
        slug: 'loops-and-conditionals',
        name: 'Loops & Conditionals',
        description:
          'Five short problems whose only job is to get you writing correct loops and boundary conditions without thinking about efficiency.',
        rows: [
          'Fizz Buzz|E|simulation|Loops,Conditionals,Warm-up|Amazon,Microsoft|Walk the numbers 1 to n and emit a word instead of the number when it is divisible by 3, by 5, or by both.',
          'Number of Steps to Reduce a Number to Zero|E|simulation|Loops,Simulation,Math|Amazon|Repeatedly halve an even number or subtract one from an odd number, counting how many operations reach zero.',
          'Richest Customer Wealth|E|matrix-manipulation|Matrix,Loops|Amazon|Sum each row of a grid of account balances and report the largest row total.',
          'Running Sum of 1d Array|E|prefix-sum|Prefix Sum,Arrays|Amazon,Adobe|Replace every element with the total of all elements up to and including it, which is your first prefix-sum array.',
          'Build Array from Permutation|E|simulation|Arrays,Indexing|Google|Construct a new array where each position takes the value found by using the current value as an index.',
        ],
      },
      {
        slug: 'basic-maths',
        name: 'Basic Maths',
        description:
          'Digit extraction, divisibility and overflow discipline. Small problems that quietly teach you to reason about numbers rather than iterate over them.',
        rows: [
          'Palindrome Number|E|math-number-theory|Math,Digits|Amazon,Apple|Decide whether an integer reads the same forwards and backwards without converting it to a string.',
          'Reverse Integer|E|math-number-theory|Math,Digits,Overflow|Apple,Bloomberg|Reverse the digits of a signed integer and return zero when the result falls outside the 32-bit range.',
          'Happy Number|E|fast-slow-pointers|Math,Cycle Detection,Hashing|Google,Uber|Repeatedly replace a number by the sum of the squares of its digits and detect whether the process reaches one or loops forever.',
          'Power of Two|E|bit-tricks|Math,Bit Manipulation|Amazon,Google|Determine whether a positive integer is an exact power of two using a single bitwise test.',
          'Add Digits|E|math-number-theory|Math,Digits|Bloomberg|Repeatedly sum the digits of a number until one digit remains, then find the closed-form shortcut for it.',
          'Count Primes|M|math-number-theory|Math,Sieve|Amazon,Microsoft|Count how many primes are strictly below n by crossing out composites with a sieve instead of testing each number.',
          'Excel Sheet Column Number|E|math-number-theory|Math,String,Base Conversion|Microsoft,Facebook|Convert a spreadsheet column label such as AB into its one-based column index, treating it as base 26.',
          'Perfect Number|E|math-number-theory|Math,Divisors|Amazon|Check whether a number equals the sum of its proper divisors by testing divisors only up to the square root.',
        ],
      },
      {
        slug: 'basic-recursion',
        name: 'Basic Recursion',
        description:
          'Three problems that establish the shape of a recursive function: a base case, one smaller call, and a combination step.',
        rows: [
          'Fibonacci Number|E|recursion|Recursion,Memoisation,Math|Amazon,Adobe|Return the nth Fibonacci number, first recursively and then with memoisation so the call tree stops exploding.',
          'Reverse String|E|two-pointers|Recursion,Two Pointers,Strings|Amazon,Apple|Reverse a character array in place, either by swapping from both ends or by recursing inward.',
          'Power of Four|E|bit-tricks|Math,Bit Manipulation,Recursion|Two Sigma|Decide whether a number is a power of four, which needs one more condition than the power-of-two test.',
        ],
      },
      {
        slug: 'basic-hashing',
        name: 'Basic Hashing',
        description:
          'Your first encounters with the hash map and hash set. Nearly every optimisation later in the roadmap starts with "store what you have already seen".',
        rows: [
          'Contains Duplicate|E|hashing|Hash Set,Arrays|Amazon,Apple,Yahoo|Report whether any value appears at least twice, which a hash set answers in a single pass.',
          'Ransom Note|E|counting|Hashing,Counting,Strings|Amazon,Apple|Decide whether one string can be assembled from the letters of another, using each letter at most as often as it appears.',
          'First Unique Character in a String|E|counting|Hashing,Counting,Strings|Amazon,Microsoft,Bloomberg|Find the index of the first character that occurs exactly once, using one pass to count and a second to scan.',
          'Intersection of Two Arrays|E|hashing|Hash Set,Arrays|Facebook,Amazon|Return the distinct values present in both arrays by turning one of them into a set.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'sorting',
    name: 'Sorting',
    icon: 'arrow-down-up',
    description:
      'Write the classic sorts by hand once so the loop invariants stick, then learn the far more common skill: choosing the key that makes a problem trivial to sort into an answer.',
    subtopics: [
      {
        slug: 'sorting-algorithms',
        name: 'Sorting Algorithms From Scratch',
        description:
          'Implement each sort yourself. You will rarely ship these, but the invariants they teach show up everywhere.',
        rows: [
          'Bubble Sort@gfg:bubble-sort/1|E|sorting-algorithm|Sorting,Implementation|-|Repeatedly sweep the array swapping adjacent out-of-order pairs, and stop early once a full pass makes no swaps.',
          'Insertion Sort@gfg:insertion-sort/1|E|sorting-algorithm|Sorting,Implementation|-|Grow a sorted prefix by taking the next element and sliding it left past everything larger than it.',
          'Selection Sort@gfg:selection-sort-1587115621/1|E|sorting-algorithm|Sorting,Implementation|-|Find the smallest remaining element on each pass and swap it into the next unfilled position.',
          'Merge Sort@gfg:merge-sort/1|M|divide-conquer|Sorting,Divide and Conquer,Recursion|Amazon,Microsoft|Split the array in half, sort both halves recursively, then merge them in linear time.',
          'Quick Sort@gfg:quick-sort/1|M|quickselect|Sorting,Divide and Conquer,Partitioning|Amazon,Adobe|Partition around a pivot so smaller values land left and larger right, then recurse into both sides.',
        ],
      },
      {
        slug: 'sorting-applied',
        name: 'Sorting Applied',
        description:
          'Problems where the whole difficulty disappears once you sort by the right key, or where you must sort under a custom rule.',
        rows: [
          'Sort Colors|M|dutch-flag|Sorting,Two Pointers,Partitioning|Microsoft,Amazon,Facebook|Sort an array containing only three distinct values in a single pass with constant extra space.',
          'Merge Sorted Array|E|two-pointers|Sorting,Two Pointers,Arrays|Facebook,Microsoft,Amazon|Merge a second sorted array into the first one in place by filling from the back.',
          'Sort an Array|M|sorting-algorithm|Sorting,Divide and Conquer|Amazon,Google|Sort an integer array without calling the library sort, which forces you to implement merge or heap sort.',
          'Largest Number|M|sorting|Sorting,Comparator,Greedy|Amazon,Microsoft|Arrange numbers so their concatenation is the largest possible value, which needs a carefully chosen comparator.',
          'Relative Sort Array|E|counting|Sorting,Counting,Custom Order|Amazon|Reorder one array to follow the order dictated by another, placing the leftovers in ascending order at the end.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'arrays',
    name: 'Arrays',
    icon: 'layout-grid',
    description:
      'The workhorse topic. Forty problems taking you from one-pass scans and hash lookups through in-place matrix surgery and interval merging, up to the hard counting problems that need a modified merge sort.',
    subtopics: [
      {
        slug: 'easy-arrays',
        name: 'Easy Arrays',
        description:
          'Single-pass scans, in-place rewrites and index-as-hash tricks. Master these and the medium tier stops feeling like a jump.',
        rows: [
          'Two Sum|E|hashing|Hashing,Arrays,Two Pointers|Amazon,Google,Apple,Microsoft|Return the indices of the two values that add up to a target, using a value-to-index map in one pass.',
          'Best Time to Buy and Sell Stock|E|kadane|Arrays,Greedy,Dynamic Programming|Amazon,Facebook,Microsoft|Find the largest gain from one buy and one later sell by tracking the cheapest price seen so far.',
          'Remove Duplicates from Sorted Array|E|two-pointers|Two Pointers,Arrays,In-place|Microsoft,Facebook|Compact a sorted array in place so each value appears once, returning the new logical length.',
          'Remove Element|E|two-pointers|Two Pointers,Arrays,In-place|Amazon|Remove every occurrence of a value in place by overwriting with a slow write pointer.',
          'Move Zeroes|E|two-pointers|Two Pointers,Arrays,In-place|Facebook,Amazon,Bloomberg|Shift all zeroes to the end while keeping the relative order of the non-zero values unchanged.',
          'Plus One|E|simulation|Arrays,Math,Carry|Google,Amazon|Add one to a number represented as a digit array, propagating the carry and growing the array when it overflows.',
          'Find All Numbers Disappeared in an Array|E|cyclic-sort|Arrays,Index as Hash,In-place|Google,Amazon|List the values from 1 to n that never appear, using the array itself as the marker store.',
          'Missing Number|E|bit-tricks|Math,Bit Manipulation,Arrays|Amazon,Microsoft|Find the one absent value in a shuffled range, via the sum formula or by XOR-ing indices against values.',
          "Pascal's Triangle|E|dp-1d|Arrays,Dynamic Programming,Math|Amazon,Apple|Generate the first n rows, where each entry is the sum of the two entries directly above it.",
          'Majority Element|E|moore-voting|Arrays,Voting,Counting|Amazon,Adobe,Zenefits|Find the element appearing more than n/2 times in constant space using a cancellation argument.',
          'Intersection of Two Arrays II|E|counting|Hashing,Two Pointers,Counting|Facebook,Amazon|Return the common elements including multiplicity, which needs counts rather than a plain set.',
          'Third Maximum Number|E|sorting|Arrays,Ordering,Edge Cases|Amazon,Google|Return the third distinct largest value, falling back to the maximum when fewer than three distinct values exist.',
          'Squares of a Sorted Array|E|two-pointers|Two Pointers,Sorting,Arrays|Facebook,Amazon|Square every value of a sorted array and keep the result sorted by filling from the largest magnitude inwards.',
          'Max Consecutive Ones|E|sliding-window|Arrays,Counting,Sliding Window|Google,Amazon|Find the longest unbroken run of ones by resetting a counter whenever a zero appears.',
          'Kids With the Greatest Number of Candies|E|simulation|Arrays,Simulation|Amazon|Decide, for each child, whether giving them all the extra candies would make them tie or beat the current maximum.',
        ],
      },
      {
        slug: 'medium-arrays',
        name: 'Medium Arrays',
        description:
          'Where arrays get interesting: prefix products, in-place matrix transforms, interval merging and the hash-map-of-prefix-sums idea you will reuse constantly.',
        rows: [
          'Maximum Subarray|M|kadane|Kadane,Dynamic Programming,Arrays|Amazon,Microsoft,LinkedIn,Apple|Find the contiguous block with the largest sum by deciding at each index whether to extend or restart.',
          'Rotate Array|M|two-pointers|Arrays,Reversal,In-place|Amazon,Microsoft|Rotate an array right by k positions in place using the reverse-whole-then-reverse-parts trick.',
          'Product of Array Except Self|M|prefix-sum|Prefix Product,Arrays|Amazon,Facebook,Apple,Lyft|Compute, for each index, the product of everything else without using division, via prefix and suffix passes.',
          'Set Matrix Zeroes|M|matrix-manipulation|Matrix,In-place,Arrays|Amazon,Microsoft,Facebook|Zero out the full row and column of every zero cell, using the first row and column as the marker store.',
          'Spiral Matrix|M|matrix-manipulation|Matrix,Simulation,Boundaries|Microsoft,Amazon,Google|Emit a matrix in spiral order by maintaining four boundaries that shrink after each edge is consumed.',
          'Rotate Image|M|matrix-manipulation|Matrix,In-place,Transpose|Amazon,Microsoft,Apple|Rotate a square matrix ninety degrees clockwise in place by transposing and then reversing each row.',
          'Next Permutation|M|two-pointers|Arrays,Permutation,Greedy|Google,Facebook,Amazon|Rearrange the numbers into the next lexicographically larger arrangement, or the smallest one if none exists.',
          'Merge Intervals|M|intervals|Intervals,Sorting,Greedy|Facebook,Google,Amazon,Bloomberg|Combine every group of overlapping intervals into one after sorting by start time.',
          'Insert Interval|M|intervals|Intervals,Sorting,Arrays|Google,Facebook,LinkedIn|Insert a new interval into a sorted disjoint list and merge whatever it now overlaps.',
          'Non-overlapping Intervals|M|intervals|Intervals,Greedy,Sorting|Facebook,Amazon|Remove the fewest intervals needed to leave the rest disjoint, by greedily keeping the earliest finisher.',
          'Find the Duplicate Number|M|fast-slow-pointers|Cycle Detection,Two Pointers,Arrays|Amazon,Bloomberg,Google|Find the single repeated value without modifying the array or using extra space, by treating it as a linked list cycle.',
          'Subarray Sum Equals K|M|prefix-sum|Prefix Sum,Hashing,Arrays|Facebook,Amazon,Google|Count contiguous blocks summing to k by storing prefix-sum frequencies in a map.',
          'Longest Consecutive Sequence|M|hashing|Hash Set,Arrays,Union Find|Google,Facebook,Amazon|Find the longest run of consecutive integers in an unsorted array in linear time using a hash set.',
          'Maximum Product Subarray|M|kadane|Kadane,Dynamic Programming,Arrays|Amazon,LinkedIn,Microsoft|Find the contiguous block with the largest product, tracking both the running maximum and minimum because of negatives.',
          'Majority Element II|M|moore-voting|Voting,Counting,Arrays|Amazon,Google|Find every element appearing more than n/3 times, which needs two candidates and a verification pass.',
        ],
      },
      {
        slug: 'hard-arrays',
        name: 'Hard Arrays',
        description:
          'Counting problems that need a modified merge sort, geometric reasoning, and the two-sided scans behind trapping rain water.',
        rows: [
          'First Missing Positive|H|cyclic-sort|Index as Hash,In-place,Arrays|Amazon,Microsoft,Google|Find the smallest absent positive integer in linear time and constant space by placing each value at its home index.',
          'Trapping Rain Water|H|two-pointers|Two Pointers,Monotonic Stack,Arrays|Amazon,Google,Apple,Bloomberg|Compute the water held between bars, where each position is capped by the smaller of the tallest bars on either side.',
          'Count of Smaller Numbers After Self|H|divide-conquer|Merge Sort,BIT,Divide and Conquer|Google,Amazon|For each index, count how many later elements are smaller, using a merge sort that counts inversions as it merges.',
          'Reverse Pairs|H|divide-conquer|Merge Sort,Divide and Conquer,Counting|Google,Amazon|Count index pairs where the earlier value exceeds twice the later one, counting during a modified merge.',
          'Count of Range Sum|H|divide-conquer|Prefix Sum,Merge Sort,Counting|Google|Count subarrays whose sum falls in a range, by counting qualifying prefix-sum pairs during a merge sort.',
          'Max Points on a Line|H|hashing|Geometry,Hashing,Math|LinkedIn,Apple,Twitter|Find the largest number of points sharing a single straight line, grouping by normalised slope from each anchor point.',
          'Candy|H|greedy|Greedy,Arrays,Two Passes|Amazon,Google,Microsoft|Hand out the fewest sweets so every child rated above a neighbour gets more, using a left pass and a right pass.',
          'Minimum Number of Taps to Open to Water a Garden|H|greedy|Greedy,Intervals,Dynamic Programming|Amazon|Cover a line segment with the fewest intervals, by jumping greedily to the furthest reachable point.',
          'Maximum Number of Visible Points|H|sliding-window|Geometry,Sliding Window,Sorting|Google|Find the most points visible inside a fixed angular window, by sorting polar angles and sliding a window over them.',
          'Create Maximum Number|H|greedy|Greedy,Monotonic Stack,Merging|Google,Amazon|Pick k digits across two arrays preserving order to form the largest number, by splitting k and merging best subsequences.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'binary-search',
    name: 'Binary Search',
    icon: 'crosshair',
    description:
      'Binary search is not really about sorted arrays; it is about monotone predicates. Start on plain arrays, then learn to search the space of possible answers, then take it into two dimensions.',
    subtopics: [
      {
        slug: 'bs-on-arrays',
        name: 'Binary Search on 1D Arrays',
        description:
          'Get the boundary conventions right here, once, and the rest of the topic becomes mechanical.',
        rows: [
          'Binary Search|E|binary-search|Binary Search,Arrays|Amazon,Microsoft|Locate a target in a sorted array in logarithmic time, and settle on one boundary convention you will reuse everywhere.',
          'Search Insert Position|E|binary-search|Binary Search,Lower Bound|Amazon,Google|Find the index of a target, or the position where it would be inserted to keep the array sorted.',
          'Find First and Last Position of Element in Sorted Array|M|binary-search|Binary Search,Lower Bound,Upper Bound|Facebook,LinkedIn,Amazon|Locate the first and last index of a value with two separate boundary searches.',
          'Search in Rotated Sorted Array|M|binary-search|Binary Search,Rotated Array|Amazon,Facebook,Microsoft,Bloomberg|Search a sorted array that has been rotated, by working out which half is still sorted at each step.',
          'Search in Rotated Sorted Array II|M|binary-search|Binary Search,Rotated Array,Duplicates|Amazon,Google|Handle the rotated search when duplicates make it impossible to tell which half is sorted.',
          'Find Minimum in Rotated Sorted Array|M|binary-search|Binary Search,Rotated Array|Amazon,Microsoft,Goldman Sachs|Find the rotation point of a rotated sorted array by comparing the midpoint with the right end.',
          'Find Minimum in Rotated Sorted Array II|H|binary-search|Binary Search,Rotated Array,Duplicates|Amazon,Google|Find the minimum when duplicates break the comparison, and understand why the worst case becomes linear.',
          'Single Element in a Sorted Array|M|binary-search|Binary Search,Parity,Arrays|Amazon,Microsoft|Find the one unpaired value in a sorted array of pairs by using index parity to pick a half.',
          'Find Peak Element|M|binary-search|Binary Search,Peak|Google,Facebook,Microsoft|Find any local maximum in logarithmic time by always walking uphill from the midpoint.',
          'Peak Index in a Mountain Array|M|binary-search|Binary Search,Peak|Amazon,Google|Find the summit of an array that strictly rises then strictly falls.',
          'Guess Number Higher or Lower|E|binary-search|Binary Search,Interactive|Google,Amazon|Narrow a guessing range using only a comparison oracle, which is binary search in its purest form.',
          'First Bad Version|E|binary-search|Binary Search,Boundary Search|Facebook,Amazon|Find the first version that fails a monotone test while making as few calls to the checker as possible.',
          'Find Smallest Letter Greater Than Target|E|binary-search|Binary Search,Upper Bound,Wraparound|LinkedIn|Find the next character strictly greater than a target in a circular sorted list.',
        ],
      },
      {
        slug: 'bs-on-answers',
        name: 'Binary Search on the Answer',
        description:
          'The pattern that unlocks a whole class of problems: define a monotone feasibility check, then binary search the answer space instead of the data.',
        rows: [
          'Sqrt(x)@lc:sqrtx|E|binary-search-answer|Binary Search,Math|Facebook,Amazon,Bloomberg|Compute the integer square root by searching the answer range rather than using a library call.',
          'Valid Perfect Square|E|binary-search-answer|Binary Search,Math|LinkedIn,Amazon|Decide whether a number is an exact square without floating-point arithmetic.',
          'Koko Eating Bananas|M|binary-search-answer|Binary Search on Answer,Greedy|Facebook,Google,Amazon|Find the slowest eating speed that still finishes in time, with hours-needed as the monotone predicate.',
          'Capacity To Ship Packages Within D Days|M|binary-search-answer|Binary Search on Answer,Greedy|Amazon,Google|Find the smallest ship capacity that keeps the shipment within the deadline, packing greedily to test each candidate.',
          'Split Array Largest Sum|H|binary-search-answer|Binary Search on Answer,Dynamic Programming,Greedy|Google,Facebook,Baidu|Split an array into k parts minimising the largest part sum, by searching that sum directly.',
          'Minimum Number of Days to Make m Bouquets|M|binary-search-answer|Binary Search on Answer,Greedy|Google|Find the earliest day on which enough adjacent flowers have bloomed to make the required bouquets.',
          'Find the Smallest Divisor Given a Threshold|M|binary-search-answer|Binary Search on Answer,Math|Google|Find the smallest divisor keeping the sum of rounded-up quotients within a threshold.',
          'Magnetic Force Between Two Balls|M|binary-search-answer|Binary Search on Answer,Greedy,Sorting|Google|Place balls in baskets to maximise the smallest gap, by testing whether a given gap is achievable.',
          'Kth Missing Positive Number|E|binary-search|Binary Search,Counting,Arrays|Amazon,Google|Find the kth positive integer absent from a sorted array, using the gap between value and index.',
          'Aggressive Cows@gfg:aggressive-cows/1|M|binary-search-answer|Binary Search on Answer,Greedy,Sorting|Amazon,Google|Place cows in stalls so the closest pair is as far apart as possible, searching over the minimum distance.',
          'Allocate Minimum Number of Pages@gfg:allocate-minimum-number-of-pages0937/1|H|binary-search-answer|Binary Search on Answer,Greedy|Amazon,Google,Flipkart|Distribute books to students in order, minimising the heaviest reading load any one student receives.',
          'Median of Two Sorted Arrays|H|binary-search|Binary Search,Partitioning,Arrays|Google,Amazon,Adobe,Apple|Find the median of two sorted arrays in logarithmic time by binary searching the split point of the shorter one.',
        ],
      },
      {
        slug: 'bs-on-2d',
        name: 'Binary Search on Matrices',
        description:
          'Two shapes of sorted matrix, two very different techniques — plus searching a value range when the data itself is not directly searchable.',
        rows: [
          'Search a 2D Matrix|M|binary-search-2d|Binary Search,Matrix|Amazon,Microsoft,Facebook|Search a fully sorted matrix by treating it as one flat sorted array with index arithmetic.',
          'Search a 2D Matrix II|M|binary-search-2d|Matrix,Staircase Search|Amazon,Google,Microsoft|Search a row-wise and column-wise sorted matrix by starting at a corner where the two directions disagree.',
          'Find a Peak Element II|M|binary-search-2d|Binary Search,Matrix,Peak|Google,Amazon|Find a cell larger than all four neighbours by binary searching columns and scanning each candidate column.',
          'Kth Smallest Element in a Sorted Matrix|M|binary-search-answer|Binary Search on Answer,Heap,Matrix|Amazon,Google,Facebook|Find the kth smallest value by binary searching the value range and counting how many entries fall below each guess.',
          'Median of a Row Wise Sorted Matrix@gfg:median-in-a-row-wise-sorted-matrix1527/1|H|binary-search-answer|Binary Search on Answer,Matrix|Amazon,Microsoft|Find the median of a matrix whose rows are sorted, by counting elements below a candidate value.',
          'Count Negative Numbers in a Sorted Matrix|E|binary-search-2d|Matrix,Binary Search,Staircase Search|Amazon|Count negative entries in a matrix sorted non-increasingly in both directions, in linear rather than quadratic time.',
          'Find K-th Smallest Pair Distance|H|binary-search-answer|Binary Search on Answer,Two Pointers,Sorting|Google,Amazon|Find the kth smallest absolute difference among all pairs, by counting pairs closer than a candidate distance.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'strings',
    name: 'Strings',
    icon: 'type',
    description:
      'Strings are arrays with a bounded alphabet, which opens doors arrays do not have: counting arrays, rolling hashes and prefix functions. Start with careful case analysis, finish with parsing.',
    subtopics: [
      {
        slug: 'easy-strings',
        name: 'Easy Strings',
        description:
          'Scanning, counting and comparing. The skill being built here is enumerating edge cases before you write a line.',
        rows: [
          'Valid Palindrome|E|two-pointers|Two Pointers,Strings,Parsing|Facebook,Microsoft,Amazon|Check whether a string reads the same both ways once non-alphanumeric characters are ignored and case is folded.',
          'Valid Anagram|E|counting|Counting,Hashing,Strings|Amazon,Google,Bloomberg|Decide whether two strings are rearrangements of each other by comparing letter frequency tables.',
          'Longest Common Prefix|E|string-manipulation|Strings,Scanning|Amazon,Google,Adobe|Find the longest prefix shared by every string in an array, stopping at the first disagreement.',
          'Find the Index of the First Occurrence in a String|E|string-matching|Strings,Pattern Matching,KMP|Facebook,Amazon,Microsoft|Locate the first occurrence of a pattern in a text, naively first and then with a prefix-function table.',
          'Reverse Words in a String III|E|string-manipulation|Strings,Two Pointers|Amazon|Reverse the characters of every word while leaving the word order and spacing intact.',
          'Length of Last Word|E|string-manipulation|Strings,Scanning,Edge Cases|Amazon,Google|Return the length of the final word, taking care with trailing spaces.',
          'Isomorphic Strings|E|hashing|Hashing,Strings,Mapping|LinkedIn,Google,Amazon|Decide whether one string maps onto another under a consistent one-to-one character substitution.',
          'Roman to Integer|E|string-manipulation|Strings,Math,Greedy|Amazon,Microsoft,Facebook|Convert a Roman numeral to its value, subtracting whenever a smaller symbol precedes a larger one.',
        ],
      },
      {
        slug: 'medium-hard-strings',
        name: 'Medium & Hard Strings',
        description:
          'Expansion around centres, grouping by canonical form, and the parsing problems that reward writing the specification down first.',
        rows: [
          'Longest Palindromic Substring|M|two-pointers|Strings,Expand Around Centre,Dynamic Programming|Amazon,Microsoft,Google|Find the longest palindromic substring by expanding outwards from every possible centre.',
          'Group Anagrams|M|hashing|Hashing,Sorting,Strings|Amazon,Facebook,Uber|Bucket words by a canonical form so anagrams land in the same group.',
          'String to Integer (atoi)@lc:string-to-integer-atoi|M|string-manipulation|Strings,Parsing,Edge Cases|Amazon,Microsoft,Facebook|Parse a signed integer from the front of a string, clamping to the 32-bit range and handling whitespace and junk.',
          'Integer to Roman|M|greedy|Greedy,Strings,Math|Amazon,Microsoft|Convert a number to a Roman numeral by greedily subtracting the largest representable value at each step.',
          'Zigzag Conversion|M|simulation|Strings,Simulation|Amazon,PayPal|Write a string in a zigzag across a fixed number of rows, then read it back row by row.',
          'Reverse Words in a String|M|string-manipulation|Strings,Two Pointers,In-place|Microsoft,Amazon,Apple|Reverse the order of the words while collapsing repeated spaces and trimming the ends.',
          'Count and Say|M|string-manipulation|Strings,Simulation,Run Length Encoding|Facebook,Amazon|Generate the next term of a sequence by reading the previous one aloud as counts and digits.',
          'Sort Characters By Frequency|M|counting|Counting,Sorting,Heap|Amazon,Google,Bloomberg|Reorder a string so that characters appear grouped and ordered by how often they occur.',
          'Repeated String Match|M|string-matching|Strings,Pattern Matching|Google|Find how many copies of one string must be concatenated before another becomes a substring.',
          'Shortest Palindrome|H|string-matching|KMP,Strings,Prefix Function|Google,PocketGems|Find the shortest palindrome formed by adding characters only to the front, using the prefix function.',
          'Valid Number|H|simulation|Strings,Parsing,State Machine|LinkedIn,Facebook|Decide whether a string is a valid numeric literal, which is best solved as an explicit state machine.',
          'Text Justification|H|greedy|Strings,Greedy,Simulation|Airbnb,LinkedIn,Google|Pack words into lines of a fixed width and distribute padding spaces as evenly as possible.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'linked-lists',
    name: 'Linked Lists',
    icon: 'link',
    description:
      'Pointer discipline. A dummy head, a saved next pointer and a drawing on paper solve most of these — then the fast and slow pointer trick solves the rest in constant space.',
    subtopics: [
      {
        slug: 'singly-linked-list-basics',
        name: 'Singly Linked List Basics',
        description:
          'Traversal, deletion, reversal and cycle detection. The foundation everything else in this topic builds on.',
        rows: [
          'Design Linked List|M|design-ds|Design,Linked List,Implementation|Amazon,Microsoft|Implement a linked list from scratch with get, insert and delete at arbitrary positions.',
          'Middle of the Linked List|E|fast-slow-pointers|Two Pointers,Linked List|Amazon,Google|Find the middle node in one pass using a pointer that moves twice as fast as the other.',
          'Reverse Linked List|E|linked-list-reversal|Linked List,Reversal,Recursion|Facebook,Amazon,Microsoft,Apple|Reverse a singly linked list in place, iteratively with three pointers and then recursively.',
          'Linked List Cycle|E|fast-slow-pointers|Two Pointers,Cycle Detection,Linked List|Amazon,Microsoft,Bloomberg|Detect whether a list loops back on itself, in constant extra space.',
          'Linked List Cycle II|M|fast-slow-pointers|Two Pointers,Cycle Detection,Linked List|Amazon,Microsoft|Find the node where a cycle begins, using the distance identity that follows from the meeting point.',
          'Remove Linked List Elements|E|linked-list-traversal|Linked List,Deletion,Dummy Head|Apple,Google|Delete every node holding a given value, with a dummy head so removing the first node is not a special case.',
          'Remove Duplicates from Sorted List|E|linked-list-traversal|Linked List,Deletion|Amazon,Microsoft|Collapse runs of equal values in a sorted list so each value appears exactly once.',
          'Merge Two Sorted Lists|E|merge-lists|Linked List,Merging,Two Pointers|Amazon,Apple,Microsoft,LinkedIn|Interleave two sorted lists into one sorted list without allocating new nodes.',
          'Palindrome Linked List|E|fast-slow-pointers|Two Pointers,Reversal,Linked List|Amazon,Facebook,Microsoft|Check whether a list reads the same both ways by reversing the second half in place.',
          'Intersection of Two Linked Lists|E|two-pointers|Two Pointers,Linked List|Amazon,Microsoft,Airbnb|Find the node where two lists merge, by walking both and switching heads so the path lengths even out.',
        ],
      },
      {
        slug: 'doubly-and-circular-lists',
        name: 'Doubly & Circular Lists',
        description:
          'Two pointers per node changes what is cheap. These problems show why the operating-system and browser worlds are full of doubly linked lists.',
        rows: [
          'Design Browser History|M|design-ds|Design,Doubly Linked List,Stack|Amazon,Bloomberg|Support visiting a page and stepping backwards and forwards through history efficiently.',
          'Flatten a Multilevel Doubly Linked List|M|recursion|Doubly Linked List,Recursion,Stack|Amazon,Bloomberg|Splice every child list inline into its parent so the whole structure becomes one flat list.',
          'Design Front Middle Back Queue|M|design-ds|Design,Deque,Doubly Linked List|Amazon|Support pushes and pops at the front, middle and back, all in constant time.',
          'Delete Node in a Linked List|M|linked-list-traversal|Linked List,Deletion,Trick|Amazon,Microsoft,Apple|Delete a node when you are handed only that node, by copying the successor into it.',
          'Design Circular Deque|M|design-ds|Design,Circular Buffer,Deque|Amazon,Google|Implement a fixed-capacity deque over a circular buffer with constant-time operations at both ends.',
        ],
      },
      {
        slug: 'medium-linked-lists',
        name: 'Medium Linked Lists',
        description:
          'Arithmetic on lists, partitioning, sorting in place, and the deep-copy problem that teaches you the interleaving trick.',
        rows: [
          'Add Two Numbers|M|linked-list-traversal|Linked List,Math,Carry|Amazon,Microsoft,Adobe,Bloomberg|Add two numbers stored as reversed digit lists, carrying between nodes as you build the result.',
          'Remove Nth Node From End of List|M|two-pointers|Two Pointers,Linked List,Dummy Head|Facebook,Amazon,Microsoft|Delete the nth node from the end in one pass by keeping two pointers n apart.',
          'Swap Nodes in Pairs|M|linked-list-traversal|Linked List,Pointer Surgery|Amazon,Microsoft,Bloomberg|Exchange every adjacent pair of nodes by relinking rather than by swapping values.',
          'Rotate List|M|linked-list-traversal|Linked List,Two Pointers,Math|Amazon,Microsoft|Rotate a list right by k places, first closing it into a ring and then cutting it at the right point.',
          'Partition List|M|linked-list-traversal|Linked List,Two Pointers,Stable Partition|Amazon,Microsoft|Split a list around a pivot value into a smaller part and a larger part while preserving relative order.',
          'Sort List|M|divide-conquer|Merge Sort,Linked List,Divide and Conquer|Facebook,Amazon,Microsoft|Sort a linked list in O(n log n) time and constant extra space using bottom-up merge sort.',
          'Odd Even Linked List|M|linked-list-traversal|Linked List,Pointer Surgery|Amazon,Microsoft,Bloomberg|Regroup nodes so all odd positions come before all even positions, in place.',
          'Copy List with Random Pointer|M|hashing|Linked List,Hashing,Deep Copy|Amazon,Facebook,Microsoft|Deep-copy a list whose nodes carry an extra arbitrary pointer, using interleaving to avoid a hash map.',
          'Reorder List|M|linked-list-reversal|Linked List,Two Pointers,Reversal|Facebook,Amazon,Microsoft|Interleave a list with its own reverse by splitting at the middle and weaving the halves together.',
          'Remove Duplicates from Sorted List II|M|linked-list-traversal|Linked List,Deletion,Dummy Head|Amazon,Microsoft|Delete every value that appears more than once, keeping only the values that were unique.',
        ],
      },
      {
        slug: 'hard-linked-lists',
        name: 'Hard Linked Lists & Caches',
        description:
          'Group reversal and the two cache designs that come up in system-design interviews as often as in algorithm rounds.',
        rows: [
          'Merge k Sorted Lists|H|heap|Heap,Divide and Conquer,Linked List|Amazon,Facebook,Google,Microsoft|Merge k sorted lists efficiently using either a size-k min-heap or pairwise merging in log k rounds.',
          'Reverse Nodes in k-Group|H|linked-list-reversal|Linked List,Reversal,Recursion|Facebook,Amazon,Microsoft|Reverse the list in blocks of exactly k, leaving any trailing partial block untouched.',
          'LRU Cache|M|design-ds|Design,Hash Map,Doubly Linked List|Amazon,Facebook,Microsoft,Google|Build a fixed-capacity cache with O(1) get and put that evicts whatever was used least recently.',
          'LFU Cache|H|design-ds|Design,Hash Map,Frequency Buckets|Amazon,Google,Bloomberg|Build a cache that evicts the least frequently used entry, breaking ties by recency, in O(1).',
          'Insertion Sort List|M|linked-list-traversal|Linked List,Sorting,Dummy Head|Microsoft,Amazon|Sort a linked list by insertion, splicing each node into a growing sorted prefix.',
          'Split Linked List in Parts|M|linked-list-traversal|Linked List,Math,Partitioning|Amazon,Google|Split a list into k parts whose sizes differ by at most one, with the longer parts first.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'recursion',
    name: 'Recursion',
    icon: 'repeat',
    description:
      'Learn to trust the recursive call. These problems separate the two halves of recursive thinking: defining what the function promises, and handling only the current step.',
    subtopics: [
      {
        slug: 'recursion-patterns',
        name: 'Recursion Patterns',
        description:
          'Halving, doubling and self-similar structure. Each of these has an obvious slow recursion and a much smaller one hiding behind it.',
        rows: [
          'Pow(x, n)@lc:powx-n|M|divide-conquer|Recursion,Divide and Conquer,Math|Facebook,LinkedIn,Google,Bloomberg|Compute a power in logarithmic time by squaring, taking care with negative exponents.',
          'K-th Symbol in Grammar|M|recursion|Recursion,Math,Bit Manipulation|Amazon,Google|Find one symbol of a self-similar binary sequence without generating the whole row.',
          'Count Good Numbers|M|math-number-theory|Recursion,Fast Exponentiation,Math|Google|Count digit strings satisfying a parity and primality rule, using modular fast exponentiation.',
          'Elimination Game|M|recursion|Recursion,Math,Simulation|Bloomberg|Track the surviving number when you alternately eliminate from the left and the right of a shrinking list.',
          'Find the Winner of the Circular Game|M|recursion|Recursion,Josephus,Simulation|Amazon,Google|Solve the Josephus elimination problem with a recurrence instead of simulating every removal.',
          'Tower of Hanoi@gfg:tower-of-hanoi-1587115621/1|M|recursion|Recursion,Classic|Amazon,Microsoft|Move a stack of discs between rods one at a time, never placing a larger disc on a smaller one.',
          'Different Ways to Add Parentheses|M|divide-conquer|Divide and Conquer,Recursion,Memoisation|Facebook,Bloomberg|Enumerate every value an expression can take by splitting at each operator and combining sub-results.',
        ],
      },
      {
        slug: 'recursion-on-structures',
        name: 'Recursion on Strings & Nested Data',
        description:
          'When the input itself is recursive — nested brackets, nested lists, chemical formulae — the parser wants to be recursive too.',
        rows: [
          'Decode String|M|stack-basic|Recursion,Stack,Parsing|Google,Amazon,Facebook|Expand a string with nested repeat counts, either with an explicit stack or with mutual recursion.',
          'Flatten Nested List Iterator|M|design-ds|Design,Recursion,Stack,Iterator|Facebook,Google,Amazon|Build an iterator that walks an arbitrarily nested list of integers in order, lazily.',
          'Number of Atoms|H|recursion|Recursion,Parsing,Stack,Counting|Amazon,Google|Parse a chemical formula with nested groups and multipliers into a sorted count of each element.',
          'Brace Expansion II|H|recursion|Recursion,Parsing,Set Operations|Google|Evaluate a grammar of nested unions and concatenations into the sorted set of strings it denotes.',
          'Special Binary String|H|recursion|Recursion,Greedy,Sorting|Coursera|Produce the lexicographically largest rearrangement by recursively sorting balanced sub-blocks.',
          'Predict the Winner|M|recursion|Recursion,Game Theory,Memoisation|Google,Adobe|Decide whether the first player can avoid losing a turn-taking game, by scoring each state from both sides.',
        ],
      },
      {
        slug: 'divide-and-conquer',
        name: 'Divide & Conquer',
        description:
          'Split, solve, combine — where the interesting work always lives in the combine step.',
        rows: [
          'Beautiful Arrangement|M|backtracking|Backtracking,Recursion,Bitmask|Google,Amazon|Count permutations where every value is divisible by its position or the other way round.',
          'Number of Ways to Reorder Array to Get Same BST|H|divide-conquer|Divide and Conquer,Combinatorics,Recursion|Amazon,Google|Count the orderings that build an identical binary search tree, by interleaving the two subtree sequences.',
          'Longest Substring with At Least K Repeating Characters|M|divide-conquer|Divide and Conquer,Sliding Window,Strings|Google,Bloomberg|Find the longest substring where every character appears at least k times, splitting on characters that cannot qualify.',
          'The Skyline Problem|H|sweep-line|Sweep Line,Heap,Divide and Conquer|Facebook,Amazon,Google|Produce the outline of overlapping rectangles by sweeping over building edges with a max-heap of active heights.',
          'Construct Quad Tree|M|divide-conquer|Divide and Conquer,Recursion,Matrix|Google,Facebook|Compress a binary grid into a quad tree by recursively splitting any region that is not uniform.',
          'Beautiful Array|M|divide-conquer|Divide and Conquer,Construction,Math|Two Sigma|Construct a permutation with no element exactly midway between two others, by building odds and evens separately.',
          'Recover the Original Array|H|two-pointers|Two Pointers,Sorting,Hashing|Google|Recover a hidden array given a shuffled combination of two shifted copies of it.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'backtracking',
    name: 'Backtracking',
    icon: 'git-branch',
    description:
      'Systematic search with an undo button. Three questions define every problem here: what is a choice, what makes it legal, and when is the answer complete.',
    subtopics: [
      {
        slug: 'subsets-and-combinations',
        name: 'Subsets & Combinations',
        description:
          'The take-it-or-leave-it recursion tree, plus the duplicate-skipping rule that stops it emitting the same answer twice.',
        rows: [
          'Subsets|M|backtracking|Backtracking,Bitmask,Recursion|Facebook,Amazon,Microsoft|Generate every subset of a distinct-valued array, by choosing to include or exclude each element.',
          'Subsets II|M|backtracking|Backtracking,Duplicates,Sorting|Facebook,Amazon|Generate every distinct subset when the input contains duplicates, by skipping repeats at the same recursion level.',
          'Combinations|M|backtracking|Backtracking,Combinatorics|Google,Facebook|List every way to choose k values from 1 to n, pruning branches that cannot reach length k.',
          'Combination Sum|M|backtracking|Backtracking,Recursion|Amazon,Facebook,Airbnb|Find every multiset of candidates summing to a target, where each candidate may be reused.',
          'Combination Sum II|M|backtracking|Backtracking,Duplicates,Sorting|Amazon,LinkedIn|Find every distinct combination summing to a target when each candidate may be used only once.',
          'Combination Sum III|M|backtracking|Backtracking,Combinatorics,Pruning|Microsoft,Amazon|Find every set of k distinct digits summing to a target, pruning as soon as the partial sum overshoots.',
          'Letter Combinations of a Phone Number|M|backtracking|Backtracking,Strings,Recursion|Amazon,Facebook,Google,Uber|Enumerate every string spelled by a sequence of phone-keypad digits.',
        ],
      },
      {
        slug: 'permutations-and-partitions',
        name: 'Permutations & Partitions',
        description:
          'Ordering matters here, and so does the cut point. Both need the same swap-recurse-unswap discipline.',
        rows: [
          'Permutations|M|backtracking|Backtracking,Permutations,Swapping|Amazon,Microsoft,LinkedIn|Generate all orderings of distinct values, either by swapping in place or by tracking which values are used.',
          'Permutations II|M|backtracking|Backtracking,Duplicates,Sorting|Microsoft,Facebook|Generate all distinct orderings when values repeat, by sorting and skipping equal siblings.',
          'Generate Parentheses|M|backtracking|Backtracking,Strings,Pruning|Amazon,Google,Facebook,Uber|Produce every balanced bracket string of n pairs by never closing more brackets than you have opened.',
          'Palindrome Partitioning|M|backtracking|Backtracking,Strings,Dynamic Programming|Amazon,Google,Bloomberg|Split a string every possible way so that each piece is a palindrome.',
          'Restore IP Addresses|M|backtracking|Backtracking,Strings,Validation|Amazon,Microsoft|Insert three dots into a digit string every way that yields four valid address octets.',
          'Letter Case Permutation|M|backtracking|Backtracking,Strings,Bitmask|Microsoft,Bloomberg|Produce every string obtained by independently upper- or lower-casing each letter.',
        ],
      },
      {
        slug: 'constraint-search',
        name: 'Constraint Search',
        description:
          'The classic hard backtracking set, where the difference between passing and timing out is entirely about pruning.',
        rows: [
          'N-Queens|H|backtracking|Backtracking,Constraints,Pruning|Amazon,Google,Facebook|Place n queens on an n by n board so none attack another, tracking attacked columns and both diagonals.',
          'N-Queens II|H|backtracking|Backtracking,Constraints,Counting|Amazon,Zenefits|Count the distinct queen placements rather than listing them, which lets you drop the board entirely.',
          'Sudoku Solver|H|backtracking|Backtracking,Constraints,Pruning|Amazon,Uber,Snapchat|Fill a partially completed grid by trying digits and backtracking, with fast row, column and box validity checks.',
          'Word Search|M|backtracking|Backtracking,Grid,DFS|Amazon,Microsoft,Facebook,Bloomberg|Decide whether a word can be spelled by walking through adjacent grid cells without reusing a cell.',
          'Word Search II|H|trie|Trie,Backtracking,Grid|Amazon,Google,Microsoft|Find every dictionary word hidden in a grid, using a trie so one traversal searches all words at once.',
          'Rat in a Maze@gfg:rat-in-a-maze-problem/1|M|backtracking|Backtracking,Grid,Paths|Amazon,Flipkart|List every path a rat can take from corner to corner of a blocked grid, in lexicographic order.',
          'M-Coloring Problem@gfg:m-coloring-problem-1587115620/1|M|backtracking|Backtracking,Graph Colouring,Constraints|Amazon,Microsoft|Decide whether a graph can be coloured with m colours so no edge joins two same-coloured vertices.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'bit-manipulation',
    name: 'Bit Manipulation',
    icon: 'binary',
    description:
      'A small toolbox with outsized reach: clearing the lowest set bit, isolating it, and the fact that XOR cancels duplicates. Write the binary out by hand for the first few cases.',
    subtopics: [
      {
        slug: 'bit-basics',
        name: 'Bit Basics',
        description:
          'The operations themselves. Short problems chosen so the trick is visible the moment you write the numbers in binary.',
        rows: [
          'Number of 1 Bits|E|bit-tricks|Bit Manipulation,Counting|Apple,Microsoft,Amazon|Count the set bits in an integer, first by shifting and then with the clear-lowest-set-bit idiom.',
          'Counting Bits|E|dp-1d|Bit Manipulation,Dynamic Programming|Amazon,Facebook|Count set bits for every number up to n in linear total time by reusing an already computed answer.',
          'Reverse Bits|E|bit-tricks|Bit Manipulation,Shifting|Apple,Airbnb,Amazon|Reverse the 32 bits of an unsigned integer by pulling bits off one end and pushing them onto the other.',
          'Single Number|E|bit-tricks|XOR,Bit Manipulation,Arrays|Amazon,Airbnb,Palantir|Find the one value appearing once when every other appears twice, using XOR in constant space.',
          'Complement of Base 10 Integer|E|bit-tricks|Bit Manipulation,Masking|Amazon|Flip every bit of a number within its own bit width, which needs a mask rather than a plain complement.',
          'Hamming Distance|E|bit-tricks|XOR,Bit Manipulation|Facebook,Amazon|Count the positions at which two integers differ, by counting set bits in their XOR.',
          'Add Binary|E|string-manipulation|Bit Manipulation,Strings,Carry|Facebook,Amazon,Microsoft|Add two binary strings digit by digit, propagating the carry from the least significant end.',
          'Binary Number with Alternating Bits|E|bit-tricks|Bit Manipulation,Shifting|Yahoo|Check whether a number never has two equal adjacent bits, using a single shift and XOR.',
        ],
      },
      {
        slug: 'bit-tricks-and-xor',
        name: 'Bit Tricks & XOR',
        description:
          'Where bit manipulation stops being a party trick: counting modulo three per bit position, and doing arithmetic without arithmetic operators.',
        rows: [
          'Single Number II|M|bit-tricks|Bit Manipulation,Counting,XOR|Amazon,Google,Bloomberg|Find the value appearing once when every other appears three times, by counting each bit position modulo three.',
          'Single Number III|M|bit-tricks|XOR,Bit Manipulation,Partitioning|Amazon,Microsoft|Find the two values appearing once, by splitting the array on a bit where the two answers differ.',
          'Bitwise AND of Numbers Range|M|bit-tricks|Bit Manipulation,Math|Amazon,Facebook|Compute the AND over a whole range of integers, which reduces to finding their common binary prefix.',
          'Divide Two Integers|M|bit-tricks|Bit Manipulation,Math,Overflow|Facebook,Amazon,Microsoft|Divide without using multiplication, division or the modulo operator, by subtracting shifted multiples.',
          'Total Hamming Distance|M|bit-tricks|Bit Manipulation,Counting,Math|Facebook|Sum the pairwise bit differences across an array by counting, per bit position, how many numbers have it set.',
          'Minimum Flips to Make a OR b Equal to c|M|bit-tricks|Bit Manipulation,Greedy|Amazon|Count the single-bit flips needed so that two numbers OR together into a third.',
          'Gray Code|M|bit-tricks|Bit Manipulation,Construction,Backtracking|Amazon,Google|Generate an ordering of all n-bit numbers where consecutive entries differ in exactly one bit.',
          'Sum of Two Integers|M|bit-tricks|Bit Manipulation,Math|Amazon,Microsoft,Hulu|Add two integers using only bitwise operations, with XOR for the sum and AND plus a shift for the carry.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'stack-and-queue',
    name: 'Stack and Queue',
    icon: 'layers',
    description:
      'Two structures, one big idea each: the stack remembers what is still unresolved, and the monotonic variant of it answers every "nearest greater element" question in linear time.',
    subtopics: [
      {
        slug: 'implementations',
        name: 'Implementations & Design',
        description:
          'Build the structures before you use them. The amortised argument behind two-stack queues is worth understanding properly.',
        rows: [
          'Implement Stack using Queues|E|design-ds|Design,Stack,Queue|Amazon,Microsoft,Bloomberg|Simulate stack behaviour with queue operations only, deciding whether push or pop carries the cost.',
          'Implement Queue using Stacks|E|design-ds|Design,Stack,Queue,Amortised Analysis|Amazon,Microsoft,Facebook|Simulate a queue with two stacks, pouring across only when the output stack runs dry.',
          'Min Stack|M|design-ds|Design,Stack,Auxiliary State|Amazon,Google,Bloomberg|Support push, pop, top and minimum in constant time by carrying the running minimum alongside each entry.',
          'Design Circular Queue|M|design-ds|Design,Circular Buffer,Queue|Amazon,Google|Implement a fixed-capacity queue over an array with wraparound head and tail indices.',
          'Design a Stack With Increment Operation|M|design-ds|Design,Stack,Lazy Propagation|Amazon|Support an operation that adds a value to the bottom k elements in constant time, using a lazy increment array.',
          'Number of Recent Calls|E|queue-basic|Queue,Sliding Window,Design|Amazon,Google|Count how many requests fell inside the last three thousand milliseconds, evicting stale ones from a queue.',
          'Design Underground System|M|design-ds|Design,Hash Map|Amazon,Google,Twitter|Track journeys between stations and report the average travel time for any station pair.',
        ],
      },
      {
        slug: 'expression-evaluation',
        name: 'Brackets & Expression Evaluation',
        description:
          'The canonical use of a stack: matching what is open against what closes it, and evaluating expressions without building a parse tree.',
        rows: [
          'Valid Parentheses|E|stack-basic|Stack,Strings,Matching|Amazon,Google,Facebook,Microsoft|Decide whether brackets are correctly nested and closed, using a stack of open brackets.',
          'Evaluate Reverse Polish Notation|M|stack-basic|Stack,Parsing,Math|Amazon,LinkedIn|Evaluate a postfix expression by pushing operands and applying each operator to the top two.',
          'Basic Calculator|H|stack-basic|Stack,Parsing,Recursion|Google,Facebook,Amazon|Evaluate an expression with plus, minus, unary signs and nested parentheses, keeping a sign stack.',
          'Basic Calculator II|M|stack-basic|Stack,Parsing,Precedence|Amazon,Facebook,Google|Evaluate an expression with all four operators by deferring additions and resolving products immediately.',
          'Simplify Path|M|stack-basic|Stack,Strings,Parsing|Facebook,Amazon,Microsoft|Canonicalise a Unix-style path by pushing directory names and popping on each parent reference.',
          'Remove Outermost Parentheses|E|stack-basic|Stack,Strings,Counting|Amazon|Strip the outer bracket of each primitive block, which a running depth counter tracks without a real stack.',
        ],
      },
      {
        slug: 'monotonic-stack',
        name: 'Monotonic Stack',
        description:
          'One idea, nine problems. Keep the stack sorted, and the moment you pop something you have found its nearest greater or smaller neighbour.',
        rows: [
          'Next Greater Element I|E|stack-monotonic|Monotonic Stack,Hashing|Amazon,Bloomberg|For each value in a subset, find the next larger value to its right in the full array.',
          'Next Greater Element II|M|stack-monotonic|Monotonic Stack,Circular Array|Amazon,Google|Solve the next-greater problem on a circular array by sweeping the array twice.',
          'Daily Temperatures|M|stack-monotonic|Monotonic Stack,Arrays|Amazon,Facebook,Google|For each day, find how long you wait for a warmer one, recording the answer as you pop.',
          'Online Stock Span|M|stack-monotonic|Monotonic Stack,Design,Streaming|Amazon,Bloomberg|Report, for each streamed price, how many consecutive earlier prices were no greater than it.',
          'Largest Rectangle in Histogram|H|stack-monotonic|Monotonic Stack,Arrays|Amazon,Google,Facebook|Find the largest rectangle fitting under a histogram, using the stack to find the span of each bar.',
          'Maximal Rectangle|H|stack-monotonic|Monotonic Stack,Matrix,Dynamic Programming|Amazon,Google,Facebook|Find the largest all-ones rectangle in a binary matrix, by turning each row into a histogram.',
          'Sum of Subarray Minimums|M|stack-monotonic|Monotonic Stack,Counting,Contribution|Amazon,Google|Sum the minimum of every subarray by counting how many subarrays each element is the minimum of.',
          'Remove K Digits|M|stack-monotonic|Monotonic Stack,Greedy,Strings|Google,Amazon,Facebook|Delete k digits to leave the smallest possible number, popping larger digits when a smaller one arrives.',
          'Asteroid Collision|M|stack-basic|Stack,Simulation|Amazon,Google|Simulate collisions between left- and right-moving bodies, resolving each impact against the stack top.',
        ],
      },
      {
        slug: 'stack-applications',
        name: 'Stack & Queue Applications',
        description:
          'Problems that do not look like stack problems until you notice something is waiting to be resolved.',
        rows: [
          'Longest Valid Parentheses|H|stack-basic|Stack,Dynamic Programming,Strings|Amazon,Google,Facebook|Find the longest correctly matched bracket substring, using a stack of indices as boundaries.',
          'Car Fleet|M|stack-monotonic|Monotonic Stack,Sorting,Greedy|Google,Amazon|Count how many groups of cars arrive together, by comparing arrival times from the destination backwards.',
          'Remove All Adjacent Duplicates In String|E|stack-basic|Stack,Strings|Facebook,Amazon|Repeatedly delete adjacent equal characters until none remain, which one stack pass achieves.',
          'Remove All Adjacent Duplicates in String II|M|stack-basic|Stack,Strings,Counting|Google,Amazon|Delete every run of exactly k equal adjacent characters, keeping counts alongside the stack entries.',
          'Score of Parentheses|M|stack-basic|Stack,Strings,Recursion|Facebook,Amazon|Score a balanced bracket string where nesting multiplies and adjacency adds.',
          'Exclusive Time of Functions|M|stack-basic|Stack,Simulation,Parsing|Facebook,Amazon,Uber|Compute the running time of each function itself from a log of start and end events on a single thread.',
          'Minimum Remove to Make Valid Parentheses|M|stack-basic|Stack,Strings,Greedy|Facebook,Amazon|Delete the fewest brackets needed to make a string valid, marking unmatched positions in one pass.',
          'The Celebrity Problem@gfg:the-celebrity-problem/1|M|stack-basic|Stack,Two Pointers,Elimination|Amazon,Microsoft,Flipkart|Find the person everyone knows but who knows nobody, eliminating one candidate per comparison.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'sliding-window-and-two-pointers',
    name: 'Sliding Window and Two Pointers',
    icon: 'move-horizontal',
    description:
      'Two techniques that turn quadratic double loops into linear sweeps. The two-pointer version needs an ordering; the sliding-window version needs a monotone validity condition.',
    subtopics: [
      {
        slug: 'two-pointers',
        name: 'Two Pointers',
        description:
          'Sort first, then let the comparison tell you which pointer to move. The k-sum family is the best drill for this.',
        rows: [
          'Two Sum II - Input Array Is Sorted|M|two-pointers|Two Pointers,Binary Search,Arrays|Amazon,Facebook|Find the pair summing to a target in a sorted array using pointers from both ends and no extra space.',
          '3Sum|M|two-pointers|Two Pointers,Sorting,Arrays|Facebook,Amazon,Microsoft,Adobe|Find every distinct triple summing to zero, by fixing one value and two-pointering the rest.',
          '3Sum Closest|M|two-pointers|Two Pointers,Sorting,Arrays|Amazon,Bloomberg|Find the triple whose sum comes nearest to a target, tracking the best difference as you sweep.',
          '4Sum|M|two-pointers|Two Pointers,Sorting,Arrays|Amazon,Adobe|Find every distinct quadruple summing to a target, with two fixed indices wrapping the two-pointer scan.',
          'Container With Most Water|M|two-pointers|Two Pointers,Greedy,Arrays|Amazon,Facebook,Bloomberg|Choose two lines holding the most water, always moving the shorter side inwards.',
          'Sort Array By Parity|E|two-pointers|Two Pointers,Partitioning,Arrays|Amazon|Rearrange an array so every even value precedes every odd one, in a single in-place partition.',
          'Boats to Save People|M|two-pointers|Two Pointers,Greedy,Sorting|Amazon,Google|Use the fewest boats of a fixed weight limit by pairing the heaviest remaining person with the lightest.',
          'Valid Palindrome II|E|two-pointers|Two Pointers,Strings,Greedy|Facebook,Amazon|Decide whether deleting at most one character can make a string a palindrome.',
          'Merge Strings Alternately|E|two-pointers|Two Pointers,Strings|Amazon|Interleave two strings character by character, appending whatever remains of the longer one.',
        ],
      },
      {
        slug: 'sliding-window',
        name: 'Sliding Window',
        description:
          'Expand right greedily, shrink left only while invalid, and keep a summary so every move is constant time.',
        rows: [
          'Longest Substring Without Repeating Characters|M|sliding-window|Sliding Window,Hashing,Strings|Amazon,Facebook,Google,Bloomberg|Find the longest stretch with no repeated character, moving the left edge past the previous occurrence.',
          'Longest Repeating Character Replacement|M|sliding-window|Sliding Window,Counting,Strings|Google,Amazon|Find the longest run achievable by replacing at most k characters, tracking the most frequent letter in the window.',
          'Permutation in String|M|sliding-window|Sliding Window,Counting,Strings|Microsoft,Facebook,Amazon|Decide whether any rearrangement of one string appears as a contiguous block of another.',
          'Find All Anagrams in a String|M|sliding-window|Sliding Window,Counting,Strings|Amazon,Facebook|List every start index where an anagram of a pattern begins, using a fixed-width count window.',
          'Minimum Window Substring|H|sliding-window|Sliding Window,Counting,Strings|Facebook,Amazon,LinkedIn,Uber|Find the shortest substring containing every required character with multiplicity.',
          'Sliding Window Maximum|H|deque-window|Monotonic Deque,Sliding Window,Arrays|Amazon,Google,Facebook|Report the maximum of every window of width k, keeping a decreasing deque of candidate indices.',
          'Max Consecutive Ones III|M|sliding-window|Sliding Window,Arrays,Counting|Facebook,Amazon|Find the longest run of ones you can create by flipping at most k zeroes.',
          'Fruit Into Baskets|M|sliding-window|Sliding Window,Hashing,Arrays|Google,Amazon|Find the longest stretch containing at most two distinct values, which is the two-type window problem in disguise.',
          'Subarrays with K Different Integers|H|sliding-window|Sliding Window,Counting,Arrays|Amazon,Google|Count subarrays with exactly k distinct values, as the difference between at-most-k and at-most-k-minus-one.',
          'Minimum Size Subarray Sum|M|sliding-window|Sliding Window,Two Pointers,Prefix Sum|Facebook,Amazon,Google|Find the shortest subarray whose sum reaches a target, shrinking from the left whenever it already does.',
          'Maximum Points You Can Obtain from Cards|M|sliding-window|Sliding Window,Prefix Sum,Arrays|Amazon,Google|Take k cards only from the two ends to maximise the total, by minimising the fixed-size middle window instead.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'heaps',
    name: 'Heaps',
    icon: 'triangle',
    description:
      'A heap gives you the extreme element cheaply without paying for a full sort. The counter-intuitive bit — a min-heap for the k largest — is worth internalising early.',
    subtopics: [
      {
        slug: 'heap-basics',
        name: 'Heap Basics',
        description:
          'Get comfortable with push, pop and the bounded-size heap before the harder combinations.',
        rows: [
          'Kth Largest Element in an Array|M|heap|Heap,Quickselect,Sorting|Facebook,Amazon,Microsoft,LinkedIn|Find the kth largest value, with a size-k min-heap or with quickselect for expected linear time.',
          'Last Stone Weight|E|heap|Heap,Simulation|Amazon|Repeatedly smash the two heaviest stones together and report what survives.',
          'Kth Largest Element in a Stream|E|heap|Heap,Design,Streaming|Amazon,Facebook|Maintain the kth largest value as numbers arrive, by capping a min-heap at size k.',
          'Relative Ranks|E|heap|Heap,Sorting|Google|Assign medals and placings to scores, which is a sort with an index-preserving twist.',
          'Take Gifts From the Richest Pile|E|heap|Heap,Simulation,Math|Amazon|Repeatedly replace the largest pile with its integer square root and report the remaining total.',
        ],
      },
      {
        slug: 'top-k-and-frequency',
        name: 'Top-K & Frequency',
        description:
          'Counting plus a heap, or counting plus buckets. Knowing when bucketing beats the heap is the real lesson here.',
        rows: [
          'Top K Frequent Elements|M|top-k|Heap,Bucket Sort,Counting|Amazon,Facebook,Google,Uber|Return the k most common values using a frequency map plus either a bounded heap or frequency buckets.',
          'K Closest Points to Origin|M|top-k|Heap,Quickselect,Geometry|Amazon,Facebook,Google|Return the k points nearest the origin, comparing squared distances so no square roots are needed.',
          'Top K Frequent Words|M|top-k|Heap,Counting,Custom Order|Amazon,Bloomberg,Uber|Return the k most common words, breaking frequency ties alphabetically.',
          'Reorganize String|M|heap|Heap,Greedy,Counting|Facebook,Amazon,Google|Rearrange a string so no two adjacent characters match, always placing the most plentiful remaining character.',
          'Task Scheduler|M|greedy|Greedy,Counting,Heap|Facebook,Amazon,Uber|Find the minimum schedule length when identical tasks must be separated by a cooldown.',
          'Find K Pairs with Smallest Sums|M|heap|Heap,Sorting,Two Pointers|Google,Amazon,LinkedIn|Return the k pairs with the smallest sums across two sorted arrays, expanding a frontier with a heap.',
        ],
      },
      {
        slug: 'advanced-heap',
        name: 'Advanced Heap Problems',
        description:
          'Two heaps facing each other, heaps combined with sorting, and heaps driving a greedy schedule.',
        rows: [
          'Find Median from Data Stream|H|two-heaps|Two Heaps,Design,Streaming|Amazon,Google,Facebook,Microsoft|Report the running median of a stream by splitting the data across a max-heap and a min-heap.',
          'Sliding Window Median|H|two-heaps|Two Heaps,Sliding Window,Design|Facebook,Amazon|Report the median of every window of width k, which needs lazy deletion from the two heaps.',
          'IPO|H|heap|Heap,Greedy,Sorting|Facebook,Google,Amazon|Pick at most k projects to maximise capital, unlocking affordable projects into a max-heap of profits.',
          'Minimum Cost to Hire K Workers|H|heap|Heap,Greedy,Sorting|Google,Airbnb|Hire k workers at minimum cost under a fair-wage rule, by fixing the wage ratio and keeping the cheapest quality.',
          'Smallest Range Covering Elements from K Lists|H|heap|Heap,Sliding Window,Merging|Amazon,Google,LinkedIn|Find the narrowest range touching every list, by advancing the list whose current value is smallest.',
          'Ugly Number II|M|heap|Heap,Dynamic Programming,Math|Amazon,Bloomberg|Generate the nth number whose only prime factors are two, three and five, using three merge pointers or a heap.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'greedy-algorithms',
    name: 'Greedy Algorithms',
    icon: 'zap',
    description:
      'Commit to the locally best choice and never look back. The technique is easy; knowing when it is actually correct is the skill, so try to break each rule before you trust it.',
    subtopics: [
      {
        slug: 'classic-greedy',
        name: 'Classic Greedy',
        description:
          'Reachability, intervals and partitions — the problems where the greedy rule is provable in a sentence.',
        rows: [
          'Assign Cookies|E|greedy|Greedy,Sorting,Two Pointers|Amazon|Satisfy the most children by giving each the smallest cookie that is still big enough.',
          'Lemonade Change|E|greedy|Greedy,Simulation|Amazon,Apple|Decide whether you can give change to every customer, always spending the largest useful note first.',
          'Jump Game|M|greedy|Greedy,Arrays,Reachability|Amazon,Microsoft,Facebook|Decide whether the last index is reachable, by tracking the furthest position reachable so far.',
          'Jump Game II|M|greedy|Greedy,BFS,Arrays|Amazon,Facebook,Google|Reach the end in the fewest jumps, treating each jump as a level of a breadth-first search.',
          'Gas Station|M|greedy|Greedy,Arrays,Prefix Sum|Amazon,Google,Bloomberg|Find the only viable starting station on a circular route, restarting whenever the running tank goes negative.',
          'Partition Labels|M|greedy|Greedy,Hashing,Two Pointers|Amazon,Facebook,Google|Cut a string into the most parts such that no letter appears in more than one part.',
          'Minimum Number of Arrows to Burst Balloons|M|intervals|Greedy,Intervals,Sorting|Amazon,Facebook|Pop every balloon with the fewest shots, by sorting on end points and shooting at each earliest end.',
          'Queue Reconstruction by Height|M|greedy|Greedy,Sorting,Insertion|Amazon,Google,Facebook|Rebuild a queue from height-and-count pairs by inserting the tallest people first.',
        ],
      },
      {
        slug: 'scheduling-and-exchange',
        name: 'Scheduling & Exchange Arguments',
        description:
          'Resource allocation problems where sorting by the right key is the entire algorithm.',
        rows: [
          'Minimum Number of Platforms@gfg:minimum-platforms-1587115620/1|M|sweep-line|Greedy,Sweep Line,Sorting|Amazon,Goldman Sachs,Flipkart|Find the fewest platforms a station needs, by sweeping arrival and departure events in time order.',
          'Job Sequencing Problem@gfg:job-sequencing-problem-1587115620/1|M|greedy|Greedy,Sorting,Disjoint Set|Amazon,Microsoft,Flipkart|Schedule unit-length jobs before their deadlines to maximise profit, placing each as late as it can go.',
          'Fractional Knapsack@gfg:fractional-knapsack-1587115620/1|M|greedy|Greedy,Sorting,Ratios|Amazon,Flipkart|Fill a bag by value-to-weight ratio, taking a fraction of the final item, which is where it differs from 0/1 knapsack.',
          'Two City Scheduling|M|greedy|Greedy,Sorting,Exchange Argument|Amazon,Bloomberg|Send half the candidates to each city at least cost, by sorting on the difference between the two prices.',
          'Advantage Shuffle|M|greedy|Greedy,Sorting,Two Pointers|Google,Amazon|Maximise the number of positions where your value beats the opponent, sacrificing your weakest when you cannot win.',
          'Maximum Units on a Truck|E|greedy|Greedy,Sorting|Amazon|Load the truck with the highest-value boxes first until the capacity runs out.',
          'Best Time to Buy and Sell Stock II|M|greedy|Greedy,Arrays,Dynamic Programming|Amazon,Bloomberg,Microsoft|Maximise profit with unlimited transactions by capturing every upward step.',
          'Remove Duplicate Letters|M|stack-monotonic|Greedy,Monotonic Stack,Strings|Google,Amazon,Bloomberg|Keep one copy of each letter so the result is lexicographically smallest, popping when a letter reappears later.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'binary-trees',
    name: 'Binary Trees',
    icon: 'git-fork',
    description:
      'Thirty-nine problems that all reduce to one question: what does each child report upward, and what does the parent pass down? Get that right and the code is five lines.',
    subtopics: [
      {
        slug: 'traversals',
        name: 'Traversals',
        description:
          'Depth-first in three orders, breadth-first level by level, and the views that fall out of them.',
        rows: [
          'Binary Tree Inorder Traversal|E|tree-dfs|Tree,DFS,Stack|Microsoft,Amazon,Facebook|Visit left subtree, node, then right subtree, first recursively and then with an explicit stack.',
          'Binary Tree Preorder Traversal|E|tree-dfs|Tree,DFS,Stack|Microsoft,Amazon|Visit the node before its children, which is the traversal that serialises a tree most naturally.',
          'Binary Tree Postorder Traversal|E|tree-dfs|Tree,DFS,Stack|Facebook,Amazon|Visit both children before the node, which is the order for any bottom-up aggregation.',
          'Binary Tree Level Order Traversal|M|tree-bfs|Tree,BFS,Queue|Amazon,Microsoft,Facebook,LinkedIn|Group nodes by depth, taking a snapshot of the queue size to separate the levels.',
          'Binary Tree Level Order Traversal II|M|tree-bfs|Tree,BFS,Queue|Amazon,Microsoft|Produce the levels from the deepest upwards, which is the same traversal reversed.',
          'Binary Tree Zigzag Level Order Traversal|M|tree-bfs|Tree,BFS,Queue|Amazon,Microsoft,LinkedIn|Alternate the reading direction on each level while keeping one ordinary level-order sweep.',
          'Binary Tree Right Side View|M|tree-bfs|Tree,BFS,DFS|Facebook,Amazon,Bloomberg|List the nodes visible from the right, which is the last node of each level.',
          'Average of Levels in Binary Tree|E|tree-bfs|Tree,BFS,Queue|Facebook,Amazon|Report the mean value at each depth using a level-by-level sweep.',
          'N-ary Tree Level Order Traversal|M|tree-bfs|Tree,BFS,N-ary Tree|Amazon,LinkedIn|Run level-order on a tree where nodes hold a list of children rather than exactly two.',
        ],
      },
      {
        slug: 'tree-properties',
        name: 'Tree Properties',
        description:
          'Height, balance, symmetry and equality. All of them are one postorder pass with a carefully chosen return value.',
        rows: [
          'Maximum Depth of Binary Tree|E|tree-dfs|Tree,DFS,Recursion|Amazon,LinkedIn,Google|Find the longest root-to-leaf path length, which is one plus the deeper of the two subtrees.',
          'Balanced Binary Tree|E|tree-dfs|Tree,DFS,Recursion|Amazon,Facebook,Google|Decide whether every node has subtrees within one level of each other, returning height and validity together.',
          'Diameter of Binary Tree|E|tree-dfs|Tree,DFS,Recursion|Facebook,Amazon,Google|Find the longest path between any two nodes, updating a shared best while each call returns its height.',
          'Same Tree|E|tree-dfs|Tree,DFS,Recursion|Amazon,Bloomberg|Decide whether two trees have identical structure and values by recursing in lockstep.',
          'Symmetric Tree|E|tree-dfs|Tree,DFS,Recursion|Amazon,Microsoft,LinkedIn|Decide whether a tree mirrors itself, by comparing the left subtree against the reversed right subtree.',
          'Invert Binary Tree|E|tree-dfs|Tree,DFS,Recursion|Google,Amazon,Microsoft|Mirror a tree by swapping the children of every node.',
          'Minimum Depth of Binary Tree|E|tree-bfs|Tree,BFS,DFS|Facebook,Amazon|Find the shallowest leaf, where breadth-first search can stop the moment it meets one.',
          'Count Complete Tree Nodes|E|tree-dfs|Tree,Binary Search,Recursion|Facebook,Google,Amazon|Count the nodes of a complete tree faster than linear time, by comparing left and right spine depths.',
          'Sum of Left Leaves|E|tree-dfs|Tree,DFS,Recursion|Adobe,Amazon|Total the values of every leaf that is a left child, which needs the parent to pass down which side it is on.',
          'Subtree of Another Tree|E|tree-dfs|Tree,DFS,String Matching|Amazon,Facebook,Google|Decide whether one tree appears as a complete subtree of another.',
        ],
      },
      {
        slug: 'paths-and-ancestors',
        name: 'Paths & Ancestors',
        description:
          'Where the answer bends at a node rather than running straight down. The return value and the shared best become two different things.',
        rows: [
          'Path Sum|E|tree-dfs|Tree,DFS,Recursion|Amazon,Microsoft|Decide whether some root-to-leaf path adds up to a target, subtracting as you descend.',
          'Path Sum II|M|backtracking|Tree,DFS,Backtracking|Amazon,Facebook,Bloomberg|List every root-to-leaf path summing to a target, undoing each node on the way back up.',
          'Path Sum III|M|prefix-sum|Tree,Prefix Sum,Hashing|Amazon,Facebook,Google|Count downward paths summing to a target, by carrying a map of prefix sums along the current root path.',
          'Binary Tree Maximum Path Sum|H|tree-dfs|Tree,DFS,Recursion|Facebook,Amazon,Microsoft,Google|Find the best path between any two nodes, returning the best straight branch while tracking the best bend.',
          'Lowest Common Ancestor of a Binary Tree|M|tree-lca|Tree,DFS,LCA|Facebook,Amazon,Microsoft,LinkedIn|Find the deepest node having both targets in its subtree, in a single postorder pass.',
          'Binary Tree Paths|E|backtracking|Tree,DFS,Backtracking,Strings|Google,Facebook,Apple|List every root-to-leaf path as a string, appending and removing as you recurse.',
          'Sum Root to Leaf Numbers|M|tree-dfs|Tree,DFS,Recursion|Facebook,Amazon,Microsoft|Read each root-to-leaf path as a number and total them, building the value as you descend.',
          'All Nodes Distance K in Binary Tree|M|graph-bfs|Tree,BFS,Graph Conversion|Amazon,Facebook,LinkedIn|Find every node exactly k steps from a target, by adding parent links and running a graph BFS.',
          'Amount of Time for Binary Tree to Be Infected|M|graph-bfs|Tree,BFS,Graph Conversion|Amazon,Google|Find how long an infection takes to spread from one node through the whole tree.',
          'Maximum Width of Binary Tree|M|tree-bfs|Tree,BFS,Indexing|Amazon,Bloomberg|Find the widest level, measuring the gap between the leftmost and rightmost positions using heap indices.',
        ],
      },
      {
        slug: 'construction-and-serialization',
        name: 'Construction & Serialization',
        description:
          'Rebuilding a tree from traversals, flattening it, and turning it into a string and back again.',
        rows: [
          'Construct Binary Tree from Preorder and Inorder Traversal|M|tree-construction|Tree,Recursion,Hashing|Facebook,Amazon,Microsoft,Bloomberg|Rebuild a tree from two traversals, using an index map so locating the root is constant time.',
          'Construct Binary Tree from Inorder and Postorder Traversal|M|tree-construction|Tree,Recursion,Hashing|Amazon,Microsoft|Rebuild a tree when the root comes from the end of the postorder sequence instead of the start.',
          'Serialize and Deserialize Binary Tree|H|tree-construction|Tree,DFS,Design,Strings|Amazon,Facebook,Google,LinkedIn|Encode a tree as a string and decode it back, using explicit null markers so the shape survives.',
          'Flatten Binary Tree to Linked List|M|tree-dfs|Tree,DFS,In-place|Facebook,Amazon,Microsoft|Rewire a tree into a right-leaning list following preorder, in constant extra space.',
          'Populating Next Right Pointers in Each Node|M|tree-bfs|Tree,BFS,Linked List|Facebook,Amazon,Microsoft|Link each node to its right neighbour on the same level of a perfect tree, in constant space.',
          'Populating Next Right Pointers in Each Node II|M|tree-bfs|Tree,BFS,Linked List|Facebook,Amazon|Do the same for an arbitrary tree, where gaps mean you must build each level from the one above.',
          'Merge Two Binary Trees|E|tree-dfs|Tree,DFS,Recursion|Amazon,Adobe|Overlay two trees, summing overlapping nodes and keeping whichever subtree the other lacks.',
          'Construct String from Binary Tree|M|tree-dfs|Tree,DFS,Strings|Amazon,Facebook|Serialise a tree into a bracketed string, omitting empty brackets only where they are unambiguous.',
          'Vertical Order Traversal of a Binary Tree|H|tree-bfs|Tree,BFS,Sorting,Hashing|Facebook,Amazon,Google|Group nodes by horizontal offset, breaking ties by depth and then by value.',
          'Find Duplicate Subtrees|M|tree-construction|Tree,Hashing,Serialisation|Google,Amazon|Find every subtree shape that occurs more than once, by hashing a canonical serialisation of each one.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'binary-search-trees',
    name: 'Binary Search Trees',
    icon: 'search',
    description:
      'Add an ordering to a binary tree and traversal becomes search. The inorder sequence being sorted is the fact that solves most of these.',
    subtopics: [
      {
        slug: 'bst-fundamentals',
        name: 'BST Fundamentals',
        description:
          'Search, insert, delete and validate. Validation is the one people get wrong, because it is not a local check.',
        rows: [
          'Search in a Binary Search Tree|E|bst-property|BST,Search,Recursion|Amazon,Microsoft|Locate a value by comparing at each node and discarding the subtree that cannot contain it.',
          'Insert into a Binary Search Tree|M|bst-property|BST,Insertion,Recursion|Amazon,Facebook|Add a value as a new leaf by descending until the appropriate empty slot is reached.',
          'Delete Node in a BST|M|bst-property|BST,Deletion,Recursion|Amazon,Microsoft,Uber|Remove a node while preserving order, replacing a two-child node with its inorder successor.',
          'Validate Binary Search Tree|M|bst-property|BST,DFS,Bounds|Amazon,Facebook,Microsoft,Bloomberg|Decide whether a tree obeys the ordering property, by carrying an allowed value range down the recursion.',
          'Convert Sorted Array to Binary Search Tree|E|divide-conquer|BST,Divide and Conquer,Recursion|Amazon,Airbnb,Google|Build a height-balanced tree from a sorted array by always making the middle element the root.',
          'Minimum Absolute Difference in BST|E|bst-inorder|BST,Inorder,Recursion|Google,Amazon|Find the smallest gap between any two values, which must be between inorder neighbours.',
          'Range Sum of BST|E|bst-property|BST,DFS,Pruning|Facebook,Amazon,Google|Total the values inside a range while pruning any subtree that cannot overlap it.',
          'Two Sum IV - Input is a BST|E|bst-inorder|BST,Two Pointers,Hashing|Facebook,Amazon|Decide whether two node values sum to a target, using the sorted inorder sequence or a hash set.',
        ],
      },
      {
        slug: 'bst-applications',
        name: 'BST Applications',
        description:
          'Order statistics, iterators and repair. All of them lean on inorder producing a sorted sequence.',
        rows: [
          'Kth Smallest Element in a BST|M|bst-inorder|BST,Inorder,Stack|Amazon,Google,Facebook,Uber|Return the kth smallest value by stopping the inorder traversal as soon as k nodes have been visited.',
          'Binary Search Tree Iterator|M|bst-inorder|BST,Design,Stack,Iterator|Facebook,Amazon,LinkedIn,Google|Build an iterator emitting values in order with amortised constant time and height-bounded memory.',
          'Lowest Common Ancestor of a Binary Search Tree|M|bst-property|BST,LCA,Recursion|Facebook,Amazon,LinkedIn|Find the split point by descending while both targets lie on the same side.',
          'Recover Binary Search Tree|M|bst-inorder|BST,Inorder,Repair|Facebook,Amazon,Google|Repair a tree where exactly two nodes were swapped, by spotting the descents in the inorder sequence.',
          'Trim a Binary Search Tree|M|bst-property|BST,Recursion,Pruning|Amazon,Bloomberg|Remove every value outside a range while keeping the remaining structure a valid search tree.',
          'Construct Binary Search Tree from Preorder Traversal|M|bst-property|BST,Construction,Bounds|Amazon,Google|Rebuild a search tree from preorder alone, using an upper bound to know when a subtree ends.',
          'Balance a Binary Search Tree|M|divide-conquer|BST,Inorder,Divide and Conquer|Amazon,Google|Rebuild an unbalanced search tree into a height-balanced one via its sorted inorder sequence.',
          'Count Nodes Equal to Average of Subtree|M|tree-dfs|Tree,DFS,Aggregation|Amazon|Count nodes whose value equals the rounded mean of their subtree, returning sum and size from each call.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'graphs',
    name: 'Graphs',
    icon: 'network',
    description:
      'The biggest topic on the ladder, and the one that pays back most. Fifty-four problems from grid flood fills through topological ordering and the four shortest-path algorithms, up to bridges and strongly connected components.',
    subtopics: [
      {
        slug: 'representation-and-traversal',
        name: 'Representation & Traversal',
        description:
          'Adjacency lists, implicit grid graphs, and the two traversals everything else is built on.',
        rows: [
          'Find if Path Exists in Graph|E|graph-dfs|Graph,DFS,BFS,Union Find|Amazon,Google|Decide whether two vertices are connected, which is the simplest possible use of a traversal.',
          'Number of Provinces|M|graph-dfs|Graph,DFS,Union Find,Components|Amazon,Bloomberg|Count connected components given an adjacency matrix, by starting a traversal from each unvisited vertex.',
          'Number of Islands|M|graph-dfs|Grid,DFS,BFS,Components|Amazon,Google,Facebook,Microsoft|Count connected land regions in a grid, sinking each island as you visit it.',
          'Max Area of Island|M|graph-dfs|Grid,DFS,Components|Amazon,Google,Facebook|Find the largest connected land region, returning an area from each flood fill.',
          'Flood Fill|E|graph-dfs|Grid,DFS,BFS|Amazon,Facebook|Repaint a connected region of equal-coloured cells, guarding against the no-op case that loops forever.',
          'Clone Graph|M|graph-dfs|Graph,DFS,Hashing,Deep Copy|Facebook,Amazon,Google|Deep-copy a graph, using a map from original to copy so cycles do not cause infinite recursion.',
          'Keys and Rooms|M|graph-dfs|Graph,DFS,Reachability|Amazon,Google|Decide whether every room is reachable when each room hands you keys to others.',
          'All Paths From Source to Target|M|backtracking|Graph,DFS,Backtracking|Amazon,Facebook|List every path through a directed acyclic graph from the first vertex to the last.',
          'Count the Number of Complete Components|M|union-find|Graph,Union Find,Components|Amazon|Count components in which every possible edge is present, comparing each component edge count against its size.',
          'Find the Town Judge|E|graph-dfs|Graph,Degree Counting|Amazon,LinkedIn|Find the vertex with full in-degree and zero out-degree, which one pass over the edges answers.',
        ],
      },
      {
        slug: 'bfs-shortest-path',
        name: 'BFS on Grids & Unweighted Graphs',
        description:
          'When every move costs the same, breadth-first search is the shortest path. Multi-source BFS is the variant worth learning properly.',
        rows: [
          'Rotting Oranges|M|graph-bfs|Grid,Multi-source BFS,Simulation|Amazon,Microsoft,Google|Find how long rot takes to spread, by seeding the queue with every rotten cell at once.',
          '01 Matrix|M|graph-bfs|Grid,Multi-source BFS,Dynamic Programming|Google,Amazon,Facebook|Compute each cell distance to the nearest zero, using every zero as a simultaneous BFS source.',
          'Shortest Path in Binary Matrix|M|graph-bfs|Grid,BFS,Shortest Path|Amazon,Facebook|Find the shortest clear diagonal-allowed path across a binary grid.',
          'Word Ladder|H|graph-bfs|BFS,Strings,Implicit Graph|Amazon,Facebook,Google,LinkedIn|Find the shortest chain of single-letter edits between two words, treating words as vertices.',
          'Word Ladder II|H|graph-bfs|BFS,Backtracking,Strings|Amazon,Google,Facebook|List every shortest transformation chain, which needs BFS for layers and DFS to rebuild the paths.',
          'Surrounded Regions|M|graph-dfs|Grid,DFS,Boundary|Amazon,Google,Bloomberg|Capture every region not touching the border, by first marking everything reachable from the edges.',
          'Number of Enclaves|M|graph-dfs|Grid,DFS,Boundary|Amazon,Google|Count land cells from which you cannot walk off the grid, using the same border-first trick.',
          'Pacific Atlantic Water Flow|M|graph-dfs|Grid,DFS,Multi-source|Amazon,Google,Facebook|Find cells draining to both oceans, by searching inwards from each coastline instead of outwards from each cell.',
          'Shortest Bridge|M|graph-bfs|Grid,DFS,BFS,Multi-source|Amazon,Google|Connect two islands with the fewest flips, by flood-filling one island then expanding it outwards.',
          'Open the Lock|M|graph-bfs|BFS,Implicit Graph,Strings|Amazon,Google,Uber|Find the fewest wheel turns to reach a target combination while avoiding forbidden states.',
        ],
      },
      {
        slug: 'cycles-and-topological-sort',
        name: 'Cycle Detection & Topological Sort',
        description:
          'Dependency problems in disguise. If the ordering cannot be completed, you have found a cycle.',
        rows: [
          'Course Schedule|M|topological-sort|Topological Sort,Cycle Detection,Graph|Amazon,Facebook,Google,Apple|Decide whether all courses can be taken, which is exactly asking whether the graph is acyclic.',
          'Course Schedule II|M|topological-sort|Topological Sort,BFS,Graph|Amazon,Facebook,Microsoft|Produce a valid course ordering, or report that no ordering exists.',
          'Find Eventual Safe States|M|graph-dfs|Graph,DFS,Cycle Detection|Google,Facebook|List vertices from which every path terminates, which is topological sort on the reversed graph.',
          'Course Schedule IV|M|floyd-warshall|Graph,Transitive Closure,Topological Sort|Amazon,Google|Answer many prerequisite queries by precomputing reachability across the whole graph.',
          'Sort Items by Groups Respecting Dependencies|H|topological-sort|Topological Sort,Graph,Grouping|Amazon,Google|Order items under both item-level and group-level constraints, by sorting groups and then within groups.',
          'Minimum Height Trees|M|topological-sort|Graph,Topological Peeling,Trees|Amazon,Google|Find the roots giving the shortest tree, by repeatedly stripping leaves until one or two vertices remain.',
          'Longest Cycle in a Graph|H|graph-dfs|Graph,Cycle Detection,Functional Graph|Amazon,Google|Find the longest cycle when every vertex has at most one outgoing edge, by timestamping each walk.',
          'Detect Cycle in a Directed Graph@gfg:detect-cycle-in-a-directed-graph/1|M|graph-dfs|Graph,DFS,Cycle Detection|Amazon,Microsoft,Flipkart|Detect a cycle in a directed graph, which needs three vertex states rather than a plain visited flag.',
          'Detect Cycle in an Undirected Graph@gfg:detect-cycle-in-an-undirected-graph/1|M|graph-dfs|Graph,DFS,Union Find|Amazon,Microsoft|Detect a cycle in an undirected graph while correctly ignoring the edge you arrived through.',
        ],
      },
      {
        slug: 'shortest-path-algorithms',
        name: 'Shortest Path Algorithms',
        description:
          'Weighted graphs: the priority-queue algorithm, the negative-weight one, the all-pairs one, and the variants that bend the distance metric.',
        rows: [
          'Network Delay Time|M|dijkstra|Dijkstra,Shortest Path,Heap|Amazon,Google,Facebook|Find how long a signal takes to reach every vertex, which is single-source shortest path.',
          'Path with Minimum Effort|M|dijkstra|Dijkstra,Grid,Binary Search|Amazon,Google|Minimise the largest single step on a route, by treating path cost as a maximum instead of a sum.',
          'Cheapest Flights Within K Stops|M|bellman-ford|Bellman-Ford,Shortest Path,BFS|Amazon,Google,Airbnb|Find the cheapest route using at most k stops, by relaxing all edges exactly k plus one times.',
          'Path with Maximum Probability|M|dijkstra|Dijkstra,Shortest Path,Heap|Amazon,Google|Maximise a product of edge probabilities, which is shortest path with a max-heap instead of a min-heap.',
          'Swim in Rising Water|H|dijkstra|Dijkstra,Union Find,Binary Search,Grid|Amazon,Google|Find the lowest water level letting you cross a grid, minimising the maximum cell along the route.',
          'Find the City With the Smallest Number of Neighbors at a Threshold Distance|M|floyd-warshall|Floyd-Warshall,All Pairs,Graph|Amazon,Google|Compute every pairwise distance, then pick the city with the fewest neighbours inside a threshold.',
          'Number of Ways to Arrive at Destination|M|dijkstra|Dijkstra,Counting,Shortest Path|Amazon,Google|Count the distinct shortest routes, by carrying a path count alongside each distance.',
          'Minimum Cost to Make at Least One Valid Path in a Grid|H|graph-bfs|0-1 BFS,Deque,Grid|Amazon,Google|Find the fewest arrow changes needed to reach the exit, using a deque so free moves go to the front.',
          'Shortest Path in a Grid with Obstacles Elimination|H|graph-bfs|BFS,Grid,State Search|Amazon,Google,Uber|Find the shortest route when you may clear up to k obstacles, by adding remaining clearances to the state.',
          'Second Minimum Time to Reach Destination|H|graph-bfs|BFS,Shortest Path,Simulation|Amazon,Google|Find the strictly second-smallest arrival time on a graph with traffic-light timing rules.',
        ],
      },
      {
        slug: 'disjoint-set-and-mst',
        name: 'Disjoint Set & Minimum Spanning Tree',
        description:
          'Merging groups and answering connectivity online — plus the two spanning-tree algorithms that both rest on the cut property.',
        rows: [
          'Redundant Connection|M|union-find|Union Find,Graph,Cycle Detection|Amazon,Google,Facebook|Find the edge whose addition created a cycle, which is the first edge joining two already-connected vertices.',
          'Redundant Connection II|H|union-find|Union Find,Graph,Directed|Google,Amazon|Find the edge to remove from a directed graph so it becomes a rooted tree, handling the two-parent case separately.',
          'Accounts Merge|M|union-find|Union Find,Hashing,Strings|Facebook,Amazon,Google|Merge accounts sharing any e-mail address, uniting the addresses into components.',
          'Most Stones Removed with Same Row or Column|M|union-find|Union Find,Graph,Components|Amazon,Google|Remove the most stones sharing a row or column, which leaves exactly one stone per component.',
          'Satisfiability of Equality Equations|M|union-find|Union Find,Graph,Constraints|Facebook,Amazon|Decide whether a set of equalities and inequalities is consistent, by uniting equals first.',
          'Number of Operations to Make Network Connected|M|union-find|Union Find,Graph,Components|Amazon,Google|Count cable moves needed to connect every computer, comparing spare cables against the component count.',
          'Min Cost to Connect All Points|M|mst|Minimum Spanning Tree,Union Find,Graph|Amazon,Google,Microsoft|Connect all points at minimum total Manhattan distance, which is a spanning tree on a complete graph.',
          'Checking Existence of Edge Length Limited Paths|H|union-find|Union Find,Offline Queries,Sorting|Google,Amazon|Answer path-length queries offline, by sorting both edges and queries and uniting as the limit grows.',
        ],
      },
      {
        slug: 'advanced-graph',
        name: 'Advanced Graph Algorithms',
        description:
          'Low-link values, component condensation and Eulerian paths — the algorithms that separate a strong graph round from an average one.',
        rows: [
          'Critical Connections in a Network|H|bridges-articulation|Bridges,DFS,Low-link|Amazon,Google,Facebook|Find every edge whose removal disconnects the graph, using discovery times and low-link values.',
          'Articulation Point@gfg:articulation-point-1/1|H|bridges-articulation|Articulation Points,DFS,Low-link|Amazon,Google|Find every vertex whose removal increases the number of components, with the DFS root handled separately.',
          "Strongly Connected Components (Kosaraju's Algo)@gfg:strongly-connected-components-kosarajus-algo/1|H|scc|SCC,DFS,Graph|Amazon,Google|Group vertices that can all reach each other, using a finish-time ordering and a pass over the reversed graph.",
          'Reconstruct Itinerary|H|graph-dfs|Eulerian Path,DFS,Graph|Amazon,Google,Uber|Build the lexicographically smallest itinerary using every ticket exactly once, via a post-order Eulerian walk.',
          'Is Graph Bipartite?|M|graph-bfs|Bipartite,BFS,DFS,Colouring|Amazon,Facebook,Google|Decide whether vertices split into two sides with no edge inside a side, by two-colouring each component.',
          'Possible Bipartition|M|graph-dfs|Bipartite,DFS,Colouring|Facebook,Amazon|Split people into two groups respecting mutual dislikes, which is the same two-colouring question.',
          'Bus Routes|H|graph-bfs|BFS,Implicit Graph,Hashing|Amazon,Google,Uber|Find the fewest buses to reach a stop, by treating whole routes rather than stops as the graph vertices.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'dynamic-programming',
    name: 'Dynamic Programming',
    icon: 'grid-3x3',
    description:
      'The largest topic, ordered so each family builds on the last. Every problem here follows the same route: recursion, memoisation, tabulation, then space optimisation. Define the state precisely and the rest follows.',
    subtopics: [
      {
        slug: 'dp-1d',
        name: '1D Dynamic Programming',
        description:
          'One index, one decision. Start here and do not move on until the recursion-to-table conversion feels mechanical.',
        rows: [
          'Climbing Stairs|E|dp-1d|Dynamic Programming,Recursion,Memoisation|Amazon,Adobe,Apple|Count the ways to climb n steps taking one or two at a time, which is the Fibonacci recurrence in disguise.',
          'Min Cost Climbing Stairs|E|dp-1d|Dynamic Programming,Arrays|Amazon,Google|Reach the top at minimum cost when each step charges a toll and you may skip one.',
          'House Robber|M|dp-1d|Dynamic Programming,Arrays|Amazon,LinkedIn,Google|Take the largest total from a row of houses without ever taking two adjacent ones.',
          'House Robber II|M|dp-1d|Dynamic Programming,Arrays,Circular|Amazon,Google,Microsoft|Solve the same problem on a circle, by running the linear version twice with one end excluded each time.',
          'Frog Jump@gfg:geek-jump/1|E|dp-1d|Dynamic Programming,Arrays|Amazon,Flipkart|Reach the last stone at minimum energy cost when each hop of one or two costs the height difference.',
          'Decode Ways|M|dp-1d|Dynamic Programming,Strings|Facebook,Amazon,Microsoft,Uber|Count the ways a digit string maps back to letters, branching on one-digit and two-digit reads.',
          'Delete and Earn|M|dp-1d|Dynamic Programming,Counting|Amazon,Google|Maximise points when taking a value deletes its neighbours, which becomes House Robber over the value axis.',
          'Word Break|M|dp-1d|Dynamic Programming,Strings,Hashing|Facebook,Amazon,Google,Bloomberg|Decide whether a string splits into dictionary words, marking every reachable cut position.',
        ],
      },
      {
        slug: 'dp-on-grids',
        name: 'DP on Grids',
        description:
          'Two indices instead of one. The fill order matters more than the recurrence.',
        rows: [
          'Unique Paths|M|dp-2d-grid|Dynamic Programming,Combinatorics,Grid|Amazon,Google,Bloomberg|Count corner-to-corner routes on an empty grid moving only right and down.',
          'Unique Paths II|M|dp-2d-grid|Dynamic Programming,Grid,Obstacles|Amazon,Bloomberg|Count the same routes when some cells are blocked, which forces zeroes into the table.',
          'Minimum Path Sum|M|dp-2d-grid|Dynamic Programming,Grid|Amazon,Google,Goldman Sachs|Find the cheapest corner-to-corner route where each cell charges a toll.',
          'Triangle|M|dp-2d-grid|Dynamic Programming,Grid|Amazon,Adobe|Find the cheapest top-to-bottom path in a triangle, which is easiest computed bottom-up.',
          'Minimum Falling Path Sum|M|dp-2d-grid|Dynamic Programming,Grid|Amazon,Google|Find the cheapest top-to-bottom path where each step may also move one column sideways.',
          'Cherry Pickup II|M|dp-2d-grid|Dynamic Programming,Grid,Multi-agent|Amazon,Google|Move two collectors down a grid at once, with both column positions in the state.',
          'Dungeon Game|H|dp-2d-grid|Dynamic Programming,Grid,Reverse DP|Amazon,Microsoft|Find the least starting health needed, which must be computed backwards from the goal.',
        ],
      },
      {
        slug: 'dp-subsequences-knapsack',
        name: 'Subsequences & Knapsack',
        description:
          'The take-or-skip recurrence, and the capacity dimension that makes it a knapsack. This family covers an enormous share of interview DP.',
        rows: [
          'Partition Equal Subset Sum|M|dp-knapsack|Knapsack,Subset Sum,Dynamic Programming|Facebook,Amazon,Google|Decide whether an array splits into two equal-sum halves, which is subset-sum for half the total.',
          'Target Sum|M|dp-knapsack|Knapsack,Counting,Dynamic Programming|Facebook,Amazon,Google|Count sign assignments reaching a target, which rearranges into a subset-sum count.',
          'Coin Change|M|dp-knapsack|Unbounded Knapsack,Dynamic Programming|Amazon,Google,Uber|Make an amount with the fewest coins, where each denomination may be reused.',
          'Coin Change II|M|dp-knapsack|Unbounded Knapsack,Counting|Amazon,Google|Count the distinct combinations making an amount, which needs the coin loop outside the amount loop.',
          'Combination Sum IV|M|dp-1d|Dynamic Programming,Counting,Permutations|Facebook,Google|Count ordered sequences summing to a target, where loop order flips it from combinations to permutations.',
          'Perfect Squares|M|dp-knapsack|Dynamic Programming,Math,BFS|Google,Amazon,Bloomberg|Write a number as the fewest perfect squares, which is unbounded coin change over square denominations.',
          'Last Stone Weight II|M|dp-knapsack|Knapsack,Subset Sum,Dynamic Programming|Amazon,Google|Minimise the final stone by splitting the weights into two groups as balanced as possible.',
          'Ones and Zeroes|M|dp-knapsack|Knapsack,Two Dimensional,Dynamic Programming|Amazon,Google|Pick the most strings under two independent budgets, which adds a second capacity dimension.',
          'Subset Sum Problem@gfg:subset-sum-problem-1611555638/1|M|dp-knapsack|Subset Sum,Knapsack,Dynamic Programming|Amazon,Microsoft|Decide whether any subset reaches an exact total, the base case of the whole knapsack family.',
          'Minimum Subset Sum Difference@gfg:minimum-sum-partition3317/1|H|dp-knapsack|Subset Sum,Knapsack,Dynamic Programming|Amazon,Microsoft|Split the array into two groups whose totals differ as little as possible.',
        ],
      },
      {
        slug: 'dp-on-strings',
        name: 'DP on Strings',
        description:
          'Aligning two sequences prefix by prefix. Once the base row and column are right, the interior is one recurrence.',
        rows: [
          'Longest Common Subsequence|M|dp-subsequence|Dynamic Programming,Strings|Amazon,Google,Microsoft|Find the longest sequence appearing in order in both strings, which is the root of this whole family.',
          'Longest Palindromic Subsequence|M|dp-subsequence|Dynamic Programming,Strings,Palindrome|Amazon,Uber|Find the longest palindromic subsequence, which is the common subsequence with the reversed string.',
          'Edit Distance|M|dp-strings|Dynamic Programming,Strings|Amazon,Google,Facebook,Microsoft|Find the fewest insert, delete and replace operations converting one string into another.',
          'Distinct Subsequences|H|dp-subsequence|Dynamic Programming,Strings,Counting|Amazon,Google|Count how many ways one string appears as a subsequence of another.',
          'Wildcard Matching|H|dp-strings|Dynamic Programming,Strings,Pattern Matching|Facebook,Google,Amazon|Match a pattern with single-character and any-sequence wildcards against a text.',
          'Regular Expression Matching|H|dp-strings|Dynamic Programming,Strings,Pattern Matching|Facebook,Google,Amazon,Uber|Match a pattern with dot and star operators, where star binds to the character before it.',
          'Shortest Common Supersequence|M|dp-subsequence|Dynamic Programming,Strings,Reconstruction|Amazon,Google|Build the shortest string containing both inputs as subsequences, by walking the LCS table backwards.',
          'Minimum Insertion Steps to Make a String Palindrome|H|dp-subsequence|Dynamic Programming,Strings,Palindrome|Amazon,Google|Find the fewest insertions making a string a palindrome, which is the length minus its longest palindromic subsequence.',
        ],
      },
      {
        slug: 'dp-on-stocks',
        name: 'DP on Stocks',
        description:
          'A small state machine per day. Learn the two-state version and the rest are extra dimensions.',
        rows: [
          'Best Time to Buy and Sell Stock III|H|dp-stocks|State Machine DP,Dynamic Programming|Amazon,Facebook,Microsoft|Maximise profit with at most two transactions, tracking four running states.',
          'Best Time to Buy and Sell Stock IV|H|dp-stocks|State Machine DP,Dynamic Programming|Amazon,Google,Citadel|Generalise to at most k transactions, which adds a transaction-count dimension.',
          'Best Time to Buy and Sell Stock with Cooldown|M|dp-stocks|State Machine DP,Dynamic Programming|Google,Amazon|Maximise profit when selling forces a rest day, which needs a third state.',
          'Best Time to Buy and Sell Stock with Transaction Fee|M|dp-stocks|State Machine DP,Greedy|Amazon,Google|Maximise profit when every sale charges a fee, folding the fee into the transition.',
          'Maximum Profit in Job Scheduling|H|dp-1d|Dynamic Programming,Binary Search,Sorting|Amazon,Google,LinkedIn|Choose non-overlapping jobs for maximum pay, binary searching for the last compatible job.',
          'Maximum Sum of Two Non-Overlapping Subarrays|M|prefix-sum|Prefix Sum,Sliding Window,Dynamic Programming|Amazon,Facebook|Choose two disjoint fixed-length windows maximising the total, by fixing the split point.',
        ],
      },
      {
        slug: 'dp-lis',
        name: 'Longest Increasing Subsequence Family',
        description:
          'Start with the quadratic version so you understand it, then learn the patience-sorting speed-up.',
        rows: [
          'Longest Increasing Subsequence|M|dp-lis|Dynamic Programming,Binary Search|Amazon,Microsoft,Google,Facebook|Find the longest strictly increasing subsequence, quadratically first and then with binary search.',
          'Number of Longest Increasing Subsequence|M|dp-lis|Dynamic Programming,Counting|Google,Amazon|Count how many longest increasing subsequences exist, carrying a count alongside each length.',
          'Largest Divisible Subset|M|dp-lis|Dynamic Programming,Sorting,Reconstruction|Google,Amazon|Find the largest subset where every pair divides one way, which is LIS under divisibility after sorting.',
          'Longest String Chain|M|dp-lis|Dynamic Programming,Hashing,Strings|Amazon,Google|Find the longest chain where each word is the previous plus one inserted letter.',
          'Russian Doll Envelopes|H|dp-lis|Dynamic Programming,Binary Search,Sorting|Google,Amazon,Facebook|Nest the most envelopes, by sorting on width and running LIS on heights with a tie-breaking twist.',
          'Maximum Length of Pair Chain|M|greedy|Greedy,Dynamic Programming,Intervals|Amazon,Google|Build the longest chain of pairs, which the greedy earliest-end rule solves faster than DP.',
        ],
      },
      {
        slug: 'dp-partition',
        name: 'Partition DP',
        description:
          'The state is a range and the choice is where to cut it. Cubic time, and the hardest DP family to spot.',
        rows: [
          'Matrix Chain Multiplication@gfg:matrix-chain-multiplication0303/1|H|dp-partition-mcm|Interval DP,Dynamic Programming|Amazon,Microsoft|Parenthesise a chain of matrix products to minimise scalar multiplications.',
          'Palindrome Partitioning II|H|dp-partition-mcm|Interval DP,Strings,Dynamic Programming|Amazon,Google|Find the fewest cuts splitting a string into palindromes, precomputing palindrome checks.',
          'Burst Balloons|H|dp-partition-mcm|Interval DP,Dynamic Programming|Google,Amazon,Facebook|Maximise coins from bursting balloons, by choosing which balloon bursts last in each range.',
          'Minimum Cost to Cut a Stick|H|dp-partition-mcm|Interval DP,Dynamic Programming|Amazon,Google|Order the cuts to minimise total cost, where each cut costs the length of the piece it divides.',
          'Boolean Parenthesization@gfg:boolean-parenthesization5610/1|H|dp-partition-mcm|Interval DP,Counting,Dynamic Programming|Amazon,Microsoft|Count the parenthesisations of a boolean expression evaluating to true, tracking true and false counts per range.',
          'Partition Array for Maximum Sum|M|dp-1d|Dynamic Programming,Partitioning|Amazon,Google|Split an array into groups of bounded size, replacing each group with its maximum to maximise the total.',
        ],
      },
      {
        slug: 'dp-squares-and-bitmask',
        name: 'DP on Squares & Bitmask DP',
        description:
          'Anchoring shapes at a corner, and encoding "which items are used" as an integer.',
        rows: [
          'Maximal Square|M|dp-squares|Dynamic Programming,Matrix|Amazon,Facebook,Google|Find the largest all-ones square, where each cell takes the minimum of three neighbours plus one.',
          'Count Square Submatrices with All Ones|M|dp-squares|Dynamic Programming,Matrix,Counting|Amazon,Google|Count every all-ones square, which is the sum of the same table rather than its maximum.',
          'Partition to K Equal Sum Subsets|M|dp-bitmask|Bitmask DP,Backtracking,Subset Sum|Amazon,Google,Facebook|Split an array into k equal-sum groups, with the used-element mask as the state.',
          'Shortest Path Visiting All Nodes|H|dp-bitmask|Bitmask DP,BFS,Graph|Amazon,Google|Find the shortest walk visiting every vertex, with the state being position plus visited mask.',
          'Number of Ways to Wear Different Hats to Each Other|H|dp-bitmask|Bitmask DP,Counting|Amazon,Google|Count assignments of distinct hats to people, iterating over hats with a mask of assigned people.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'tries',
    name: 'Tries',
    icon: 'folder-tree',
    description:
      'A tree where the path spells the key. Small topic, but it is the structure behind autocomplete, and its binary form turns maximum-XOR queries into a greedy walk.',
    subtopics: [
      {
        slug: 'trie-fundamentals',
        name: 'Trie Fundamentals',
        description:
          'Build one from scratch, then extend it with wildcards and dictionary lookups.',
        rows: [
          'Implement Trie (Prefix Tree)|M|trie|Trie,Design,Strings|Amazon,Google,Microsoft,Facebook|Build a prefix tree supporting insert, exact search and prefix search.',
          'Design Add and Search Words Data Structure|M|trie|Trie,Design,Backtracking|Facebook,Amazon,Google|Extend a trie so a query may contain dots matching any single character, which needs branching search.',
          'Replace Words|M|trie|Trie,Strings,Hashing|Amazon,Google|Replace each word with the shortest dictionary root that prefixes it.',
          'Longest Word in Dictionary|M|trie|Trie,Strings,Sorting|Google,Amazon|Find the longest word buildable one letter at a time where every prefix is also a word.',
        ],
      },
      {
        slug: 'trie-applications',
        name: 'Trie Applications',
        description:
          'Binary tries over bit representations, and the prefix tree behind a search box.',
        rows: [
          'Maximum XOR of Two Numbers in an Array|M|trie|Binary Trie,Bit Manipulation,Greedy|Amazon,Google,Facebook|Find the largest XOR of any pair by walking a binary trie and preferring the opposite bit at each level.',
          'Maximum XOR With an Element From Array|H|trie|Binary Trie,Offline Queries,Sorting|Google,Amazon|Answer maximum-XOR queries with an upper bound on the partner, by sorting queries and inserting as the bound grows.',
          'Search Suggestions System|M|trie|Trie,Strings,Binary Search|Amazon,Google|Return up to three matching products after each typed character, which a trie or a sorted binary search both answer.',
        ],
      },
    ],
  },

  // ======================================================================
  {
    slug: 'advanced-dsa',
    name: 'Advanced Data Structures and Algorithms',
    icon: 'cpu',
    description:
      'The last rung. Range-query structures, offline processing and a few designs that show up in senior interviews. Attempt these once the rest of the ladder is comfortable.',
    subtopics: [
      {
        slug: 'range-query-structures',
        name: 'Range Query Structures',
        description:
          'Segment trees, Fenwick trees and the interval bookkeeping that hides behind calendar problems.',
        rows: [
          'Range Sum Query - Immutable|E|prefix-sum|Prefix Sum,Design|Facebook,Amazon|Answer many range-sum queries on a fixed array, which one prefix-sum pass makes constant time.',
          'Range Sum Query - Mutable|M|fenwick|Fenwick Tree,Segment Tree,Design|Amazon,Google,Facebook|Support range sums alongside point updates, which needs a Fenwick or segment tree.',
          'My Calendar I|M|intervals|Intervals,Ordered Set,Design|Google,Amazon|Accept a booking only when it overlaps nothing already booked, using an ordered structure for the lookup.',
          'My Calendar II|M|sweep-line|Sweep Line,Intervals,Design|Google,Amazon|Allow double bookings but reject triple ones, by tracking the overlap count across event boundaries.',
          'Falling Squares|H|segment-tree|Segment Tree,Coordinate Compression,Intervals|Google,Amazon|Track the tallest stack as squares drop onto a line, with range-max queries and range assignments.',
        ],
      },
      {
        slug: 'advanced-techniques',
        name: 'Advanced Techniques',
        description:
          'Binary search on a value range, rolling hashes and two designs that reward careful invariants.',
        rows: [
          'Kth Smallest Number in Multiplication Table|H|binary-search-answer|Binary Search on Answer,Counting,Math|Google,Amazon|Find the kth smallest product without building the table, by counting entries below a candidate value.',
          'Minimum Number of Refueling Stops|H|heap|Heap,Greedy,Dynamic Programming|Amazon,Google|Reach a destination with the fewest stops, retroactively taking the largest fuel stop already passed.',
          'Longest Duplicate Substring|H|string-hashing|Rolling Hash,Binary Search,Suffix Array|Amazon,Google,Bloomberg|Find the longest repeated substring, by binary searching the length and hashing every window of it.',
          'Maximum Frequency Stack|H|design-ds|Design,Hash Map,Stack,Frequency|Amazon,Google,Bloomberg|Pop the most frequent element, breaking ties by recency, using one stack per frequency level.',
          'Design Skiplist|H|design-ds|Design,Randomisation,Linked List|Google,Amazon|Build a probabilistic ordered structure supporting search, insert and erase in expected logarithmic time.',
        ],
      },
    ],
  },
];
