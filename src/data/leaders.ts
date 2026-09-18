// 修改：领导人按政权—年份记录；同年发生更替时完整列出，不以当前领导人回填历史。
export interface LeaderRecord {
  id: string
  leader: string
  sourceName: string
  sourceUrl: string
  retrievedAt: string
}

export const leaderRecords: LeaderRecord[] = [
  { id: 'china-1966', leader: '毛泽东（中共中央主席）；刘少奇（国家主席）', sourceName: 'Wikipedia：1966 in China / PRC leaders', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_leaders_of_the_People%27s_Republic_of_China', retrievedAt: '2026-09-18' },
  { id: 'china-1995', leader: '江泽民（中共中央总书记、国家主席）', sourceName: 'Wikipedia：List of leaders of the PRC', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_leaders_of_the_People%27s_Republic_of_China', retrievedAt: '2026-09-18' },
  { id: 'ussr-1937', leader: '约瑟夫·斯大林（联共（布）中央总书记）', sourceName: 'Wikipedia：List of leaders of the Soviet Union', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_leaders_of_the_Soviet_Union', retrievedAt: '2026-09-18' },
  { id: 'germany-1932', leader: '保罗·冯·兴登堡（总统）；勃吕宁、冯·巴本、施莱歇尔（年内总理更替）', sourceName: 'Wikipedia：1932 in Germany', sourceUrl: 'https://en.wikipedia.org/wiki/1932_in_Germany', retrievedAt: '2026-09-18' },
  { id: 'germany-1938', leader: '阿道夫·希特勒（元首兼帝国总理）', sourceName: 'Wikipedia：1938 in Germany', sourceUrl: 'https://en.wikipedia.org/wiki/1938_in_Germany', retrievedAt: '2026-09-18' },
  { id: 'japan-1925', leader: '大正天皇；裕仁（摄政）；加藤高明（首相）', sourceName: 'Wikipedia：1925 in Japan', sourceUrl: 'https://en.wikipedia.org/wiki/1925_in_Japan', retrievedAt: '2026-09-18' },
  { id: 'usa-2020', leader: '唐纳德·特朗普（总统）', sourceName: 'Wikipedia：2020 in the United States', sourceUrl: 'https://en.wikipedia.org/wiki/2020_in_the_United_States', retrievedAt: '2026-09-18' },
  { id: 'CHN-2024', leader: '习近平（中共中央总书记、国家主席）；李强（国务院总理）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-09-18' },
  { id: 'USA-2024', leader: '乔·拜登（总统）', sourceName: 'Wikipedia：List of state leaders in 2024', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_2024', retrievedAt: '2026-09-18' },
  { id: 'DEU-2024', leader: '弗兰克-瓦尔特·施泰因迈尔（总统）；奥拉夫·朔尔茨（总理）', sourceName: 'Wikipedia：List of state leaders in 2024', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_2024', retrievedAt: '2026-09-18' },
  { id: 'JPN-2024', leader: '德仁天皇；岸田文雄、石破茂（年内首相更替）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-09-18' },
  { id: 'GBR-2024', leader: '查尔斯三世；里希·苏纳克、基尔·斯塔默（年内首相更替）', sourceName: 'Wikipedia：List of state leaders in 2024', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_2024', retrievedAt: '2026-09-18' },
  { id: 'FRA-2024', leader: '埃马纽埃尔·马克龙（总统）；阿塔尔、巴尼耶、贝鲁（年内总理更替）', sourceName: 'Wikipedia：List of state leaders in 2024', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_2024', retrievedAt: '2026-09-18' },
  { id: 'IND-2024', leader: '德劳帕迪·穆尔穆（总统）；纳伦德拉·莫迪（总理）', sourceName: 'Wikipedia：List of state leaders in 2024', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_2024', retrievedAt: '2026-09-18' },
  { id: 'RUS-2024', leader: '弗拉基米尔·普京（总统）；米哈伊尔·米舒斯京（总理）', sourceName: 'Wikipedia：List of state leaders in 2024', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_2024', retrievedAt: '2026-09-18' },
]

export function leaderFor(id: string): LeaderRecord | undefined {
  return leaderRecords.find(record => record.id === id)
}
