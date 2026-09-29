import { vdemCodes, type VdemDataset } from '../data/vdem'

// 修改：本地 V-Dem/OWID 摘录读取时校验处理口径、唯一国家年份与指数范围，异常反馈给界面。
export async function loadVdem(): Promise<VdemDataset> {
  const response = await fetch('/data/observations/vdem.json')
  if (!response.ok) throw new Error(`V-Dem 快照读取失败（HTTP ${response.status}）`)
  const dataset = await response.json() as VdemDataset
  if (!Array.isArray(dataset.sources) || !Array.isArray(dataset.records) || dataset.sources.length !== vdemCodes.length ||
    dataset.processor !== 'Our World in Data' || typeof dataset.processingUrl !== 'string' ||
    !dataset.processingUrl.startsWith('https://ourworldindata.org/grapher/') || !dataset.note?.includes('回填')) {
    throw new Error('V-Dem 快照结构异常')
  }
  const seen = new Set<string>()
  for (const record of dataset.records) {
    const key = `${record.iso}-${record.year}`
    if (!/^[A-Z]{3}$/.test(record.iso) || !Number.isInteger(record.year) || seen.has(key) ||
      vdemCodes.some(code => record.values?.[code] !== null &&
        (typeof record.values?.[code] !== 'number' || record.values[code]! < 0 || record.values[code]! > 1))) {
      throw new Error(`V-Dem 快照含无效记录：${key}`)
    }
    seen.add(key)
  }
  return dataset
}
