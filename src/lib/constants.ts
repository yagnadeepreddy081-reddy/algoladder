/**
 * Plain constants shared between server actions and client components.
 *
 * These cannot live inside a `'use server'` module — Next.js only allows such a
 * file to export async functions — so they get their own home here.
 */

export const CODE_LANGUAGES = [
  'java',
  'python',
  'cpp',
  'javascript',
  'typescript',
  'c',
  'go',
  'rust',
  'kotlin',
  'text',
] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const REPORT_REASONS = [
  'Broken or wrong link',
  'Wrong difficulty',
  'Wrong topic or subtopic',
  'Duplicate problem',
  'Description is inaccurate',
  'Something else',
] as const;
