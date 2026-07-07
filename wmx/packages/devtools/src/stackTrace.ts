export interface StackFrame {
  function: string;
  file: string;
  line: number;
  column: number;
}

const FRAME_PATTERN = /at\s+(?:(.*?)\s+\()?(.*?):(\d+):(\d+)\)?/;

/** Parses a V8-style Error.stack into structured frames — file, line, column, and calling function. */
export function formatStackTrace(error: Error): StackFrame[] {
  if (!error.stack) return [];

  const frames: StackFrame[] = [];
  const lines = error.stack.split("\n").slice(1);

  for (const line of lines) {
    const match = FRAME_PATTERN.exec(line.trim());
    if (!match) continue;

    const [, fn, file, lineNo, column] = match;
    frames.push({
      function: fn?.trim() || "<anonymous>",
      file,
      line: Number(lineNo),
      column: Number(column),
    });
  }

  return frames;
}
