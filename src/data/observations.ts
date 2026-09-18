// 修改：真实观测保持来源原始尺度，不填充自定义 DRI/CAP/NCI 的空白。
export interface EiuObservation {
  iso: string; year: number; score: number; rank: number; page: number;
  dimensions: [number, number, number, number, number];
}
export const eiuSource = {
  name: 'EIU Democracy Index 2024', version: '2024（2025 年发布）', retrievedAt: '2026-09-18',
  url: 'https://www.eiu.com/n/campaigns/democracy-index-2024/',
  report: 'https://rulesofactivism.com/wp-content/uploads/2025/03/Democracy-Index-2024.pdf',
  note: 'EIU 原版报告的第三方镜像；人工核验表 2 的八国摘录。保留原始五维，不映射为八维 DRI。',
}
export const eiuDimensions = ['选举与多元化', '政府运作', '政治参与', '政治文化', '公民自由']
export const eiuObservations: EiuObservation[] = [
  { iso: 'CHN', year: 2024, score: 2.11, rank: 145, page: 20, dimensions: [0, 3.21, 3.33, 3.13, 0.88] },
  { iso: 'USA', year: 2024, score: 7.85, rank: 28, page: 16, dimensions: [9.17, 6.43, 8.89, 6.25, 8.53] },
  { iso: 'DEU', year: 2024, score: 8.73, rank: 13, page: 15, dimensions: [9.58, 8.21, 8.33, 8.13, 9.41] },
  { iso: 'JPN', year: 2024, score: 8.48, rank: 16, page: 15, dimensions: [9.58, 8.93, 6.67, 8.13, 9.12] },
  { iso: 'GBR', year: 2024, score: 8.34, rank: 17, page: 15, dimensions: [9.58, 7.50, 8.33, 6.88, 9.41] },
  { iso: 'FRA', year: 2024, score: 7.99, rank: 26, page: 16, dimensions: [9.58, 7.50, 7.78, 6.88, 8.24] },
  { iso: 'IND', year: 2024, score: 7.29, rank: 41, page: 16, dimensions: [8.67, 7.50, 7.22, 6.88, 6.18] },
  { iso: 'RUS', year: 2024, score: 2.03, rank: 150, page: 20, dimensions: [0, 2.14, 2.22, 3.75, 2.06] },
]
export interface Country { iso: string; country: string; coords: [number, number] }
export const countries: Country[] = [
  { iso: 'CHN', country: '中国', coords: [104, 35] }, { iso: 'USA', country: '美国', coords: [-100, 38] },
  { iso: 'DEU', country: '德国', coords: [10, 51] }, { iso: 'JPN', country: '日本', coords: [138, 36] },
  { iso: 'GBR', country: '英国', coords: [-2, 54] }, { iso: 'FRA', country: '法国', coords: [2, 47] },
  { iso: 'IND', country: '印度', coords: [79, 22] }, { iso: 'RUS', country: '俄罗斯', coords: [90, 60] },
]
export interface WorldBankSource { code: string; label: string; unit: string; url: string; updated: string; sourceId: number }
export interface WorldBankRecord { iso: string; year: number; code: string; value: number | null; status: string; decimal: number }
export interface WorldBankDataset { publisher: string; retrievedAt: string; sources: WorldBankSource[]; records: WorldBankRecord[] }
export function eiuFor(iso: string, year: number): EiuObservation | undefined {
  return eiuObservations.find(row => row.iso === iso && row.year === year)
}
export const whitePaper = {
  title: '《中国的民主》', publisher: '国务院新闻办公室', publishedAt: '2021-12-04',
  url: 'https://www.spp.gov.cn/spp/zdgz/202112/t20211204_537860.shtml',
  sections: [
    { title: '制度安排', text: '白皮书阐述人民代表大会制度、中国共产党领导的多党合作和政治协商制度，以及基层群众自治等制度。', section: '二、具有科学有效的制度安排' },
    { title: '民主实践', text: '文件从选举、协商、决策、管理、监督五个环节说明全过程人民民主的运行方式。', section: '三、具有具体现实的民主实践' },
    { title: '评价视角', text: '文件强调人民参与、利益表达、国家治理和权力监督；这些是官方对制度的表述，不能直接转换为跨国评分。', section: '四、具有广泛真实管用的民主' },
  ],
}
