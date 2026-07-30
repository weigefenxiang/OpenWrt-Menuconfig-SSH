#!/usr/bin/env node

import {createHash} from 'node:crypto'
import {
  appendFile,
  mkdir,
  readdir,
  stat,
  writeFile
} from 'node:fs/promises'
import path from 'node:path'

const sourceDir = path.resolve(
  process.env.SOURCE_DIR ||
  path.join(process.env.GITHUB_WORKSPACE || process.cwd(), 'source')
)
const targetsDir = path.join(sourceDir, 'bin', 'targets')
const indexPath = path.join(sourceDir, 'ARTIFACT_INDEX.txt')
const artifactPrefix = sanitizeName(process.env.ARTIFACT_PREFIX || 'firmware')
const buildOutcome = process.env.BUILD_OUTCOME || 'unknown'
const retentionDays = parsePositiveInt(process.env.RETENTION_DAYS, 30)
const dryRun = /^(1|true|yes)$/i.test(process.env.DRY_RUN || '')
const maxFirmwareArtifacts = 498

function parsePositiveInt(value, fallback) {
  const number = Number.parseInt(value || '', 10)
  return Number.isInteger(number) && number > 0 ? number : fallback
}

function sanitizeName(value) {
  let result = String(value)
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f/\\:"<>|*?]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.\-_ ]+|[.\-_ ]+$/g, '')

  if (!result) result = 'artifact'
  return result
}

function shortHash(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 10)
}

function createArtifactName(prefix, fileName, relativePath, usedNames) {
  const safeFileName = sanitizeName(fileName)
  const maxLength = 240
  let candidate = `${prefix}-${safeFileName}`

  if (candidate.length > maxLength) {
    const suffix = `-${shortHash(relativePath)}`
    const available = Math.max(20, maxLength - prefix.length - suffix.length - 1)
    candidate = `${prefix}-${safeFileName.slice(0, available).replace(/[.\-_ ]+$/g, '')}${suffix}`
  }

  if (usedNames.has(candidate)) {
    const suffix = `-${shortHash(relativePath)}`
    candidate = `${candidate.slice(0, maxLength - suffix.length).replace(/[.\-_ ]+$/g, '')}${suffix}`
  }

  usedNames.add(candidate)
  return candidate
}

function isMetadata(relativePath) {
  const parts = relativePath.split(path.sep)
  if (parts.includes('packages')) return true

  const name = path.basename(relativePath)
  return (
    name === 'profiles.json' ||
    name === 'sha256sums' ||
    name.endsWith('.buildinfo') ||
    name.endsWith('.manifest')
  )
}

async function walkFiles(directory) {
  let entries
  try {
    entries = await readdir(directory, {withFileTypes: true})
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }

  const files = []
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walkFiles(absolutePath))
    } else if (entry.isFile()) {
      files.push(absolutePath)
    }
  }
  return files
}

async function sha256(filePath) {
  const hash = createHash('sha256')
  const file = await import('node:fs')
  await new Promise((resolve, reject) => {
    const stream = file.createReadStream(filePath)
    stream.on('data', chunk => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', resolve)
  })
  return hash.digest('hex')
}

function formatIndex(rows, summary) {
  const lines = [
    `artifact_prefix=${artifactPrefix}`,
    `build_outcome=${buildOutcome}`,
    `firmware_root=${targetsDir}`,
    `firmware_count=${summary.total}`,
    `upload_success=${summary.success}`,
    `upload_failed=${summary.failed}`,
    `dry_run=${dryRun}`,
    '',
    'status\tartifact_name\toriginal_file\trelative_path\tsize_bytes\tsha256\tartifact_id\terror'
  ]

  for (const row of rows) {
    lines.push([
      row.status,
      row.artifactName,
      row.originalFile,
      row.relativePath,
      row.size,
      row.sha256,
      row.artifactId || '',
      String(row.error || '').replace(/[\t\r\n]+/g, ' ')
    ].join('\t'))
  }

  return `${lines.join('\n')}\n`
}

async function appendSummary(summary) {
  const data = [
    `firmware_artifact_count=${summary.total}`,
    `firmware_upload_success=${summary.success}`,
    `firmware_upload_failed=${summary.failed}`
  ].join('\n') + '\n'

  await appendFile(path.join(sourceDir, 'SOURCE_INFO.txt'), data).catch(() => {})
  await appendFile(path.join(sourceDir, 'BUILD_INFO.txt'), data).catch(() => {})
}

await mkdir(sourceDir, {recursive: true})

const allFiles = await walkFiles(targetsDir)
const firmwareFiles = allFiles
  .map(filePath => ({
    absolutePath: filePath,
    relativePath: path.relative(targetsDir, filePath)
  }))
  .filter(item => !isMetadata(item.relativePath))
  .sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'en'))

