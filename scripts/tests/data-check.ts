import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { selectBoundary, metricColor, historicalYears } from '../../src/utils/historical'
import { weightedScore } from '../../src/utils/scoring'
import { calculatePp } from '../../src/utils/powerEquation'
import { eiuObservations, wgiSeriesFor, type WorldBankDataset } from '../../src/data/observations'
import { buildProfiles } from '../../src/data/profiles'
import { leaderFor } from '../../src/data/leaders'
import { regimes } from '../../src/data/regimes'
import { strategicCoding } from '../../src/data/ppCoding'
import { vdemCodes, vdemFor, vdemSeriesFor, type VdemDataset } from '../../src/data/vdem'
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
// 修改（2026-10-25）：P1-3 扩到 12 个现代国家，7 历史 + 12 现代 = 19 个档案。
assert.equal(profiles.length, 19)
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
  LEADER_SOURCE_URL?: string; ADMIN_NAME?: string; TERRITORIAL_STATUS?: string; FromYear?: number; ToYear?: number;
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
// 修改：新增四国档案后，2024 ClioPatria 对应主权面必须同步展示已核验档案中的领导人和来源。
for (const [adminName, profileId] of [['Republic of Korea', 'KOR-2024'], ['Republic of Brazil', 'BRA-2024'], ['South Africa', 'ZAF-2024'], ['Ukraine', 'UKR-2024']]) {
  const profile = leaderFor(profileId)
  assert(profile, `${profileId} 缺少领导人来源档案`)
  const features = clio2024.filter(feature => feature.properties.ADMIN_NAME === adminName)
  assert(features.length > 0, `2024 ClioPatria 缺少 ${adminName}`)
  assert(features.every(feature => feature.properties.LEADER === profile.leader && feature.properties.LEADER_SOURCE_URL === profile.sourceUrl), `${adminName} 边界面领导人/来源与档案不一致`)
}
// 新增（2026-11-06）：2000/2010/2020 快照中十二国主权面必须带有对应领导人档案与来源，且无“待补充”。
for (const year of [2000, 2010, 2020]) {
  const features = clioSnapshots.find(row => row.year === year)!.geo.features
  for (const [adminName, iso] of [["People's Republic of China", 'CHN'], ['United States of America', 'USA'], ['Federated Republic of Germany', 'DEU'],
    ['Japan', 'JPN'], ['United Kingdom', 'GBR'], ['French Fifth Republic', 'FRA'], ['Republic of India', 'IND'], ['Russian Federation', 'RUS'],
    ['Republic of Korea', 'KOR'], ['Republic of Brazil', 'BRA'], ['South Africa', 'ZAF'], ['Ukraine', 'UKR']]) {
    const profile = year === 2020 && iso === 'USA' ? leaderFor('usa-2020') : leaderFor(`${iso}-${year}`)
    assert(profile?.sourceUrl.startsWith('https://en.wikipedia.org/wiki/List_of_state_leaders') || profile?.sourceUrl.startsWith('https://en.wikipedia.org/wiki/2020_in'), `${iso}-${year} 缺少领导人来源`)
    const matched = features.filter(feature => feature.properties.ADMIN_NAME === adminName)
    assert(matched.length > 0, `${year} ClioPatria 缺少 ${adminName}`)
    assert(matched.every(feature => feature.properties.LEADER === profile.leader && feature.properties.LEADER_SOURCE_URL === profile.sourceUrl), `${year} ${adminName} 边界面领导人/来源与档案不一致`)
  }
}
for (const { year, geo } of clioSnapshots) {
  const chinese = geo.features.filter(feature => ['Qing Empire', 'Empire of China', 'Republic of China', "People's Republic of China"].includes(feature.properties.ADMIN_NAME ?? ''))
  assert(chinese.some(feature => geometryContains([85, 42], feature.geometry)), `${year} 年新疆参考点未落入中国政治实体`)
}
const clio1966 = clioSnapshots.find(row => row.year === 1966)!.geo.features
const china1966 = clio1966.filter(feature => feature.properties.ADMIN_NAME === "People's Republic of China")
assert(china1966.some(feature => geometryContains([91, 31], feature.geometry)), '1966 年西藏参考点未落入中国')
const worldBank = parse<WorldBankDataset>('public/data/observations/world-bank.json')
// 修改：核验七项年度 WDI 与 WGI 2026 版六维估计值/标准误的完整键空间及真实缺口。
const wdiCodes = ['NY.GDP.MKTP.CD', 'NY.GDP.PCAP.CD', 'SP.POP.TOTL', 'NY.GDP.MKTP.KD', 'NY.GDP.MKTP.KD.ZG', 'GC.TAX.TOTL.GD.ZS', 'GC.REV.XGRT.GD.ZS',
  'MS.MIL.XPND.CD', 'MS.MIL.XPND.GD.ZS', 'SP.DYN.LE00.IN', 'SP.URB.TOTL.IN.ZS', 'NE.TRD.GNFS.ZS', 'IT.NET.USER.ZS', 'SI.POV.GINI']
