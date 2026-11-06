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
  { id: 'KOR-2024', leader: '尹锡悦（总统）；韩德洙（总理，2024 年 12 月戒严弹劾后代理总统）', sourceName: 'Wikipedia：List of state leaders in 2024', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_2024', retrievedAt: '2026-10-25' },
  { id: 'BRA-2024', leader: '卢拉（总统）；阿尔克明（副总统）', sourceName: 'Wikipedia：List of state leaders in 2024', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_2024', retrievedAt: '2026-10-25' },
  { id: 'ZAF-2024', leader: '拉马福萨（总统，2024 年 5 月大选后连任）', sourceName: 'Wikipedia：List of state leaders in 2024', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_2024', retrievedAt: '2026-10-25' },
  { id: 'UKR-2024', leader: '泽连斯基（总统，战时任期延长）；什梅加尔（总理）', sourceName: 'Wikipedia：List of state leaders in 2024', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_2024', retrievedAt: '2026-10-25' },
  // 新增（2026-11-06）：十二国 2000、2010、2020 年快照领导人。任期取自 Wikipedia 各年代列表页的起止日期（scripts/data/leaders-candidates.mjs 抽取后人工核对）；
  // 凡该年发生更替者完整列出，不以当前领导人回填；美国 2020 沿用 usa-2020。
  { id: 'CHN-2000', leader: '江泽民（中共中央总书记、国家主席）；朱镕基（国务院总理）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'USA-2000', leader: '比尔·克林顿（总统）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'DEU-2000', leader: '约翰内斯·劳（总统）；格哈德·施罗德（总理）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'JPN-2000', leader: '明仁天皇；小渊惠三、森喜朗（年内首相更替，青木干雄曾代理首相）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'GBR-2000', leader: '伊丽莎白二世；托尼·布莱尔（首相）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'FRA-2000', leader: '雅克·希拉克（总统）；利昂内尔·若斯潘（总理）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'IND-2000', leader: 'K·R·纳拉亚南（总统）；阿塔尔·比哈里·瓦杰帕伊（总理）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'RUS-2000', leader: '弗拉基米尔·普京（代总统，2000 年起任总统；1999—2000 年曾任总理）；米哈伊尔·卡西扬诺夫（总理，2000 年起）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'KOR-2000', leader: '金大中（总统）；金钟泌、朴泰俊、李汉东（年内总理更替）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'BRA-2000', leader: '费尔南多·恩里克·卡多佐（总统）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'ZAF-2000', leader: '塔博·姆贝基（总统）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'UKR-2000', leader: '列昂尼德·库奇马（总统）；维克托·尤先科（总理，1999—2001）', sourceName: 'Wikipedia：List of state leaders in the 2000s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2000s', retrievedAt: '2026-11-06' },
  { id: 'CHN-2010', leader: '胡锦涛（中共中央总书记、国家主席）；温家宝（国务院总理）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'USA-2010', leader: '巴拉克·奥巴马（总统）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'DEU-2010', leader: '霍斯特·克勒、克里斯蒂安·武尔夫（总统，年内更替）；安格拉·默克尔（总理）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'JPN-2010', leader: '明仁天皇；鸠山由纪夫、菅直人（年内首相更替）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'GBR-2010', leader: '伊丽莎白二世；戈登·布朗、戴维·卡梅伦（年内首相更替）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'FRA-2010', leader: '尼古拉·萨科齐（总统）；弗朗索瓦·菲永（总理）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'IND-2010', leader: '普拉蒂巴·帕蒂尔（总统）；曼莫汉·辛格（总理）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'RUS-2010', leader: '德米特里·梅德韦杰夫（总统）；弗拉基米尔·普京（总理）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'KOR-2010', leader: '李明博（总统）；郑云灿、金滉植（年内总理更替，尹增铉曾代理总理）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'BRA-2010', leader: '卢拉（总统）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'ZAF-2010', leader: '雅各布·祖马（总统）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'UKR-2010', leader: '维克托·尤先科、维克托·亚努科维奇（总统，年内更替）；尤利娅·季莫申科、米科拉·阿扎罗夫（年内总理更替，图尔奇诺夫曾代理总理）', sourceName: 'Wikipedia：List of state leaders in the 2010s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2010s', retrievedAt: '2026-11-06' },
  { id: 'CHN-2020', leader: '习近平（中共中央总书记、国家主席）；李克强（国务院总理）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
  { id: 'JPN-2020', leader: '德仁天皇；安倍晋三、菅义伟（年内首相更替）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
  { id: 'GBR-2020', leader: '伊丽莎白二世；鲍里斯·约翰逊（首相）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
  { id: 'FRA-2020', leader: '埃马纽埃尔·马克龙（总统）；爱德华·菲利普、让·卡斯泰（年内总理更替）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
  { id: 'DEU-2020', leader: '弗兰克-瓦尔特·施泰因迈尔（总统）；安格拉·默克尔（总理）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
  { id: 'IND-2020', leader: '拉姆·纳特·科温德（总统）；纳伦德拉·莫迪（总理）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
  { id: 'RUS-2020', leader: '弗拉基米尔·普京（总统）；梅德韦杰夫、米舒斯京（年内总理更替，别洛乌索夫曾代理总理）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
  { id: 'KOR-2020', leader: '文在寅（总统）；李洛渊、丁世均（年内总理更替）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
  { id: 'BRA-2020', leader: '雅伊尔·博索纳罗（总统）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
  { id: 'ZAF-2020', leader: '西里尔·拉马福萨（总统）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
  { id: 'UKR-2020', leader: '沃洛迪米尔·泽连斯基（总统）；奥列克西·冈察鲁克、杰尼斯·什米加尔（年内总理更替）', sourceName: 'Wikipedia：List of state leaders in the 2020s', sourceUrl: 'https://en.wikipedia.org/wiki/List_of_state_leaders_in_the_2020s', retrievedAt: '2026-11-06' },
]

export function leaderFor(id: string): LeaderRecord | undefined {
  return leaderRecords.find(record => record.id === id)
}
