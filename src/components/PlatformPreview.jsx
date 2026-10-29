import { useState } from 'react';
import { Briefcase, MessageCircle, Repeat2, Send, ThumbsUp, Heart, Share, BarChart2 } from 'lucide-react';
import { chunkText, renderMarkdown, stripMarkdown } from '../utils/markdown.js';

const Avatar = ({ dark }) => <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white ${dark ? 'bg-indigo-500' : 'bg-gradient-to-br from-indigo-500 to-sky-500'}`}>NR</div>;
const hashtags = (tags) => tags.map((t) => `#${t.replace(/[^a-z0-9]/gi, '')}`).join(' ');

export function LinkedInPreview({ post }) {
  const [open, setOpen] = useState(false);
  const full = `${post.title ? `**${post.title}**\n\n` : ''}${post.body}`;
  const plainLen = stripMarkdown(full).length;
  const long = plainLen > 220;
  return (
    <div className="rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm">
      <div className="flex gap-2 p-3">
        <Avatar />
        <div className="min-w-0 text-sm leading-tight">
          <p className="font-semibold">Northwind Revenue Team</p>
          <p className="text-xs text-slate-500">B2B growth & demand generation</p>
          <p className="text-xs text-slate-500">{post.status === 'Published' ? 'Posted' : 'Preview'} · 🌐</p>
        </div>
      </div>
      <div className={`px-3 pb-2 text-sm [overflow-wrap:anywhere] ${!open && long ? 'line-clamp-4' : ''}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(full) || '<p class="text-slate-400">Your post will appear here…</p>' }} />
      {long && <button className="px-3 pb-2 text-sm text-slate-500 hover:text-sky-700" onClick={() => setOpen(!open)}>{open ? 'show less' : '…see more'}</button>}
      {!!post.tags.length && <p className="px-3 pb-3 text-sm font-medium text-sky-700">{hashtags(post.tags)}</p>}
      <div className="flex justify-between border-t border-slate-200 px-2 py-1 text-xs text-slate-600">
        {[[ThumbsUp, 'Like'], [MessageCircle, 'Comment'], [Repeat2, 'Repost'], [Send, 'Send']].map(([I, l]) => <span key={l} className="flex items-center gap-1.5 px-2 py-2"><I size={15} />{l}</span>)}
      </div>
    </div>
  );
}

export function TwitterPreview({ post }) {
  const text = stripMarkdown([post.body, hashtags(post.tags)].filter(Boolean).join('\n\n'));
  const chunks = chunkText(text, 280);
  const last = chunks[chunks.length - 1].length;
  return (
    <div className="space-y-2">
      {chunks.slice(0, 4).map((c, i, arr) => (
        <div key={i} className="rounded-2xl border border-slate-700 bg-black p-3 text-slate-100">
          <div className="flex gap-2.5">
            <Avatar dark />
            <div className="min-w-0 flex-1">
              <p className="text-sm"><span className="font-bold">Northwind</span> <span className="text-slate-500">@northwind · {i === 0 ? 'now' : '1m'}</span></p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-snug [overflow-wrap:anywhere]">{c || <span className="text-slate-500">Your post will appear here…</span>}</p>
              {chunks.length > 1 && <p className="mt-1 text-xs text-slate-500">{i + 1}/{chunks.length}</p>}
              <div className="mt-3 flex max-w-xs justify-between text-slate-500"><MessageCircle size={16} /><Repeat2 size={16} /><Heart size={16} /><BarChart2 size={16} /><Share size={16} /></div>
            </div>
          </div>
          {i === arr.length - 1 && chunks.length > 4 && <p className="mt-2 text-xs text-slate-500">+{chunks.length - 4} more posts in thread</p>}
        </div>
      ))}
      <p className={`text-right text-xs ${chunks.length > 1 ? 'text-amber-500' : 'text-slate-500'}`}>{chunks.length > 1 ? `Thread of ${chunks.length} · ` : ''}{last}/280</p>
    </div>
  );
}

export default function PlatformPreview({ post }) {
  const [tab, setTab] = useState(post.platform === 'Twitter' ? 'Twitter' : 'LinkedIn');
  return (
    <div>
      <div className="mb-3 inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-white/15" role="tablist" aria-label="Preview platform">
        {[['LinkedIn', 'LinkedIn feed', Briefcase], ['Twitter', 'Twitter/X', MessageCircle]].map(([id, label, I]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm ${tab === id ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}><I size={14} />{label}</button>
        ))}
      </div>
      {tab === 'LinkedIn' ? <LinkedInPreview post={post} /> : <TwitterPreview post={post} />}
    </div>
  );
}