const wgiDimensions = ['VA', 'PV', 'GE', 'RQ', 'RL', 'CC']
const wgiCodes = wgiDimensions.flatMap(dimension => [`GOV_WGI_${dimension}.EST`, `GOV_WGI_${dimension}.SE`])
const wgiYears = [1996, 1998, 2000, ...Array.from({ length: 24 }, (_, index) => 2002 + index)]
// 修改（2026-10-25）：P1-3 加韩国、巴西、南非、乌克兰，共 12 国。
const wdiCountries = ['CHN', 'USA', 'DEU', 'JPN', 'GBR', 'FRA', 'IND', 'RUS', 'KOR', 'BRA', 'ZAF', 'UKR']
assert.equal(worldBank.license, 'CC BY 4.0')
assert.deepEqual(worldBank.period, [1960, 2025])
assert.deepEqual(worldBank.wdiPeriod, [1960, 2025])
assert.equal(worldBank.wgiVersion, '2026 update')
assert.match(worldBank.wgiMethodologyUrl, /^https:\/\/www\.worldbank\.org\/content\/dam\/sites\/govindicators\/doc\//)
assert.deepEqual(worldBank.sources.map(source => source.code), [...wdiCodes, ...wgiCodes])
// 修改（2026-10-25）：P1-3 扩 12 国——WDI 7 指标 × 12 国 × 66 年 = 5544，WGI 12 代码 × 12 国 × 27 年 = 3888，总记录 9432。
// 2026-11-06：WDI 扩至 14 指标 × 12 国 × 66 年 = 11088，加 WGI 3888，总记录 14976。
assert.equal(worldBank.records.length, 14976)
assert.equal(new Set(worldBank.records.map(row => `${row.iso}-${row.year}-${row.code}`)).size, worldBank.records.length)
assert(worldBank.records.every(row => row.value === null || Number.isFinite(row.value)))
assert(worldBank.records.every(row => row.status === (row.value === null ? 'missing' : 'observed')))
assert(worldBank.records.some(row => row.value === null))
for (const code of wdiCodes) {
  const source = worldBank.sources.find(item => item.code === code)!
  const rows = worldBank.records.filter(row => row.code === code)
  assert.equal(rows.length, wdiCountries.length * 66, `${code} 年度行数错误`)
  assert.equal(source.rows, rows.length)
  assert.equal(source.nonNull, rows.filter(row => row.value !== null).length)
  assert.match(source.sha256 ?? '', /^[0-9a-f]{64}$/)
  if (code.startsWith('GC.')) {
    assert.equal(source.sourceId, 2)
    assert(source.unit.includes('IMF GFS'))
    assert(rows.some(row => row.value !== null), `${code} 没有任何已发布观测`)
    assert(rows.some(row => row.value === null), `${code} 缺少真实空值，需复核源覆盖变化`)
  }
  for (const iso of wdiCountries) {
    const years = rows.filter(row => row.iso === iso).map(row => row.year).sort((a, b) => a - b)
    assert.deepEqual(years, Array.from({ length: 66 }, (_, index) => 1960 + index), `${iso} ${code} 年份不连续`)
  }
}
for (const code of wgiCodes) {
  const source = worldBank.sources.find(item => item.code === code)!
  const rows = worldBank.records.filter(row => row.code === code)
  assert.equal(source.sourceId, 3)
  assert.equal(source.updated, '2026-09-25')
  assert.equal(source.rows, wdiCountries.length * wgiYears.length)
  assert.equal(source.nonNull, rows.filter(row => row.value !== null).length)
  assert.match(source.sha256 ?? '', /^[0-9a-f]{64}$/)
  for (const iso of wdiCountries) {
    const years = rows.filter(row => row.iso === iso).map(row => row.year).sort((a, b) => a - b)
    assert.deepEqual(years, wgiYears, `${iso} ${code} 年份不符合 WGI 发布范围`)
  }
  assert(rows.every(row => row.status === (row.value === null ? 'missing' : 'observed')))
  if (code.endsWith('.SE')) assert(rows.every(row => row.value === null || row.value >= 0))
}
// 修改（2026-10-25）：P1-3 扩 12 国，WGI 键空间 12 代码 × 12 国 × 27 年 = 3888。
assert.equal(worldBank.records.filter(row => wgiCodes.includes(row.code)).length, 3888)
assert.equal(worldBank.records.filter(row => wgiCodes.includes(row.code) && [1997, 1999, 2001].includes(row.year)).length, 0)
assert.equal(worldBank.records.filter(row => wgiCodes.includes(row.code) && row.year === 2025).length, 144)
assert.equal(worldBank.records.filter(row => wgiCodes.includes(row.code) && row.year === 2024 && row.value !== null).length, 144)
// 修改（2026-10-25）：wgiSeriesFor 单国六维时间序列取数：八国 × 六维 × 27 点，年份与发布年表一致，EST/SE 非空且 EST 落在 −2.5～+2.5。
const expectedWgiDimCodes = wgiCodes.filter(code => code.endsWith('.EST')).map(code => code.replace('GOV_WGI_', '').replace('.EST', ''))
for (const iso of wdiCountries) {
  const single = wgiSeriesFor(worldBank, iso)
  assert.equal(single.length, 6)
  assert.deepEqual(single.map(item => item.code), expectedWgiDimCodes)
  for (const dimension of single) {
    assert.equal(dimension.points.length, wgiYears.length)
    assert.deepEqual(dimension.points.map(point => point.year), wgiYears)
    assert(dimension.points.every(point => point.estimate !== null && point.standardError !== null))
    assert(dimension.points.every(point => point.estimate === null || (point.estimate >= -2.5 && point.estimate <= 2.5)))
  }
}
// 修改（2026-10-25）：P1-3 扩 12 国——2025 年五项宏观指标十二国均已发布（60 个非空），两项 IMF GFS 财政比率尚未发布（24 键，保留 null）。
const wdiMacroCodes = ['NY.GDP.MKTP.CD', 'NY.GDP.PCAP.CD', 'SP.POP.TOTL', 'NY.GDP.MKTP.KD', 'NY.GDP.MKTP.KD.ZG']
assert.equal(worldBank.records.filter(row => wdiMacroCodes.includes(row.code) && row.year === 2025 && row.value !== null).length, 60)
assert.equal(worldBank.records.filter(row => ['GC.TAX.TOTL.GD.ZS', 'GC.REV.XGRT.GD.ZS'].includes(row.code) && row.year === 2025).length, 24)
assert.equal(worldBank.records.filter(row => ['GC.TAX.TOTL.GD.ZS', 'GC.REV.XGRT.GD.ZS'].includes(row.code) && row.year === 2025 && row.value !== null).length, 0)
assert.equal(worldBank.records.filter(row => row.iso === 'SUN').length, 0)
assert(worldBank.records.some(row => row.iso === 'CHN' && row.year === 1978 && row.code === 'NY.GDP.MKTP.KD.ZG' && row.value !== null))
for (const eiu of eiuObservations) {
  assert(worldBank.records.some(row => row.iso === eiu.iso && row.year === eiu.year && row.code === 'NY.GDP.PCAP.CD' && row.value !== null))
}
// 修改：V-Dem 保留原生量表、固定版 OWID 回填依据和有边界的苏联编码单元映射。
const vdem = parse<VdemDataset>('public/data/observations/vdem.json')
assert.equal(vdem.version, 'v16 (2026)')
assert.equal(vdem.license, 'CC BY-SA 4.0')
// 修改：逐行状态只说明 OWID 是否跨政权复制，不能据此推断现代国界直接观测。
assert.equal(vdem.processor, 'Our World in Data')
assert.match(vdem.note, /回填/)
assert.equal(vdem.owidEtl.verification, 'verified')
assert.equal(vdem.owidEtl.commit, '4ad0beba651dcdde8f2808be1a43e146e168b420')
assert.match(vdem.owidEtl.rulesUrl, /vdem\.countries_impute\.yml$/)
assert.match(vdem.owidEtl.rulesSha256, /^[0-9a-f]{64}$/)
assert.match(vdem.owidEtl.namesSha256, /^[0-9a-f]{64}$/)
assert.equal(vdem.owidEtl.issue, null)
assert.deepEqual([vdem.sovietMapping.targetIso, vdem.sovietMapping.sourceIso, vdem.sovietMapping.firstYear, vdem.sovietMapping.lastYear, vdem.sovietMapping.vdemCountryUnitId], ['SUN', 'RUS', 1923, 1990, 11])
assert.deepEqual(vdem.sources.map(source => source.code), vdemCodes)
assert(vdem.sources.every(source => source.url.startsWith('https://ourworldindata.org/grapher/') && /^[0-9a-f]{64}$/.test(source.sha256)))
// 修改（2026-10-25）：P1-3 扩 12 国——V-Dem 国家—年份 962 → 1376（韩/巴/南各 126 年，乌克兰 1990 起 36 年；1946—1989 回填已排除）。
assert.equal(vdem.records.length, 1376)
assert.equal(new Set(vdem.records.map(row => `${row.iso}-${row.year}`)).size, vdem.records.length)
assert(vdem.records.every(row => row.year >= 1900 && row.year <= 2025 && row.sourceEntity.length > 0 && row.owidImputationStatus === 'not_imputed' && vdemCodes.every(code => row.values[code] === null || (row.values[code] >= 0 && row.values[code] <= 1))))
assert.equal(typeof vdemFor(vdem, 'DEU', 1932)?.values.v2x_polyarchy, 'number')
assert.equal(typeof vdemFor(vdem, 'DEU', 1938)?.values.v2x_polyarchy, 'number')
assert.equal(typeof vdemFor(vdem, 'CHN', 1966)?.values.v2x_polyarchy, 'number')
// 新增（2026-11-06）：V-Dem 长序列须与 vdemFor 口径一致，且 SUN/RUS 互不串用。
{
  const sun = vdemSeriesFor(vdem, 'SUN', 'v2x_polyarchy')
  assert.deepEqual([sun[0]?.year, sun[sun.length - 1]?.year], [1923, 1990], 'SUN 序列年份应为 1923—1990')
  assert(sun.every(point => point.status === 'not_imputed'), 'SUN 序列不得含回填行')
  assert(!vdemSeriesFor(vdem, 'RUS', 'v2x_polyarchy').some(point => point.year >= 1923 && point.year <= 1990), 'RUS 序列不得含 1923—1990')
  const deu = vdemSeriesFor(vdem, 'DEU', 'v2x_polyarchy')
  assert(deu.length > 0 && deu.length <= 126, 'DEU 序列年份应在 1900—2025 内')
  for (const point of deu) assert.equal(point.value, vdemFor(vdem, 'DEU', point.year)?.values.v2x_polyarchy)
}
assert.equal(typeof vdemFor(vdem, 'SUN', 1937)?.values.v2x_polyarchy, 'number')
assert.equal(vdemFor(vdem, 'SUN', 1937)?.iso, 'RUS')
assert.equal(vdemFor(vdem, 'RUS', 1937), undefined)
assert.equal(vdemFor(vdem, 'SUN', 1922), undefined)
assert.equal(vdemFor(vdem, 'SUN', 1991), undefined)
assert.equal(vdemFor(vdem, 'DEU', 1966), undefined)
assert(eiuObservations.every(row => vdemCodes.every(code => typeof vdemFor(vdem, row.iso, row.year)?.values[code] === 'number')))
// 修改（2026-10-25）：V-Dem 2025——十二国均有当年记录，且五指数全为 0—1 数值。
assert.equal(vdem.records.filter(row => row.year === 2025).length, 12)
assert.deepEqual(vdem.records.filter(row => row.year === 2025).map(row => row.iso).sort(), [...wdiCountries].sort())
assert(vdem.records.filter(row => row.year === 2025).every(row => vdemCodes.every(code => typeof row.values[code] === 'number' && row.values[code]! >= 0 && row.values[code]! <= 1)))
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
console.log(`PASS：年份与缺失值回归；${manifest.snapshots.length} 个边界快照哈希；${eiuObservations.length} 国 EIU；${vdem.records.length} 条 V-Dem 五指数；${worldBank.records.length} 条世界银行记录；${nmc.records.length} 条 NMC 国力；${Object.keys(strategicCoding).length} 组 S/W 编码。`)
