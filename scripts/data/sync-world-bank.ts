// 修改：逐年获取八国五项 WDI 指标，校验世界银行响应后原子替换快照；保留原有 WGI 记录。
import { createHash } from 'node:crypto'
import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

type JsonObject = Record<string, unknown>
interface Indicator { code: string; label: string; unit: string }
interface Observation { iso: string; year: number; code: string; value: number | null; status: 'observed' | 'missing'; decimal: number }
interface Source extends Indicator { url: string; updated: string; sourceId: number; sha256?: string; rows?: number; nonNull?: number }
interface Snapshot { publisher: string; retrievedAt: string; sources: Source[]; records: Observation[]; [key: string]: unknown }

const countryCodes = ['CHN', 'USA', 'DEU', 'JPN', 'GBR', 'FRA', 'IND', 'RUS'] as const
const countrySet = new Set<string>(countryCodes)
const wdiIndicators: Indicator[] = [
  { code: 'NY.GDP.MKTP.CD', label: 'GDP（现价美元）', unit: '美元' },
  { code: 'NY.GDP.PCAP.CD', label: '人均 GDP（现价美元）', unit: '美元/人' },
  { code: 'SP.POP.TOTL', label: '总人口', unit: '人' },
  { code: 'NY.GDP.MKTP.KD', label: 'GDP（2015 年不变价美元）', unit: '2015 年不变价美元' },
  { code: 'NY.GDP.MKTP.KD.ZG', label: 'GDP 实际增长率', unit: '%/年' },
]
const wgiCodes = new Set(['GOV_WGI_GE.EST', 'GOV_WGI_RL.EST', 'GOV_WGI_CC.EST'])
const years = Array.from({ length: 65 }, (_, index) => 1960 + index)
const outputPath = path.join(process.cwd(), 'public/data/observations/world-bank.json')

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireObject(value: unknown, context: string): JsonObject {
  if (!isObject(value)) throw new Error(`${context} 不是对象`)
  return value
}

function validateRecord(value: unknown, context: string): Observation {
  const row = requireObject(value, context)
  if (typeof row.iso !== 'string' || !countrySet.has(row.iso)) throw new Error(`${context} 国家代码异常`)
  if (!Number.isInteger(row.year) || !years.includes(row.year as number)) throw new Error(`${context} 年份异常`)
  if (typeof row.code !== 'string') throw new Error(`${context} 指标代码异常`)
  if (row.value !== null && (typeof row.value !== 'number' || !Number.isFinite(row.value))) throw new Error(`${context} 数值异常`)
  if (!Number.isInteger(row.decimal) || (row.decimal as number) < 0) throw new Error(`${context} 精度异常`)
  const expectedStatus = row.value === null ? 'missing' : 'observed'
  if (row.status !== expectedStatus) throw new Error(`${context} 缺失状态异常`)
  return row as unknown as Observation
}

function validateWgiSource(value: unknown): Source {
  const source = requireObject(value, '已有 WGI 来源')
  if (typeof source.code !== 'string' || !wgiCodes.has(source.code) || source.sourceId !== 3 ||
    typeof source.label !== 'string' || typeof source.unit !== 'string' || typeof source.url !== 'string' ||
    typeof source.updated !== 'string') throw new Error('已有 WGI 来源字段不完整，拒绝覆盖快照')
  return source as unknown as Source
}

function validateExistingSnapshot(value: unknown): { wgiSources: Source[]; wgiRecords: Observation[] } {
  const snapshot = requireObject(value, '已有快照')
  if (!Array.isArray(snapshot.sources) || !Array.isArray(snapshot.records)) throw new Error('已有快照缺少来源或记录')
  const wgiSources = snapshot.sources
    .filter(entry => isObject(entry) && typeof entry.code === 'string' && wgiCodes.has(entry.code))
    .map(validateWgiSource)
  if (wgiSources.length !== wgiCodes.size || new Set(wgiSources.map(item => item.code)).size !== wgiCodes.size) {
    throw new Error('已有 WGI 来源不完整，拒绝覆盖快照')
  }
  const wgiRecords = snapshot.records
    .filter(entry => isObject(entry) && typeof entry.code === 'string' && wgiCodes.has(entry.code))
    .map((entry, index) => validateRecord(entry, `已有 WGI 第 ${index + 1} 条`))
  const keys = new Set<string>()
  for (const row of wgiRecords) {
    if (!wgiCodes.has(row.code) || ![2020, 2021, 2024].includes(row.year)) throw new Error(`已有 WGI ${row.code} 年份异常`)
    const key = `${row.code}|${row.iso}|${row.year}`
    if (keys.has(key)) throw new Error(`已有 WGI 重复：${key}`)
    keys.add(key)
  }
  if (wgiRecords.length !== countryCodes.length * 3 * wgiCodes.size) throw new Error('已有 WGI 记录不完整，拒绝覆盖快照')
  return { wgiSources, wgiRecords }
}

