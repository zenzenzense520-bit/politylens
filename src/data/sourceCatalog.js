export const sourceCatalog = [
  {
    id: 'eiu-democracy-index',
    title: 'Democracy Index',
    publisher: 'Economist Intelligence Unit',
    url: 'https://www.eiu.com/n/campaigns/democracy-index-2024/',
    scope: '五大类、60 项指标；国家/年份民主测量',
    access: '官方说明页公开；详细数据需遵守 EIU 获取与使用条款',
    allowedFor: ['dri'],
  },
  {
    id: 'china-democracy-white-paper-2021',
    title: '中国的民主',
    publisher: '中华人民共和国国务院新闻办公室',
    url: 'https://www.gov.cn/zhengce/2021-12/04/content_5655880.htm',
    scope: '中国民主制度与实践的官方政策文本',
    access: '官方公开文本；不作为跨国可比数值数据源',
    allowedFor: ['evidence'],
  },
  {
    id: 'v-dem',
    title: 'V-Dem Dataset and Methodology',
    publisher: 'Varieties of Democracy Institute',
    url: 'https://www.v-dem.net/data/the-v-dem-dataset/',
    scope: '选举、自由、参与、协商和平等多种民主原则的历史测量',
    // 修改：回填判定锚定 OWID 规则版本，并与历史边界口径分开。
    access: 'v16 五个指数经 OWID 处理后筛选八国 1900—2024 年；逐条按固定版本的 OWID 跨政权回填规则判定，未回填不等于现代国界；CC BY-SA 4.0 署名共享',
    allowedFor: ['raw'],
  },
  {
    id: 'world-bank-wgi',
    title: 'Worldwide Governance Indicators',
    publisher: 'World Bank',
    url: 'https://www.worldbank.org/en/publication/worldwide-governance-indicators',
    scope: '政府效能、法治、腐败控制等治理维度',
    access: '按 World Bank 数据使用条款和版本说明使用',
    allowedFor: ['capacity'],
  },
  {
    id: 'cow-nmc',
    title: 'National Material Capabilities',
    publisher: 'Correlates of War Project',
    url: 'https://correlatesofwar.org/data-sets/national-material-capabilities/',
    scope: '人口、城市人口、钢铁、能源、军费和军人等物质能力变量',
    access: '按数据集说明和许可使用；不直接等同于 21 世纪综合国力',
    allowedFor: ['power'],
  },
  {
    id: 'world-bank-api',
    title: 'World Bank Indicators API',
    publisher: 'World Bank',
    url: 'https://data.worldbank.org/',
    scope: '八国 1960—2024 年现价与不变价 GDP、人均 GDP、实际增长率和人口',
    // 修改：年度 WDI 摘录保留 API 空值与来源，不把未接入的其他世界银行指标写成已接入。
    access: 'WDI API 年度摘录；保留指标代码、年份、缺失值和来源哈希；CC BY 4.0',
    allowedFor: ['raw'],
  },
  {
    id: 'historical-basemaps',
    title: 'Historical basemaps',
    publisher: 'aourednik',
    url: 'https://github.com/aourednik/historical-basemaps',
    scope: '全球国家与文化区域的历史 GeoJSON 边界参考',
    access: 'GPL-3.0；上游明确要求使用前与其他来源交叉核验',
    allowedFor: ['historical-boundary'],
  },
  {
    id: 'cliopatria',
    title: 'ClioPatria',
    publisher: 'Seshat Global History Databank',
    url: 'https://github.com/Seshat-Global-History-Databank/cliopatria',
    scope: '公元前 3400 年至 2024 年的政治实体、实控几何、面积、有效时段、Wikipedia、Wikidata 与 Seshat ID',
    access: 'CC BY 4.0；本项目筛选 1900—2024 并声明殖民地、傀儡政权与实控口径的派生修改',
    allowedFor: ['historical-boundary', 'humanities', 'political-entity'],
  },
]

export function findSource(sourceId) {
  return sourceCatalog.find((source) => source.id === sourceId) || null
}
