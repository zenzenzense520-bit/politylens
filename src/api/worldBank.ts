import { wgiDimensions, type WorldBankDataset } from '../data/observations'

const countryCodes = ['CHN', 'USA', 'DEU', 'JPN', 'GBR', 'FRA', 'IND', 'RUS']
const wgiYears = [1996, 1998, 2000, 2002, ...Array.from({ length: 23 }, (_, index) => 2003 + index)]
const wgiCodes = wgiDimensions.flatMap(dimension => [`GOV_WGI_${dimension.code}.EST`, `GOV_WGI_${dimension.code}.SE`])

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// 修改：浏览器加载时校验结构、版本和已发布 WGI 键空间，避免旧缓存或截断快照伪装成 2026 数据。
function isWorldBankDataset(value: unknown): value is WorldBankDataset {
  if (!isObject(value) || !Array.isArray(value.sources) || !Array.isArray(value.records) ||
    !Array.isArray(value.period) || value.period[0] !== 1960 || value.period[1] !== 2025 ||
    value.wgiVersion !== '2026 update' || value.wgiSourceUpdated !== '2026-09-25' ||
    typeof value.wgiMethodologyUrl !== 'string' || !value.wgiMethodologyUrl.startsWith('https://www.worldbank.org/')) return false
  if (typeof value.publisher !== 'string' || typeof value.retrievedAt !== 'string' ||
    typeof value.license !== 'string' || typeof value.note !== 'string') return false
  const sourceCodes = new Set<string>()
  for (const source of value.sources as unknown[]) {
    if (!isObject(source) || typeof source.code !== 'string' || typeof source.label !== 'string' ||
      typeof source.unit !== 'string' || typeof source.url !== 'string' ||
      typeof source.updated !== 'string' || ![2, 3].includes(source.sourceId as number)) return false
    if (sourceCodes.has(source.code)) return false
    sourceCodes.add(source.code)
    if (wgiCodes.includes(source.code) && (source.sourceId !== 3 || source.updated !== value.wgiSourceUpdated ||
      source.rows !== 216 || source.nonNull !== 216)) return false
  }
  if (!wgiCodes.every(code => sourceCodes.has(code))) return false
  const wgiKeySet = new Set<string>()
  for (const record of value.records as unknown[]) {
    if (!isObject(record) || typeof record.iso !== 'string' || typeof record.code !== 'string' ||
      !Number.isInteger(record.year) || (record.value !== null &&
      (typeof record.value !== 'number' || !Number.isFinite(record.value))) ||
      record.status !== (record.value === null ? 'missing' : 'observed') ||
      !Number.isInteger(record.decimal)) return false
    if (!wgiCodes.includes(record.code)) continue
    if (!countryCodes.includes(record.iso) || !wgiYears.includes(record.year as number) ||
      record.value === null || (record.code.endsWith('.SE') && (record.value as number) < 0)) return false
    const key = `${record.code}|${record.iso}|${record.year}`
    if (wgiKeySet.has(key)) return false
    wgiKeySet.add(key)
  }
  return wgiKeySet.size === wgiCodes.length * countryCodes.length * wgiYears.length
}

export async function loadWorldBank(): Promise<WorldBankDataset> {
  const response = await fetch('/data/observations/world-bank.json')
  if (!response.ok) throw new Error(`世界银行快照读取失败（HTTP ${response.status}）`)
  const data: unknown = await response.json()
  if (!isWorldBankDataset(data)) throw new Error('世界银行快照版本或结构不符合 2026 WGI 数据契约')
  return data
}
