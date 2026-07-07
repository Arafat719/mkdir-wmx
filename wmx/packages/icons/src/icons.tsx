import { createIcon } from "./createIcon.js";

/* ===== Core actions ===== */

export const Check = createIcon("Check", <polyline points="4 12 9 17 20 6" />);

export const CheckCircle = createIcon(
  "CheckCircle",
  <>
    <circle cx="12" cy="12" r="9" />
    <polyline points="8 12.5 11 15.5 16 9" />
  </>
);

export const X = createIcon(
  "X",
  <>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </>
);

export const XCircle = createIcon(
  "XCircle",
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="9" y1="9" x2="15" y2="15" />
    <line x1="15" y1="9" x2="9" y2="15" />
  </>
);

export const Plus = createIcon(
  "Plus",
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>
);

export const PlusCircle = createIcon(
  "PlusCircle",
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </>
);

export const Minus = createIcon("Minus", <line x1="5" y1="12" x2="19" y2="12" />);

/* ===== Chevrons & arrows ===== */

export const ChevronDown = createIcon("ChevronDown", <polyline points="6 9 12 15 18 9" />);
export const ChevronUp = createIcon("ChevronUp", <polyline points="18 15 12 9 6 15" />);
export const ChevronLeft = createIcon("ChevronLeft", <polyline points="15 18 9 12 15 6" />);
export const ChevronRight = createIcon("ChevronRight", <polyline points="9 18 15 12 9 6" />);

export const ArrowRight = createIcon(
  "ArrowRight",
  <>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </>
);

export const ArrowLeft = createIcon(
  "ArrowLeft",
  <>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </>
);

export const ArrowUp = createIcon(
  "ArrowUp",
  <>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </>
);

export const ArrowDown = createIcon(
  "ArrowDown",
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </>
);

export const ExternalLink = createIcon(
  "ExternalLink",
  <>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </>
);

/* ===== Toolbar actions ===== */

export const Search = createIcon(
  "Search",
  <>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
);

export const Filter = createIcon("Filter", <polygon points="4 4 20 4 14 12.5 14 19 10 21 10 12.5 4 4" />);

export const Trash = createIcon(
  "Trash",
  <>
    <polyline points="4 7 20 7" />
    <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </>
);

export const Edit = createIcon(
  "Edit",
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </>
);

export const Copy = createIcon(
  "Copy",
  <>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </>
);

export const Refresh = createIcon(
  "Refresh",
  <>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <polyline points="21 3 21 9 15 9" />
  </>
);

export const Download = createIcon(
  "Download",
  <>
    <path d="M12 3v12" />
    <polyline points="7 11 12 16 17 11" />
    <path d="M5 19h14" />
  </>
);

export const Upload = createIcon(
  "Upload",
  <>
    <path d="M12 21V9" />
    <polyline points="7 13 12 8 17 13" />
    <path d="M5 5h14" />
  </>
);

export const Settings = createIcon(
  "Settings",
  <>
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="8" strokeDasharray="2 3.1" />
  </>
);

export const Menu = createIcon(
  "Menu",
  <>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </>
);

export const MoreHorizontal = createIcon(
  "MoreHorizontal",
  <>
    <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </>
);

export const MoreVertical = createIcon(
  "MoreVertical",
  <>
    <circle cx="12" cy="5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none" />
  </>
);

/* ===== Feedback & status ===== */

export const AlertTriangle = createIcon(
  "AlertTriangle",
  <>
    <path d="M12 3 2 20h20L12 3z" />
    <line x1="12" y1="10" x2="12" y2="14" />
    <circle cx="12" cy="17.2" r="0.75" fill="currentColor" stroke="none" />
  </>
);

export const AlertCircle = createIcon(
  "AlertCircle",
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="12.5" />
    <circle cx="12" cy="16" r="0.75" fill="currentColor" stroke="none" />
  </>
);

export const Info = createIcon(
  "Info",
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="16" />
    <circle cx="12" cy="7.5" r="0.75" fill="currentColor" stroke="none" />
  </>
);

