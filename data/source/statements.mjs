/**
 * AlgoLadder — full problem statements.
 * =====================================
 *
 * roadmap.mjs carries the curation (which problem, where, what pattern) and a
 * one-line summary. This file carries the part a solver actually reads: the
 * full statement, the input and output format, worked examples, constraints,
 * problem-specific hints and an approach written for THAT problem rather than
 * for its pattern.
 *
 * Everything here is written for AlgoLadder. The underlying problems are
 * well-known and unownable, but the wording, the examples and the explanations
 * are original — nothing is copied from LeetCode, GeeksforGeeks or any course.
 * Keep it that way when you add entries.
 *
 * SHAPE  (every field optional — anything omitted falls back to the
 *          pattern-level default from patterns.mjs)
 *
 *   '<problem-slug>': {
 *     description      Full statement. Two to four sentences. Must be
 *                      solvable from this text alone.
 *     ioFormat         { input, output } — described for a program reading
 *                      stdin and writing stdout, which is what the built-in
 *                      editor gives the user.
 *     examples         [{ input, output, explanation }] — input is exactly
 *                      what you would paste into the editor's Input box.
 *     constraints      Array of strings.
 *     hints            Three, escalating: nudge, then method, then the crux.
 *                      Never the finished solution.
 *     approach         One paragraph on how to think about THIS problem.
 *     timeComplexity   Of the intended solution.
 *     spaceComplexity  Of the intended solution.
 *   }
 */

