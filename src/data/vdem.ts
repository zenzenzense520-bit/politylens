// 修改：区分 OWID 跨政权回填状态与 V-Dem 历史编码单元，并显式限定苏联映射年份。
export type VdemIndexCode = 'v2x_polyarchy' | 'v2x_libdem' | 'v2x_partipdem' | 'v2x_delibdem' | 'v2x_egaldem'
export type OwidImputationStatus = 'not_imputed' | 'imputed' | 'unresolved'
export interface VdemSource { code: VdemIndexCode; label: string; slug: string; column: string; url: string; sha256: string; rows: number }
export interface VdemRecord { iso: string; year: number; sourceEntity: string; owidImputationStatus: OwidImputationStatus; values: Record<VdemIndexCode, number | null> }
export interface VdemEtlProvenance {
  datasetVersion: string; commit: string; rulesUrl: string; rulesSha256: string; namesUrl: string;
  namesSha256: string; verification: 'verified' | 'unresolved'; issue: string | null; statusDefinition: string
}
export interface VdemHistoricalMapping {
  targetIso: 'SUN'; sourceIso: 'RUS'; firstYear: number; lastYear: number; vdemCountryUnitId: number; sourceUrl: string
}
export interface VdemDataset {
  publisher: string; processor: string; version: string; license: string; retrievedAt: string;
  period: [number, number]; processingUrl: string; note: string; owidEtl: VdemEtlProvenance;
  sovietMapping: VdemHistoricalMapping; sources: VdemSource[]; records: VdemRecord[]
}
export const vdemCodes: VdemIndexCode[] = ['v2x_polyarchy', 'v2x_libdem', 'v2x_partipdem', 'v2x_delibdem', 'v2x_egaldem']
export function vdemMappingFor(dataset: VdemDataset | null, iso: string, year: number): VdemHistoricalMapping | undefined {
  const mapping = dataset?.sovietMapping
  return mapping && iso === mapping.targetIso && year >= mapping.firstYear && year <= mapping.lastYear ? mapping : undefined
}
export function vdemFor(dataset: VdemDataset | null, iso: string, year: number): VdemRecord | undefined {
  if (!dataset) return undefined
  const mapping = vdemMappingFor(dataset, iso, year)
  if (mapping) return dataset.records.find(record => record.iso === mapping.sourceIso && record.year === year &&
    record.owidImputationStatus === 'not_imputed')
  // 苏联编码期间的 RUS 仅作数据来源，不能同时展示成俄罗斯联邦。
  if (iso === 'SUN' || (iso === 'RUS' && year >= dataset.sovietMapping.firstYear && year <= dataset.sovietMapping.lastYear)) return undefined
  return dataset.records.find(record => record.iso === iso && record.year === year)
}
// 新增（2026-11-06）：单国 V-Dem 长序列。沿用 vdemFor 的口径：SUN 仅 1923—1990 取 RUS 未回填行，RUS 在该区间不展示。
export interface VdemSeriesPoint { year: number; value: number | null; status: OwidImputationStatus }
export function vdemSeriesFor(dataset: VdemDataset | null, iso: string, code: VdemIndexCode): VdemSeriesPoint[] {
  if (!dataset) return []
  const { sourceIso, targetIso, firstYear, lastYear } = dataset.sovietMapping
  const points: VdemSeriesPoint[] = []
  for (let year = dataset.period[0]; year <= dataset.period[1]; year++) {
    const record = (iso === targetIso && year >= firstYear && year <= lastYear)
      ? dataset.records.find(row => row.iso === sourceIso && row.year === year && row.owidImputationStatus === 'not_imputed')
      : vdemFor(dataset, iso, year)
    if (record) points.push({ year, value: record.values[code], status: record.owidImputationStatus })
  }
  return points
}
