import { useState } from "react";
import type { ReactNode } from "react";
import "./Accordion.css";

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenIds?: string[];
}

export function Accordion({ items, allowMultiple = false, defaultOpenIds = [] }: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const isOpen = prev.includes(id);
      if (allowMultiple) {
        return isOpen ? prev.filter((x) => x !== id) : [...prev, id];
      }
      return isOpen ? [] : [id];
    });
  };

  return (
    <div className="wmx-accordion">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id} className="wmx-accordion__item">
            <button
              type="button"
              className="wmx-accordion__trigger"
              aria-expanded={isOpen}
              disabled={item.disabled}
              onClick={() => toggle(item.id)}
            >
              <span>{item.title}</span>
              <span className={`wmx-accordion__chevron${isOpen ? " wmx-accordion__chevron--open" : ""}`} aria-hidden="true">
                ⌄
              </span>
            </button>
            <div className={`wmx-accordion__panel${isOpen ? " wmx-accordion__panel--open" : ""}`}>
              <div className="wmx-accordion__panel-inner">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
