// 修改：保留上游原始文件，生成带来源字段和已审计东亚归属修正的应用图层。
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '../..')
const boundaryDir = path.join(root, 'public/data/historical-basemaps')
const rawDir = path.join(boundaryDir, 'raw')
const correctedDir = path.join(boundaryDir, 'corrected')
const rawManifest = JSON.parse(await readFile(path.join(boundaryDir, 'raw-manifest.json'), 'utf8'))
await mkdir(correctedDir, { recursive: true })

const parseRaw = async year => JSON.parse(await readFile(path.join(rawDir, `world_${year}.geojson`), 'utf8'))
const references = {
  manchukuo: 'https://artsandculture.google.com/entity/manchukuo/m0fctx?hl=en',
  qing: 'https://en.wikipedia.org/wiki/Qing_dynasty',
  xinjiang: 'https://en.wikipedia.org/wiki/Xinjiang_under_Qing_rule',
  tibet1965: 'https://en.wikipedia.org/wiki/Tibet_Autonomous_Region',
}

function rememberSource(feature) {
  const source = { ...feature.properties }
  feature.properties = {
    ...source,
    SOURCE_NAME: source.NAME ?? '',
    SOURCE_SUBJECTO: source.SUBJECTO ?? '',
    SOURCE_PARTOF: source.PARTOF ?? '',
    DISPLAY_NAME: source.NAME ?? '未命名区域',
    LEADER: '待补充',
    ADMIN_STATUS: '沿用上游属性，尚未完成独立逐国考证',
    CORRECTION_SOURCE: '',
  }
}

function setIdentity(feature, { name, subject = name, partOf = subject, leader = '待补充', status, source }) {
  feature.properties.NAME = name
  feature.properties.ABBREVN = name
  feature.properties.SUBJECTO = subject
  feature.properties.PARTOF = partOf
  feature.properties.DISPLAY_NAME = name
  feature.properties.LEADER = leader
  feature.properties.ADMIN_STATUS = status
  feature.properties.CORRECTION_SOURCE = source
}

function findFeature(geo, name) {
  return geo.features.find(feature => feature.properties.NAME === name)
}

function polygonBox(polygon) {
  const points = polygon.flat()
  const xs = points.map(point => point[0])
  const ys = points.map(point => point[1])
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
}

function cloneFeature(feature) {
  return structuredClone(feature)
}

function add1938ManchukuoAndKorea(geo, manchuria1930, korea1945) {
  const japan = findFeature(geo, 'Empire of Japan')
  if (!japan || japan.geometry.type !== 'MultiPolygon') throw new Error('1938 年日本要素结构异常')
  const before = japan.geometry.coordinates.length
  japan.geometry.coordinates = japan.geometry.coordinates.filter(polygon => {
    const box = polygonBox(polygon)
    return !(box.minX < 116 && box.maxX > 134 && box.minY < 35 && box.maxY > 53)
  })
  if (japan.geometry.coordinates.length !== before - 1) throw new Error('1938 年日本/满洲复合面识别失败')
  japan.properties.ADMIN_STATUS = '日本本土及当时直接管辖区域'
  japan.properties.CORRECTION_SOURCE = references.manchukuo

  const manchukuo = cloneFeature(manchuria1930)
  rememberSource(manchukuo)
  setIdentity(manchukuo, {
    name: 'Manchukuo', subject: 'Manchukuo', partOf: 'Northeast China', leader: '溥仪（康德皇帝）',
    status: '1932—1945 年日本实际控制的傀儡政权', source: references.manchukuo,
  })
  geo.features.push(manchukuo)

  const korea = {
    type: 'Feature',
    properties: {
      NAME: 'Korea under Japanese rule', ABBREVN: 'Korea', SUBJECTO: 'Empire of Japan', PARTOF: 'Korea',
      BORDERPRECISION: 2, SOURCE_NAME: 'Korea (USSR) + Korea (USA), 1945 reference geometry',
      SOURCE_SUBJECTO: 'USSR + USA', SOURCE_PARTOF: 'Korea', DISPLAY_NAME: 'Korea under Japanese rule',
      LEADER: '裕仁（昭和天皇）', ADMIN_STATUS: '1910—1945 年日本统治下的朝鲜；用 1945 年南北几何合成显示',
      CORRECTION_SOURCE: 'https://en.wikipedia.org/wiki/Korea_under_Japanese_rule',
    },
    geometry: { type: 'MultiPolygon', coordinates: korea1945.flatMap(feature => feature.geometry.coordinates) },
  }
  geo.features.push(korea)
}

