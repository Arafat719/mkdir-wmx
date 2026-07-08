import { useEffect, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import { formatBytes } from "../formatBytes.js";
import "./FileUpload.css";

export type UploadStatus = "idle" | "uploading" | "done" | "error";

export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  previewUrl?: string;
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
  label?: ReactNode;
  hint?: ReactNode;
  onFilesChange?: (files: UploadFile[]) => void;
  onUpload?: (file: File, onProgress: (progress: number) => void) => Promise<void> | void;
  className?: string;
}

function generateId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function matchesAccept(file: File, accept: string): boolean {
  const patterns = accept.split(",").map((p) => p.trim()).filter(Boolean);
  if (patterns.length === 0) return true;
  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    if (pattern.endsWith("/*")) return file.type.startsWith(pattern.slice(0, -1));
    return file.type === pattern;
  });
}

export function FileUpload({
  accept,
  multiple = true,
  maxFiles,
  maxSizeBytes,
  disabled = false,
  label = "Drag and drop files here",
  hint,
  onFilesChange,
  onUpload,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  // Revoke any outstanding object URLs when the component unmounts, so preview
  // blobs don't leak once the caller stops rendering the upload widget.
  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, []);

  const runUpload = (entry: UploadFile) => {
    if (!onUpload) return;
    const update = (patch: Partial<UploadFile>) => {
      setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, ...patch } : f)));
    };
    update({ status: "uploading", progress: 0 });
    Promise.resolve(onUpload(entry.file, (progress) => update({ progress })))
      .then(() => update({ status: "done", progress: 100 }))
      .catch((err) => update({ status: "error", error: err instanceof Error ? err.message : "Upload failed" }));
  };

  const addFiles = (incoming: File[]) => {
    if (disabled) return;
    const rejected: string[] = [];
    const accepted: File[] = [];
    const remainingSlots = maxFiles ? Math.max(0, maxFiles - files.length) : Infinity;

    for (const file of incoming) {
      if (accept && !matchesAccept(file, accept)) {
        rejected.push(`${file.name} — unsupported file type`);
        continue;
      }
      if (maxSizeBytes && file.size > maxSizeBytes) {
        rejected.push(`${file.name} — exceeds ${formatBytes(maxSizeBytes)} limit`);
        continue;
      }
      if (accepted.length >= remainingSlots) {
        rejected.push(`${file.name} — max ${maxFiles} file${maxFiles === 1 ? "" : "s"} allowed`);
        continue;
      }
      accepted.push(file);
    }

    setRejections(rejected);

    if (accepted.length === 0) return;

    const entries: UploadFile[] = accepted.map((file) => ({
      id: generateId(),
      file,
      status: "idle",
      progress: 0,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));

    setFiles((prev) => {
      const next = multiple ? [...prev, ...entries] : entries;
      if (!multiple) {
        // Replacing the single-file selection — release the previous preview blob.
        prev.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
      }
      onFilesChange?.(next);
      return next;
    });

    entries.forEach(runUpload);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((f) => f.id !== id);
      onFilesChange?.(next);
      return next;
    });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    addFiles(Array.from(e.dataTransfer.files));
  };

  const openBrowser = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openBrowser();
    }
  };

  const classes = ["wmx-upload", isDragging && "wmx-upload--dragging", disabled && "wmx-upload--disabled", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div
        className="wmx-upload__zone"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={openBrowser}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="wmx-upload__input"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <span className="wmx-upload__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
            <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="wmx-upload__label">{label}</span>
        {hint && <span className="wmx-upload__hint">{hint}</span>}
      </div>

      {rejections.length > 0 && (
        <ul className="wmx-upload__rejections">
          {rejections.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="wmx-upload__list">
          {files.map((entry) => (
            <li key={entry.id} className="wmx-upload__item">
              <span className="wmx-upload__thumb" aria-hidden="true">
                {entry.previewUrl ? (
                  <img src={entry.previewUrl} alt="" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </span>

              <span className="wmx-upload__meta">
                <span className="wmx-upload__name">{entry.file.name}</span>
                <span className="wmx-upload__size">{formatBytes(entry.file.size)}</span>
                {entry.status === "uploading" && (
                  <span className="wmx-upload__progress">
                    <span className="wmx-upload__progress-bar" style={{ width: `${entry.progress}%` }} />
                  </span>
                )}
                {entry.status === "error" && <span className="wmx-upload__error">{entry.error}</span>}
              </span>

              <span className="wmx-upload__status" aria-hidden="true">
                {entry.status === "done" && <span className="wmx-upload__status-icon wmx-upload__status-icon--done">✓</span>}
                {entry.status === "error" && <span className="wmx-upload__status-icon wmx-upload__status-icon--error">!</span>}
              </span>

              <button
                type="button"
                className="wmx-upload__remove"
                onClick={() => removeFile(entry.id)}
                aria-label={`Remove ${entry.file.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
