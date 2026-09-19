import { readFileSync } from 'node:fs'

interface Properties {
  Name: string
  FromYear: number
  ToYear: number
  Area: number
  Type: 'POLITY' | 'RELATION'
  Wikipedia: string
  Wikidata: string
  SeshatID: string
  Components: string
  MemberOf: string
}

interface Feature {
  type: 'Feature'
  properties: Properties
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown }
}

interface FeatureCollection {
  type: 'FeatureCollection'
  features: Feature[]
}

const input = process.argv[2]
if (!input) throw new Error('缺少 ClioPatria GeoJSON 路径')
const data = JSON.parse(readFileSync(input, 'utf8')) as FeatureCollection
if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('ClioPatria 文件结构无效')

const targetYears = [1900, 1914, 1920, 1925, 1930, 1932, 1937, 1938, 1945, 1960, 1966, 1994, 1995, 2000, 2010, 2020, 2024]
const relationCounts = new Map<string, number>()
for (const feature of data.features) {
  const relation = feature.properties.MemberOf.trim()
  if (relation) relationCounts.set(relation, (relationCounts.get(relation) ?? 0) + 1)
}
const samples = data.features.filter(feature => {
  const value = `${feature.properties.Name} ${feature.properties.MemberOf} ${feature.properties.Components}`
  return /(colony|colonial|british|french|portuguese|dutch|manchu|manchukuo|tibet|xinjiang|kashmir|taiwan)/i.test(value)
}).slice(0, 120).map(feature => feature.properties)
const activeRelations = Object.fromEntries([1900, 1938, 1941, 1966, 2024].map(year => [year, data.features
  .filter(feature => feature.properties.FromYear <= year && feature.properties.ToYear >= year)
  .filter(feature => feature.properties.MemberOf || /^\(.+\)$/.test(feature.properties.Name) || /(Manchu|Manchukuo|Mengjiang|Tibet|Xinjiang|Kashmir|Taiwan)/i.test(feature.properties.Name))
  .map(feature => feature.properties)]))
const matchedEntities = data.features
  .filter(feature => /(China|Chinese|Qing|Manchu|Manchukuo|Manchuria|Japan|Mengjiang|Tibet|Xinjiang|Taiwan|Kashmir|occupied territor)/i.test(feature.properties.Name))
  .map(feature => feature.properties)

console.log(JSON.stringify({
  total: data.features.length,
  entities: new Set(data.features.map(feature => feature.properties.Name)).size,
  types: Object.fromEntries(['POLITY', 'RELATION'].map(type => [type, data.features.filter(feature => feature.properties.Type === type).length])),
  years: Object.fromEntries(targetYears.map(year => [year, data.features.filter(feature => feature.properties.FromYear <= year && feature.properties.ToYear >= year).length])),
  topMemberOf: [...relationCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40),
  activeRelations,
  matchedEntities,
  samples,
}, null, 2))