const raw1930 = await parseRaw(1930)
const raw1945 = await parseRaw(1945)
const manchuria1930 = findFeature(raw1930, 'Manchuria')
const korea1945 = raw1945.features.filter(feature => ['Korea (USSR)', 'Korea (USA)'].includes(feature.properties.NAME))
if (!manchuria1930 || korea1945.length !== 2) throw new Error('修正参考几何缺失')

const correctedSnapshots = []
for (const snapshot of rawManifest.snapshots) {
  const year = snapshot.year
  const geo = await parseRaw(year)
  geo.features.forEach(rememberSource)

  const manchu = geo.features.find(feature => feature.properties.SOURCE_NAME === 'Manchu Empire')
  if (manchu && year === 1900) setIdentity(manchu, {
    name: 'Qing Empire', subject: 'Qing Empire', partOf: 'China', leader: '光绪帝；慈禧太后（实际最高权力者）',
    status: '清朝；将上游族称 Manchu Empire 改为正式政权名 Qing Empire', source: references.qing,
  })
  if (manchu && year >= 1912) setIdentity(manchu, {
    name: 'China', subject: 'China', partOf: 'China', leader: year === 1914 ? '袁世凯（大总统）' : '待补充',
    status: '中华民国；上游在清朝结束后仍沿用 Manchu Empire，现按年份纠正', source: references.qing,
  })

  const xinjiang = geo.features.find(feature => feature.properties.SOURCE_NAME === 'Xinjiang')
  if (xinjiang) setIdentity(xinjiang, {
    name: 'China · Xinjiang', subject: 'China', partOf: 'China',
    leader: year <= 1914 ? '中华民国中央政府；地方主政者杨增新' : year <= 1928 ? '地方主政者杨增新' : year <= 1944 ? '地方主政者盛世才' : '中华民国政府',
    status: '中国新疆；1884 年建省。保留区域面以表达边疆行政范围，归属字段统一为 China', source: references.xinjiang,
  })

  const tibet = geo.features.find(feature => feature.properties.SOURCE_NAME === 'Tibet')
  if (tibet && year >= 1960) setIdentity(tibet, {
    name: 'China · Tibet', subject: 'China', partOf: 'China', leader: '毛泽东（中共中央主席）',
    status: '中国西藏；1965 年成立西藏自治区。1966 年视图使用本 1960 快照时仍明确归属 China', source: references.tibet1965,
  })

  const manchuria = geo.features.find(feature => feature.properties.SOURCE_NAME === 'Manchuria')
  if (manchuria && year !== 1930) setIdentity(manchuria, {
    name: 'China · Manchuria', subject: 'China', partOf: 'China', leader: year === 1945 ? '中华民国政府（战后接收阶段）' : '待补充',
    status: '中国东北；未标作日本帝国领土', source: references.manchukuo,
  })

  if (year === 1938) add1938ManchukuoAndKorea(geo, manchuria1930, korea1945)

  const json = `${JSON.stringify(geo)}\n`
  const filename = `world_${year}.geojson`
  await writeFile(path.join(correctedDir, filename), json)
  correctedSnapshots.push({
    year, filename, features: geo.features.length,
    sha256: createHash('sha256').update(json).digest('hex'),
    corrections: geo.features.filter(feature => feature.properties.CORRECTION_SOURCE).length,
  })
  console.log(`已生成修正版 ${year}：${geo.features.length} 个区域，${correctedSnapshots.at(-1).corrections} 条修正`)
}

await writeFile(path.join(boundaryDir, 'manifest.json'), `${JSON.stringify({
  revision: rawManifest.revision,
  retrievedAt: rawManifest.retrievedAt,
  generatedAt: new Date().toISOString(),
  source: rawManifest.source,
  policy: '原始文件保存在 raw/；应用读取 corrected/。修正字段保留 SOURCE_* 和 CORRECTION_SOURCE。',
  references,
  rawSnapshots: rawManifest.snapshots,
  snapshots: correctedSnapshots,
}, null, 2)}\n`)
