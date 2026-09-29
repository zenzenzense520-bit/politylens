// 修改：固定五个 V-Dem v16 经 OWID 处理的图表，提取八国 1900—2024 年 0—1 指数并记录哈希与历史回填口径。
import { createHash } from 'node:crypto'
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

type IndexCode = 'v2x_polyarchy' | 'v2x_libdem' | 'v2x_partipdem' | 'v2x_delibdem' | 'v2x_egaldem'
interface Series { code: IndexCode; label: string; slug: string; column: string }
interface Observation { iso: string; year: number; values: Record<IndexCode, number | null> }
interface SourceRecord extends Series { url: string; sha256: string; rows: number }
const series: Series[] = [
  { code: 'v2x_polyarchy', label: '选举民主', slug: 'electoral-democracy-index', column: 'Electoral democracy index' },
  { code: 'v2x_libdem', label: '自由民主', slug: 'liberal-democracy-index', column: 'Liberal democracy index' },
  { code: 'v2x_partipdem', label: '参与式民主', slug: 'participatory-democracy-index', column: 'Participatory democracy index' },
  { code: 'v2x_delibdem', label: '协商民主', slug: 'deliberative-democracy-index-vdem', column: 'Deliberative democracy index' },
  { code: 'v2x_egaldem', label: '平等民主', slug: 'egalitarian-democracy-index-vdem', column: 'Egalitarian democracy index' },
]
const countries = new Set(['CHN', 'USA', 'DEU', 'JPN', 'GBR', 'FRA', 'IND', 'RUS'])
const records = new Map<string, Observation>()
const sources: SourceRecord[] = []
const root = process.cwd()
const cacheDir = path.join(root, 'logs/cache/vdem')
const outputDir = path.join(root, 'public/data/observations')
mkdirSync(cacheDir, { recursive: true })
mkdirSync(outputDir, { recursive: true })

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index++ }
      else quoted = !quoted
    } else if (char === ',' && !quoted) { cells.push(value); value = '' }
    else value += char
  }
  if (quoted) throw new Error('CSV 引号未闭合')
  cells.push(value)
  return cells
}

for (const item of series) {
  const url = `https://ourworldindata.org/grapher/${item.slug}.csv?v=1&csvType=full&useColumnShortNames=false`
  const response = await fetch(url, { headers: { 'User-Agent': 'PolityLens data sync (https://github.com/zenzenzense520-bit/politylens)' } })
  if (!response.ok) throw new Error(`${item.code} 下载失败：HTTP ${response.status}`)
  const csv = await response.text()
  const lines = csv.trimEnd().split(/\r?\n/)
  const header = parseCsvLine(lines[0].replace(/^\uFEFF/, ''))
  const codeAt = header.indexOf('Code')
  const yearAt = header.indexOf('Year')
  const valueAt = header.indexOf(item.column)
  if (codeAt < 0 || yearAt < 0 || valueAt < 0 || lines.length < 1000) throw new Error(`${item.code} CSV 格式异常`)
  let selected = 0
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line)
    const iso = cells[codeAt]
    const year = Number(cells[yearAt])
    if (!countries.has(iso) || !Number.isInteger(year) || year < 1900 || year > 2024) continue
    const raw = cells[valueAt]
    const value = raw === '' ? null : Number(raw)
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1)) throw new Error(`${item.code} ${iso}-${year} 超出 0—1`)
    const key = `${iso}-${year}`
    const record = records.get(key) ?? { iso, year, values: Object.fromEntries(series.map(seriesItem => [seriesItem.code, null])) as Record<IndexCode, number | null> }
    if (record.values[item.code] !== null) throw new Error(`${item.code} ${key} 重复`)
    record.values[item.code] = value
    records.set(key, record)
    selected++
  }
  if (selected < 500) throw new Error(`${item.code} 覆盖记录过少：${selected}`)
  const sha256 = createHash('sha256').update(csv).digest('hex')
  writeFileSync(path.join(cacheDir, `${item.slug}.csv`), csv)
  sources.push({ ...item, url, sha256, rows: selected })
  console.log(`${item.code}: ${selected} 个八国年度记录，SHA-256 ${sha256.slice(0, 12)}`)
}
const output = {
  publisher: 'Varieties of Democracy (V-Dem) Project', processor: 'Our World in Data', version: 'v16 (2026)',
  license: 'CC BY-SA 4.0', retrievedAt: new Date().toISOString(), period: [1900, 2024],
  processingUrl: 'https://ourworldindata.org/grapher/electoral-democracy-index',
  note: '五个 V-Dem v16 指数经 OWID 处理；OWID 对部分现代国家的前独立年份按当时所属历史政权回填，本摘录未逐条区分回填值与 V-Dem 直接观测，不可将全部历史值视作对应现代国家的原始观测。仅筛选八国；RUS 历史序列不自动映射为苏联 SUN。0—1 量表，不等同于 EIU 或自定义 DRI。',
  sources, records: [...records.values()].sort((left, right) => left.iso.localeCompare(right.iso) || left.year - right.year),
}
const target = path.join(outputDir, 'vdem.json')
const pending = `${target}.pending`
writeFileSync(pending, `${JSON.stringify(output)}\n`)
renameSync(pending, target)
console.log(`V-Dem 完成：${output.records.length} 个国家—年份，${series.length} 个指数`)
