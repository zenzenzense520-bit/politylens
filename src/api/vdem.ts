import { vdemCodes, type VdemDataset } from '../data/vdem'

// 修改：校验固定 ETL 溯源、逐行回填状态和苏联编码单元 11 的年份映射，异常反馈给界面。
export async function loadVdem(): Promise<VdemDataset> {
  const response = await fetch('/data/observations/vdem.json')
  if (!response.ok) throw new Error(`V-Dem 快照读取失败（HTTP ${response.status}）`)
  const dataset = await response.json() as VdemDataset
  if (!Array.isArray(dataset.sources) || !Array.isArray(dataset.records) || dataset.sources.length !== vdemCodes.length ||
    dataset.processor !== 'Our World in Data' || typeof dataset.processingUrl !== 'string' ||
    !dataset.processingUrl.startsWith('https://ourworldindata.org/grapher/') || !dataset.note?.includes('回填') ||
    !dataset.owidEtl || dataset.owidEtl.commit !== '4ad0beba651dcdde8f2808be1a43e146e168b420' ||
    !/^[0-9a-f]{64}$/.test(dataset.owidEtl.rulesSha256) ||
    !dataset.owidEtl.rulesUrl?.includes(dataset.owidEtl.commit) ||
    !['verified', 'unresolved'].includes(dataset.owidEtl.verification) ||
    !dataset.sovietMapping || dataset.sovietMapping.targetIso !== 'SUN' ||
    dataset.sovietMapping.sourceIso !== 'RUS' || dataset.sovietMapping.firstYear !== 1923 ||
    dataset.sovietMapping.lastYear !== 1990 || dataset.sovietMapping.vdemCountryUnitId !== 11 ||
    !dataset.sovietMapping.sourceUrl?.startsWith('https://v-dem.net/documents/72/countryunit_v16.pdf')) {
    throw new Error('V-Dem 快照结构异常')
  }
  const seen = new Set<string>()
  for (const record of dataset.records) {
    const key = `${record.iso}-${record.year}`
    if (!/^[A-Z]{3}$/.test(record.iso) || !Number.isInteger(record.year) || seen.has(key) ||
      typeof record.sourceEntity !== 'string' || record.sourceEntity.length === 0 ||
      !['not_imputed', 'imputed', 'unresolved'].includes(record.owidImputationStatus) ||
      vdemCodes.some(code => record.values?.[code] !== null &&
        (typeof record.values?.[code] !== 'number' || record.values[code]! < 0 || record.values[code]! > 1))) {
      throw new Error(`V-Dem 快照含无效记录：${key}`)
    }
    seen.add(key)
  }
  return dataset
}
