// 修改：ClioPatria 为界面全部可选年份生成实控快照；额外导入年份仍只回退到更早快照。
export const historicalYears = [1900, 1914, 1919, 1920, 1925, 1928, 1929, 1930, 1931, 1932, 1933, 1937, 1938, 1941, 1945, 1954, 1960, 1965, 1966, 1978, 1992, 1994, 1995, 2000, 2010, 2020, 2024]
export interface BoundarySelection { targetYear: number; snapshotYear: number | null; exact: boolean; message: string }
export function selectBoundary(targetYear: number, strict: boolean): BoundarySelection {
  const prior = [...historicalYears].reverse().find(year => year <= targetYear) ?? null
  const exact = prior === targetYear
  const snapshotYear = strict && !exact ? null : prior
  const message = exact ? `${targetYear} 年 ClioPatria 实控快照（年度口径）` : snapshotYear === null
    ? `${targetYear} 年缺少同年边界；严格模式不显示其他年份国界`
    : `参考 ${snapshotYear} 年 ClioPatria 快照，与 ${targetYear} 年相差 ${targetYear - snapshotYear} 年；不代表目标年的精确实控边界`
  return { targetYear, snapshotYear, exact, message }
}
export function metricColor(value: number | null, maximum: number): string {
  if (value === null || !Number.isFinite(value)) return '#718b88'
  if (value / maximum >= 0.8) return '#70d8c7'
  if (value / maximum >= 0.6) return '#f2bd70'
  return '#da7566'
}
