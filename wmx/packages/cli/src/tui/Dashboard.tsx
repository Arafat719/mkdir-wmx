import React, { useState } from 'react'
import { Box, Text, useInput, useApp, useStdout } from 'ink'
import { execa } from 'execa'
import { TUI_COMMANDS } from './commands.js'

// Keeps the command list from growing absurdly tall on very short
// terminals. Not load-bearing for the frame-stacking issue any more
// (renderDashboard forces a full clear+redraw every time), just keeps
// the layout sane.
const CHROME_ROWS = 12
const MIN_LIST_HEIGHT = 5

// Batches stdout/stderr chunks from a running command before flushing
// them into React state, so a chatty command doesn't trigger a full
// terminal clear+redraw (see renderDashboard.ts) many times a second.
const FLUSH_INTERVAL_MS = 120

// Cycled by each command's absolute index so every entry in the sidebar
// gets its own color (magenta is reserved for the selection highlight).
const LIST_COLORS = ['cyan', 'green', 'yellow', 'blue', 'redBright', 'cyanBright', 'greenBright', 'yellowBright'] as const

interface DashboardProps {
  version: string
  cwd: string
}

type RunState =
  | { status: 'idle' }
  | { status: 'running'; lines: string[]; current: string }
  | { status: 'done'; ok: boolean; lines: string[] }

// Strips ANSI escape sequences from captured child-process output before
// embedding it inside an Ink <Text>, EXCEPT color/style (SGR) codes —
// those are safe to keep (Ink measures their width as zero and the
// terminal just applies the color) and preserve each command's own
// red/yellow/green formatting. Cursor-move/erase codes (spinner control,
// etc.) are dropped since they'd corrupt Ink's own layout.
function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;?]*[a-zA-Z]/g, match => (match.endsWith('m') ? match : ''))
}

