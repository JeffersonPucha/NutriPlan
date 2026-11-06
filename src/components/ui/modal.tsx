"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ title, onClose, children, wide = false, closeDisabled = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; closeDisabled?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null); const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => {
      dialog?.close(); document.body.style.overflow = previous;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? "modal-wide" : ""}`} aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); if (!closeDisabled) onClose(); }} onClick={(event) => { if (!closeDisabled && event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}>
    <div className="modal-header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" disabled={closeDisabled} aria-label="Cerrar ventana" onClick={onClose}><X size={20} aria-hidden="true" /></button></div>
    <div className="modal-body">{children}</div>
  </dialog>;
}
