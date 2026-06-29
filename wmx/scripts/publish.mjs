#!/usr/bin/env node
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const PACKAGES = [
  { name: 'wmx-os-core',       dir: 'packages/core'       },
  { name: 'wmx-os-scanners',   dir: 'packages/scanners'   },
  { name: 'wmx-os-generators', dir: 'packages/generators' },
  { name: 'wmx-os',            dir: 'packages/cli'        },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function readPkg(dir) {
  return JSON.parse(readFileSync(resolve(ROOT, dir, 'package.json'), 'utf8'))
}

function writePkg(dir, data) {
  writeFileSync(resolve(ROOT, dir, 'package.json'), JSON.stringify(data, null, 2) + '\n')
}

function getNpmVersion(name) {
  try {
    return execSync(`npm view ${name} version 2>/dev/null`, { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function bumpPatch(v) {
  const p = v.split('.')
  p[2] = String(Number(p[2]) + 1)
  return p.join('.')
}

function run(cmd, cwd = ROOT) {
  execSync(cmd, { cwd, stdio: 'inherit' })
}

function ask(question) {
  return new Promise(res => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, ans => { rl.close(); res(ans.trim()) })
  })
}

function line(char = '─', len = 42) {
  return char.repeat(len)
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${line()}\n  wmx publish\n${line()}\n`)

  // 1. Analyze each package
  const info = []
  for (const pkg of PACKAGES) {
    const local  = readPkg(pkg.dir)
    const onNpm  = getNpmVersion(pkg.name)

    // local == npm  → same version on npm, code likely changed → bump + publish
    // local != npm  → already bumped or brand new               → just publish
    // npm == null   → never published                           → first publish
    const needsBump   = onNpm !== null && onNpm === local.version
    const newVersion  = needsBump ? bumpPatch(local.version) : local.version
    const willPublish = onNpm === null || onNpm !== newVersion

    info.push({ ...pkg, localVersion: local.version, onNpm, needsBump, newVersion, willPublish })
  }

  // 2. Print status table
  for (const p of info) {
    if (!p.willPublish) {
      console.log(`  ⏭  ${p.name}@${p.localVersion}  (already published, skipping)`)
    } else if (p.needsBump) {
      console.log(`  📦 ${p.name}  ${p.localVersion} → ${p.newVersion}  (bump + publish)`)
    } else if (p.onNpm === null) {
      console.log(`  🆕 ${p.name}@${p.newVersion}  (first publish)`)
    } else {
      console.log(`  🚀 ${p.name}@${p.newVersion}  (publish)`)
    }
  }

  const toPublish = info.filter(p => p.willPublish)

  if (toPublish.length === 0) {
    console.log(`\n✅ Nothing to publish — all packages are up to date.\n`)
    console.log(`   Bump a version in package.json if you made changes.\n`)
    return
  }

  // 3. Confirm
  console.log('')
  const ans = await ask(`Proceed with ${toPublish.length} package(s)? (Y/n) `)
  if (ans.toLowerCase() === 'n') {
    console.log('\nCancelled.\n')
    return
  }

  // 4. Bump versions that need it
  const versionMap = {}
  for (const p of info) {
    if (p.needsBump) {
      const pkg = readPkg(p.dir)
      pkg.version = p.newVersion
      writePkg(p.dir, pkg)
      console.log(`\n  Bumped ${p.name}: ${p.localVersion} → ${p.newVersion}`)
    }
    versionMap[p.name] = p.newVersion
  }

  // 5. Build everything
  console.log('\n  Building...\n')
  run('pnpm run build')
  console.log('\n  Build done.\n')

  // 6. Publish in order
  for (const p of toPublish) {
    const pkgJson   = readPkg(p.dir)
    const snapshot  = JSON.stringify(pkgJson, null, 2) + '\n'

    // Replace workspace:* → real version
    let touched = false
    for (const group of ['dependencies', 'devDependencies', 'peerDependencies']) {
      for (const [dep, ver] of Object.entries(pkgJson[group] ?? {})) {
        if (ver === 'workspace:*' && versionMap[dep]) {
          pkgJson[group][dep] = `^${versionMap[dep]}`
          touched = true
        }
      }
    }
    if (touched) writePkg(p.dir, pkgJson)

    try {
      console.log(`  Publishing ${p.name}@${p.newVersion}...`)
      run('npm publish --access public', resolve(ROOT, p.dir))
      console.log(`  ✅ ${p.name}@${p.newVersion}\n`)
    } finally {
      // Always restore workspace:* — even if publish fails
      if (touched) writeFileSync(resolve(ROOT, p.dir, 'package.json'), snapshot)
    }
  }

  console.log(`${line()}\n  Done!\n${line()}\n`)
}

main().catch(err => {
  console.error('\n❌', err.message)
  process.exit(1)
})
