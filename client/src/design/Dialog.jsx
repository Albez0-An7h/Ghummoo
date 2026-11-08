import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '../components/ui';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Focus trap + Escape + scroll lock + focus return. Shared by Dialog and Drawer. */
function useOverlay(open, onClose, panelRef, initialFocusRef) {
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const panel = panelRef.current;
    const first = initialFocusRef?.current || panel?.querySelector(FOCUSABLE) || panel;
    requestAnimationFrame(() => first?.focus({ preventScroll: true }));
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); return; }
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
      if (opener && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    };
  }, [open, onClose, panelRef, initialFocusRef]);
}

export function Dialog({ open, onClose, title, description, children, footer, size = 'md', initialFocusRef }) {
  const panel = useRef(null);
  const id = useId();
  useOverlay(open, onClose, panel, initialFocusRef);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden data-cursor-passthrough />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        aria-describedby={description ? `${id}-d` : undefined}
        tabIndex={-1}
        className={cx('relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-lift outline-none animate-fade-up sm:rounded-[28px]', size === 'lg' ? 'sm:max-w-3xl' : size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-xl')}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5">
          <div>
            <h2 id={`${id}-t`} className="text-lg font-extrabold">{title}</h2>
            {description && <p id={`${id}-d`} className="mt-1 text-sm text-subtle">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-sand" aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-ivory/60 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* Side sheet. On phones it slides from the bottom; on larger screens from the side. */
export function Drawer({ open, onClose, title, children, footer, side = 'right' }) {
  const panel = useRef(null);
  const id = useId();
  useOverlay(open, onClose, panel);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden data-cursor-passthrough />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        tabIndex={-1}
        className={cx(
          'absolute flex flex-col bg-ivory shadow-lift outline-none',
          'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[28px] animate-fade-up',
          'sm:inset-y-0 sm:bottom-auto sm:h-full sm:max-h-none sm:w-[400px] sm:rounded-none',
          side === 'right' ? 'sm:left-auto sm:right-0' : 'sm:left-0 sm:right-auto'
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id={`${id}-t`} className="text-lg font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-sand" aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex gap-2 border-t border-line bg-white px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