async function fetchIndicator(indicator: Indicator): Promise<{ source: Source; records: Observation[] }> {
  const url = `https://api.worldbank.org/v2/country/${countryCodes.join(';')}/indicator/${indicator.code}?source=2&date=1960:2024&format=json&per_page=1000`
  let response: Response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(45000), headers: { 'User-Agent': 'PolityLens data sync (https://github.com/zenzenzense520-bit/politylens)' } })
  } catch (error) { throw new Error(`${indicator.code} 下载失败：${error instanceof Error ? error.message : String(error)}`) }
  if (!response.ok) throw new Error(`${indicator.code} 下载失败：HTTP ${response.status}`)
  const body = await response.text()
  let parsed: unknown
  try { parsed = JSON.parse(body) }
  catch { throw new Error(`${indicator.code} 响应不是有效 JSON`) }
  if (!Array.isArray(parsed) || parsed.length !== 2 || !Array.isArray(parsed[1])) throw new Error(`${indicator.code} 响应结构异常`)
  const meta = requireObject(parsed[0], `${indicator.code} 元数据`)
  const expectedRows = countryCodes.length * years.length
  if (meta.page !== 1 || meta.pages !== 1 || Number(meta.per_page) < expectedRows || meta.total !== expectedRows || parsed[1].length !== expectedRows) {
    throw new Error(`${indicator.code} 页数或行数异常：page=${meta.page} pages=${meta.pages} total=${meta.total} rows=${parsed[1].length}`)
  }
  if (typeof meta.lastupdated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(meta.lastupdated)) {
    throw new Error(`${indicator.code} 缺少更新时间`)
  }
  const records: Observation[] = []
  const keys = new Set<string>()
  for (const [index, entry] of parsed[1].entries()) {
    const row = requireObject(entry, `${indicator.code} 第 ${index + 1} 条`)
    const rowIndicator = requireObject(row.indicator, `${indicator.code} 指标字段`)
    if (rowIndicator.id !== indicator.code) throw new Error(`${indicator.code} 响应混入其他指标`)
    const iso = row.countryiso3code
    const year = typeof row.date === 'string' && /^\d{4}$/.test(row.date) ? Number(row.date) : NaN
    if (typeof iso !== 'string' || !countrySet.has(iso) || !years.includes(year)) throw new Error(`${indicator.code} 第 ${index + 1} 条国家或年份异常`)
    const key = `${iso}|${year}`
    if (keys.has(key)) throw new Error(`${indicator.code} 响应重复：${key}`)
    keys.add(key)
    if (row.value !== null && (typeof row.value !== 'number' || !Number.isFinite(row.value))) throw new Error(`${indicator.code} ${key} 数值异常`)
    if (row.value !== null && indicator.code !== 'NY.GDP.MKTP.KD.ZG' && (row.value as number) < 0) throw new Error(`${indicator.code} ${key} 数值为负`)
    if (!Number.isInteger(row.decimal) || (row.decimal as number) < 0) throw new Error(`${indicator.code} ${key} 精度异常`)
    records.push({ iso, year, code: indicator.code, value: row.value as number | null, status: row.value === null ? 'missing' : 'observed', decimal: row.decimal as number })
  }
  for (const iso of countryCodes) for (const year of years) if (!keys.has(`${iso}|${year}`)) throw new Error(`${indicator.code} 缺少 ${iso}-${year}`)
  records.sort((left, right) => left.iso.localeCompare(right.iso) || right.year - left.year)
  const nonNull = records.filter(row => row.value !== null).length
  const source: Source = { ...indicator, url, updated: meta.lastupdated, sourceId: 2, sha256: createHash('sha256').update(body).digest('hex'), rows: records.length, nonNull }
  console.log(`${indicator.code}：${records.length} 条，非空 ${nonNull}，SHA-256 ${source.sha256?.slice(0, 12)}`)
  return { source, records }
}

async function main(): Promise<void> {
  const existing: unknown = JSON.parse(readFileSync(outputPath, 'utf8'))
  const { wgiSources, wgiRecords } = validateExistingSnapshot(existing)
  const downloaded = [] as { source: Source; records: Observation[] }[]
  for (const indicator of wdiIndicators) downloaded.push(await fetchIndicator(indicator))
  const sources = [...downloaded.map(item => item.source), ...wgiSources]
  const records = [...downloaded.flatMap(item => item.records), ...wgiRecords]
  const keys = new Set<string>()
  for (const row of records) {
    const key = `${row.code}|${row.iso}|${row.year}`
    if (keys.has(key)) throw new Error(`输出指标—国家—年份重复：${key}`)
    keys.add(key)
  }
  const snapshot: Snapshot = {
    publisher: 'World Bank', retrievedAt: new Date().toISOString(),
    license: 'CC BY 4.0', period: [1960, 2024],
    note: '五项 WDI 指标为八国 1960—2024 年逐年 API 原值；空值保留为 missing。WGI 三项仍沿用原有 2020、2021、2024 年快照，不能向早期年份外推。RUS 不自动映射为苏联 SUN。',
    sources, records,
  }
  const pendingPath = `${outputPath}.pending`
  writeFileSync(pendingPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  renameSync(pendingPath, outputPath)
  console.log(`世界银行完成：${records.length} 条（WDI ${downloaded.flatMap(item => item.records).length}，WGI ${wgiRecords.length}）`)
}

main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
