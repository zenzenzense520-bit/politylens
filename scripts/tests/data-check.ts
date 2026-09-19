import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { selectBoundary, metricColor, historicalYears } from '../../src/utils/historical'
import { weightedScore } from '../../src/utils/scoring'
import { calculatePp } from '../../src/utils/powerEquation'
import { eiuObservations, type WorldBankDataset } from '../../src/data/observations'
import { buildProfiles } from '../../src/data/profiles'
import { regimes } from '../../src/data/regimes'
import { strategicCoding } from '../../src/data/ppCoding'
// 修改：回归年份错配、未来边界、缺失零分和苏联身份污染。
assert.equal(selectBoundary(1938, true).snapshotYear, 1938)
assert.equal(selectBoundary(1932, true).snapshotYear, 1932)
assert.equal(selectBoundary(1937, false).snapshotYear, 1937)
assert.equal(selectBoundary(1966, false).snapshotYear, 1966)
assert.equal(selectBoundary(1995, false).snapshotYear, 1995)
assert.equal(selectBoundary(2024, true).snapshotYear, 2024)
assert.equal(selectBoundary(2024, false).snapshotYear, 2024)
assert.equal(selectBoundary(1980, true).snapshotYear, null)
assert.equal(selectBoundary(1980, false).snapshotYear, 1978)
assert.equal(selectBoundary(1800, false).snapshotYear, null)
assert.equal(weightedScore({ a: null }, { a: 1 }), null)
assert.equal(weightedScore({ a: '' }, { a: 1 }), null)
assert.equal(weightedScore({ a: 0 }, { a: 1 }), 0)
assert.equal(weightedScore({ a: 9 }, { a: 0 }), null)
assert.equal(calculatePp({ C: null, E: null, M: null, S: null, W: null }).status, 'unavailable')
assert.equal(calculatePp({ C: 50, E: 50, M: 50, S: 0, W: 0 }).value, 0)
assert.equal(calculatePp({ C: 100, E: 100, M: 100, S: 1, W: 1 }).value, 600)
assert.equal(calculatePp({ C: 50, E: 50, M: 50, S: 1.5, W: 0.5 }).status, 'invalid')
assert.equal(calculatePp({ C: 150, E: 50, M: 50, S: 0.5, W: 0.5 }).status, 'invalid')
assert.equal(metricColor(8, 10), metricColor(80, 100))
assert.notEqual(metricColor(null, 10), metricColor(0, 10))
const profiles = buildProfiles(regimes)
assert.equal(profiles.find(row => row.id === 'ussr-1937')?.iso, 'SUN')
assert(profiles.every(row => Object.values(row.dri).every(value => value === null)))
assert.equal(profiles.length, 15)
assert(profiles.every(row => row.leader && row.leader !== '领导人资料待补充'))
assert(profiles.every(row => row.leaderSource?.url.startsWith('https://')))
for (const row of eiuObservations) {
  assert(row.dimensions.every(value => value >= 0 && value <= 10))
  assert(Math.abs(row.score - row.dimensions.reduce((sum, value) => sum + value, 0) / 5) <= 0.011)
  assert.equal(row.year, 2024)
}
interface Snapshot { year: number; filename: string; sha256: string; features: number }
interface Manifest { revision: string; rawSnapshots: Snapshot[]; snapshots: (Snapshot & { corrections: number })[] }
interface Properties {
  NAME?: string; SUBJECTO?: string; PARTOF?: string; SOURCE_NAME?: string;
  DISPLAY_NAME?: string; ADMIN_STATUS?: string; LEADER?: string;
  ADMIN_NAME?: string; TERRITORIAL_STATUS?: string; FromYear?: number; ToYear?: number;
}
interface FeatureCollection { type: string; features: { type: string; geometry: { type: string; coordinates: unknown }; properties: Properties }[] }
const parse = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, '')) as T
const manifest = parse<Manifest>('public/data/historical-basemaps/manifest.json')
const historicalBasemapYears = [1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010]
assert.deepEqual(manifest.snapshots.map(row => row.year), historicalBasemapYears)
assert.deepEqual(manifest.rawSnapshots.map(row => row.year), historicalBasemapYears)
for (const [folder, snapshots] of [['raw', manifest.rawSnapshots], ['corrected', manifest.snapshots]] as const) {
  for (const row of snapshots) {
    const path = `public/data/historical-basemaps/${folder}/${row.filename}`
    assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'), row.sha256.toLowerCase())
    const geo = parse<FeatureCollection>(path)
    assert.equal(geo.type, 'FeatureCollection')
    assert.equal(geo.features.length, row.features)
    assert(geo.features.every(feature => feature.type === 'Feature' && ['Polygon', 'MultiPolygon'].includes(feature.geometry.type)))
  }
}
const corrected = manifest.snapshots.map(row => ({
  year: row.year,
  geo: parse<FeatureCollection>(`public/data/historical-basemaps/corrected/${row.filename}`),
}))
for (const { geo } of corrected) {
  assert.equal(geo.type, 'FeatureCollection')
  assert(geo.features.every(feature => !['NAME', 'SUBJECTO', 'PARTOF'].some(key => String(feature.properties[key as keyof Properties] ?? '').includes('Manchu Empire'))))
  assert(geo.features.filter(feature => feature.properties.SOURCE_NAME === 'Xinjiang').every(feature => feature.properties.SUBJECTO === 'China' && feature.properties.PARTOF === 'China'))
}
const corrected1900 = corrected.find(row => row.year === 1900)!.geo.features
assert(corrected1900.some(feature => feature.properties.SOURCE_NAME === 'Manchu Empire' && feature.properties.DISPLAY_NAME === 'Qing Empire'))
const corrected1938 = corrected.find(row => row.year === 1938)!.geo.features
const manchukuo1938 = corrected1938.find(feature => feature.properties.DISPLAY_NAME === 'Manchukuo')
assert(manchukuo1938)
assert.equal(manchukuo1938.properties.SUBJECTO, 'Manchukuo')
assert.notEqual(manchukuo1938.properties.PARTOF, 'Empire of Japan')
assert.match(manchukuo1938.properties.ADMIN_STATUS ?? '', /(不计入|不把它并入)日本帝国领土/)
assert(corrected1938.some(feature => feature.properties.DISPLAY_NAME === 'Korea under Japanese rule'))
const corrected1960 = corrected.find(row => row.year === 1960)!.geo.features
const tibet1960 = corrected1960.find(feature => feature.properties.SOURCE_NAME === 'Tibet')
assert(tibet1960)
assert.equal(tibet1960.properties.SUBJECTO, 'China')
assert.equal(tibet1960.properties.PARTOF, 'China')

