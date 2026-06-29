import React, { useState } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import { execa } from 'execa'
import { TUI_COMMANDS } from './commands.js'

interface DashboardProps {
  version: string
  cwd: string
}

export default function Dashboard({ version, cwd }: DashboardProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [status, setStatus] = useState<string>('')
  const { exit } = useApp()

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1))
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(TUI_COMMANDS.length - 1, i + 1))
    } else if (input === 'q' || key.escape) {
      exit()
    } else if (key.return) {
      const selected = TUI_COMMANDS[selectedIndex]
      setStatus(`Running: wmx ${selected.run} ...`)
      ;(async () => {
        try {
          await execa(process.argv[0], [process.argv[1], ...selected.run.split(' ')], { stdio: 'inherit' })
          setStatus(`✔  wmx ${selected.run} complete.`)
        } catch {
          setStatus(`✖  wmx ${selected.run} failed.`)
        }
      })()
    }
  }, { isActive: true })

  const selected = TUI_COMMANDS[selectedIndex]

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" paddingX={1}>
        <Text bold color="magenta">wmx</Text>
        <Text> Developer OS  </Text>
        <Text color="gray">v{version}  {cwd}</Text>
      </Box>

      <Box flexDirection="row">
        <Box width={28} borderStyle="single" flexDirection="column">
          {TUI_COMMANDS.map((cmd, index) =>
            index === selectedIndex ? (
              <Text key={cmd.key} backgroundColor="magenta" color="white"> {cmd.label.padEnd(24)} </Text>
            ) : (
              <Text key={cmd.key} color="gray"> {cmd.label.padEnd(24)} </Text>
            )
          )}
        </Box>

        <Box flexGrow={1} borderStyle="single" paddingX={1} flexDirection="column">
          <Text bold color="magenta">{selected.label}</Text>
          <Text> </Text>
          <Text color="white">{selected.description}</Text>
          <Text> </Text>
          <Text color="gray">Options:</Text>
          {selected.options.map((option, i) => (
            <Text key={i} color="cyan">  {option}</Text>
          ))}
          <Text> </Text>
          {status !== '' && (
            <Text color={status.startsWith('✔') ? 'green' : status.startsWith('✖') ? 'red' : 'yellow'}>
              {status}
            </Text>
          )}
        </Box>
      </Box>

      <Box borderStyle="single" paddingX={1}>
        <Text color="gray">↑↓ / jk  navigate    </Text>
        <Text color="white">enter</Text>
        <Text color="gray">  run command    </Text>
        <Text color="white">q</Text>
        <Text color="gray">  quit</Text>
      </Box>
    </Box>
  )
}
