// 修改：同批同步七项 WDI 与 WGI 2026 六维估计值及标准误，完整校验后才替换快照。
import { createHash } from 'node:crypto'
import { renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

type JsonObject = Record<string, unknown>
type IndicatorKind = 'wdi' | 'wgiEstimate' | 'wgiStandardError'
interface Indicator { code: string; label: string; unit: string; kind: IndicatorKind }
interface Observation { iso: string; year: number; code: string; value: number | null; status: 'observed' | 'missing'; decimal: number }
interface Source { code: string; label: string; unit: string; url: string; updated: string; sourceId: number; sha256: string; rows: number; nonNull: number; version?: string }

const countryCodes = ['CHN', 'USA', 'DEU', 'JPN', 'GBR', 'FRA', 'IND', 'RUS'] as const
const countrySet = new Set<string>(countryCodes)
const wdiYears = Array.from({ length: 65 }, (_, index) => 1960 + index)
const wgiYears = [1996, 1998, 2000, 2002, ...Array.from({ length: 23 }, (_, index) => 2003 + index)]
const wgiUpdate = '2026-09-25'
const wgiVersion = '2026 update'
const wgiSourceUrl = 'https://api.worldbank.org/v2/source/3?format=json'
const wgiMethodologyUrl = 'https://www.worldbank.org/content/dam/sites/govindicators/doc/The%20Worldwide%20Governance%20Indicators%202026%20Methodology.pdf'
const outputPath = path.join(process.cwd(), 'public/data/observations/world-bank.json')

const wdiIndicators: Indicator[] = [
  { code: 'NY.GDP.MKTP.CD', label: 'GDP（现价美元）', unit: '美元', kind: 'wdi' },
  { code: 'NY.GDP.PCAP.CD', label: '人均 GDP（现价美元）', unit: '美元/人', kind: 'wdi' },
  { code: 'SP.POP.TOTL', label: '总人口', unit: '人', kind: 'wdi' },
  { code: 'NY.GDP.MKTP.KD', label: 'GDP（2015 年不变价美元）', unit: '2015 年不变价美元', kind: 'wdi' },
  { code: 'NY.GDP.MKTP.KD.ZG', label: 'GDP 实际增长率', unit: '%/年', kind: 'wdi' },
  { code: 'GC.TAX.TOTL.GD.ZS', label: '税收收入占 GDP', unit: '% GDP（IMF GFS）', kind: 'wdi' },
  { code: 'GC.REV.XGRT.GD.ZS', label: '财政收入（不含赠款）占 GDP', unit: '% GDP（IMF GFS）', kind: 'wdi' },
]
const wgiDimensions = [
  { code: 'VA', label: '问责与表达' }, { code: 'PV', label: '政治稳定' },
  { code: 'GE', label: '政府效能' }, { code: 'RQ', label: '监管质量' },
  { code: 'RL', label: '法治' }, { code: 'CC', label: '腐败控制' },
]
const wgiIndicators: Indicator[] = wgiDimensions.flatMap(dimension => [
  { code: `GOV_WGI_${dimension.code}.EST`, label: `${dimension.label}（WGI 估计值）`, unit: '模型估计值', kind: 'wgiEstimate' as const },
  { code: `GOV_WGI_${dimension.code}.SE`, label: `${dimension.label}（WGI 标准误）`, unit: '模型标准误（SE）', kind: 'wgiStandardError' as const },
])

function requireObject(value: unknown, context: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${context} 不是对象`)
  return value as JsonObject
}

async function fetchJson(url: string, context: string): Promise<{ parsed: unknown; sha256: string }> {
  let response: Response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(45000), headers: { 'User-Agent': 'PolityLens data sync (https://github.com/zenzenzense520-bit/politylens)' } })
  } catch (error) { throw new Error(`${context} 下载失败：${error instanceof Error ? error.message : String(error)}`) }
  if (!response.ok) throw new Error(`${context} 下载失败：HTTP ${response.status}`)
  const body = await response.text()
  let parsed: unknown
  try { parsed = JSON.parse(body) } catch { throw new Error(`${context} 响应不是有效 JSON`) }
  return { parsed, sha256: createHash('sha256').update(body).digest('hex') }
}

async function verifyWgiVersion(): Promise<string> {
  const response = await fetchJson(wgiSourceUrl, 'WGI 来源版本')
  if (!Array.isArray(response.parsed) || response.parsed.length !== 2 ||
    !Array.isArray(response.parsed[1]) || response.parsed[1].length !== 1) throw new Error('WGI 来源版本响应结构异常')
  const meta = requireObject(response.parsed[0], 'WGI 来源元数据')
  const source = requireObject(response.parsed[1][0], 'WGI 来源')
  if (Number(meta.page) !== 1 || Number(meta.pages) !== 1 || Number(meta.total) !== 1 ||
    source.id !== '3' || source.code !== 'WGI' || source.lastupdated !== wgiUpdate) {
    throw new Error(`WGI 来源版本不是预期的 ${wgiVersion}（${wgiUpdate}），拒绝混版`)
  }
  console.log(`WGI 来源：${wgiVersion}，更新 ${wgiUpdate}，SHA-256 ${response.sha256.slice(0, 12)}`)
  return response.sha256
}

async function fetchIndicator(indicator: Indicator): Promise<{ source: Source; records: Observation[] }> {
  const isWgi = indicator.kind !== 'wdi'
  const sourceId = isWgi ? 3 : 2
  const years = isWgi ? wgiYears : wdiYears
  const date = isWgi ? '1996:2025' : '1960:2024'
  const url = `https://api.worldbank.org/v2/country/${countryCodes.join(';')}/indicator/${indicator.code}?source=${sourceId}&date=${date}&format=json&per_page=1000`
  const { parsed, sha256 } = await fetchJson(url, indicator.code)
  if (!Array.isArray(parsed) || parsed.length !== 2 || !Array.isArray(parsed[1])) throw new Error(`${indicator.code} 响应结构异常`)
  const meta = requireObject(parsed[0], `${indicator.code} 元数据`)
  const expectedRows = countryCodes.length * years.length
  if (meta.page !== 1 || meta.pages !== 1 || Number(meta.per_page) < expectedRows ||
    meta.total !== expectedRows || parsed[1].length !== expectedRows || String(meta.sourceid) !== String(sourceId)) {
    throw new Error(`${indicator.code} 来源、页数或行数异常：source=${meta.sourceid} pages=${meta.pages} total=${meta.total} rows=${parsed[1].length}`)
  }
  if (typeof meta.lastupdated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(meta.lastupdated) ||
    (isWgi && meta.lastupdated !== wgiUpdate)) throw new Error(`${indicator.code} 来源更新时间异常，拒绝混版`)
  const yearSet = new Set(years)
  const records: Observation[] = []
  const keys = new Set<string>()
  for (const [index, entry] of parsed[1].entries()) {
    const row = requireObject(entry, `${indicator.code} 第 ${index + 1} 条`)
    const rowIndicator = requireObject(row.indicator, `${indicator.code} 指标字段`)
    const iso = row.countryiso3code
    const year = typeof row.date === 'string' && /^\d{4}$/.test(row.date) ? Number(row.date) : NaN
    if (rowIndicator.id !== indicator.code || typeof iso !== 'string' || !countrySet.has(iso) || !yearSet.has(year)) {
      throw new Error(`${indicator.code} 第 ${index + 1} 条指标、国家或年份异常`)
    }
    const key = `${iso}|${year}`
    if (keys.has(key)) throw new Error(`${indicator.code} 响应重复：${key}`)
    keys.add(key)
    if (row.value !== null && (typeof row.value !== 'number' || !Number.isFinite(row.value))) throw new Error(`${indicator.code} ${key} 数值异常`)
    if (isWgi && row.value === null) throw new Error(`${indicator.code} ${key} 在已发布年份为空，拒绝不完整快照`)
    if (typeof row.value === 'number' && (indicator.kind === 'wgiStandardError' ||
      (indicator.kind === 'wdi' && indicator.code !== 'NY.GDP.MKTP.KD.ZG')) && row.value < 0) {
      throw new Error(`${indicator.code} ${key} 应为非负数`)
    }
    if (!Number.isInteger(row.decimal) || (row.decimal as number) < 0) throw new Error(`${indicator.code} ${key} 精度异常`)
    records.push({ iso, year, code: indicator.code, value: row.value as number | null,
      status: row.value === null ? 'missing' : 'observed', decimal: row.decimal as number })
  }
  for (const iso of countryCodes) for (const year of years) {
    if (!keys.has(`${iso}|${year}`)) throw new Error(`${indicator.code} 缺少 ${iso}-${year}`)
  }
  records.sort((left, right) => left.iso.localeCompare(right.iso) || right.year - left.year)
  const source: Source = { code: indicator.code, label: indicator.label, unit: indicator.unit,
    url, updated: meta.lastupdated, sourceId, sha256, rows: records.length,
    nonNull: records.filter(row => row.value !== null).length,
    ...(isWgi ? { version: wgiVersion } : {}) }
  console.log(`${indicator.code}：${source.rows} 条，非空 ${source.nonNull}，SHA-256 ${sha256.slice(0, 12)}`)
  return { source, records }
}

async function main(): Promise<void> {
  const wgiSourceMetadataSha256 = await verifyWgiVersion()
  const downloaded: { source: Source; records: Observation[] }[] = []
  for (const indicator of [...wdiIndicators, ...wgiIndicators]) downloaded.push(await fetchIndicator(indicator))
  const sources = downloaded.map(item => item.source)
  const records = downloaded.flatMap(item => item.records)
  const keys = new Set<string>()
  for (const row of records) {
    const key = `${row.code}|${row.iso}|${row.year}`
    if (keys.has(key)) throw new Error(`输出指标—国家—年份重复：${key}`)
    keys.add(key)
  }
  const wdiCount = wdiIndicators.length * countryCodes.length * wdiYears.length
  const wgiCount = wgiIndicators.length * countryCodes.length * wgiYears.length
  const expectedSourceCount = wdiIndicators.length + wgiIndicators.length
  if (sources.length !== expectedSourceCount || records.length !== wdiCount + wgiCount) throw new Error('最终指标或记录数量异常')
  const snapshot = {
    publisher: 'World Bank', retrievedAt: new Date().toISOString(), license: 'CC BY 4.0',
    period: [1960, 2025], wdiPeriod: [1960, 2024], wgiPeriod: [1996, 2025], wgiYears,
    wgiVersion, wgiMethodologyUrl, wgiSourceUrl, wgiSourceUpdated: wgiUpdate, wgiSourceMetadataSha256,
    note: '七项 WDI 指标为八国 1960—2024 年逐年 API 原值；税收收入和不含赠款的财政收入占 GDP 来自 IMF GFS，经 WDI API 提供，覆盖稀疏且不自动折算 CAP。WGI 2026 版六维估计值及标准误为 1996、1998、2000、2002、2003—2025 年 27 个已发布年份。空值仅表示 API 缺值，WGI 的 observed 仅表示数值存在而非直接观测；不填补 1997、1999、2001，也不将 RUS 借给苏联 SUN。',
    sources, records,
  }
  const pendingPath = `${outputPath}.pending`
  writeFileSync(pendingPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  renameSync(pendingPath, outputPath)
  console.log(`世界银行完成：${records.length} 条（WDI ${wdiCount}，WGI ${wgiCount}）`)
}

main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
