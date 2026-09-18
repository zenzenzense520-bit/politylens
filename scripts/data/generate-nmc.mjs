// 生成 public/data/observations/nmc.json：
// 读取固化的 COW NMC 原始 CSV，按“当年全球最大值”归一化 C/E/M，抽取现有政权。
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', '..')

const csvPath = join(__dirname, 'nmc-source.csv')
const outPath = join(root, 'public', 'data', 'observations', 'nmc.json')

const lines = readFileSync(csvPath, 'utf8').split(/\r?\n/).filter((line) => line.trim())
const headers = lines[0].split(',').map((h) => h.trim())
const rows = lines.slice(1).map((line) => {
  const cols = line.split(',')
  return Object.fromEntries(headers.map((h, i) => [h, cols[i]]))
})

const num = (v) => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// 每个年份每个指标的全球最大值
const indicators = ['tpop', 'pec', 'irst', 'milex', 'milper']
const max = Object.fromEntries(indicators.map((key) => [key, {}]))
for (const row of rows) {
  const year = Number(row.year)
  for (const key of indicators) {
    const value = num(row[key])
    if (value !== null && (max[key][year] === undefined || value > max[key][year])) max[key][year] = value
  }
}

// 值 / 当年全球最大值 × 100，保留 2 位小数
const norm = (key, year, value) => {
  if (value === null) return null
  const m = max[key][year]
  if (m === undefined || m <= 0) return null
  return Math.round((value / m) * 100 * 100) / 100
}

// 目标政权：iso / ccode / 档案年 / 实际数据年（NMC 最新到 2022）
const targets = [
  { iso: 'CHN', ccode: 710, year: 1966, dataYear: 1966 },
  { iso: 'CHN', ccode: 710, year: 1995, dataYear: 1995 },
  { iso: 'SUN', ccode: 365, year: 1937, dataYear: 1937 },
  { iso: 'DEU', ccode: 255, year: 1932, dataYear: 1932 },
  { iso: 'DEU', ccode: 255, year: 1938, dataYear: 1938 },
  { iso: 'JPN', ccode: 740, year: 1925, dataYear: 1925 },
  { iso: 'USA', ccode: 2, year: 2020, dataYear: 2020 },
  { iso: 'CHN', ccode: 710, year: 2024, dataYear: 2022 },
  { iso: 'USA', ccode: 2, year: 2024, dataYear: 2022 },
  { iso: 'DEU', ccode: 255, year: 2024, dataYear: 2022 },
  { iso: 'JPN', ccode: 740, year: 2024, dataYear: 2022 },
  { iso: 'GBR', ccode: 200, year: 2024, dataYear: 2022 },
  { iso: 'FRA', ccode: 220, year: 2024, dataYear: 2022 },
  { iso: 'IND', ccode: 750, year: 2024, dataYear: 2022 },
  { iso: 'RUS', ccode: 365, year: 2024, dataYear: 2022 },
]

const records = []
for (const t of targets) {
  const row = rows.find((r) => Number(r.ccode) === t.ccode && Number(r.year) === t.dataYear)
  if (!row) throw new Error(`缺少数据：ccode=${t.ccode} year=${t.dataYear}`)
  const tpop = num(row.tpop)
  const pec = num(row.pec)
  const irst = num(row.irst)
  const milex = num(row.milex)
  const milper = num(row.milper)
  const c = norm('tpop', t.dataYear, tpop)
  const ePec = norm('pec', t.dataYear, pec)
  const eIrst = norm('irst', t.dataYear, irst)
  const e = ePec !== null && eIrst !== null ? Math.round(((ePec + eIrst) / 2) * 100) / 100 : null
  const mMilex = norm('milex', t.dataYear, milex)
  const mMilper = norm('milper', t.dataYear, milper)
  const m = mMilex !== null && mMilper !== null ? Math.round(((mMilex + mMilper) / 2) * 100) / 100 : null
  records.push({
    iso: t.iso, ccode: t.ccode, year: t.year, dataYear: t.dataYear,
    c, e, m,
    raw: { tpop, pec, irst, milex, milper },
  })
}

const output = {
  publisher: 'Correlates of War',
  dataset: 'National Material Capabilities',
  datasetVersion: 'v7.0 (abridged)',
  retrievedAt: new Date().toISOString(),
  normalization: {
    rule: 'per-indicator value / global-max-for-year × 100; C=tpop; E=avg(pec,irst); M=avg(milex,milper); S/W=expert-coded 0-1 in src/data/ppCoding.js',
    note: '现代档案 2024 使用 2022 数据年（NMC 最新可用年），同年不伪装',
  },
  source: 'https://correlatesofwar.org/data-sets/national-material-capabilities/',
  records,
}

writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')
console.log(`已生成 nmc.json：${records.length} 条政权国力观测。`)
