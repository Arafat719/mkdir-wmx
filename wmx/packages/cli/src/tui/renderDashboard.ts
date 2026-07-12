import { render } from 'ink'
import React from 'react'
import Dashboard from './Dashboard.js'

// Ink normally redraws in place by moving the cursor up N lines and
// erasing them, then rewriting the frame — this depends on the terminal
// correctly honoring relative cursor-up escapes. Some terminal emulators
// don't do this reliably for Ink's specific write pattern, so the
// previous frame never actually gets erased and frames stack up on every
// keypress. Ink has a second, unconditional code path — a hard
// `clear + redraw` with no cursor-relative math at all — that it only
// takes when it thinks the frame is taller than the terminal. Reporting
// a fake tiny row count forces every render onto that path, trading a
// per-keypress full-screen clear for redraw correctness on every terminal.
function forceFullClearStdout(stream: NodeJS.WriteStream): NodeJS.WriteStream {
  return new Proxy(stream, {
    get(target, prop, receiver) {
      if (prop === 'rows') return 1
      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    }
  })
}

export interface DashboardProps {
  version: string
  cwd: string
}

export function renderDashboard(props: DashboardProps): void {
  render(React.createElement(Dashboard, props), { stdout: forceFullClearStdout(process.stdout) })
}