const usedNames = new Set()
const rows = []

for (const item of firmwareFiles) {
  const fileStat = await stat(item.absolutePath)
  rows.push({
    status: 'pending',
    artifactName: createArtifactName(
      artifactPrefix,
      path.basename(item.absolutePath),
      item.relativePath,
      usedNames
    ),
    originalFile: path.basename(item.absolutePath),
    relativePath: item.relativePath.split(path.sep).join('/'),
    size: fileStat.size,
    sha256: await sha256(item.absolutePath),
    artifactId: '',
    error: '',
    absolutePath: item.absolutePath
  })
}

let summary = {total: rows.length, success: 0, failed: 0}
await writeFile(indexPath, formatIndex(rows, summary), 'utf8')

if (rows.length > maxFirmwareArtifacts) {
  for (const row of rows) {
    row.status = 'not-uploaded'
    row.error = `固件数量超过单个 Job 允许的安全上限 ${maxFirmwareArtifacts}`
  }
  summary = {total: rows.length, success: 0, failed: rows.length}
  await writeFile(indexPath, formatIndex(rows, summary), 'utf8')
  await appendSummary(summary)
  throw new Error(`检测到 ${rows.length} 个固件文件，超过安全上限 ${maxFirmwareArtifacts}`)
}

if (rows.length === 0) {
  await appendSummary(summary)
  const message = `未在 ${targetsDir} 找到可逐个上传的固件文件`
  if (buildOutcome === 'success') {
    throw new Error(message)
  }
  console.warn(`${message}；当前编译结果为 ${buildOutcome}，继续上传 build-info。`)
  process.exit(0)
}

if (dryRun) {
  for (const row of rows) row.status = 'dry-run'
  summary = {total: rows.length, success: rows.length, failed: 0}
  await writeFile(indexPath, formatIndex(rows, summary), 'utf8')
  await appendSummary(summary)

  for (const row of rows) {
    console.log(`[dry-run] ${row.artifactName} <- ${row.relativePath}`)
  }
  process.exit(0)
}

let artifact
try {
  const {DefaultArtifactClient} = await import('@actions/artifact')
  artifact = new DefaultArtifactClient()
} catch (error) {
  for (const row of rows) {
    row.status = 'dependency-error'
    row.error = error instanceof Error ? error.message : String(error)
  }
  summary = {total: rows.length, success: 0, failed: rows.length}
  await writeFile(indexPath, formatIndex(rows, summary), 'utf8')
  await appendSummary(summary)
  throw error
}

for (const row of rows) {
  try {
    console.log(`上传：${row.artifactName}`)
    const result = await artifact.uploadArtifact(
      row.artifactName,
      [row.absolutePath],
      {
        retentionDays,
        compressionLevel: 0
      }
    )

    row.status = 'success'
    row.artifactId = String(result.id || '')
    summary.success += 1
    console.log(`完成：${row.artifactName}，ID=${row.artifactId || 'unknown'}`)
  } catch (error) {
    row.status = 'failed'
    row.error = error instanceof Error ? error.message : String(error)
    summary.failed += 1
    console.error(`失败：${row.artifactName}：${row.error}`)
  }

  await writeFile(indexPath, formatIndex(rows, summary), 'utf8')
}

await appendSummary(summary)

if (summary.failed > 0) {
  throw new Error(`${summary.failed} 个固件 Artifact 上传失败`)
}

console.log(`固件逐个上传完成：${summary.success}/${summary.total}`)
