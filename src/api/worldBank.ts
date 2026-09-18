import type { WorldBankDataset } from '../data/observations'
// 修改：从本地已核验快照读取，网络异常明确反馈；不把缺失观测转换为零。
export async function loadWorldBank(): Promise<WorldBankDataset> {
  const response = await fetch('/data/observations/world-bank.json')
  if (!response.ok) throw new Error(`世界银行快照读取失败（HTTP ${response.status}）`)
  const data: WorldBankDataset = await response.json()
  if (!Array.isArray(data.records) || !Array.isArray(data.sources) || data.records.some(row =>
    !Number.isInteger(row.year) || (row.value !== null && !Number.isFinite(row.value)))) {
    throw new Error('世界银行快照格式不符合数据契约')
  }
  return data
}
