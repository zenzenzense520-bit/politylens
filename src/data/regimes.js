export const driDimensions = [
  { key: 'competition', label: '政治竞争', short: '竞争', weight: 18 },
  { key: 'pluralism', label: '政治多元', short: '多元', weight: 12 },
  { key: 'liberties', label: '公民自由', short: '自由', weight: 15 },
  { key: 'ruleOfLaw', label: '法治与司法', short: '法治', weight: 15 },
  { key: 'checks', label: '权力制衡', short: '制衡', weight: 12 },
  { key: 'participation', label: '政治参与', short: '参与', weight: 10 },
  { key: 'localDemocracy', label: '基层民主', short: '基层', weight: 8 },
  { key: 'inclusion', label: '政治包容', short: '包容', weight: 10 },
]

export const capacityDimensions = [
  { key: 'administration', label: '行政执行力' },
  { key: 'fiscal', label: '财政汲取能力' },
  { key: 'law', label: '法治能力' },
  { key: 'integrity', label: '廉政程度' },
  { key: 'services', label: '公共服务' },
]

const source = (name, url) => ({ name, url, role: '方法参考' })
const evidence = (claim, rationale, confidence = '中') => ({ claim, rationale, confidence, status: '合成占位值，未发布' })

export const regimes = [
  {
    id: 'china-1966', country: '中国', regime: '中华人民共和国', leader: '毛泽东时期', year: 1966, iso: 'CHN', coords: [104, 35], color: '#e6a45c',
    dri: { competition: 1.2, pluralism: 1.0, liberties: 1.8, ruleOfLaw: 1.5, checks: 1.2, participation: 8.3, localDemocracy: 2.4, inclusion: 4.0 },
    capacity: { administration: 6.7, fiscal: 5.1, law: 2.7, integrity: 3.0, services: 4.2 },
    events: [{ year: 1954, title: '制度建立', text: '新国家制度与组织体系成形。' }, { year: 1966, title: '文化大革命', text: '群众动员能力上升，制度约束与公民自由显著承压。' }, { year: 1978, title: '改革开放', text: '国家能力与经济结构开始重组。' }],
    evidence: {
      competition: evidence('一党执政，执政权不存在开放竞逐。', '政治参与与政治竞争在本模型中分开计量。', '高'),
      participation: evidence('群众政治动员广泛存在。', '参与度反映动员和政治介入，不代表轮替可能。', '中'),
      checks: evidence('行政与政治运动对制度制衡形成强压。', '权力制衡维度关注可持续、可执行的约束机制。', '中'),
    },
    sources: [source('V-Dem 方法说明', 'https://www.v-dem.net/about/v-dem-project/methodology/'), source('World Bank WGI', 'https://www.worldbank.org/en/publication/worldwide-governance-indicators')],
  },
  {
    id: 'china-1995', country: '中国', regime: '中华人民共和国', leader: '改革开放时期', year: 1995, iso: 'CHN', coords: [104, 35], color: '#f0b06d',
    dri: { competition: 1.8, pluralism: 1.6, liberties: 3.1, ruleOfLaw: 4.3, checks: 2.0, participation: 4.8, localDemocracy: 3.2, inclusion: 4.7 },
    capacity: { administration: 7.8, fiscal: 6.9, law: 5.2, integrity: 4.5, services: 6.3 },
    events: [{ year: 1978, title: '改革开放', text: '经济治理和对外联系进入新阶段。' }, { year: 1992, title: '市场化加速', text: '经济能力与行政执行结构发生变化。' }],
    evidence: { ruleOfLaw: evidence('正式法律体系扩张，司法独立和权力约束仍有限。', '将法制建设与司法自主拆开观察。', '中') },
    sources: [source('World Bank WGI', 'https://www.worldbank.org/en/publication/worldwide-governance-indicators'), source('COW NMC', 'https://correlatesofwar.org/data-sets/national-material-capabilities/')],
  },
  {
    id: 'ussr-1937', country: '苏联', regime: '苏联', leader: '斯大林时期', year: 1937, iso: 'RUS', coords: [90, 60], color: '#d96b5f',
    dri: { competition: 0.8, pluralism: 0.6, liberties: 0.7, ruleOfLaw: 0.9, checks: 0.7, participation: 7.4, localDemocracy: 2.0, inclusion: 3.6 },
    capacity: { administration: 8.8, fiscal: 7.7, law: 2.0, integrity: 2.6, services: 5.3 },
    events: [{ year: 1928, title: '五年计划', text: '工业动员与国家汲取能力提升。' }, { year: 1937, title: '大清洗', text: '政治控制增强，法治与自由急剧下降。' }, { year: 1941, title: '全面战争', text: '军事动员能力进入极高水平。' }],
    evidence: { administration: evidence('行政动员与计划执行能力很强。', '能力维度与权利维度独立记录。', '中'), liberties: evidence('政治压制和强制性治理显著。', '公民自由不因国家动员能力而获得补偿。', '高') },
    sources: [source('COW NMC', 'https://correlatesofwar.org/data-sets/national-material-capabilities/')],
  },
  {
    id: 'germany-1932', country: '德国', regime: '魏玛共和国', leader: '魏玛时期', year: 1932, iso: 'DEU', coords: [10, 51], color: '#69b9a7',
    dri: { competition: 7.4, pluralism: 7.0, liberties: 6.6, ruleOfLaw: 6.5, checks: 6.2, participation: 7.2, localDemocracy: 6.8, inclusion: 5.6 },
    capacity: { administration: 6.7, fiscal: 6.0, law: 6.3, integrity: 5.4, services: 6.8 },
    events: [{ year: 1919, title: '魏玛宪法', text: '议会民主制度建立。' }, { year: 1929, title: '大萧条', text: '经济危机削弱制度稳定性。' }, { year: 1933, title: '权力转折', text: '制度竞争空间在短时间内急剧收缩。' }],
    evidence: { competition: evidence('多党竞争存在，但极化与危机削弱轮替稳定性。', '不是把“有选举”直接等同于高分。', '高') },
    sources: [source('V-Dem 方法说明', 'https://www.v-dem.net/about/v-dem-project/methodology/')],
  },
  {
    id: 'germany-1938', country: '德国', regime: '纳粹德国', leader: '希特勒时期', year: 1938, iso: 'DEU', coords: [10, 51], color: '#d96b5f',
    dri: { competition: 0.2, pluralism: 0.1, liberties: 0.3, ruleOfLaw: 0.2, checks: 0.2, participation: 6.7, localDemocracy: 0.5, inclusion: 0.8 },
    capacity: { administration: 8.0, fiscal: 7.5, law: 2.4, integrity: 2.0, services: 6.0 },
    events: [{ year: 1933, title: '授权法', text: '议会制衡被架空，竞争与自由下降。' }, { year: 1938, title: '扩张与动员', text: '军事、工业和行政动员能力高企。' }],
    evidence: { competition: evidence('独立反对党与公开竞逐被禁止。', '竞争项只观察执政权竞争，不把动员算作竞争。', '高'), participation: evidence('国家组织和群众动员覆盖广泛。', '动员强度不等于政治选择权。', '中') },
    sources: [source('V-Dem 方法说明', 'https://www.v-dem.net/about/v-dem-project/methodology/'), source('COW NMC', 'https://correlatesofwar.org/data-sets/national-material-capabilities/')],
  },
  {
    id: 'japan-1925', country: '日本', regime: '大正民主余波', leader: '大正末期', year: 1925, iso: 'JPN', coords: [138, 36], color: '#69b9a7',
    dri: { competition: 6.4, pluralism: 5.8, liberties: 4.8, ruleOfLaw: 5.2, checks: 4.9, participation: 6.0, localDemocracy: 4.7, inclusion: 3.8 },
    capacity: { administration: 7.2, fiscal: 6.8, law: 5.7, integrity: 5.0, services: 6.2 },
    events: [{ year: 1925, title: '普选扩展', text: '男性普选扩大参与基础，同时压制性法律并存。' }, { year: 1931, title: '军部上升', text: '文官制衡开始显著承压。' }],
    evidence: { liberties: evidence('选举参与扩大，但公共自由并非同步扩张。', '参与、竞争、自由保持分项。', '中') },
    sources: [source('V-Dem 方法说明', 'https://www.v-dem.net/about/v-dem-project/methodology/')],
  },
  {
    id: 'usa-2020', country: '美国', regime: '美国', leader: '联邦共和制', year: 2020, iso: 'USA', coords: [-100, 38], color: '#73c4d3',
    dri: { competition: 8.2, pluralism: 8.0, liberties: 7.4, ruleOfLaw: 7.5, checks: 7.8, participation: 6.9, localDemocracy: 7.0, inclusion: 7.3 },
    capacity: { administration: 7.1, fiscal: 8.4, law: 7.4, integrity: 5.9, services: 7.5 },
    events: [{ year: 1965, title: '权利扩展', text: '公民权利制度继续扩展。' }, { year: 2020, title: '极化加剧', text: '竞争仍然存在，但制度信任和政治包容承压。' }],
    evidence: { checks: evidence('行政、立法、司法之间存在可执行的制衡机制。', '本指标关注约束是否实际运作，而不只看宪法文本。', '中') },
    sources: [source('V-Dem 方法说明', 'https://www.v-dem.net/about/v-dem-project/methodology/'), source('World Bank WGI', 'https://www.worldbank.org/en/publication/worldwide-governance-indicators')],
  },
]

export const presets = {
  liberal: { label: '自由主义民主', weights: { competition: 14, pluralism: 10, liberties: 21, ruleOfLaw: 20, checks: 18, participation: 6, localDemocracy: 4, inclusion: 7 } },
  participatory: { label: '参与式民主', weights: { competition: 10, pluralism: 12, liberties: 12, ruleOfLaw: 10, checks: 8, participation: 22, localDemocracy: 16, inclusion: 10 } },
  electoral: { label: '选举民主', weights: { competition: 28, pluralism: 18, liberties: 12, ruleOfLaw: 10, checks: 10, participation: 10, localDemocracy: 4, inclusion: 8 } },
}
