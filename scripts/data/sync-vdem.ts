// 修改：按固定的 OWID v16 ETL 规则核定逐行回填状态，并记录苏联编码单元映射来源。
import { createHash } from 'node:crypto'
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

type IndexCode = 'v2x_polyarchy' | 'v2x_libdem' | 'v2x_partipdem' | 'v2x_delibdem' | 'v2x_egaldem'
interface Series { code: IndexCode; label: string; slug: string; column: string }
type ImputationStatus = 'not_imputed' | 'imputed' | 'unresolved'
interface Observation { iso: string; year: number; sourceEntity: string; owidImputationStatus: ImputationStatus; values: Record<IndexCode, number | null> }
interface SourceRecord extends Series { url: string; sha256: string; rows: number }
interface ImputationRule { country: string; donor: string; yearMin: number; yearMax: number }
interface RuleEvidence { rules: ImputationRule[] | null; knownEntities: Set<string> | null; issue: string | null }
const series: Series[] = [
  { code: 'v2x_polyarchy', label: '选举民主', slug: 'electoral-democracy-index', column: 'Electoral democracy index' },
  { code: 'v2x_libdem', label: '自由民主', slug: 'liberal-democracy-index', column: 'Liberal democracy index' },
  { code: 'v2x_partipdem', label: '参与式民主', slug: 'participatory-democracy-index', column: 'Participatory democracy index' },
  { code: 'v2x_delibdem', label: '协商民主', slug: 'deliberative-democracy-index-vdem', column: 'Deliberative democracy index' },
  { code: 'v2x_egaldem', label: '平等民主', slug: 'egalitarian-democracy-index-vdem', column: 'Egalitarian democracy index' },
]
const countries = new Set(['CHN', 'USA', 'DEU', 'JPN', 'GBR', 'FRA', 'IND', 'RUS'])
const etlCommit = '4ad0beba651dcdde8f2808be1a43e146e168b420'
const etlBase = `https://raw.githubusercontent.com/owid/etl/${etlCommit}/etl/steps/data/garden/democracy/2026-03-17/vdem/`
const rulesUrl = `${etlBase}vdem.countries_impute.yml`
const rulesSha256 = '16f8afa9cb47f77edaf5fb2da91736411fe329f2ab8145a9a8526cbb6b4ffbec'
const namesUrl = `${etlBase}vdem.countries.json`
const namesSha256 = 'b4317ca2429e0aa466067132211d43bfa2db876e2b3ebaf2dd9b9fc87d40c434'
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

// 修改：只解析固定 SHA 的 OWID 回填目标和年份；无法核定时统一标 unresolved。
function parseRules(yaml: string): ImputationRule[] {
  const rules: ImputationRule[] = []
  let current: { country?: string; donor?: string; yearMin?: number; yearMax?: number } = {}
  let entries = 0
  const finish = () => {
    if (!current.donor) return
    if (!current.country || !Number.isInteger(current.yearMin) || !Number.isInteger(current.yearMax) ||
      current.yearMin! > current.yearMax!) throw new Error('OWID 回填规则字段不完整')
    rules.push({ country: current.country, donor: current.donor, yearMin: current.yearMin!, yearMax: current.yearMax! })
  }
  for (const line of yaml.split(/\r?\n/)) {
    const country = /^- country: (.+)$/.exec(line)
    if (country) {
      finish()
      if (country[1].startsWith('[')) throw new Error('OWID 回填规则含未支持的国家列表')
      current = { country: country[1] }
      entries++
      continue
    }
    const donor = /^  country_impute: (.+)$/.exec(line)
    const yearMin = /^  year_min: (\d+)$/.exec(line)
    const yearMax = /^  year_max: (\d+)$/.exec(line)
    if (donor) current.donor = donor[1]
    if (yearMin) current.yearMin = Number(yearMin[1])
    if (yearMax) current.yearMax = Number(yearMax[1])
  }
  finish()
  if (entries !== 101 || rules.length !== 56) throw new Error(`OWID 回填规则解析数量异常：${entries}/${rules.length}`)
  return rules
}

async function readPinned(url: string, expectedSha256: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`固定 ETL 来源读取失败：HTTP ${response.status}`)
  const content = await response.text()
  const actual = createHash('sha256').update(content).digest('hex')
  if (actual !== expectedSha256) throw new Error(`固定 ETL 来源哈希不匹配：${url}`)
  return content
}

async function loadRuleEvidence(): Promise<RuleEvidence> {
  try {
    const [yaml, namesText] = await Promise.all([readPinned(rulesUrl, rulesSha256), readPinned(namesUrl, namesSha256)])
    const rawNames: unknown = JSON.parse(namesText)
    if (!rawNames || typeof rawNames !== 'object' || Array.isArray(rawNames)) throw new Error('OWID 国家名称表结构异常')
    const names = Object.values(rawNames as Record<string, unknown>)
    if (names.some(name => typeof name !== 'string')) throw new Error('OWID 国家名称表存在无效名称')
    return { rules: parseRules(yaml), knownEntities: new Set(names as string[]), issue: null }
  } catch (error) {
    const issue = error instanceof Error ? error.message : '固定 ETL 规则核验失败'
    console.warn(`OWID 溯源未核定：${issue}；所有记录标记 unresolved`)
    return { rules: null, knownEntities: null, issue }
  }
}

