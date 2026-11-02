const ANGLES = [
  {
    angle: 'Contrarian take',
    hook: (t, a) => `Everything ${a} has been told about ${t} is slightly wrong.`,
    outline: (t) => [`State the popular belief about ${t}`, 'Show the data or story that breaks it', 'Offer the replacement mental model'],
  },
  {
    angle: 'Step-by-step playbook',
    hook: (t) => `How we approach ${t} in 5 steps (and the step most teams skip).`,
    outline: (t) => [`Why ${t} breaks down at scale`, 'The five steps, each with one concrete example', 'A checklist readers can copy'],
  },
  {
    angle: 'Personal story',
    hook: (t) => `We got ${t} badly wrong for two years. Here is what finally worked.`,
    outline: () => ['The mistake, told honestly', 'The turning point', 'What changed in the numbers', 'What you would do first'],
  },
  {
    angle: 'Data-driven insight',
    hook: (t, a) => `We analysed 200 ${a} teams. The ${t} pattern nobody talks about.`,
    outline: (t) => ['The headline number', `Three segments where ${t} behaves differently`, 'What to benchmark against'],
  },
  {
    angle: 'Myth vs. reality',
    hook: (t) => `3 myths about ${t} that cost B2B teams real pipeline.`,
    outline: () => ['Myth 1 → reality', 'Myth 2 → reality', 'Myth 3 → reality', 'One action for this week'],
  },
];

const SHORT = { Twitter: true };

/** Deterministic, realistic client-side idea generator (n8n fallback). */
export function generateMockIdeas({ topic, platform, audience = 'B2B marketers' }) {
  const t = (topic || 'content strategy').trim();
  const a = (audience || 'B2B marketers').trim();
  return ANGLES.map((x, i) => {
    let hook = x.hook(t, a);
    if (platform === 'Newsletter') hook = `This week: ${hook}`;
    if (platform === 'Blog') hook = hook.replace(/\.$/, '') + ': a practical guide';
    if (SHORT[platform] && hook.length > 120) hook = hook.slice(0, 117).trimEnd() + '…';
    return {
      id: `mock_${platform}_${i}_${t.length}`,
      angle: x.angle, hook, outline: x.outline(t), platform,
    };
  });
}
