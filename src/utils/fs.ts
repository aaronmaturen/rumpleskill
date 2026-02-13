import { promises as fs } from "fs";
import * as path from "path";
import type { InstallMode } from "../types/agents.js";

/**
 * Check if a path exists
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read file contents
 */
export async function readFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Write file, creating directories if needed
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}

/**
 * Get project context by reading key files
 */
export async function getProjectContext(projectRoot: string): Promise<string> {
  const contextParts: string[] = [];

  // Check for package.json
  const packageJson = await readFile(path.join(projectRoot, "package.json"));
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      contextParts.push(`## package.json
- name: ${pkg.name || "unnamed"}
- dependencies: ${Object.keys(pkg.dependencies || {}).join(", ") || "none"}
- devDependencies: ${Object.keys(pkg.devDependencies || {}).join(", ") || "none"}
- scripts: ${Object.keys(pkg.scripts || {}).join(", ") || "none"}`);
    } catch {
      // Invalid JSON
    }
  }

  // Check for Python requirements
  const requirements = await readFile(path.join(projectRoot, "requirements.txt"));
  if (requirements) {
    const deps = requirements
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .slice(0, 20);
    contextParts.push(`## requirements.txt
${deps.join("\n")}`);
  }

  // Check for pyproject.toml
  const pyproject = await readFile(path.join(projectRoot, "pyproject.toml"));
  if (pyproject) {
    contextParts.push(`## pyproject.toml (excerpt)
${pyproject.slice(0, 1000)}`);
  }

  // Check for Cargo.toml
  const cargoToml = await readFile(path.join(projectRoot, "Cargo.toml"));
  if (cargoToml) {
    contextParts.push(`## Cargo.toml (excerpt)
${cargoToml.slice(0, 1000)}`);
  }

  // Check for go.mod
  const goMod = await readFile(path.join(projectRoot, "go.mod"));
  if (goMod) {
    contextParts.push(`## go.mod
${goMod.slice(0, 1000)}`);
  }

  // Get directory structure
  try {
    const entries = await fs.readdir(projectRoot, { withFileTypes: true });
    const dirs = entries.filter(
      (e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules"
    );
    const files = entries.filter((e) => e.isFile());

    contextParts.push(`## Directory Structure
Directories: ${dirs.map((d) => d.name).join(", ") || "none"}
Root files: ${files
      .map((f) => f.name)
      .slice(0, 20)
      .join(", ")}`);
  } catch {
    // Can't read directory
  }

  // Check for existing CLAUDE.md
  const existingClaudeMd =
    (await readFile(path.join(projectRoot, "CLAUDE.md"))) ||
    (await readFile(path.join(projectRoot, ".claude", "CLAUDE.md")));
  if (existingClaudeMd) {
    contextParts.push(`## Existing CLAUDE.md
${existingClaudeMd.slice(0, 2000)}`);
  }

  return contextParts.join("\n\n");
}

/**
 * Ensure .claude directory structure exists
 */
export async function ensureClaudeDir(projectRoot: string): Promise<string> {
  const claudeDir = path.join(projectRoot, ".claude");
  await fs.mkdir(claudeDir, { recursive: true });
  await fs.mkdir(path.join(claudeDir, "skills"), { recursive: true });
  return claudeDir;
}

/**
 * Ensure canonical .agents/skills directory exists
 */
export async function ensureCanonicalDir(projectRoot: string): Promise<string> {
  const agentsDir = path.join(projectRoot, ".agents", "skills");
  await fs.mkdir(agentsDir, { recursive: true });
  return agentsDir;
}

/**
 * Create a symlink with copy fallback
 * @param target - The file/directory the symlink points to
 * @param linkPath - Where to create the symlink
 * @param mode - "symlink" or "copy"
 */
export async function createSymlink(
  target: string,
  linkPath: string,
  mode: InstallMode = "symlink"
): Promise<void> {
  // Ensure parent directory exists
  const linkDir = path.dirname(linkPath);
  await fs.mkdir(linkDir, { recursive: true });

  // Remove existing link/directory if present
  try {
    const stats = await fs.lstat(linkPath);
    if (stats.isSymbolicLink()) {
      await fs.unlink(linkPath);
    } else if (stats.isDirectory()) {
      await fs.rm(linkPath, { recursive: true });
    }
  } catch {
    // Link doesn't exist, which is fine
  }

  if (mode === "copy") {
    // Copy the directory recursively
    await copyDir(target, linkPath);
  } else {
    // Create relative symlink
    const relativeTarget = path.relative(linkDir, target);
    try {
      await fs.symlink(relativeTarget, linkPath, "dir");
    } catch (err) {
      // Fallback to copy if symlink fails (e.g., on some Windows systems)
      console.warn(`Symlink failed, falling back to copy: ${(err as Error).message}`);
      await copyDir(target, linkPath);
    }
  }
}

/**
 * Copy a directory recursively
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
