export interface NmcRecord {
  iso: string; ccode: number; year: number; dataYear: number;
  c: number | null; e: number | null; m: number | null;
  raw: { tpop: number | null; pec: number | null; irst: number | null; milex: number | null; milper: number | null };
}
export interface NmcDataset {
  publisher: string; dataset: string; datasetVersion: string; retrievedAt: string;
  normalization: { rule: string; note: string };
  source: string; records: NmcRecord[];
}
// 修改：从本地已核验快照读取，网络异常明确反馈；不把缺失观测转换为零。
export async function loadNmc(): Promise<NmcDataset> {
  const response = await fetch('/data/observations/nmc.json')
  if (!response.ok) throw new Error(`COW NMC 快照读取失败（HTTP ${response.status}）`)
  const data: NmcDataset = await response.json()
  if (!Array.isArray(data.records) || data.records.some(row =>
    typeof row.iso !== 'string' || !Number.isInteger(row.year) || !Number.isInteger(row.dataYear) ||
    (row.c !== null && !Number.isFinite(row.c)) || (row.e !== null && !Number.isFinite(row.e)) || (row.m !== null && !Number.isFinite(row.m)))) {
    throw new Error('COW NMC 快照格式不符合数据契约')
  }
  return data
}

// 按 iso + 档案年精确匹配；未匹配返回 undefined。
export function nmcFor(dataset: NmcDataset | null, iso: string, year: number): NmcRecord | undefined {
  return dataset?.records.find(row => row.iso === iso && row.year === year)
}
