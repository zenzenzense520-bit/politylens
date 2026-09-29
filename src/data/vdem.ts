// 修改：V-Dem 五个经 OWID 处理的 0—1 指数独立建模，保留历史回填说明，不与 EIU 或 DRI 混算。
export type VdemIndexCode = 'v2x_polyarchy' | 'v2x_libdem' | 'v2x_partipdem' | 'v2x_delibdem' | 'v2x_egaldem'
export interface VdemSource { code: VdemIndexCode; label: string; slug: string; column: string; url: string; sha256: string; rows: number }
export interface VdemRecord { iso: string; year: number; values: Record<VdemIndexCode, number | null> }
export interface VdemDataset {
  publisher: string; processor: string; version: string; license: string; retrievedAt: string;
  period: [number, number]; processingUrl: string; note: string; sources: VdemSource[]; records: VdemRecord[]
}
export const vdemCodes: VdemIndexCode[] = ['v2x_polyarchy', 'v2x_libdem', 'v2x_partipdem', 'v2x_delibdem', 'v2x_egaldem']
export function vdemFor(dataset: VdemDataset | null, iso: string, year: number): VdemRecord | undefined {
  if (!dataset || iso === 'SUN') return undefined
  return dataset.records.find(record => record.iso === iso && record.year === year)
}
