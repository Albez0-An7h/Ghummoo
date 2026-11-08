import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    const prev = document.title;
    document.title = title.includes('Ghumo') ? title : `${title} · Ghumo AI`;
    return () => { document.title = prev; };
  }, [title]);
}
