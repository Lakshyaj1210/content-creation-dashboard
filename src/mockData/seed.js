/** Seed records are dated relative to "now" so the calendar always looks alive. */
export function createSeedPosts(now = new Date()) {
  const at = (dayOffset, hour = 9, minute = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  const iso = now.toISOString();
  const mk = (n, o) => ({
    id: `seed_${n}`,
    body: '',
    tags: [],
    date: null,
    needsApproval: false,
    metrics: { views: 0, engagement: 0 },
    createdAt: iso,
    updatedAt: iso,
    ...o,
  });

  return [
    mk(1, {
      title: 'Why 70% of ABM programs stall in quarter two',
      platform: 'LinkedIn',
      status: 'Published',
      date: at(-24, 8, 30),
      tags: ['abm', 'demand-gen', 'b2b'],
      metrics: { views: 18420, engagement: 1253 },
      body: "Most account-based programs don't fail at launch. They fail at **week 10**, when sales stops opening the alerts.\n\nThree fixes that worked for us:\n\n- Cut the target list from 400 to 60 accounts\n- Give every account one named owner in sales\n- Review pipeline influence weekly, not quarterly\n\nWhat's the first thing you cut when ABM gets noisy?",
    }),
    mk(2, {
      title: 'We replaced 14 dashboards with one weekly memo',
      platform: 'Blog',
      status: 'Published',
      date: at(-17, 10),
      tags: ['analytics', 'ops', 'leadership'],
      metrics: { views: 9610, engagement: 742 },
      body: '# One memo beats fourteen dashboards\n\nOur leadership team stopped reading dashboards in 2023. Here is the memo format that replaced them, and the three metrics that survived the cut.\n\n## What we measure now\n\n- Pipeline created per channel\n- Sales cycle length by segment\n- Net revenue retention',
    }),
    mk(3, {
      title: 'Hot take: your case studies are too polite',
      platform: 'Twitter',
      status: 'Published',
      date: at(-9, 14, 15),
      tags: ['content', 'case-studies'],
      metrics: { views: 41280, engagement: 3190 },
      body: 'Hot take: your case studies are too polite.\n\nNobody buys because "Customer X saw a 20% lift." They buy because you showed the ugly month-two where it almost broke, and how you fixed it.',
    }),
    mk(4, {
      title: 'Q3 Pipeline Pulse: what changed in enterprise buying',
      platform: 'Newsletter',
      status: 'Published',
      date: at(-3, 7),
      tags: ['newsletter', 'research', 'enterprise'],
      metrics: { views: 6240, engagement: 884 },
      body: "This month's issue: buying committees grew to **11 people**, security review now starts before the first demo, and why your champion matters less than you think.",
    }),
    mk(5, {
      title: 'The 5-minute security questionnaire template',
      platform: 'LinkedIn',
      status: 'Scheduled',
      date: at(1, 9),
      tags: ['security', 'sales-enablement'],
      needsApproval: false,
      body: 'Security questionnaires kill deals quietly. We built a reusable answer library that cut turnaround from 9 days to 2.\n\n- Pre-approve answers with legal\n- Tag by framework (SOC 2, ISO 27001)\n- Review quarterly\n\nTemplate in the comments.',
    }),
    mk(6, {
      title: 'Webinar teaser: Forecasting without spreadsheets',
      platform: 'Twitter',
      status: 'Scheduled',
      date: at(3, 11, 30),
      tags: ['webinar', 'forecasting'],
      body: 'Live next Thursday: how three RevOps leaders forecast without a 40-tab spreadsheet.\n\nBring your messiest pipeline question.',
    }),
    mk(7, {
      title: 'Customer story: how Halden Freight cut onboarding by 40%',
      platform: 'YouTube',
      status: 'Scheduled',
      date: at(6, 15),
      tags: ['customer-story', 'video'],
      body: 'A 6-minute walkthrough with Halden Freight on how they rebuilt customer onboarding around a single shared plan.',
    }),
    mk(8, {
      title: 'Pricing page teardown: 9 B2B SaaS examples',
      platform: 'Blog',
      status: 'Draft',
      date: at(9, 10),
      tags: ['pricing', 'teardown'],
      needsApproval: true,
      body: '# Pricing page teardown\n\nWe reviewed nine B2B SaaS pricing pages. **Seven** hid their enterprise price behind a form.\n\n- What the best ones do differently\n- The one element that lifted conversion',
    }),
    mk(9, {
      title: 'Lessons from running 40 customer advisory boards',
      platform: 'LinkedIn',
      status: 'Draft',
      tags: ['customer-success', 'leadership'],
      needsApproval: true,
      body: "After 40 advisory boards, the best ones share one trait: members are asked to **decide**, not to listen.\n\nHere's the agenda we use...",
    }),
    mk(10, {
      title: 'Thread: the anatomy of a high-converting demo',
      platform: 'Twitter',
      status: 'Draft',
      tags: ['demos', 'sales'],
      body: 'The best demos are 70% discovery. A thread on structuring the first 20 minutes...',
    }),
  ];
}
