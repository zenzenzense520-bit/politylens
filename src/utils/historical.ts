// 修改：严格区分目标年份、实际快照年份和数据缺失，不借用未来边界。
export const historicalYears = [1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010]
export interface BoundarySelection { targetYear: number; snapshotYear: number | null; exact: boolean; message: string }
export function selectBoundary(targetYear: number, strict: boolean): BoundarySelection {
  const prior = [...historicalYears].reverse().find(year => year <= targetYear) ?? null
  const exact = prior === targetYear
  const snapshotYear = strict && !exact ? null : prior
  const message = exact ? `${targetYear} 年上游快照（未精确到月日）` : snapshotYear === null
    ? `${targetYear} 年缺少同年边界；严格模式不显示其他年份国界`
    : `参考 ${snapshotYear} 年快照，与 ${targetYear} 年相差 ${targetYear - snapshotYear} 年；不代表当年精确国界`
  return { targetYear, snapshotYear, exact, message }
}
export function metricColor(value: number | null, maximum: number): string {
  if (value === null || !Number.isFinite(value)) return '#718b88'
  if (value / maximum >= 0.8) return '#70d8c7'
  if (value / maximum >= 0.6) return '#f2bd70'
  return '#da7566'
}
