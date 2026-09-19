import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { leaderFor } from '../../src/data/leaders'

type Geometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown }
interface SourceProperties {
  Name: string; FromYear: number; ToYear: number; Area: number; Type: 'POLITY' | 'RELATION'
  Wikipedia: string; Wikidata: string; SeshatID: string; Components: string; MemberOf: string
}
interface SourceFeature { type: 'Feature'; properties: SourceProperties; geometry: Geometry }
interface SourceCollection { type: 'FeatureCollection'; name?: string; features: SourceFeature[] }
interface OutputProperties extends SourceProperties {
  DISPLAY_NAME: string; ADMIN_NAME: string; TERRITORIAL_STATUS: TerritorialStatus
  TERRITORIAL_STATUS_ZH: string; POLICY_NOTE: string; SOURCE_NAME: string
  WIKIPEDIA_URL: string; WIKIDATA_URL: string; SESHAT_URL: string; DATA_SOURCE: string
  LEADER: string; LEADER_SOURCE_URL: string
}
interface OutputFeature { type: 'Feature'; properties: OutputProperties; geometry: Geometry }
type TerritorialStatus = 'sovereign' | 'metropole' | 'colony' | 'puppet' | 'de_facto_control' | 'relation_member'
type Position = [number, number]

const targetYears = [1900, 1914, 1919, 1920, 1925, 1928, 1929, 1930, 1931, 1932, 1933, 1937, 1938, 1941, 1945, 1954, 1960, 1965, 1966, 1978, 1992, 1994, 1995, 2000, 2010, 2020, 2024]
const sourceCommit = 'ad28a691b7c07c1fca89d0e0636d324667d2a258'
const sourceUrl = 'https://github.com/Seshat-Global-History-Databank/cliopatria'
const input = process.argv[2]
if (!input) throw new Error('缺少 ClioPatria GeoJSON 路径')
const root = path.resolve(process.cwd())
const outputDir = path.join(root, 'public/data/cliopatria')
const snapshotDir = path.join(outputDir, 'snapshots')
if (!snapshotDir.startsWith(`${outputDir}${path.sep}`)) throw new Error('快照目录越出输出目录')
rmSync(snapshotDir, { recursive: true, force: true })
mkdirSync(snapshotDir, { recursive: true })

const inputBuffer = readFileSync(input)
const source = JSON.parse(inputBuffer.toString('utf8')) as SourceCollection
if (source.type !== 'FeatureCollection' || !Array.isArray(source.features)) throw new Error('ClioPatria 文件结构无效')

const colonialOwners = new Map<string, { owner: string; homes: string[] }>([
  ['British Empire', { owner: 'British Empire', homes: ['Kingdom of Great Britain'] }],
  ['French Third Republic', { owner: 'French Third Republic', homes: ['French Third Republic'] }],
  ['French Fourth Republic', { owner: 'French Fourth Republic', homes: ['French Fourth Republic'] }],
  ['Vichy France', { owner: 'Vichy France', homes: ['Vichy France'] }],
  ['Netherlands', { owner: 'Netherlands', homes: ['Netherlands'] }],
  ['Spanish Empire', { owner: 'Spanish Empire', homes: ['Kingdom of Spain'] }],
  ['Portuguese Empire', { owner: 'Portuguese Empire', homes: ['Kingdom of Portugal', 'Portuguese Empire'] }],
  ['Second French Empire', { owner: 'Second French Empire', homes: ['Second French Empire'] }],
])
const statusLabels: Record<TerritorialStatus, string> = {
  sovereign: '独立政治实体', metropole: '宗主国本土', colony: '殖民地（计入宗主国）', puppet: '傀儡政权（不计入控制国）',
  de_facto_control: '争议地区（按实控计入）', relation_member: '复合政治关系成员',
}
// 修改：复用界面已核验的 15 个国家—年份领导人记录，避免地图面与图标信息不一致。
const leaderIds = new Map<string, string>([
  ['1966:People\'s Republic of China', 'china-1966'], ['1995:People\'s Republic of China', 'china-1995'],
  ['1937:Union of Soviet Socialist Republics', 'ussr-1937'], ['1932:Weimar Republic', 'germany-1932'],
  ['1938:Nazi Germany', 'germany-1938'], ['1925:Empire of Japan', 'japan-1925'],
  ['2020:United States of America', 'usa-2020'], ['2024:People\'s Republic of China', 'CHN-2024'],
  ['2024:United States of America', 'USA-2024'], ['2024:Federated Republic of Germany', 'DEU-2024'],
  ['2024:Japan', 'JPN-2024'], ['2024:United Kingdom', 'GBR-2024'],
  ['2024:French Fifth Republic', 'FRA-2024'], ['2024:Republic of India', 'IND-2024'],
  ['2024:Russian Federation', 'RUS-2024'],
])

function cleanComposite(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith('(') && trimmed.endsWith(')') ? trimmed.slice(1, -1) : trimmed
}

function wikiUrl(phrase: string): string {
  return phrase ? `https://en.wikipedia.org/wiki/${encodeURIComponent(phrase.replaceAll(' ', '_'))}` : ''
}

