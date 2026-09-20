/**
 * AlgoLadder — test cases.
 * ========================
 *
 * Keyed by problem slug. Each case is { input, expected, hidden? } and is fed
 * to the submitted program on standard input; what it prints on standard
 * output is compared against `expected`.
 *
 * Comparison is forgiving about trailing spaces and trailing blank lines and
 * strict about everything else, so `expected` must match the output format in
 * statements.mjs exactly — including capitalisation and the order of values.
 * A problem whose statement allows several valid answers cannot be graded this
 * way; pin the order down in the statement first.
 *
 * `hidden: true` still runs the case but shows the solver only pass or fail.
 * Two or three visible cases followed by one or two hidden ones is the right
 * shape: enough to debug against, not enough to hard-code.
 *
 * At most 8 cases per problem are graded (see MAX_CASES in the run route).
 */

export const TEST_CASES = {
  /* ------------------------------------------------ Basics / Loops ----- */

  'fizz-buzz': [
    { input: '5', expected: '1\n2\nFizz\n4\nBuzz' },
    { input: '1', expected: '1' },
    {
      input: '15',
      expected:
        '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
    },
    {
      input: '20',
      expected:
        '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz',
      hidden: true,
    },
  ],

  'number-of-steps-to-reduce-a-number-to-zero': [
    { input: '14', expected: '6' },
    { input: '8', expected: '4' },
    { input: '0', expected: '0' },
    { input: '1', expected: '1' },
    { input: '123', expected: '12', hidden: true },
  ],

  'richest-customer-wealth': [
    { input: '3 2\n1 5\n7 3\n3 4', expected: '10' },
    { input: '2 3\n1 2 3\n3 2 1', expected: '6' },
    { input: '1 1\n5', expected: '5' },
    { input: '3 3\n2 8 7\n7 1 3\n1 9 5', expected: '17', hidden: true },
  ],

  'running-sum-of-1d-array': [
    { input: '4\n1 2 3 4', expected: '1 3 6 10' },
    { input: '5\n3 1 2 10 1', expected: '3 4 6 16 17' },
    { input: '1\n7', expected: '7' },
    { input: '3\n-1 5 -2', expected: '-1 4 2', hidden: true },
  ],

  'build-array-from-permutation': [
    { input: '5\n0 2 1 4 3', expected: '0 1 2 3 4' },
    { input: '4\n0 2 3 1', expected: '0 3 1 2' },
    { input: '1\n0', expected: '0' },
    { input: '3\n2 0 1', expected: '1 2 0', hidden: true },
  ],

  /* ------------------------------------------------ Basics / Maths ----- */

  'palindrome-number': [
    { input: '121', expected: 'true' },
    { input: '-121', expected: 'false' },
    { input: '10', expected: 'false' },
    { input: '0', expected: 'true' },
    { input: '1234321', expected: 'true', hidden: true },
    { input: '1000021', expected: 'false', hidden: true },
  ],

  'reverse-integer': [
    { input: '123', expected: '321' },
    { input: '-123', expected: '-321' },
    { input: '120', expected: '21' },
    { input: '0', expected: '0' },
    { input: '1534236469', expected: '0', hidden: true },
    { input: '-2147483648', expected: '0', hidden: true },
  ],

  'happy-number': [
    { input: '19', expected: 'true' },
    { input: '2', expected: 'false' },
    { input: '1', expected: 'true' },
    { input: '7', expected: 'true' },
    { input: '116', expected: 'false', hidden: true },
  ],

  'power-of-two': [
    { input: '16', expected: 'true' },
    { input: '1', expected: 'true' },
    { input: '6', expected: 'false' },
    { input: '0', expected: 'false' },
    { input: '-16', expected: 'false', hidden: true },
    { input: '1073741824', expected: 'true', hidden: true },
  ],

  'add-digits': [
    { input: '38', expected: '2' },
    { input: '0', expected: '0' },
    { input: '99', expected: '9' },
    { input: '9', expected: '9' },
    { input: '123456789', expected: '9', hidden: true },
  ],

  'count-primes': [
    { input: '10', expected: '4' },
    { input: '2', expected: '0' },
    { input: '0', expected: '0' },
    { input: '3', expected: '1' },
    { input: '100', expected: '25', hidden: true },
  ],

  'excel-sheet-column-number': [
    { input: 'A', expected: '1' },
    { input: 'AB', expected: '28' },
    { input: 'ZY', expected: '701' },
    { input: 'Z', expected: '26' },
    { input: 'AAA', expected: '703', hidden: true },
    { input: 'FXSHRXW', expected: '2147483647', hidden: true },
  ],

  'perfect-number': [
    { input: '28', expected: 'true' },
    { input: '7', expected: 'false' },
    { input: '1', expected: 'false' },
    { input: '6', expected: 'true' },
    { input: '496', expected: 'true', hidden: true },
    { input: '8128', expected: 'true', hidden: true },
  ],

  /* -------------------------------------------- Basics / Recursion ----- */

  'fibonacci-number': [
    { input: '4', expected: '3' },
    { input: '0', expected: '0' },
    { input: '1', expected: '1' },
    { input: '10', expected: '55' },
    { input: '50', expected: '12586269025', hidden: true },
  ],

  'reverse-string': [
    { input: 'hello', expected: 'olleh' },
    { input: 'Hannah', expected: 'hannaH' },
    { input: 'a', expected: 'a' },
    { input: 'AlgoLadder', expected: 'reddaLoglA', hidden: true },
  ],

  'power-of-four': [
    { input: '16', expected: 'true' },
    { input: '8', expected: 'false' },
    { input: '1', expected: 'true' },
    { input: '0', expected: 'false' },
    { input: '-4', expected: 'false', hidden: true },
    { input: '1073741824', expected: 'true', hidden: true },
  ],

  /* ---------------------------------------------- Basics / Hashing ----- */

  'contains-duplicate': [
    { input: '4\n1 2 3 1', expected: 'true' },
    { input: '4\n1 2 3 4', expected: 'false' },
    { input: '1\n1', expected: 'false' },
    { input: '10\n1 1 1 3 3 4 3 2 4 2', expected: 'true', hidden: true },
  ],

  'ransom-note': [
    { input: 'aa\nab', expected: 'false' },
    { input: 'aa\naab', expected: 'true' },
    { input: 'a\nb', expected: 'false' },
    { input: 'abc\ncba', expected: 'true', hidden: true },
  ],

  'first-unique-character-in-a-string': [
    { input: 'leetcode', expected: '0' },
    { input: 'loveleetcode', expected: '2' },
    { input: 'aabb', expected: '-1' },
    { input: 'z', expected: '0' },
    { input: 'dddccdbba', expected: '8', hidden: true },
  ],

  'intersection-of-two-arrays': [
    { input: '2\n1 2\n2\n2 2', expected: '2' },
    { input: '3\n4 9 5\n5\n9 4 9 8 4', expected: '4 9' },
    { input: '2\n1 2\n2\n3 4', expected: '' },
    { input: '5\n7 7 1 3 3\n4\n3 7 9 1', expected: '1 3 7', hidden: true },
  ],

  /* ------------------------------------- Sorting / From Scratch -------- */

  'bubble-sort': [
    { input: '5\n5 1 4 2 8', expected: '1 2 4 5 8' },
    { input: '3\n3 2 1', expected: '1 2 3' },
    { input: '1\n42', expected: '42' },
    { input: '6\n-2 5 -2 0 3 1', expected: '-2 -2 0 1 3 5', hidden: true },
  ],

  'insertion-sort': [
    { input: '5\n12 11 13 5 6', expected: '5 6 11 12 13' },
    { input: '4\n1 2 3 4', expected: '1 2 3 4' },
    { input: '1\n9', expected: '9' },
    { input: '6\n4 4 2 9 2 1', expected: '1 2 2 4 4 9', hidden: true },
  ],

  'selection-sort': [
    { input: '5\n64 25 12 22 11', expected: '11 12 22 25 64' },
    { input: '2\n2 1', expected: '1 2' },
    { input: '1\n0', expected: '0' },
    { input: '5\n-3 -1 -7 0 2', expected: '-7 -3 -1 0 2', hidden: true },
  ],

  'merge-sort': [
    { input: '6\n38 27 43 3 9 82', expected: '3 9 27 38 43 82' },
    { input: '1\n5', expected: '5' },
    { input: '4\n4 3 2 1', expected: '1 2 3 4' },
    { input: '7\n5 5 5 1 9 1 5', expected: '1 1 5 5 5 5 9', hidden: true },
  ],

  'quick-sort': [
    { input: '6\n10 7 8 9 1 5', expected: '1 5 7 8 9 10' },
    { input: '5\n2 2 2 2 2', expected: '2 2 2 2 2' },
    { input: '1\n3', expected: '3' },
    { input: '8\n8 7 6 5 4 3 2 1', expected: '1 2 3 4 5 6 7 8', hidden: true },
  ],

  /* ----------------------------------------- Sorting / Applied --------- */

  'sort-colors': [
    { input: '6\n2 0 2 1 1 0', expected: '0 0 1 1 2 2' },
    { input: '3\n2 0 1', expected: '0 1 2' },
    { input: '1\n0', expected: '0' },
    { input: '7\n2 2 2 1 1 0 0', expected: '0 0 1 1 2 2 2', hidden: true },
  ],

  'merge-sorted-array': [
    { input: '3 3\n1 2 3 0 0 0\n2 5 6', expected: '1 2 2 3 5 6' },
    { input: '0 1\n0\n1', expected: '1' },
    { input: '2 2\n4 5 0 0\n1 2', expected: '1 2 4 5' },
    { input: '3 2\n-5 0 7 0 0\n-9 3', expected: '-9 -5 0 3 7', hidden: true },
  ],

  'sort-an-array': [
    { input: '4\n5 2 3 1', expected: '1 2 3 5' },
    { input: '5\n5 1 1 2 0', expected: '0 1 1 2 5' },
    { input: '1\n1', expected: '1' },
    { input: '6\n-1 -5 3 0 -5 2', expected: '-5 -5 -1 0 2 3', hidden: true },
  ],

  'largest-number': [
    { input: '2\n10 2', expected: '210' },
    { input: '5\n3 30 34 5 9', expected: '9534330' },
    { input: '2\n0 0', expected: '0' },
    { input: '1\n10', expected: '10' },
    { input: '3\n1 20 23', expected: '23201', hidden: true },
  ],

  'relative-sort-array': [
    {
      input: '11\n2 3 1 3 2 4 6 7 9 2 19\n4\n2 1 4 3',
      expected: '2 2 2 1 4 3 3 6 7 9 19',
    },
    { input: '6\n28 6 22 8 44 17\n3\n22 28 8', expected: '22 28 8 6 17 44' },
    { input: '3\n5 5 5\n1\n5', expected: '5 5 5' },
    { input: '5\n1 2 3 4 5\n2\n5 1', expected: '5 1 2 3 4', hidden: true },
  ],
};