export default function Dashboard({ version, cwd }: DashboardProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [run, setRun] = useState<RunState>({ status: 'idle' })
  const { exit } = useApp()
  const { stdout } = useStdout()

  const terminalRows = stdout?.rows ?? 24
  const listHeight = Math.max(
    MIN_LIST_HEIGHT,
    Math.min(TUI_COMMANDS.length, terminalRows - CHROME_ROWS)
  )
  // Same budget as the sidebar list: how many output lines fit in the
  // right-hand panel before we start tailing (dropping the oldest lines).
  const outputHeight = listHeight

  const clampScroll = (index: number, offset: number): number => {
    if (index < offset) return index
    if (index >= offset + listHeight) return index - listHeight + 1
    return Math.min(offset, Math.max(0, TUI_COMMANDS.length - listHeight))
  }

  const runCommand = (selected: (typeof TUI_COMMANDS)[number]) => {
    setRun({ status: 'running', lines: [], current: '' })

    // Accumulates raw chunks into finished lines, collapsing carriage
    // returns the way a real terminal would (a spinner redrawing the
    // same line via `\r` should only ever show its latest frame, not
    // every frame it ever printed).
    let currentLine = ''
    const finishedLines: string[] = []
    let pending: string[] = []
    let flushTimer: NodeJS.Timeout | null = null

    const scheduleFlush = () => {
      if (flushTimer) return
      flushTimer = setTimeout(() => {
        flushTimer = null
        const toAppend = pending
        pending = []
        setRun(r =>
          r.status === 'running'
            ? { ...r, lines: [...r.lines, ...toAppend], current: currentLine }
            : r
        )
      }, FLUSH_INTERVAL_MS)
    }

    const onData = (chunk: Buffer) => {
      for (const ch of chunk.toString('utf8')) {
        if (ch === '\n') {
          const cleaned = stripAnsi(currentLine)
          finishedLines.push(cleaned)
          pending.push(cleaned)
          currentLine = ''
        } else if (ch === '\r') {
          currentLine = ''
        } else {
          currentLine += ch
        }
      }
      scheduleFlush()
    }

    const child = execa(process.argv[0], [process.argv[1], ...selected.run.split(' ')], {
      all: true,
      reject: false
    })
    child.all?.on('data', onData)

    child.then(result => {
      if (flushTimer) clearTimeout(flushTimer)
      if (currentLine.trim() !== '') finishedLines.push(stripAnsi(currentLine))
      setRun({ status: 'done', ok: (result.exitCode ?? 1) === 0, lines: finishedLines })
    })
  }

  useInput((input, key) => {
    if (run.status === 'done') {
      // Any key dismisses the result and returns to the idle dashboard view.
      setRun({ status: 'idle' })
      return
    }
    if (run.status === 'running') {
      // Ignore navigation/launch keys while a command is in flight; only
      // quitting is allowed (and it takes the whole app down with it).
      if (input === 'q' || key.escape) exit()
      return
    }
    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => {
        const next = Math.max(0, i - 1)
        setScrollOffset(o => clampScroll(next, o))
        return next
      })
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => {
        const next = Math.min(TUI_COMMANDS.length - 1, i + 1)
        setScrollOffset(o => clampScroll(next, o))
        return next
      })
    } else if (input === 'q' || key.escape) {
      exit()
    } else if (key.return) {
      runCommand(TUI_COMMANDS[selectedIndex])
    }
  }, { isActive: true })

  const selected = TUI_COMMANDS[selectedIndex]

  const footer =
    run.status === 'running' ? (
      <Text color="yellow">running wmx {selected.run} ...  please wait</Text>
    ) : run.status === 'done' ? (
      <Text color="white">press any key to return to the dashboard</Text>
    ) : (
      <>
        <Text color="gray">↑↓ / jk  navigate    </Text>
        <Text color="white">enter</Text>
        <Text color="gray">  run command    </Text>
        <Text color="white">q</Text>
        <Text color="gray">  quit</Text>
      </>
    )

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" paddingX={1}>
        <Text bold color="magenta">wmx</Text>
        <Text> Developer OS  </Text>
        <Text color="gray">v{version}  {cwd}</Text>
      </Box>

      <Box flexDirection="row">
        <Box width={28} borderStyle="single" flexDirection="column">
          {scrollOffset > 0 && <Text color="gray">  ▲ more above</Text>}
          {TUI_COMMANDS.slice(scrollOffset, scrollOffset + listHeight).map((cmd, i) => {
            const index = scrollOffset + i
            return index === selectedIndex ? (
              <Text key={cmd.key} backgroundColor="magenta" color="white"> {cmd.label.padEnd(24)} </Text>
            ) : (
              <Text key={cmd.key} color={LIST_COLORS[index % LIST_COLORS.length]}> {cmd.label.padEnd(24)} </Text>
            )
          })}
          {scrollOffset + listHeight < TUI_COMMANDS.length && <Text color="gray">  ▼ more below</Text>}
        </Box>

        <Box flexGrow={1} borderStyle="single" paddingX={1} flexDirection="column">
          {run.status === 'idle' && (
            <>
              <Text bold color="magenta">{selected.label}</Text>
              <Text> </Text>
              <Text color="white">{selected.description}</Text>
              <Text> </Text>
              <Text color="gray">Options:</Text>
              {selected.options.map((option, i) => (
                <Text key={i} color="cyan">  {option}</Text>
              ))}
            </>
          )}

          {run.status !== 'idle' && (
            <>
              <Text bold color="magenta">wmx {selected.run}</Text>
              <Text> </Text>
              {run.lines.slice(-outputHeight).map((line, i) => (
                <Text key={i}>{line === '' ? ' ' : line}</Text>
              ))}
              {run.status === 'running' && run.current !== '' && (
                <Text color="gray">{run.current}</Text>
              )}
              {run.status === 'done' && (
                <>
                  <Text> </Text>
                  <Text color={run.ok ? 'green' : 'red'}>
                    {run.ok ? `✔  wmx ${selected.run} complete.` : `✖  wmx ${selected.run} failed.`}
                  </Text>
                </>
              )}
            </>
          )}
        </Box>
      </Box>

      <Box borderStyle="single" paddingX={1}>
        {footer}
      </Box>
    </Box>
  )
}
