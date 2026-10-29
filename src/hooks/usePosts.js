import { useCallback, useEffect, useState } from 'react';
import { loadPosts, resetPosts, savePosts } from '../services/storage.js';

export function usePosts() {
  const [posts, setPosts] = useState(loadPosts);

  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  const upsert = useCallback(
    (post) =>
      setPosts((ps) =>
        ps.some((p) => p.id === post.id) ? ps.map((p) => (p.id === post.id ? post : p)) : [post, ...ps],
      ),
    [],
  );
  const patch = useCallback(
    (id, changes) =>
      setPosts((ps) =>
        ps.map((p) => (p.id === id ? { ...p, ...changes, updatedAt: new Date().toISOString() } : p)),
      ),
    [],
  );
  const remove = useCallback((id) => setPosts((ps) => ps.filter((p) => p.id !== id)), []);
  const replace = useCallback((next) => setPosts(Array.isArray(next) ? next : []), []);
  const reset = useCallback(() => setPosts(resetPosts()), []);
  return { posts, upsert, patch, remove, replace, reset };
}