// 修改：验证 ClioPatria 逐年实控快照、殖民归属、傀儡排除和中国边疆覆盖。
interface CliopatriaManifest {
  sourceCommit: string; sourceSha256: string; license: string; policyVersion: string;
  snapshots: { year: number; filename: string; features: number; sha256: string }[];
}
type Position = [number, number]
function ringContains(point: Position, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j]
    const crosses = (yi > point[1]) !== (yj > point[1]) && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    if (crosses) inside = !inside
  }
  return inside
}
function geometryContains(point: Position, geometry: { type: string; coordinates: unknown }): boolean {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates as Position[][]] : geometry.coordinates as Position[][][]
  return polygons.some(polygon => ringContains(point, polygon[0]) && !polygon.slice(1).some(hole => ringContains(point, hole)))
}
const clioManifest = parse<CliopatriaManifest>('public/data/cliopatria/manifest.json')
assert.deepEqual(clioManifest.snapshots.map(row => row.year), historicalYears)
assert.equal(clioManifest.license, 'CC BY 4.0')
assert.match(clioManifest.sourceCommit, /^[0-9a-f]{40}$/)
assert.match(clioManifest.sourceSha256, /^[0-9a-f]{64}$/)
const clioSnapshots = clioManifest.snapshots.map(row => {
  const path = `public/data/cliopatria/snapshots/${row.filename}`
  assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'), row.sha256)
  const geo = parse<FeatureCollection>(path)
  assert.equal(geo.features.length, row.features)
  assert(geo.features.every(feature => ['Polygon', 'MultiPolygon'].includes(feature.geometry.type)))
  assert(geo.features.every(feature => (feature.properties.FromYear ?? row.year) <= row.year && (feature.properties.ToYear ?? row.year) >= row.year))
  assert(geo.features.every(feature => !/^\(.+\)$/.test(feature.properties.SOURCE_NAME ?? '')))
  return { year: row.year, geo }
})
const clio1900 = clioSnapshots.find(row => row.year === 1900)!.geo.features
assert(clio1900.some(feature => feature.properties.SOURCE_NAME === 'Qing Dynasty' && feature.properties.ADMIN_NAME === 'Qing Empire'))
assert(clio1900.some(feature => feature.properties.SOURCE_NAME === 'British Raj' && feature.properties.ADMIN_NAME === 'British Empire' && feature.properties.TERRITORIAL_STATUS === 'colony'))
const clio1938 = clioSnapshots.find(row => row.year === 1938)!.geo.features
assert(clio1938.some(feature => feature.properties.SOURCE_NAME === 'Manchukuo' && feature.properties.ADMIN_NAME === 'Manchukuo' && feature.properties.TERRITORIAL_STATUS === 'puppet'))
const clio2024 = clioSnapshots.find(row => row.year === 2024)!.geo.features
assert(clio2024.some(feature => feature.properties.SOURCE_NAME === 'Russian-occupied territories' && feature.properties.ADMIN_NAME === 'Russian Federation' && feature.properties.TERRITORIAL_STATUS === 'de_facto_control'))
for (const { year, geo } of clioSnapshots) {
  const chinese = geo.features.filter(feature => ['Qing Empire', 'Empire of China', 'Republic of China', "People's Republic of China"].includes(feature.properties.ADMIN_NAME ?? ''))
  assert(chinese.some(feature => geometryContains([85, 42], feature.geometry)), `${year} 年新疆参考点未落入中国政治实体`)
}
const clio1966 = clioSnapshots.find(row => row.year === 1966)!.geo.features
const china1966 = clio1966.filter(feature => feature.properties.ADMIN_NAME === "People's Republic of China")
assert(china1966.some(feature => geometryContains([91, 31], feature.geometry)), '1966 年西藏参考点未落入中国')
const worldBank = parse<WorldBankDataset>('public/data/observations/world-bank.json')
assert.equal(worldBank.sources.length, 6)
assert.equal(new Set(worldBank.records.map(row => `${row.iso}-${row.year}-${row.code}`)).size, worldBank.records.length)
assert(worldBank.records.every(row => row.value === null || Number.isFinite(row.value)))
assert(worldBank.records.some(row => row.value === null))
for (const eiu of eiuObservations) {
  assert(worldBank.records.some(row => row.iso === eiu.iso && row.year === eiu.year && row.code === 'NY.GDP.PCAP.CD' && row.value !== null))
}
interface NmcDataset { records: { iso: string; year: number; c: number | null; e: number | null; m: number | null }[] }
const nmc = parse<NmcDataset>('public/data/observations/nmc.json')
assert(Array.isArray(nmc.records) && nmc.records.length === 15)
for (const row of nmc.records) {
  for (const key of ['c', 'e', 'm'] as const) {
    assert(row[key] === null || (row[key] >= 0 && row[key] <= 100), `${row.iso}-${row.year} ${key} 超出 0-100`)
  }
}
for (const [id, coding] of Object.entries(strategicCoding)) {
  assert(coding.s >= 0 && coding.s <= 1 && coding.w >= 0 && coding.w <= 1, `${id} S/W 超出 0-1`)
}
console.log(`PASS：年份与缺失值回归；${manifest.snapshots.length} 个边界快照哈希；${eiuObservations.length} 国 EIU；${worldBank.records.length} 条世界银行记录；${nmc.records.length} 条 NMC 国力；${Object.keys(strategicCoding).length} 组 S/W 编码。`)
