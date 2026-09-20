/**
 * The four languages the playground offers, and everything each one needs:
 * how Monaco highlights it, what the compiler service calls it, which compiler
 * to prefer, and the starter template a new user lands on.
 *
 * Adding a fifth language is a matter of adding one entry here — nothing else
 * in the playground hard-codes a language name.
 */

export const LANGUAGE_IDS = ['python', 'java', 'cpp', 'c'] as const;

export type LanguageId = (typeof LANGUAGE_IDS)[number];

export interface RunnerLanguage {
  id: LanguageId;
  /** Shown on the language tab. */
  label: string;
  /** Monaco's own language identifier, for syntax highlighting. */
  monaco: string;
  /** What Wandbox calls this language in its compiler list. */
  wandboxLanguage: string;
  /**
   * Which compiler to prefer when the service offers several. Compiler names
   * carry their version ("gcc-13.2.0"), so this matches the family, not a
   * pinned release — the newest matching stable build wins.
   */
  compilerPrefix: RegExp;
  /**
   * Raw flags handed to the compiler, ONE PER LINE — Wandbox splits this on
   * newlines, so a space-separated string arrives as a single bogus flag.
   * Empty for interpreted languages.
   */
  compilerOptions: string;
  /** What an empty editor starts with. */
  template: string;
}

export const LANGUAGES: Record<LanguageId, RunnerLanguage> = {
  python: {
    id: 'python',
    label: 'Python',
    monaco: 'python',
    wandboxLanguage: 'Python',
    compilerPrefix: /^cpython-3/,
    compilerOptions: '',
    template: `import sys


def solve(line):
    # Your solution goes here.
    return line


def main():
    data = sys.stdin.read().split()
    if not data:
        print("Add some input in the Input box, then press Run.")
        return
    print(solve(data[0]))


main()
`,
  },

  java: {
    id: 'java',
    label: 'Java',
    monaco: 'java',
    wandboxLanguage: 'Java',
    compilerPrefix: /^openjdk/,
    compilerOptions: '',
    template: `import java.util.Scanner;

// Not \`public\` on purpose: the sandbox compiles this as prog.java, and a
// public class would have to match that file name.
class Main {

    static String solve(String token) {
        // Your solution goes here.
        return token;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNext()) {
            System.out.println("Add some input in the Input box, then press Run.");
            return;
        }
        System.out.println(solve(in.next()));
    }
}
`,
  },

  cpp: {
    id: 'cpp',
    label: 'C++',
    monaco: 'cpp',
    wandboxLanguage: 'C++',
    compilerPrefix: /^gcc-\d/,
    compilerOptions: '-std=gnu++17\n-O2',
    template: `#include <bits/stdc++.h>
using namespace std;

string solve(const string &token) {
    // Your solution goes here.
    return token;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string token;
    if (!(cin >> token)) {
        cout << "Add some input in the Input box, then press Run." << endl;
        return 0;
    }
    cout << solve(token) << endl;
    return 0;
}
`,
  },

  c: {
    id: 'c',
    label: 'C',
    monaco: 'c',
    wandboxLanguage: 'C',
    compilerPrefix: /^gcc-\d.*-c$/,
    compilerOptions: '-std=gnu11\n-O2',
    template: `#include <stdio.h>
#include <string.h>

int main(void) {
    char token[256];

    if (scanf("%255s", token) != 1) {
        printf("Add some input in the Input box, then press Run.\\n");
        return 0;
    }

    /* Your solution goes here. */
    printf("%s\\n", token);
    return 0;
}
`,
  },
};

export const LANGUAGE_LIST: RunnerLanguage[] = LANGUAGE_IDS.map((id) => LANGUAGES[id]);

export const DEFAULT_LANGUAGE: LanguageId = 'python';

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === 'string' && (LANGUAGE_IDS as readonly string[]).includes(value);
}

export function languageOrDefault(value: unknown): RunnerLanguage {
  return LANGUAGES[isLanguageId(value) ? value : DEFAULT_LANGUAGE];
}
