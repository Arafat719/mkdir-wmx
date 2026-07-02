import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'
import { execa } from 'execa'

export type SecurityCategory =
  | 'secret'
  | 'password'
  | 'env-committed'
  | 'xss'
  | 'sql-injection'
  | 'cors'
  | 'jwt'

export interface SecurityFinding {
  category: SecurityCategory
  severity: 'high' | 'medium' | 'low'
  file: string
  line: number
  message: string
  snippet: string
}

export interface SecurityReport {
  findings: SecurityFinding[]
  counts: Record<SecurityCategory, number>
}

const IGNORE = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/.git/**']

function snippet(line: string): string {
  const trimmed = line.trim()
  return trimmed.length > 100 ? trimmed.slice(0, 97) + '...' : trimmed
}

interface Rule {
  category: SecurityCategory
  severity: SecurityFinding['severity']
  pattern: RegExp
  message: string
  skipIf?: RegExp
}

const RULES: Rule[] = [
  // Secrets / API keys
  {
    category: 'secret',
    severity: 'high',
    pattern: /AKIA[0-9A-Z]{16}/,
    message: 'Hardcoded AWS access key detected',
  },
  {
    category: 'secret',
    severity: 'high',
    pattern: /sk_live_[0-9a-zA-Z]{16,}/,
    message: 'Hardcoded Stripe live secret key detected',
  },
  {
    category: 'secret',
    severity: 'high',
    pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
    message: 'Private key committed to source',
  },
  {
    category: 'secret',
    severity: 'high',
    pattern: /(api[_-]?key|apikey|secret[_-]?key|access[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i,
    message: 'Hardcoded API key or access token',
    skipIf: /process\.env|import\.meta\.env/,
  },
  // Passwords
  {
    category: 'password',
    severity: 'high',
    pattern: /\bpassword\s*[:=]\s*['"][^'"]{3,}['"]/i,
    message: 'Hardcoded password literal',
    skipIf: /process\.env|import\.meta\.env|placeholder|xxxxx|<.*>|\*{3,}/i,
  },
  // XSS
  {
    category: 'xss',
    severity: 'medium',
    pattern: /dangerouslySetInnerHTML/,
    message: 'dangerouslySetInnerHTML can lead to XSS if input is not sanitized',
  },
  {
    category: 'xss',
    severity: 'medium',
    pattern: /\.innerHTML\s*=/,
    message: 'Assigning to innerHTML can lead to XSS if input is not sanitized',
  },
  {
    category: 'xss',
    severity: 'high',
    pattern: /document\.write\s*\(/,
    message: 'document.write() is an XSS risk',
  },
  {
    category: 'xss',
    severity: 'high',
    pattern: /\beval\s*\(/,
    message: 'eval() can execute arbitrary code — XSS / injection risk',
  },
  // SQL injection
  {
    category: 'sql-injection',
    severity: 'high',
    pattern: /(query|execute)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*(SELECT|INSERT|UPDATE|DELETE)/i,
    message: 'SQL query built with template-literal interpolation — use parameterized queries',
  },
  {
    category: 'sql-injection',
    severity: 'high',
    pattern: /['"](SELECT|INSERT|UPDATE|DELETE)[^'"]*['"]\s*\+/i,
    message: 'SQL query built with string concatenation — use parameterized queries',
  },
  // CORS
  {
    category: 'cors',
    severity: 'medium',
    pattern: /origin\s*:\s*['"]\*['"]/,
    message: "CORS origin set to '*' — allows requests from any domain",
  },
  {
    category: 'cors',
    severity: 'medium',
    pattern: /Access-Control-Allow-Origin['"]?\s*,\s*['"]\*['"]/,
    message: "Access-Control-Allow-Origin header set to '*'",
  },
  // JWT
  {
    category: 'jwt',
    severity: 'high',
    pattern: /jwt\.sign\s*\([^,]+,\s*['"][^'"]+['"]/,
    message: 'JWT signed with a hardcoded secret literal',
    skipIf: /process\.env|import\.meta\.env/,
  },
  {
    category: 'jwt',
    severity: 'high',
    pattern: /algorithms?\s*:\s*\[?\s*['"]none['"]/i,
    message: "JWT algorithm 'none' disables signature verification",
  },
]

async function scanFile(cwd: string, file: string, findings: SecurityFinding[]): Promise<void> {
  let content: string
  try {
    content = await fs.readFile(file, 'utf8')
  } catch {
    return
  }

  const relFile = path.relative(cwd, file)
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const rule of RULES) {
      if (!rule.pattern.test(line)) continue
      if (rule.skipIf && rule.skipIf.test(line)) continue
      findings.push({
        category: rule.category,
        severity: rule.severity,
        file: relFile,
        line: i + 1,
        message: rule.message,
        snippet: snippet(line),
      })
    }
  }
}

async function checkEnvCommitted(cwd: string, findings: SecurityFinding[]): Promise<void> {
  try {
    const result = await execa('git', ['ls-files', '.env'], { cwd, reject: false })
    const tracked = result.stdout.trim()
    if (tracked) {
      findings.push({
        category: 'env-committed',
        severity: 'high',
        file: '.env',
        line: 1,
        message: '.env file is tracked by git — secrets may be exposed in history',
        snippet: '.env',
      })
    }
  } catch {
    // not a git repo — skip
  }
}

export async function scanSecurity(cwd: string): Promise<SecurityReport> {
  const files = await fg(['**/*.{ts,tsx,js,jsx,mjs,cjs}'], {
    cwd,
    ignore: IGNORE,
    absolute: true,
  })

  const findings: SecurityFinding[] = []

  await Promise.all([
    ...files.map(file => scanFile(cwd, file, findings)),
    checkEnvCommitted(cwd, findings),
  ])

  const severityOrder: Record<SecurityFinding['severity'], number> = { high: 0, medium: 1, low: 2 }
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  const counts: Record<SecurityCategory, number> = {
    secret: 0,
    password: 0,
    'env-committed': 0,
    xss: 0,
    'sql-injection': 0,
    cors: 0,
    jwt: 0,
  }
  for (const f of findings) counts[f.category]++

  return { findings, counts }
}