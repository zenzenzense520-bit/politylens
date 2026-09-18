import { countries } from './observations'
import { leaderFor } from './leaders'
type DriKey = 'competition' | 'pluralism' | 'liberties' | 'ruleOfLaw' | 'checks' | 'participation' | 'localDemocracy' | 'inclusion'
type CapacityKey = 'administration' | 'fiscal' | 'law' | 'integrity' | 'services'
export interface Profile {
  id: string; country: string; regime: string; leader: string; year: number; iso: string;
  leaderSource?: { name: string; url: string; retrievedAt: string };
  coords: number[] | null; color: string; observationStatus: string;
  dri: Record<DriKey, number | null>; capacity: Record<CapacityKey, number | null>;
  events: { year: number; title: string; text: string }[];
  evidence: Record<string, { claim: string; rationale: string; confidence: string; status: string }>;
  sources: { name: string; url: string; role: string }[];
}
const emptyDri = (): Profile['dri'] => ({ competition: null, pluralism: null, liberties: null, ruleOfLaw: null, checks: null, participation: null, localDemocracy: null, inclusion: null })
const emptyCapacity = (): Profile['capacity'] => ({ administration: null, fiscal: null, law: null, integrity: null, services: null })
// 修改：国力 pp 不再存于档案对象，改由 NMC 数据 + ppCoding 在前端动态合成（见 App.vue ppFor）。
export function buildProfiles(historical: Profile[]): Profile[] {
  const modern: Profile[] = countries.map(country => {
    const id = `${country.iso}-2024`
    const leader = leaderFor(id)
    return { ...country, id, year: 2024,
    regime: '当年观测', leader: leader?.leader ?? '领导人资料待补充', leaderSource: leader ? { name: leader.sourceName, url: leader.sourceUrl, retrievedAt: leader.retrievedAt } : undefined,
    color: '#70d8c7', observationStatus: '已接入真实观测',
    dri: emptyDri(), capacity: emptyCapacity(), evidence: {},
    events: [{ year: 2024, title: '2024 年观测', text: 'EIU 原版评分与世界银行同年观测；各自保留原始单位。' }],
    sources: [],
  }} )
  return [...historical.map(item => {
    const leader = leaderFor(item.id)
    return { ...item, iso: item.id.startsWith('ussr-') ? 'SUN' : item.iso,
    leader: leader?.leader ?? item.leader,
    leaderSource: leader ? { name: leader.sourceName, url: leader.sourceUrl, retrievedAt: leader.retrievedAt } : undefined,
    dri: emptyDri(), capacity: emptyCapacity(), evidence: {}, observationStatus: '历史档案 · 指标待补证',
  }}), ...modern]
}
