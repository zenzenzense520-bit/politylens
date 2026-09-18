export function weightedScore(values, weights) {
  // 修改：拒绝空值和空权重；null 不能通过 Number(null) 被伪装为零分。
  const entries = Object.entries(weights)
  if (!entries.length || entries.some(([key, weight]) => values[key] === null || values[key] === undefined || values[key] === '' || !Number.isFinite(Number(values[key])) || !Number.isFinite(Number(weight)) || Number(weight) < 0)) return null
  const total = entries.reduce((sum, [, weight]) => sum + Number(weight), 0)
  if (total <= 0) return null
  return entries.reduce((sum, [key, weight]) => sum + (Number(values[key]) || 0) * Number(weight), 0) / total
}

export function driScore(regime, weights) {
  return weightedScore(regime.dri, weights)
}

export function capacityScore(regime) {
  return weightedScore(regime.capacity, Object.fromEntries(Object.keys(regime.capacity).map((key) => [key, 1])))
}

// 修改：国力 pp 改由 powerEquation.calculatePp 承担，此处移除 nci / power 分支。
export function axisValue(regime, axis, weights) {
  if (axis === 'dri') return driScore(regime, weights)
  if (axis === 'capacity') return capacityScore(regime)
  if (axis.startsWith('dri:')) return regime.dri[axis.split(':')[1]] ?? null
  return null
}

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0))
}
