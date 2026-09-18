// Pp 国力方程：Pp = (C + E + M) × (S + W)
// C/E/M 为物质能力（0–100，来自 COW NMC 归一化），S/W 为 0–1 专家系数。
export const PP_COMPONENTS = [
  { key: 'C', label: '基本实体', short: 'C', max: 100, note: '总人口归一化（COW NMC tpop）' },
  { key: 'E', label: '经济能力', short: 'E', max: 100, note: '能源 + 钢铁，各自归一化后平均' },
  { key: 'M', label: '军事能力', short: 'M', max: 100, note: '军费 + 军队，各自归一化后平均' },
  { key: 'S', label: '战略意图', short: 'S', max: 1, note: '0–1 专家编码，见 ppCoding.js' },
  { key: 'W', label: '国家意志', short: 'W', max: 1, note: '0–1 专家编码，见 ppCoding.js' },
]

export const PP_FORMULA = 'Pp = (C + E + M) × (S + W)'

// 着色参考值（约当前样本最高 Pp 量级），仅用于地图配色，非理论最大值 (100+100+100)×(1+1)=600。
export const PP_MAX_REFERENCE = 300

export function calculatePp(inputs) {
  // 修改：S/W 改为 0–1 系数，C/E/M 保持 0–100；空值不伪装成零。
  const missing = PP_COMPONENTS.filter(({ key }) => {
    const value = inputs?.[key]
    return value === null || value === undefined || value === '' || !Number.isFinite(Number(value))
  })
  if (missing.length) return { status: 'unavailable', value: null, missing: missing.map(({ key }) => key), formula: PP_FORMULA }
  const values = Object.fromEntries(PP_COMPONENTS.map(({ key }) => [key, Number(inputs[key])]))
  const outOfRange = PP_COMPONENTS.filter(({ key, max }) => values[key] < 0 || values[key] > max)
  if (outOfRange.length) return { status: 'invalid', value: null, outOfRange: outOfRange.map(({ key }) => key), formula: PP_FORMULA }
  return { status: 'calculated', value: (values.C + values.E + values.M) * (values.S + values.W), inputs: values, formula: PP_FORMULA }
}
