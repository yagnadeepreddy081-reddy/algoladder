import type { Metadata } from 'next';
import problems from '../../../data/problems.json';
import topics from '../../../data/topics.json';
import { GuestDemo } from '@/components/demo/guest-demo';

export const metadata: Metadata = { title: 'Try the interactive roadmap', description: 'Explore all 474 AlgoLadder problems. Track progress, bookmark questions and take notes without an account.' };

export default function DemoPage() {
  // Do not ship hidden grading cases or the entire editorial catalogue to the browser.
  const catalogue = problems.map(p => ({ id: p.id, title: p.title, topicSlug: p.topicSlug,
    topicName: p.topicName, difficulty: p.difficulty, overallNo: p.overallNo,
    externalUrl: p.externalUrl, tags: p.tags, description: p.description, hints: p.hints,
    timeComplexity: p.timeComplexity, spaceComplexity: p.spaceComplexity }));
  return <GuestDemo problems={catalogue} topics={topics.map(t => ({ slug: t.slug, name: t.name }))} />;
}