export const Bell = createIcon(
  "Bell",
  <>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </>
);

export const Star = createIcon(
  "Star",
  <polygon points="12 2 15 9 22 9.5 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.5 9 9" />
);

export const Heart = createIcon(
  "Heart",
  <path d="M12 20s-7-4.35-9.5-8.5C.5 8 2 4.5 5.5 4A5 5 0 0 1 12 7a5 5 0 0 1 6.5-3c3.5.5 5 4 3 7.5C19 15.65 12 20 12 20z" />
);

export const Bookmark = createIcon("Bookmark", <path d="M6 3h12v18l-6-4-6 4V3z" />);

export const Eye = createIcon(
  "Eye",
  <>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </>
);

export const EyeOff = createIcon(
  "EyeOff",
  <>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c6 0 10 7 10 7a17.7 17.7 0 0 1-3.4 4.3M6.6 6.6C3.7 8.4 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 4.4-1" />
    <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" />
  </>
);

export const Lock = createIcon(
  "Lock",
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>
);

export const Unlock = createIcon(
  "Unlock",
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 7.4-2" />
  </>
);

/* ===== Developer tooling ===== */

export const Terminal = createIcon(
  "Terminal",
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <polyline points="7 9 10.5 12 7 15" />
    <line x1="12" y1="15" x2="17" y2="15" />
  </>
);

export const Code = createIcon(
  "Code",
  <>
    <polyline points="9 18 3 12 9 6" />
    <polyline points="15 6 21 12 15 18" />
  </>
);

export const GitBranch = createIcon(
  "GitBranch",
  <>
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="6" r="2" />
    <path d="M18 8a9 9 0 0 1-9 9" />
  </>
);

export const GitCommit = createIcon(
  "GitCommit",
  <>
    <line x1="2" y1="12" x2="8" y2="12" />
    <circle cx="12" cy="12" r="3" />
    <line x1="16" y1="12" x2="22" y2="12" />
  </>
);

export const Package = createIcon(
  "Package",
  <>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <line x1="12" y1="13" x2="12" y2="21" />
  </>
);

export const Folder = createIcon(
  "Folder",
  <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
);

export const File = createIcon(
  "File",
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
    <polyline points="14 2 14 8 20 8" />
  </>
);

export const Database = createIcon(
  "Database",
  <>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </>
);

export const Server = createIcon(
  "Server",
  <>
    <rect x="3" y="4" width="18" height="6" rx="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" />
    <line x1="7" y1="7" x2="7" y2="7" />
    <line x1="7" y1="17" x2="7" y2="17" />
  </>
);

export const Github = createIcon(
  "Github",
  <path d="M12 2a10 10 0 0 0-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.98 1.03-2.68-.1-.25-.45-1.28.1-2.67 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.9-1.29 2.75-1.02 2.75-1.02.55 1.39.2 2.42.1 2.67.64.7 1.03 1.58 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48A10 10 0 0 0 12 2z" />
);

/* ===== General ===== */

export const User = createIcon(
  "User",
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
  </>
);

export const Users = createIcon(
  "Users",
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6" />
    <path d="M16 8.5a3 3 0 1 1 4 2.8" />
    <path d="M22 21c0-2.8-2-5-5-5.7" />
  </>
);

export const Home = createIcon(
  "Home",
  <>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" />
  </>
);

export const Calendar = createIcon(
  "Calendar",
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <line x1="16" y1="3" x2="16" y2="7" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>
);

export const Clock = createIcon(
  "Clock",
  <>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15.5 14" />
  </>
);

export const Sun = createIcon(
  "Sun",
  <>
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2.5" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="21.5" />
    <line x1="4.2" y1="4.2" x2="6" y2="6" />
    <line x1="18" y1="18" x2="19.8" y2="19.8" />
    <line x1="2.5" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="21.5" y2="12" />
    <line x1="4.2" y1="19.8" x2="6" y2="18" />
    <line x1="18" y1="6" x2="19.8" y2="4.2" />
  </>
);

export const Moon = createIcon("Moon", <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />);

export const Zap = createIcon("Zap", <polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" />);