const ruleEvidence = await loadRuleEvidence()
function imputationStatus(entity: string, year: number): ImputationStatus {
  if (!ruleEvidence.rules || !ruleEvidence.knownEntities?.has(entity)) return 'unresolved'
  // 当前摘录没有规则目标；未来如命中规则，CSV 不带原始/复制行标记，先保持未核定。
  return ruleEvidence.rules.some(rule => rule.country === entity && year >= rule.yearMin && year <= rule.yearMax)
    ? 'unresolved' : 'not_imputed'
}

for (const item of series) {
  const url = `https://ourworldindata.org/grapher/${item.slug}.csv?v=1&csvType=full&useColumnShortNames=false`
  const response = await fetch(url, { headers: { 'User-Agent': 'PolityLens data sync (https://github.com/zenzenzense520-bit/politylens)' } })
  if (!response.ok) throw new Error(`${item.code} 下载失败：HTTP ${response.status}`)
  const csv = await response.text()
  const lines = csv.trimEnd().split(/\r?\n/)
  const header = parseCsvLine(lines[0].replace(/^\uFEFF/, ''))
  const codeAt = header.indexOf('Code')
  const entityAt = header.indexOf('Entity')
  const yearAt = header.indexOf('Year')
  const valueAt = header.indexOf(item.column)
  if (codeAt < 0 || entityAt < 0 || yearAt < 0 || valueAt < 0 || lines.length < 1000) throw new Error(`${item.code} CSV 格式异常`)
  let selected = 0
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line)
    const iso = cells[codeAt]
    const sourceEntity = cells[entityAt]
    const year = Number(cells[yearAt])
    if (!countries.has(iso) || !Number.isInteger(year) || year < 1900 || year > 2024) continue
    if (!sourceEntity) throw new Error(`${item.code} ${iso}-${year} 缺少 OWID 实体名称`)
    const raw = cells[valueAt]
    const value = raw === '' ? null : Number(raw)
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1)) throw new Error(`${item.code} ${iso}-${year} 超出 0—1`)
    const key = `${iso}-${year}`
    const record = records.get(key) ?? { iso, year, sourceEntity, owidImputationStatus: imputationStatus(sourceEntity, year),
      values: Object.fromEntries(series.map(seriesItem => [seriesItem.code, null])) as Record<IndexCode, number | null> }
    if (record.sourceEntity !== sourceEntity) throw new Error(`${key} 五指数的 OWID 实体不一致`)
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
const selected = [...records.values()]
if (ruleEvidence.rules && ruleEvidence.knownEntities &&
  selected.every(record => ruleEvidence.knownEntities!.has(record.sourceEntity))) {
  // 修改：八国全部未回填是从固定规则解析后得出的断言，不预设逐行状态。
  if (selected.some(record => record.owidImputationStatus !== 'not_imputed')) throw new Error('八国出现需另行核定的 OWID 回填记录')
}
const output = {
  publisher: 'Varieties of Democracy (V-Dem) Project', processor: 'Our World in Data', version: 'v16 (2026)',
  license: 'CC BY-SA 4.0', retrievedAt: new Date().toISOString(), period: [1900, 2024],
  processingUrl: 'https://ourworldindata.org/grapher/electoral-democracy-index',
  note: '五个 V-Dem v16 指数经 OWID 处理；逐行状态仅说明是否经过 OWID 跨政权回填，不代表现代国界内的直接观测。苏联 SUN 仅在 1923—1990 年按 V-Dem 编码单元 11 映射 RUS；1922 和 1991 不自动映射。0—1 量表，不等同于 EIU 或自定义 DRI。',
  owidEtl: { datasetVersion: '2026-03-17', commit: etlCommit, rulesUrl, rulesSha256, namesUrl, namesSha256,
    verification: ruleEvidence.issue ? 'unresolved' : 'verified', issue: ruleEvidence.issue,
    statusDefinition: 'OWID 跨政权复制状态；not_imputed 为未经过该回填，不表示现代国界或独立国家的直接观测。' },
  sovietMapping: { targetIso: 'SUN', sourceIso: 'RUS', firstYear: 1923, lastYear: 1990, vdemCountryUnitId: 11,
    sourceUrl: 'https://v-dem.net/documents/72/countryunit_v16.pdf#page=31' },
  sources, records: selected.sort((left, right) => left.iso.localeCompare(right.iso) || left.year - right.year),
}
const target = path.join(outputDir, 'vdem.json')
const pending = `${target}.pending`
writeFileSync(pending, `${JSON.stringify(output)}\n`)
renameSync(pending, target)
console.log(`V-Dem 完成：${output.records.length} 个国家—年份，${series.length} 个指数`)
