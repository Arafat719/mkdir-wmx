import { useState } from "react";
import type { ReactNode } from "react";
import "./Tabs.css";

export interface Tab {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  onChange?: (id: string) => void;
}

export function Tabs({ tabs, defaultTabId, onChange }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];

  const select = (id: string) => {
    setActiveId(id);
    onChange?.(id);
  };

  return (
    <div className="wmx-tabs">
      <div className="wmx-tabs__list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            disabled={tab.disabled}
            className={`wmx-tabs__tab${tab.id === activeId ? " wmx-tabs__tab--active" : ""}`}
            onClick={() => select(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="wmx-tabs__panel" role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  );
}