function ringContains(point: Position, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j]
    const crosses = (yi > point[1]) !== (yj > point[1]) && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    if (crosses) inside = !inside
  }
  return inside
}

function geometryContains(point: Position, geometry: Geometry): boolean {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates as Position[][]] : geometry.coordinates as Position[][][]
  return polygons.some(polygon => ringContains(point, polygon[0]) && !polygon.slice(1).some(hole => ringContains(point, hole)))
}

function leaderFields(year: number, adminName: string): { LEADER: string; LEADER_SOURCE_URL: string } {
  const leader = leaderFor(leaderIds.get(`${year}:${adminName}`) ?? '')
  return { LEADER: leader?.leader ?? '领导人资料待补充', LEADER_SOURCE_URL: leader?.sourceUrl ?? '' }
}

function transform(feature: SourceFeature, year: number): OutputFeature {
  const sourceName = feature.properties.Name
  const parentName = cleanComposite(feature.properties.MemberOf)
  let adminName = sourceName === 'Qing Dynasty' ? 'Qing Empire' : sourceName
  let displayName = adminName
  let territorialStatus: TerritorialStatus = 'sovereign'
  let policyNote = '按 ClioPatria 目标年份记录的实际控制几何显示'
  const colonial = colonialOwners.get(parentName)
  if (colonial) {
    adminName = colonial.owner
    territorialStatus = colonial.homes.includes(sourceName) ? 'metropole' : 'colony'
    displayName = sourceName === colonial.owner ? colonial.owner : `${colonial.owner} · ${sourceName}`
    policyNote = territorialStatus === 'colony' ? '殖民地按本项目口径计入宗主国领土' : '宗主国本土'
  } else if (sourceName === 'British Overseas Territories') {
    adminName = 'United Kingdom'
    displayName = `United Kingdom · ${sourceName}`
    territorialStatus = 'colony'
    policyNote = '海外领地按本项目口径计入英国领土'
  } else if (sourceName === 'Russian-occupied territories') {
    adminName = 'Russian Federation'
    displayName = `Russian Federation · ${sourceName}`
    territorialStatus = 'de_facto_control'
    policyNote = '争议地区按 ClioPatria 记录的目标年份实际控制计入俄罗斯'
  } else if (parentName) {
    territorialStatus = 'relation_member'
    policyNote = `ClioPatria 复合关系成员：${parentName}；未自动推断为殖民地`
  }
  const properties: OutputProperties = {
    ...feature.properties, Name: adminName, DISPLAY_NAME: displayName, ADMIN_NAME: adminName,
    TERRITORIAL_STATUS: territorialStatus, TERRITORIAL_STATUS_ZH: statusLabels[territorialStatus],
    POLICY_NOTE: policyNote, SOURCE_NAME: sourceName, WIKIPEDIA_URL: wikiUrl(feature.properties.Wikipedia),
    WIKIDATA_URL: feature.properties.Wikidata ? `https://www.wikidata.org/wiki/${feature.properties.Wikidata}` : '',
    SESHAT_URL: feature.properties.SeshatID ? `https://seshat-db.com/core/polity/${feature.properties.SeshatID}` : '',
    DATA_SOURCE: `ClioPatria ${sourceCommit.slice(0, 8)}`, ...leaderFields(year, adminName),
  }
  return { type: 'Feature', properties, geometry: feature.geometry }
}

const manchukuoReference = JSON.parse(readFileSync(path.join(root, 'public/data/historical-basemaps/corrected/world_1938.geojson'), 'utf8')) as { features: Array<{ properties: { DISPLAY_NAME?: string }; geometry: Geometry }> }
const manchukuoGeometry = manchukuoReference.features.find(feature => feature.properties.DISPLAY_NAME === 'Manchukuo')?.geometry
if (!manchukuoGeometry) throw new Error('缺少满洲国参考几何')

function manchukuo(year: number): OutputFeature {
  const properties: OutputProperties = {
    Name: 'Manchukuo', FromYear: 1932, ToYear: 1945, Area: 0, Type: 'POLITY', Wikipedia: 'Manchukuo', Wikidata: 'Q172579',
    SeshatID: '', Components: '', MemberOf: '', DISPLAY_NAME: 'Manchukuo', ADMIN_NAME: 'Manchukuo', TERRITORIAL_STATUS: 'puppet',
    TERRITORIAL_STATUS_ZH: statusLabels.puppet, POLICY_NOTE: `${year} 年作为日本实际控制的傀儡政权单列，不计入日本帝国分析主体；几何采用 1930 东北参考面`,
    SOURCE_NAME: 'Manchukuo', WIKIPEDIA_URL: wikiUrl('Manchukuo'), WIKIDATA_URL: 'https://www.wikidata.org/wiki/Q172579',
    SESHAT_URL: '', DATA_SOURCE: 'ClioPatria + PolityLens audited overlay', ...leaderFields(year, 'Manchukuo'),
  }
  return { type: 'Feature', properties, geometry: structuredClone(manchukuoGeometry) }
}

