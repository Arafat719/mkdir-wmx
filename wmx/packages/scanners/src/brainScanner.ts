import { scanMemory } from './memoryScanner.js'
import type { MemoryComponent } from './memoryScanner.js'
import { scanGraph } from './graphScanner.js'
import type { ComponentEdge } from './graphScanner.js'
import { scanArchitecture } from './architectureScanner.js'
import type { RouteEntry } from './astScanner.js'

export interface BrainContext {
  generatedAt: string
  projectName: string
  framework: string | null
  database: string | null
  packageManager: string | null
  folderTree: string
  routes: RouteEntry[]
  apiRoutes: RouteEntry[]
  components: MemoryComponent[]
  hooks: MemoryComponent[]
  modules: string[]
  graphEdges: ComponentEdge[]
}

export async function buildBrain(cwd: string): Promise<BrainContext> {
  const [memory, graph, architecture] = await Promise.all([
    scanMemory(cwd),
    scanGraph(cwd),
    scanArchitecture(cwd),
  ])

  return {
    generatedAt: new Date().toISOString(),
    projectName: memory.projectName,
    framework: memory.framework,
    database: memory.database,
    packageManager: memory.packageManager,
    folderTree: memory.folderTree,
    routes: memory.routes,
    apiRoutes: memory.apiRoutes,
    components: memory.components,
    hooks: memory.hooks,
    modules: architecture.modules,
    graphEdges: graph.edges,
  }
}