export const STATEMENTS = {
  /* ---------------------------------------------- Basics / Loops ------- */

  'fizz-buzz': {
    description:
      'You are given a single integer n. Print the numbers from 1 to n, one per line, with three substitutions: a number divisible by 3 is printed as "Fizz", a number divisible by 5 is printed as "Buzz", and a number divisible by both is printed as "FizzBuzz". Every other number is printed as itself.',
    ioFormat: {
      input: 'One line containing the integer n.',
      output: 'n lines. Line i holds the word or number for i.',
    },
    examples: [
      {
        input: '5',
        output: '1\n2\nFizz\n4\nBuzz',
        explanation:
          '3 is divisible by 3 so it becomes Fizz; 5 is divisible by 5 so it becomes Buzz. 1, 2 and 4 are divisible by neither.',
      },
      {
        input: '15',
        output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        explanation:
          '15 is divisible by 3 and by 5, so it is the first number to print FizzBuzz rather than one word or the other.',
      },
    ],
    constraints: ['1 <= n <= 10^4'],
    hints: [
      'Order matters. If you test divisibility by 3 before you test for both, the number 15 will print "Fizz" and never reach the combined case.',
      'Check the "divisible by both" condition first, or equivalently build the output string by appending "Fizz" then "Buzz" and printing the number only if the string is still empty.',
      'Divisible by both 3 and 5 is the same as divisible by 15 — the two rules never need to be tested separately once you check 15 first.',
    ],
    approach:
      'This is the classic warm-up, and the only thing it really tests is whether you order your conditions correctly. The trap is writing three independent if statements in the order 3, 5, both — by the time you reach the third, the first has already fired. Either test 15 first and let the chain fall through, or drop the branching entirely: start with an empty string, append "Fizz" when divisible by 3, append "Buzz" when divisible by 5, and print the number itself only when nothing was appended. The second version generalises: adding a fourth rule is one more line rather than a rewrite of the whole chain.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  },

  'number-of-steps-to-reduce-a-number-to-zero': {
    description:
      'You are given a non-negative integer n. Repeatedly apply one operation until n becomes zero: if n is even, halve it; if n is odd, subtract one from it. Report how many operations this takes.',
    ioFormat: {
      input: 'One line containing the integer n.',
      output: 'A single integer: the number of operations performed.',
    },
    examples: [
      {
        input: '14',
        output: '6',
        explanation:
          '14 is even so it halves to 7; 7 is odd so it drops to 6; 6 halves to 3; 3 drops to 2; 2 halves to 1; 1 drops to 0. Six operations.',
      },
      {
        input: '8',
        output: '4',
        explanation: '8 halves to 4, to 2, to 1, then 1 subtracts down to 0 — four operations.',
      },
      {
        input: '0',
        output: '0',
        explanation: 'n is already zero, so nothing is done.',
      },
    ],
    constraints: ['0 <= n <= 10^6'],
    hints: [
      'Write the loop exactly as the statement describes it and count each pass. Do not try to be clever before you have something correct.',
      'Remember the case where n starts at zero — the loop body must not run at all, so test the condition before doing any work.',
      'In binary, halving is a right shift and subtracting one from an odd number clears its lowest bit. So the answer is (number of bits) + (number of 1-bits) - 1 for n > 0, which is why the loop finishes in about log n steps rather than n.',
    ],
    approach:
      'Simulate it — the loop is three lines and the answer is a counter. What makes the problem worth doing is noticing why it terminates quickly: every halving removes a binary digit and every subtraction clears a one-bit, so the work is proportional to the number of bits in n, not to n itself. Even n = 1,000,000 finishes in about thirty steps. If you look at the binary representation you can compute the count directly without looping at all, which is a nice thing to mention if an interviewer asks whether you can do better.',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
  },

  'richest-customer-wealth': {
    description:
      'A bank has m customers, and each customer holds money in n different accounts. You are given the amounts as a grid of m rows and n columns, where row i lists the balances belonging to customer i. A customer’s wealth is the sum of their own row. Report the wealth of the richest customer.',
    ioFormat: {
      input:
        'The first line holds two integers m and n. The next m lines each hold n integers, the balances for one customer.',
      output: 'A single integer: the largest row sum.',
    },
    examples: [
      {
        input: '3 2\n1 5\n7 3\n3 4',
        output: '10',
        explanation:
          'The three customers are worth 1+5 = 6, 7+3 = 10 and 3+4 = 7. The richest holds 10.',
      },
      {
        input: '2 3\n1 2 3\n3 2 1',
        output: '6',
        explanation: 'Both customers are worth 6, so the maximum is 6 — a tie is not a special case.',
      },
    ],
    constraints: ['1 <= m, n <= 200', '1 <= balance <= 10^5'],
    hints: [
      'You never need to store the whole grid. Each row can be summed and thrown away before you read the next one.',
      'Keep one running variable for the best row sum seen so far and compare after finishing each row.',
      'Initialise the running maximum from the first row rather than from zero — it costs nothing here because balances are positive, but the habit saves you when negatives are allowed.',
    ],
    approach:
      'Two nested loops, and the only decision is where to reset the accumulator: the row sum must start at zero at the top of each row, not once at the top of the grid. The useful idea to carry forward is that this is a streaming problem — you are asked for one number about each row, so you can process a row and discard it, which means constant extra memory regardless of how many customers there are. Watch for the off-by-one habit of comparing against a max initialised to zero; it works here only because the problem promises positive balances.',
    timeComplexity: 'O(m * n)',
    spaceComplexity: 'O(1)',
  },

  'running-sum-of-1d-array': {
    description:
      'You are given an array of n integers. Build a new array of the same length where position i holds the sum of all elements from position 0 through position i inclusive. This is called the prefix-sum array, and it is the foundation for answering range-sum questions in constant time.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated integers.',
      output: 'One line of n space-separated integers: the running sums.',
    },
    examples: [
      {
        input: '4\n1 2 3 4',
        output: '1 3 6 10',
        explanation: 'Each output is the previous output plus the current element: 1, 1+2, 3+3, 6+4.',
      },
      {
        input: '5\n3 1 2 10 1',
        output: '3 4 6 16 17',
        explanation: 'The last value, 17, is the total of the whole array.',
      },
    ],
    constraints: ['1 <= n <= 1000', '-10^6 <= element <= 10^6'],
    hints: [
      'Each answer differs from the one before it by exactly one element — you should never need an inner loop.',
      'Carry a running total across a single pass and write it out at every step.',
      'You can write the result back into the input array in place: position i only ever needs position i-1, which you have already finalised.',
    ],
    approach:
      'The naive version re-sums the prefix at every position and costs O(n^2); the fix is to notice that answer[i] is just answer[i-1] + input[i], which turns it into one pass. Doing it in place is safe because each position depends only on the position to its left, which is already final by the time you reach it. This tiny transformation is worth internalising because it is the whole basis of prefix sums: once you have this array, the sum of any range [l, r] is prefix[r] - prefix[l-1] in constant time, which is how a great many array problems later in the ladder avoid nested loops. Watch the accumulator type when values are large — in Java or C++ a sum of a thousand million-sized values still fits in a 32-bit int, but the margin is thinner than it looks.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1) in place, O(n) for a separate output array',
  },

  'build-array-from-permutation': {
    description:
      'You are given an array a of length n that is a permutation of the numbers 0 through n-1, meaning every index appears exactly once as a value. Build the array b where b[i] = a[a[i]]: take the value at position i, use it as an index, and read the value found there.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated integers.',
      output: 'One line of n space-separated integers: the array b.',
    },
    examples: [
      {
        input: '5\n0 2 1 4 3',
        output: '0 1 2 3 4',
        explanation:
          'For i = 1, a[1] is 2 and a[2] is 1, so b[1] = 1. For i = 3, a[3] is 4 and a[4] is 3, so b[3] = 3.',
      },
      {
        input: '4\n0 2 3 1',
        output: '0 3 1 2',
        explanation:
          'b[1] = a[a[1]] = a[2] = 3, b[2] = a[a[2]] = a[3] = 1, b[3] = a[a[3]] = a[1] = 2.',
      },
    ],
    constraints: ['1 <= n <= 1000', '0 <= a[i] < n', 'a is a permutation of 0..n-1'],
    hints: [
      'With a separate output array this is one line inside one loop. Write that first and make sure you agree on what a[a[i]] means.',
      'Doing it in place is the interesting version, and it is hard because overwriting position i destroys a value that a later position still needs to read.',
      'Every value is smaller than n, so you can pack two numbers into one slot: store old + n * (new % n), then divide every slot by n at the end. The old value survives as slot % n while you still need it.',
    ],
    approach:
      'The straightforward answer is a second array and a single pass, and for an interview that is usually the right answer to give first. The reason this problem exists is the in-place follow-up, which teaches a genuinely reusable trick: when every value is known to be below some bound n, one array slot can carry two numbers at once — the old value in the remainder when divided by n, the new value in the quotient. You do one pass encoding both, then a second pass dividing everything by n to reveal the new values. Mention the overflow risk if you use it: the encoded value can reach n squared, which overflows a 32-bit integer once n passes about 46,000.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n), or O(1) with the encoding trick',
  },

  /* ---------------------------------------------- Basics / Maths ------- */

  'palindrome-number': {
    description:
      'You are given a signed integer x. Decide whether its decimal digits read the same left to right as right to left. Do it without converting the number to a string — the point of the exercise is arithmetic on digits.',
    ioFormat: {
      input: 'One line containing the integer x.',
      output: 'true if x is a palindrome, false otherwise.',
    },
    examples: [
      {
        input: '121',
        output: 'true',
        explanation: 'Reading backwards gives 121 again.',
      },
      {
        input: '-121',
        output: 'false',
        explanation:
          'The minus sign only appears at the front, so reversed it would read 121- . Every negative number fails.',
      },
      {
        input: '10',
        output: 'false',
        explanation: 'Reversed it reads 01, which is 1, not 10.',
      },
    ],
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    hints: [
      'Two cases are false before you do any work at all: any negative number, and any number ending in 0 unless the number is 0 itself.',
      'Peel digits off the back with x % 10 and x / 10, building the reversed number as you go.',
      'You do not have to reverse the whole number. Stop when the reversed half is greater than or equal to what is left, then compare the halves — this also sidesteps overflow entirely.',
    ],
    approach:
      'Reversing the whole number and comparing works, but it can overflow: the reverse of a valid 32-bit integer need not itself be a valid 32-bit integer. The cleaner solution reverses only half. Peel digits off the back into a growing reversed value and stop once that value is at least as large as what remains at the front; at that point the two halves meet in the middle. For an even digit count the halves should be equal, and for an odd count you drop the middle digit by dividing the reversed half by ten. The two early exits — negatives, and trailing zeros on a non-zero number — are not optimisations, they are correctness.',
    timeComplexity: 'O(log x)',
    spaceComplexity: 'O(1)',
  },

  'reverse-integer': {
    description:
      'You are given a signed 32-bit integer x. Return the integer formed by reversing the order of its digits, keeping the sign. If the reversed value falls outside the signed 32-bit range, which is -2147483648 to 2147483647, return 0 instead. You may not use any 64-bit type to hold the intermediate result.',
    ioFormat: {
      input: 'One line containing the integer x.',
      output: 'The reversed integer, or 0 on overflow.',
    },
    examples: [
      { input: '123', output: '321', explanation: 'Digits reversed, sign unchanged.' },
      {
        input: '-123',
        output: '-321',
        explanation: 'The sign is kept; only the digits are reversed.',
      },
      {
        input: '1534236469',
        output: '0',
        explanation:
          'Reversed this would be 9646324351, which is larger than 2147483647, so the answer is 0.',
      },
    ],
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    hints: [
      'Build the answer one digit at a time: result = result * 10 + last digit of x, then drop that digit from x.',
      'The overflow must be caught before it happens, not after — once the value has wrapped, the evidence is gone.',
      'Before multiplying, check whether result is already greater than 214748364, or exactly 214748364 with a digit above 7. Those are the only ways the next step can overflow.',
    ],
    approach:
      'The digit loop is easy; the whole problem is the overflow rule, and it is a good one to get right because "check afterwards" does not work in a language where signed overflow wraps or is undefined. The bound 2147483647 ends in ...364 7, so before executing result = result * 10 + digit you compare result against 214748364: strictly greater means the multiply alone overflows, and equal means it overflows only if the incoming digit exceeds 7. The negative side is symmetric with 8 as the limiting digit. Handling the sign separately and reversing the absolute value is tempting but breaks on the most negative integer, whose absolute value is not representable — reversing the signed value directly avoids that entirely.',
    timeComplexity: 'O(log x)',
    spaceComplexity: 'O(1)',
  },

  'happy-number': {
    description:
      'Define one step on a positive integer as replacing it with the sum of the squares of its digits. A number is happy if repeating that step eventually reaches 1. If it never reaches 1, the sequence falls into a cycle that repeats forever. Given n, decide whether it is happy.',
    ioFormat: {
      input: 'One line containing the positive integer n.',
      output: 'true if n is happy, false otherwise.',
    },
    examples: [
      {
        input: '19',
        output: 'true',
        explanation:
          '1 + 81 = 82, then 64 + 4 = 68, then 36 + 64 = 100, then 1 + 0 + 0 = 1. It reaches 1, so 19 is happy.',
      },
      {
        input: '2',
        output: 'false',
        explanation:
          'The sequence runs 4, 16, 37, 58, 89, 145, 42, 20, 4 and then repeats forever without touching 1.',
      },
    ],
    constraints: ['1 <= n <= 2^31 - 1'],
    hints: [
      'The dangerous case is not a wrong answer, it is an infinite loop. You need a way to notice that the sequence has started repeating.',
      'A set of every value seen so far works: stop when you hit 1, or when you see a value for the second time.',
      'You can drop the set entirely. Run two pointers over the sequence, one advancing one step and the other two steps; if they ever meet at a value other than 1, there is a cycle.',
    ],
    approach:
      'What makes this more than a digit exercise is that the sequence is a linked structure in disguise: each number points to exactly one successor, so the path from n either reaches 1 or enters a cycle. That reframing gives you both solutions. The hash-set version records every value and stops on a repeat — simple, and worth writing first. The better version is Floyd’s tortoise and hare: advance one copy by a single step and another by two, and they are guaranteed to meet inside any cycle, using constant memory. The digit-square step itself is bounded — any number below a billion drops under 800 in one step — which is why the process always terminates quickly.',
    timeComplexity: 'O(log n) per step, and the sequence length is bounded by a constant',
    spaceComplexity: 'O(1) with the two-pointer version',
  },

  'power-of-two': {
    description:
      'You are given an integer n. Decide whether it is a power of two, meaning whether there exists an integer k with 0 <= k such that n equals 2 raised to the power k. Note that n can be zero or negative, and neither of those can be a power of two.',
    ioFormat: {
      input: 'One line containing the integer n.',
      output: 'true if n is a power of two, false otherwise.',
    },
    examples: [
      { input: '16', output: 'true', explanation: '16 is 2 to the power 4.' },
      { input: '1', output: 'true', explanation: '1 is 2 to the power 0.' },
      { input: '6', output: 'false', explanation: '6 is 2 times 3, so it has a factor other than 2.' },
      { input: '0', output: 'false', explanation: 'Zero is not a power of anything.' },
    ],
    constraints: ['-2^31 <= n <= 2^31 - 1'],
    hints: [
      'Dividing by two while the number stays even is a correct answer and takes about thirty steps. Get that working first.',
      'In binary, a power of two is a single 1 bit followed by zeros. That is a property you can test without a loop.',
      'Subtracting one from such a number flips that single 1 to 0 and turns every zero below it into a 1, so n and n-1 share no bits at all: n & (n - 1) is zero exactly when n has one bit set.',
    ],
    approach:
      'The loop version is fine and you should be able to write it instantly, but the bit version is the one worth knowing: n & (n - 1) clears the lowest set bit of n, so if the result is zero then n had only one bit set. Guard it with n > 0, because the identity also holds for zero and the check would wrongly report true. This "clear the lowest set bit" idiom comes back repeatedly — counting set bits, iterating over subsets, and the power-of-four problem later in this topic, where you additionally need that single bit to sit in an even position.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
  },

  'add-digits': {
    description:
      'You are given a non-negative integer n. Repeatedly replace it with the sum of its digits until only one digit remains, and report that digit. For example 38 becomes 3 + 8 = 11, which becomes 1 + 1 = 2, so the answer is 2. Try to find a solution that runs in constant time without any loop.',
    ioFormat: {
      input: 'One line containing the integer n.',
      output: 'A single digit from 0 to 9.',
    },
    examples: [
      {
        input: '38',
        output: '2',
        explanation: '38 gives 11, and 11 gives 2, which is a single digit so the process stops.',
      },
      { input: '0', output: '0', explanation: 'Already a single digit.' },
      { input: '99', output: '9', explanation: '99 gives 18, and 18 gives 9.' },
    ],
    constraints: ['0 <= n <= 2^31 - 1'],
    hints: [
      'Write the obvious nested loop first, then look at the answers for 1 through 20 written out in a row.',
      'The answers cycle 1,2,3,4,5,6,7,8,9,1,2,3,... — that is a pattern with period 9.',
      'Summing digits never changes a number’s remainder when divided by 9, because 10 leaves remainder 1. So the answer is n mod 9, with 9 substituted whenever n is a non-zero multiple of 9.',
    ],
    approach:
      'This is called the digital root, and the point of the problem is to make you look for structure instead of simulating. The key fact is that 10 leaves a remainder of 1 when divided by 9, so every power of ten does too, which means a number and the sum of its digits always have the same remainder mod 9. Repeated digit-summing therefore cannot change that remainder, and since the final value is a single digit it must be exactly the remainder — except that a non-zero multiple of 9 gives remainder 0 while the digital root is 9. The compact way to write all three cases at once is 1 + (n - 1) mod 9 for n > 0, and 0 for n = 0.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
  },

  'count-primes': {
    description:
      'You are given an integer n. Count how many prime numbers are strictly less than n. A prime is a whole number above 1 whose only divisors are 1 and itself. Note that n itself is never counted, even when it is prime.',
    ioFormat: {
      input: 'One line containing the integer n.',
      output: 'A single integer: how many primes are below n.',
    },
    examples: [
      {
        input: '10',
        output: '4',
        explanation: 'The primes below 10 are 2, 3, 5 and 7.',
      },
      { input: '2', output: '0', explanation: 'There is nothing below 2, and 2 itself does not count.' },
      { input: '0', output: '0', explanation: 'No primes below 0.' },
    ],
    constraints: ['0 <= n <= 5 * 10^6'],
    hints: [
      'Testing each number for primality one at a time is too slow at this size. Turn the problem around: instead of asking which numbers are prime, cross out the ones that cannot be.',
      'Keep a boolean array of length n. Walk upward, and each time you meet a number still marked prime, mark all of its multiples as composite.',
      'You can start crossing out at p * p rather than 2 * p, because every smaller multiple already got crossed out by a smaller prime. That also means you can stop the outer loop once p * p reaches n.',
    ],
    approach:
      'This is the Sieve of Eratosthenes, and it is the first problem on the ladder where the naive method is genuinely too slow rather than merely inelegant. Trial division costs about n times the square root of n; the sieve costs close to n. The two refinements that matter are starting the inner loop at p squared, since any multiple below that has a smaller prime factor and is already marked, and stopping the outer loop when p squared exceeds n, since beyond that point nothing new gets crossed out. Be careful with the array type in C++ or Java at the top of the constraint range — five million booleans is fine, five million ints is wasteful.',
    timeComplexity: 'O(n log log n)',
    spaceComplexity: 'O(n)',
  },

  'excel-sheet-column-number': {
    description:
      'Spreadsheet columns are labelled A, B, ... , Z, then AA, AB, ... , AZ, then BA and so on. Given such a label as a string of uppercase letters, return the column number it denotes, counting A as 1.',
    ioFormat: {
      input: 'One line containing the column label, uppercase letters only.',
      output: 'A single integer: the column number.',
    },
    examples: [
      { input: 'A', output: '1', explanation: 'The first column.' },
      {
        input: 'AB',
        output: '28',
        explanation: 'A contributes 1 * 26 and B contributes 2, giving 26 + 2 = 28.',
      },
      {
        input: 'ZY',
        output: '701',
        explanation: 'Z contributes 26 * 26 = 676 and Y contributes 25, giving 701.',
      },
    ],
    constraints: ['1 <= label length <= 7', 'Label contains only the characters A through Z'],
    hints: [
      'This is base conversion, and the base is 26. Process the letters left to right the way you would read a decimal number.',
      'Carry a running total: for each letter, multiply the total by 26 and add the letter’s value.',
      'The catch is that the digits run 1 to 26 rather than 0 to 25 — there is no zero digit. That is why A is 1 and why Z followed by A is not the same as 26 followed by 1 in ordinary base 26.',
    ],
    approach:
      'Reading a number in any base is the same loop: total = total * base + digit. The only thing that makes this problem interesting is that the numbering is bijective base-26, with digits 1 through 26 and no zero, so the value of a letter is its position in the alphabet rather than its offset from A. Getting that wrong gives you answers that are correct for single letters and drift as the label lengthens, which is exactly the kind of bug that passes your first test and fails the second. Convert a character to its value with c - \'A\' + 1 and the rest falls out.',
    timeComplexity: 'O(length of the label)',
    spaceComplexity: 'O(1)',
  },

  'perfect-number': {
    description:
      'A perfect number is a positive integer that equals the sum of all its positive divisors excluding itself. For instance 28 is perfect because its proper divisors 1, 2, 4, 7 and 14 add up to 28. Given an integer n, decide whether it is perfect.',
    ioFormat: {
      input: 'One line containing the integer n.',
      output: 'true if n is perfect, false otherwise.',
    },
    examples: [
      {
        input: '28',
        output: 'true',
        explanation: '1 + 2 + 4 + 7 + 14 = 28.',
      },
      { input: '7', output: 'false', explanation: 'Its only proper divisor is 1, and 1 is not 7.' },
      { input: '1', output: 'false', explanation: 'It has no proper divisors at all, so the sum is 0.' },
    ],
    constraints: ['1 <= n <= 10^8'],
    hints: [
      'Checking every number below n is too slow at the top of the range. Divisors come in pairs.',
      'If d divides n then so does n / d, and one of the pair is always at or below the square root of n. So you only need to loop while d * d <= n.',
      'Two traps when you add both members of a pair: never add n itself, and when n is a perfect square do not add its square root twice.',
    ],
    approach:
      'The pairing insight is the whole problem, and it recurs everywhere divisors appear: loop d from 2 while d * d <= n, and whenever d divides n add both d and n / d. Seed the sum with 1, which is a proper divisor of every n above 1, and never add n itself — which is why the loop starts at 2 rather than 1. The square-root case needs care: when d equals n / d you would otherwise count that divisor twice. Handle n = 1 separately, since it has no proper divisors and the general logic would wrongly start its sum at 1.',
    timeComplexity: 'O(sqrt n)',
    spaceComplexity: 'O(1)',
  },

  /* ------------------------------------------ Basics / Recursion ------- */

  'fibonacci-number': {
    description:
      'The Fibonacci sequence starts with F(0) = 0 and F(1) = 1, and every later term is the sum of the two before it. Given n, return F(n).',
    ioFormat: {
      input: 'One line containing the integer n.',
      output: 'A single integer: F(n).',
    },
    examples: [
      { input: '4', output: '3', explanation: 'The sequence runs 0, 1, 1, 2, 3 — so F(4) is 3.' },
      { input: '0', output: '0', explanation: 'The base case.' },
      { input: '10', output: '55', explanation: '0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55.' },
    ],
    constraints: ['0 <= n <= 90'],
    hints: [
      'The plain recursive definition is correct but recomputes the same terms an exponential number of times. Try tracing the calls for n = 6 and count how often F(2) is evaluated.',
      'Either remember each result the first time you compute it, or build the sequence upward from the bottom.',
      'Building upward needs only the last two values, so you do not need an array at all — two variables and a loop.',
    ],
    approach:
      'This problem exists to show you the gap between a correct definition and a usable algorithm. Naive recursion mirrors the mathematics exactly and costs exponential time because the call tree repeats enormous amounts of work; memoising it makes it linear by refusing to compute any term twice; and turning it upside down into a loop makes it linear in time and constant in space, because F(n) only ever depends on the two values before it. Work through all three, since this is the template for almost every dynamic-programming problem later on. One practical note: F(90) is close to 2.9 * 10^18, which fits in a 64-bit signed integer but overflows a 32-bit one, so choose your type deliberately.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1) iteratively',
  },

  'reverse-string': {
    description:
      'You are given a string as an array of characters. Reverse the order of the characters in place, using no extra array — only a constant amount of additional memory.',
    ioFormat: {
      input: 'One line containing the string.',
      output: 'The reversed string on one line.',
    },
    examples: [
      { input: 'hello', output: 'olleh', explanation: 'Each character moves to the mirrored position.' },
      {
        input: 'Hannah',
        output: 'hannaH',
        explanation: 'Case is preserved, so the result is not identical to the input.',
      },
    ],
    constraints: ['1 <= length <= 10^5', 'The string contains printable ASCII characters'],
    hints: [
      'Two indices, one at each end, swapping and stepping toward each other.',
      'Stop when the two indices meet or cross — continuing past that point swaps everything back.',
      'An odd-length string leaves the middle character untouched, and that falls out of the loop condition automatically rather than needing its own case.',
    ],
    approach:
      'This is the smallest possible instance of the two-pointer pattern, which is why it sits this early in the ladder. A pointer at each end, swap, move both inward, stop when they meet. The loop condition left < right is what makes the odd-length case free: the middle character is already where it belongs. Recursion works too — swap the ends and recurse on the middle — and it is worth writing once to see the same structure expressed differently, though it costs stack depth proportional to the length. In Python remember that strings are immutable, so you work on a list of characters and join at the end.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  },

  'power-of-four': {
    description:
      'You are given an integer n. Decide whether it is a power of four, meaning whether there is an integer k with 0 <= k such that n equals 4 raised to the power k. Solve it without a loop and without recursion.',
    ioFormat: {
      input: 'One line containing the integer n.',
      output: 'true if n is a power of four, false otherwise.',
    },
    examples: [
      { input: '16', output: 'true', explanation: '16 is 4 squared.' },
      {
        input: '8',
        output: 'false',
        explanation: '8 is a power of two but not a power of four — its single set bit sits in an odd position.',
      },
      { input: '1', output: 'true', explanation: '1 is 4 to the power 0.' },
    ],
    constraints: ['-2^31 <= n <= 2^31 - 1'],
    hints: [
      'Every power of four is a power of two, so start from that test: positive, and n & (n - 1) equal to zero.',
      'That is not enough — 2, 8 and 32 all pass it. Write those out in binary next to 1, 4, 16 and 64 and look at where the single 1 sits.',
      'Powers of four have their bit in an even position. Mask against the constant 0x55555555, which has 1s exactly in those positions.',
    ],
    approach:
      'Build it in two halves. First establish that only one bit is set, using the n & (n - 1) trick from the power-of-two problem, guarded by n > 0. Then establish that the bit is in an even position, because 4^k is 2^(2k) and the exponent is always even. The mask 0x55555555 is binary 0101 repeated, so a non-zero result of n & 0x55555555 confirms the bit sits where it should. The alternative arithmetic test is that n - 1 is divisible by 3, which works for the same underlying reason and is worth knowing as a second answer if an interviewer asks for one.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
  },

  /* -------------------------------------------- Basics / Hashing ------- */

  'contains-duplicate': {
    description:
      'You are given an array of n integers. Report whether any value appears more than once. Return true if at least one value is repeated, and false if every value is distinct.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated integers.',
      output: 'true if any value repeats, false otherwise.',
    },
    examples: [
      { input: '4\n1 2 3 1', output: 'true', explanation: 'The value 1 appears at both ends.' },
      { input: '4\n1 2 3 4', output: 'false', explanation: 'All four values are distinct.' },
      {
        input: '10\n1 1 1 3 3 4 3 2 4 2',
        output: 'true',
        explanation: 'Several values repeat; one is enough to answer true.',
      },
    ],
    constraints: ['1 <= n <= 10^5', '-10^9 <= element <= 10^9'],
    hints: [
      'Comparing every pair is correct and costs n squared. At n = 100,000 that is ten billion comparisons.',
      'You need a way to ask "have I seen this value before?" quickly. A hash set answers that in constant time on average.',
      'Return as soon as an insertion fails. Waiting until the end and comparing sizes also works but does more work than necessary on arrays that repeat early.',
    ],
    approach:
      'This is the problem that justifies the hash set, and the trade it makes is the one you will make hundreds of times on this ladder: spend O(n) memory to turn an O(n^2) scan into an O(n) pass. Walk the array, try to insert each value into a set, and return true the moment an insert finds the value already present. Sorting first and comparing neighbours is a legitimate alternative at O(n log n) time and no extra memory, and it is the right answer when memory is tight or when the input is already sorted — being able to name both, and say when you would pick each, is what an interviewer is listening for.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },

  'ransom-note': {
    description:
      'You are given two strings: a note you want to assemble, and a magazine you can cut letters out of. Each letter in the magazine can be used at most once. Decide whether the note can be built entirely from the magazine’s letters. Both strings consist of lowercase English letters.',
    ioFormat: {
      input: 'The first line holds the note. The second line holds the magazine.',
      output: 'true if the note can be built, false otherwise.',
    },
    examples: [
      {
        input: 'aa\nab',
        output: 'false',
        explanation: 'The note needs two copies of a, and the magazine only supplies one.',
      },
      {
        input: 'aa\naab',
        output: 'true',
        explanation: 'The magazine has two a characters, which is exactly what the note needs.',
      },
      { input: 'a\nb', output: 'false', explanation: 'The required letter is not present at all.' },
    ],
    constraints: ['1 <= length of each string <= 10^5', 'Both strings are lowercase English letters'],
    hints: [
      'Order does not matter here — only how many of each letter you have against how many you need.',
      'Count the letters of the magazine first, then walk the note and spend one from the count for each character.',
      'With only 26 possible letters you do not need a hash map at all: an array of 26 counters is smaller and faster.',
    ],
    approach:
      'The insight is that this is a multiset containment question dressed up as a string question, so the answer is counting rather than searching. Tally the magazine into 26 counters, then walk the note decrementing the counter for each character and fail the moment one would go below zero. Decrementing as you go, rather than counting both strings and comparing afterwards, lets you exit early and uses one pass over the note instead of two. An immediate rejection when the note is longer than the magazine costs one comparison and saves the whole scan on an obvious no.',
    timeComplexity: 'O(n + m)',
    spaceComplexity: 'O(1), since the alphabet is fixed at 26',
  },

  'first-unique-character-in-a-string': {
    description:
      'You are given a string of lowercase English letters. Find the first character that appears exactly once in the string and return its index. If every character repeats, return -1.',
    ioFormat: {
      input: 'One line containing the string.',
      output: 'The index of the first non-repeating character, or -1.',
    },
    examples: [
      {
        input: 'leetcode',
        output: '0',
        explanation: 'l appears once and is the first character, so the answer is index 0.',
      },
      {
        input: 'loveleetcode',
        output: '2',
        explanation:
          'l and o both repeat; v at index 2 is the first character that appears exactly once.',
      },
      { input: 'aabb', output: '-1', explanation: 'Every character appears twice.' },
    ],
    constraints: ['1 <= length <= 10^5', 'The string contains only lowercase English letters'],
    hints: [
      'You cannot decide whether the first character is unique until you have seen the whole string, so one pass will not be enough.',
      'Pass one counts every letter. Pass two walks the string again in order and returns the first index whose count is 1.',
      'Scanning in the original order on the second pass is what makes the answer "first" — iterating over the 26 counters instead would give you the alphabetically smallest unique letter, which is a different question.',
    ],
    approach:
      'Two passes, and the reason there must be two is worth stating plainly: uniqueness is a property of the whole string, so no single left-to-right pass can commit to an answer at the moment it sees a candidate. Count first, then re-scan in index order and return the first count of one. The subtle mistake is doing the second pass over the counter array rather than over the string — that finds a unique letter, but not the earliest one. Because the alphabet is fixed at 26, the counting array is constant space no matter how long the input is.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1), since the alphabet is fixed at 26',
  },

  'intersection-of-two-arrays': {
    description:
      'You are given two integer arrays. Return the values that appear in both, with each value listed at most once regardless of how often it occurs in either array. The order of the result does not matter.',
    ioFormat: {
      input:
        'The first line holds n and the second line holds n integers. The third line holds m and the fourth line holds m integers.',
      output: 'The shared values, space separated, each appearing once.',
    },
    examples: [
      {
        input: '2\n1 2\n2\n2 2',
        output: '2',
        explanation:
          'Only 2 is in both. It appears twice in the second array, but the result lists it once.',
      },
      {
        input: '4\n4 9 5\n5\n9 4 9 8 4',
        output: '4 9',
        explanation: 'Both 4 and 9 appear in each array. Either order is accepted.',
      },
    ],
    constraints: ['1 <= n, m <= 1000', '0 <= element <= 1000'],
    hints: [
      'The phrase "each value at most once" is telling you the answer is a set, not a list.',
      'Put one array into a hash set, then walk the other and collect the values the set contains.',
      'Collect the results into a second set as well, otherwise a value repeated in the second array lands in your output more than once.',
    ],
    approach:
      'Two sets is the whole solution, and the second one is the part people forget: the first set answers "is this value in the other array", and the second stops duplicates in the array you are scanning from reaching the output. Build the set from the shorter array to keep memory down. The sorted alternative — sort both, then walk them with two pointers, skipping equal neighbours — costs O(n log n + m log m) but no extra memory beyond the output, and it is the better answer when the inputs are already sorted or too large to hash comfortably.',
    timeComplexity: 'O(n + m)',
    spaceComplexity: 'O(min(n, m))',
  },

  /* --------------------------------- Sorting / From Scratch ------------ */

  'bubble-sort': {
    description:
      'Implement bubble sort yourself, without calling a library sort. Repeatedly walk the array comparing each adjacent pair and swapping them when they are out of order. After the first full pass the largest value has been carried to the end; after the second pass the two largest are in place, and so on. Print the sorted array in non-decreasing order.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated integers.',
      output: 'One line of n space-separated integers in non-decreasing order.',
    },
    examples: [
      {
        input: '5\n5 1 4 2 8',
        output: '1 2 4 5 8',
        explanation:
          'The first pass moves 8 to the end, the second settles 5 before it, and the array is sorted after a few more passes.',
      },
      { input: '3\n3 2 1', output: '1 2 3', explanation: 'The worst case — every pair must be swapped.' },
    ],
    constraints: ['1 <= n <= 2000', '-10^6 <= element <= 10^6'],
    hints: [
      'The inner loop compares position j with j + 1, so it must stop one short of the end or you will read past the array.',
      'After pass number i, the last i elements are already final — shorten the inner loop each time instead of rescanning them.',
      'If a whole pass makes no swaps the array is already sorted. Tracking that with a flag turns an already-sorted input from n squared into n.',
    ],
    approach:
      'Bubble sort is not a sort you would ever choose, and that is exactly why it is here: it is the cheapest way to get comfortable with the loop invariant "after i passes, the last i positions hold the i largest values in order". Hold that sentence in mind and both refinements follow from it — shrink the inner loop by i because those positions are settled, and stop early when a pass performs no swaps because that proves the remainder is already ordered. Write the swap carefully; getting a three-line swap wrong is a surprisingly common way to lose an interview.',
    timeComplexity: 'O(n^2), O(n) on an already-sorted array with the early-exit flag',
    spaceComplexity: 'O(1)',
  },

  'insertion-sort': {
    description:
      'Implement insertion sort yourself, without calling a library sort. Treat the front of the array as a sorted region that grows by one each step: take the next unsorted element and slide it left past every larger element until it sits in the right place. Print the sorted array in non-decreasing order.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated integers.',
      output: 'One line of n space-separated integers in non-decreasing order.',
    },
    examples: [
      {
        input: '5\n12 11 13 5 6',
        output: '5 6 11 12 13',
        explanation:
          '11 slides in front of 12, 13 stays put, then 5 slides all the way to the front, and finally 6 settles behind it.',
      },
      {
        input: '4\n1 2 3 4',
        output: '1 2 3 4',
        explanation:
          'Already sorted, so no element ever slides — this is the best case and costs a single pass.',
      },
    ],
    constraints: ['1 <= n <= 2000', '-10^6 <= element <= 10^6'],
    hints: [
      'Hold the element you are placing in a temporary variable before you start shifting, or the first shift will overwrite it.',
      'Shift larger elements one position to the right rather than swapping repeatedly — it is the same result with a third of the writes.',
      'The inner loop has two stopping conditions and you need both: you have run off the front of the array, or you have found an element no larger than the one you are placing.',
    ],
    approach:
      'Insertion sort is the one quadratic sort worth actually using, because on nearly-sorted data it is close to linear and it is stable — equal elements keep their original order, which matters when you sort by one key after another. The technique to internalise is shifting rather than swapping: save the value, slide everything bigger one place right, then drop the value into the gap. Real library sorts fall back to insertion sort for small subarrays for exactly this reason, so the code you write here shows up inside industrial-strength implementations.',
    timeComplexity: 'O(n^2) worst case, O(n) when the input is nearly sorted',
    spaceComplexity: 'O(1)',
  },

  'selection-sort': {
    description:
      'Implement selection sort yourself, without calling a library sort. On each pass, scan the unsorted remainder of the array for its smallest element and swap that element into the first unsorted position. Print the sorted array in non-decreasing order.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated integers.',
      output: 'One line of n space-separated integers in non-decreasing order.',
    },
    examples: [
      {
        input: '5\n64 25 12 22 11',
        output: '11 12 22 25 64',
        explanation:
          'Pass one finds 11 and swaps it to the front; pass two finds 12 among the rest and swaps it into position two, and so on.',
      },
      { input: '2\n2 1', output: '1 2', explanation: 'One swap finishes it.' },
    ],
    constraints: ['1 <= n <= 2000', '-10^6 <= element <= 10^6'],
    hints: [
      'Track the index of the smallest element you have seen, not its value — you need the index to perform the swap.',
      'Do the swap once, after the inner loop finishes. Swapping every time you find something smaller is wasted work.',
      'Nothing here depends on the data, so the comparison count is the same for every input of a given size — there is no early exit to add.',
    ],
    approach:
      'Selection sort is the quadratic sort that does the fewest writes: exactly n swaps regardless of input, against the many shifts insertion sort performs. That makes it the right choice in the rare setting where writing is expensive and reading is cheap, such as wearing out flash memory. It is also unusual in having no best case — the inner scan always examines the whole remainder, so an already-sorted array costs just as much as a reversed one. Note too that the straightforward implementation is not stable, because the long-distance swap can jump an equal element over its twin.',
    timeComplexity: 'O(n^2) in every case',
    spaceComplexity: 'O(1)',
  },

  'merge-sort': {
    description:
      'Implement merge sort yourself, without calling a library sort. Split the array into two halves, sort each half by the same method, then merge the two sorted halves into one sorted whole by repeatedly taking the smaller of the two front elements. Print the sorted array in non-decreasing order.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated integers.',
      output: 'One line of n space-separated integers in non-decreasing order.',
    },
    examples: [
      {
        input: '6\n38 27 43 3 9 82',
        output: '3 9 27 38 43 82',
        explanation:
          'The halves 38 27 43 and 3 9 82 sort to 27 38 43 and 3 9 82, which then merge element by element.',
      },
      { input: '1\n5', output: '5', explanation: 'A single element is already sorted — the base case.' },
    ],
    constraints: ['1 <= n <= 10^5', '-10^9 <= element <= 10^9'],
    hints: [
      'Get the merge right on its own first: two already-sorted arrays into one, using two read positions.',
      'After the main merge loop, one of the two halves still has elements left. Copy the remainder across — forgetting this drops values silently.',
      'Allocate the scratch buffer once outside the recursion rather than inside every call, or the allocations will dominate the running time.',
    ],
    approach:
      'Merge sort is the first genuinely efficient sort on the ladder, and the divide-and-conquer shape it teaches is reused by quicksort, by binary search on answers, and by a great many tree problems. The recursion is trivial; the merge is where the bugs live, so write it standalone and test it before wiring the recursion around it. Two details separate a working version from a good one: copy the leftover tail of whichever half did not run out, and reuse a single scratch array across all calls instead of allocating per level. Unlike quicksort it is stable and its O(n log n) bound holds on every input, which is why it is the sort of choice when worst-case guarantees matter.',
    timeComplexity: 'O(n log n) in every case',
    spaceComplexity: 'O(n)',
  },

  'quick-sort': {
    description:
      'Implement quicksort yourself, without calling a library sort. Choose a pivot, partition the array so that everything smaller sits to its left and everything larger to its right, then sort the two sides by the same method. Print the sorted array in non-decreasing order.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated integers.',
      output: 'One line of n space-separated integers in non-decreasing order.',
    },
    examples: [
      {
        input: '6\n10 7 8 9 1 5',
        output: '1 5 7 8 9 10',
        explanation:
          'Partitioning around 5 puts 1 on its left and the rest on its right, and each side is then sorted the same way.',
      },
      {
        input: '5\n2 2 2 2 2',
        output: '2 2 2 2 2',
        explanation:
          'All values equal — the case that degrades a careless partition into quadratic time.',
      },
    ],
    constraints: ['1 <= n <= 10^5', '-10^9 <= element <= 10^9'],
    hints: [
      'Write the partition step as its own function that returns the pivot’s final index. Everything else is two recursive calls around it.',
      'Always taking the first or last element as the pivot makes an already-sorted array the worst case, which is the input most likely to be tested.',
      'Pick the pivot at random, or as the median of the first, middle and last elements. For inputs with many duplicates, partition into three regions — less than, equal to, greater than — so equal elements are never re-sorted.',
    ],
    approach:
      'Quicksort is faster than merge sort in practice, with better cache behaviour and no scratch array, and in exchange it gives up the worst-case guarantee: a bad pivot choice makes it quadratic. The two defences are both worth implementing here, because they are what real implementations do. Randomising the pivot makes the bad case vanishingly unlikely rather than merely unlikely on the inputs you happened to test. Three-way partitioning — the Dutch national flag layout — collapses runs of equal elements into a single settled block, which is what saves you on the all-equal input above. Recursing into the smaller side first keeps the stack depth logarithmic.',
    timeComplexity: 'O(n log n) expected, O(n^2) worst case',
    spaceComplexity: 'O(log n) for the recursion stack',
  },

  /* ------------------------------------ Sorting / Applied -------------- */

  'sort-colors': {
    description:
      'You are given an array of n values, each of which is 0, 1 or 2, standing for red, white and blue. Sort them in place so that all the 0s come first, then all the 1s, then all the 2s. Do it in a single pass, using only constant extra memory, and without calling a library sort.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated values, each 0, 1 or 2.',
      output: 'One line of n space-separated values in sorted order.',
    },
    examples: [
      {
        input: '6\n2 0 2 1 1 0',
        output: '0 0 1 1 2 2',
        explanation: 'Two of each value, grouped in order.',
      },
      { input: '3\n2 0 1', output: '0 1 2', explanation: 'One of each.' },
    ],
    constraints: ['1 <= n <= 300', 'Every element is 0, 1 or 2'],
    hints: [
      'Counting how many of each value and then rewriting the array is correct, but it reads the array twice. The problem is asking for one pass.',
      'Keep three indices: a boundary below which everything is 0, a boundary above which everything is 2, and a cursor scanning between them.',
      'When you swap a 2 into place from the back, do not advance the cursor — the value you just received has not been examined yet. When you swap a 0 forward, you can advance, because the value coming back is always a 1.',
    ],
    approach:
      'This is the Dutch national flag partition, and it is the same machinery that makes three-way quicksort work on duplicate-heavy input, which is why it sits right after quicksort here. Maintain three regions and one cursor, and the entire algorithm is a three-way branch: a 0 swaps to the low boundary and both advance, a 1 is already where it belongs so only the cursor advances, and a 2 swaps to the high boundary which then moves inward while the cursor stays put. That last asymmetry is the whole problem — advancing after a swap from the back skips an unexamined element, and it is the bug nearly everyone writes first.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  },

  'merge-sorted-array': {
    description:
      'You are given two arrays sorted in non-decreasing order. The first has m real elements followed by n empty slots, giving it exactly enough room for both. The second has n elements. Merge the second into the first so that the first ends up holding all m + n values in sorted order. Do it in place, without allocating another array.',
    ioFormat: {
      input:
        'The first line holds m and n. The second line holds m + n integers, where the last n are placeholder zeros. The third line holds the n integers of the second array.',
      output: 'One line of m + n space-separated integers in non-decreasing order.',
    },
    examples: [
      {
        input: '3 3\n1 2 3 0 0 0\n2 5 6',
        output: '1 2 2 3 5 6',
        explanation: 'The three real values 1 2 3 merge with 2 5 6 to fill all six slots.',
      },
      {
        input: '0 1\n0\n1',
        output: '1',
        explanation: 'The first array has no real elements, so the result is just the second.',
      },
    ],
    constraints: ['0 <= m, n <= 200', '-10^9 <= element <= 10^9', 'Both inputs are sorted'],
    hints: [
      'Merging from the front forces you to shift elements out of the way, which is where the in-place requirement bites.',
      'The free space is at the back. Fill from the back instead, taking the larger of the two candidates each time.',
      'When the second array runs out you can stop immediately — anything still in the first array is already in the right place. The reverse is not true, so the leftovers of the second array must be copied.',
    ],
    approach:
      'Reversing the direction of the merge is the entire insight, and it generalises: when in-place work would require shifting, check whether the free space is at the other end and work toward it. Three indices walk backwards — one at the last real element of the first array, one at the end of the second, one at the last slot — and each step writes the larger candidate and steps that index back. The asymmetric ending is worth understanding rather than memorising: leftovers in the first array are already in their final positions, whereas leftovers in the second array still have to be moved across.',
    timeComplexity: 'O(m + n)',
    spaceComplexity: 'O(1)',
  },

  'sort-an-array': {
    description:
      'You are given an array of n integers. Return it sorted in non-decreasing order, without using any built-in sort function. Your solution must run in O(n log n) time and use as little extra space as you can manage.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated integers.',
      output: 'One line of n space-separated integers in non-decreasing order.',
    },
    examples: [
      { input: '4\n5 2 3 1', output: '1 2 3 5', explanation: 'Standard ascending order.' },
      {
        input: '5\n5 1 1 2 0',
        output: '0 1 1 2 5',
        explanation: 'Duplicates are kept, both copies of 1 appear in the output.',
      },
    ],
    constraints: ['1 <= n <= 5 * 10^4', '-5 * 10^4 <= element <= 5 * 10^4'],
    hints: [
      'This is the exam for the sorts you just wrote. Merge sort passes it on every input; plain quicksort with a fixed pivot does not.',
      'The test data for this problem is known to include adversarial cases aimed at naive pivot selection, so randomise your pivot or use merge sort.',
      'Look at the value range in the constraints. Values span only about 100,000 possibilities, which opens the door to counting sort in linear time.',
    ],
    approach:
      'The interesting part of this problem is choosing which sort to bring, and the constraints are the hint. Merge sort is the safe answer — guaranteed O(n log n), stable, and no pathological input. Quicksort is faster in practice but needs a randomised pivot here, because fixed-pivot implementations are exactly what this problem is designed to break. Heapsort gives the same guarantee as merge sort in constant extra space. And since the values span a small fixed range, counting sort runs in genuinely linear time by tallying each value and writing them back out, which is the answer worth volunteering once you have given a comparison-based one.',
    timeComplexity: 'O(n log n), or O(n + range) with counting sort',
    spaceComplexity: 'O(n) for merge sort, O(1) for heapsort',
  },

  'largest-number': {
    description:
      'You are given a list of non-negative integers. Arrange them in some order and concatenate their decimal representations, so as to produce the largest possible resulting number. Return that number as a string, since it may be far too large to hold in an integer type.',
    ioFormat: {
      input: 'The first line holds n. The second line holds n space-separated non-negative integers.',
      output: 'The largest concatenation, as a single string on one line.',
    },
    examples: [
      {
        input: '2\n10 2',
        output: '210',
        explanation:
          'Concatenating as 2 then 10 gives 210, which beats 1020. Note that 2 sorts before 10 here even though it is the smaller number.',
      },
      {
        input: '5\n3 30 34 5 9',
        output: '9534330',
        explanation:
          '9, then 5, then 34, then 3, then 30. Compare 3 against 30 by testing "330" against "303" — the first wins, so 3 goes first.',
      },
      {
        input: '2\n0 0',
        output: '0',
        explanation: 'Naive concatenation would give "00"; the answer must be a single 0.',
      },
    ],
    constraints: ['1 <= n <= 100', '0 <= element <= 10^9'],
    hints: [
      'Sorting by numeric value is wrong, and so is sorting by string value. Try both on 3 and 30 to see them fail.',
      'The right question for any pair a and b is: does a + b read larger than b + a, as strings? Sort by that comparison.',
      'After sorting, handle the all-zeros case — if the first character of the result is 0 then every input was 0 and the answer is the single character "0".',
    ],
    approach:
      'The lesson here is that a sort is only as good as its comparator, and the natural orders both fail. The correct comparator is pairwise and concrete: a should come before b exactly when the string a + b is greater than the string b + a. That relation is a genuine total order — it is transitive, which is what makes it safe to hand to a sort at all — and proving that to yourself is a good use of ten minutes. Two practical notes: compare the concatenations as strings rather than converting back to numbers, since the results overflow any fixed integer type, and collapse a leading zero at the end, because an input of all zeros would otherwise produce a string of them.',
    timeComplexity: 'O(n log n) comparisons, each costing the length of the numbers',
    spaceComplexity: 'O(n)',
  },

  'relative-sort-array': {
    description:
      'You are given two arrays. The second lists distinct values, all of which also occur in the first. Sort the first array so that its elements follow the order given by the second array. Any element of the first array that does not appear in the second must be placed at the end, in ascending order.',
    ioFormat: {
      input:
        'The first line holds n and the second line holds the n elements to sort. The third line holds m and the fourth line holds the m ordering values.',
      output: 'One line of n space-separated integers in the required order.',
    },
    examples: [
      {
        input: '11\n2 3 1 3 2 4 6 7 9 2 19\n4\n2 1 4 3',
        output: '2 2 2 1 4 3 3 9 6 7 19',
        explanation:
          'The values 2, 1, 4 and 3 come first in exactly that order, with duplicates grouped. Then 6, 7, 9 and 19 — which are not in the ordering list — follow in ascending order.',
      },
      {
        input: '8\n28 6 22 8 44 17\n3\n22 28 8',
        output: '22 28 8 6 17 44',
        explanation: 'The listed values lead; 6, 17 and 44 trail in ascending order.',
      },
    ],
    constraints: ['1 <= n <= 1000', '0 <= element <= 1000', 'The second array has distinct values'],
    hints: [
      'Build a lookup from value to its position in the ordering array, then sort the first array with a comparator that reads that lookup.',
      'Elements missing from the lookup must sort after everything present, and among themselves by value. Give them a rank larger than any real position.',
      'Because the values are bounded by 1000, you can skip sorting entirely: count how many of each value there are, then emit them by walking the ordering array and afterwards walking 0 to 1000.',
    ],
    approach:
      'This is a custom-comparator exercise, and the clean way to express it is to map each value to a sort key — its index in the ordering array if present, or a sentinel above every real index if not — and break ties among the absent values by the value itself. Many languages let you return a tuple or pair from the key function, which handles both levels at once. Worth noticing, though, is that the small value range makes the comparison sort unnecessary: tally counts into an array of 1001 buckets, then output each listed value as many times as it occurred, then sweep the buckets in order for the rest. That version is linear and is the stronger answer to give.',
    timeComplexity: 'O(n log n) with a comparator, O(n + range) with counting',
    spaceComplexity: 'O(range)',
  },
};