interface AuditedReferenceFeature { properties: { SOURCE_NAME?: string }; geometry: Geometry }
function auditedGeometry(referenceYear: number, sourceName: string): Geometry {
  const referencePath = path.join(root, `public/data/historical-basemaps/corrected/world_${referenceYear}.geojson`)
  const reference = JSON.parse(readFileSync(referencePath, 'utf8')) as { features: AuditedReferenceFeature[] }
  const geometry = reference.features.find(feature => feature.properties.SOURCE_NAME === sourceName)?.geometry
  if (!geometry) throw new Error(`${referenceYear} 年参考底图缺少 ${sourceName} 几何`)
  return geometry
}

const xinjiangGeometry = auditedGeometry(1945, 'Xinjiang')
const tibetGeometry = auditedGeometry(1960, 'Tibet')

function chinaAdmin(year: number): string {
  if (year <= 1911) return 'Qing Empire'
  if (year <= 1949) return 'Republic of China'
  return "People's Republic of China"
}

function chinaOverlay(year: number, region: 'Xinjiang' | 'Tibet', geometry: Geometry): OutputFeature {
  const adminName = chinaAdmin(year)
  const wikidata = region === 'Xinjiang' ? 'Q34800' : 'Q17252'
  const properties: OutputProperties = {
    Name: adminName, FromYear: year, ToYear: year, Area: 0, Type: 'POLITY', Wikipedia: region, Wikidata: wikidata,
    SeshatID: '', Components: '', MemberOf: '', DISPLAY_NAME: `${adminName} · ${region}`, ADMIN_NAME: adminName,
    TERRITORIAL_STATUS: 'sovereign', TERRITORIAL_STATUS_ZH: statusLabels.sovereign,
    POLICY_NOTE: `${region} 按项目审校规则归入中国；原始目标年份面未覆盖参考点，采用 historical-basemaps 已审校区域面补足`,
    SOURCE_NAME: `${region} (audited overlay)`, WIKIPEDIA_URL: wikiUrl(region),
    WIKIDATA_URL: `https://www.wikidata.org/wiki/${wikidata}`, SESHAT_URL: '',
    DATA_SOURCE: 'ClioPatria + historical-basemaps audited overlay', ...leaderFields(year, adminName),
  }
  return { type: 'Feature', properties, geometry: structuredClone(geometry) }
}

function ensureAuditedChinaRegions(year: number, features: OutputFeature[]): void {
  const chinese = (): OutputFeature[] => features.filter(feature => feature.properties.ADMIN_NAME === chinaAdmin(year))
  if (!chinese().some(feature => geometryContains([85, 42], feature.geometry))) {
    features.push(chinaOverlay(year, 'Xinjiang', xinjiangGeometry))
  }
  if (year === 1966 && !chinese().some(feature => geometryContains([91, 31], feature.geometry))) {
    features.push(chinaOverlay(year, 'Tibet', tibetGeometry))
  }
}

const snapshots: Array<{ year: number; filename: string; features: number; sha256: string }> = []
for (const year of targetYears) {
  const features = source.features
    .filter(feature => feature.properties.Type === 'POLITY')
    .filter(feature => feature.properties.FromYear <= year && feature.properties.ToYear >= year)
    .filter(feature => !/^\(.+\)$/.test(feature.properties.Name))
    .filter(feature => ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type))
    .map(feature => transform(feature, year))
  if (year >= 1932 && year <= 1945) features.push(manchukuo(year))
  ensureAuditedChinaRegions(year, features)
  const collection = { type: 'FeatureCollection', name: `PolityLens_ClioPatria_${year}`, features }
  const json = `${JSON.stringify(collection)}\n`
  const decade = `${Math.floor(year / 10) * 10}s`
  const filename = `${decade}/world_${year}.geojson`
  mkdirSync(path.join(snapshotDir, decade), { recursive: true })
  writeFileSync(path.join(snapshotDir, filename), json)
  snapshots.push({ year, filename, features: features.length, sha256: createHash('sha256').update(json).digest('hex') })
  console.log(`已生成 ClioPatria ${year}：${features.length} 个实控政治要素`)
}

const entityRecords = source.features
  .filter(feature => feature.properties.ToYear >= 1900 && feature.properties.FromYear <= 2024)
  .map(feature => feature.properties)
writeFileSync(path.join(outputDir, 'entities.json'), `${JSON.stringify({ source: sourceUrl, sourceCommit, period: [1900, 2024], records: entityRecords }, null, 2)}\n`)
const manifest = {
  source: sourceUrl, sourceCommit, sourceName: source.name ?? 'cliopatria', retrievedAt: new Date().toISOString(),
  license: 'CC BY 4.0', sourceSha256: createHash('sha256').update(inputBuffer).digest('hex'),
  policyVersion: '2026-09-19', policy: '殖民地计入宗主国；傀儡政权单列；争议地区按目标年份实控；复合关系不自动视为殖民。', snapshots,
}
writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`完成：${snapshots.length} 个年份，${entityRecords.length} 条 1900—2024 人文政治时段记录`)
