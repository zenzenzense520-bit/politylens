// 2026-11-06：从 Wikipedia “List of state leaders in the YYYYs” 逐国抽取带起止日期的任职条目，
// 对目标年份给出“年内在任者”候选，供人工核对后写入 src/data/leaders.ts。本脚本只产出候选，不修改任何数据文件。
// 用法：node scripts/data/leaders-candidates.mjs 2020 2010 2000
import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const UA = 'PolityLens data sync (https://github.com/zenzenzense520-bit/politylens)'
const countries = ['China', 'United States', 'Japan', 'Germany', 'United Kingdom', 'France', 'India', 'Russia', 'South Korea', 'Brazil', 'South Africa', 'Ukraine']
const months = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 }
const pageFor = year => year >= 2020 ? 'List_of_state_leaders_in_the_2020s' : year >= 2010 ? 'List_of_state_leaders_in_the_2010s' : 'List_of_state_leaders_in_the_2000s'

function api(params) {
  // 经 curl 请求：Node 内置 fetch 在本机访问维基百科时偶发连接被重置。
  const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  return JSON.parse(execFileSync('curl.exe', ['-s', '-m', '90', '-A', UA, url], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8'))
}

function parseDate(text, fallbackEnd) {
  const full = text.match(/(\d{1,2}) (\w+) (\d{4})/)
  if (full && months[full[2]] !== undefined) return Date.UTC(Number(full[3]), months[full[2]], Number(full[1]))
  const monthYear = text.match(/(\w+) (\d{4})/)
  if (monthYear && months[monthYear[1]] !== undefined) return Date.UTC(Number(monthYear[2]), months[monthYear[1]], fallbackEnd ? 28 : 1)
  const yearOnly = text.match(/(\d{4})/)
  return yearOnly ? Date.UTC(Number(yearOnly[1]), fallbackEnd ? 11 : 0, fallbackEnd ? 31 : 1) : NaN
}

// 条目格式：[[Name]], role (start – end) 或 (start – end, start – end) 或 (since start)
function parseEntries(block) {
  const entries = []
  let section = ''
  for (const raw of block.split('\n')) {
    // 先判断是否为“人名, 职务 (起止)”条目；不是条目且形如 :*[[...]] 的行才视为职务分组标题。
    const isEntry = /^:+\*\s*\[\[(?:[^|\]]*\|)?[^\]]+\]\](?:\{\{[^}]*\}\})?,?\s*[^()]*\(/.test(raw.replace(/<ref[\s\S]*?<\/ref>/g, ''))
    if (!isEntry && /^:\*\[\[/.test(raw)) { section = raw.replace(/<ref[\s\S]*?<\/ref>|<ref[^>]*\/>/g, '').replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1'); continue }
    const line = raw.replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/<ref[^>]*\/>/g, '')
    const match = line.match(/^:+\*\s*\[\[(?:[^|\]]*\|)?([^\]]+)\]\](?:\{\{[^}]*\}\})?,?\s*([^()]*?)\s*\((.*)\)\s*$/)
    if (!match) continue
    const ranges = []
    for (const part of match[3].split(/,(?=\s*(?:since|\d))/)) {
      const bits = part.split(/\s+[–\-‒—]\s+/)
      const sinceOnly = /^\s*since/.test(part)
      const start = parseDate(sinceOnly ? part : bits[0], false)
      const end = sinceOnly || bits.length < 2 ? Date.UTC(2100, 0, 1) : parseDate(bits[1], true)
      if (!Number.isNaN(start) && !Number.isNaN(end)) ranges.push([start, end])
    }
    entries.push({ name: match[1], role: match[2].replace(/,$/, ''), group: section.trim(), ranges, text: match[3] })
  }
  return entries
}

const years = process.argv.slice(2).map(Number)
if (years.length === 0) { console.error('请提供年份'); process.exit(1) }
const result = {}
for (const page of new Set(years.map(pageFor))) {
  const sections = api({ action: 'parse', page, prop: 'sections' }).parse.sections.filter(item => item.level === '3' && /^(Africa|Americas|Asia|Europe): /.test(item.line))
  for (const section of sections) {
    const wikitext = api({ action: 'parse', page, prop: 'wikitext', section: section.index }).parse.wikitext
    const blocks = wikitext.split(/\n(?=\*\{\{flagdeco\|)/).slice(1)
    for (const block of blocks) {
      const title = block.match(/^\*(?:\{\{flagdeco\|[^}]*\}\})+(?:<!--[\s\S]*?-->)?\s*\[\[([^\]|]+)/)?.[1]
      if (!title || !countries.includes(title)) continue
      const entries = parseEntries(block)
      for (const year of years.filter(item => pageFor(item) === page)) {
        const from = Date.UTC(year, 0, 1); const to = Date.UTC(year, 11, 31)
        const inOffice = entries.filter(entry => entry.ranges.some(([start, end]) => start <= to && end >= from))
        ;(result[title] ??= {})[year] = { page, entries: inOffice.map(entry => ({ name: entry.name, role: entry.role, group: entry.group, text: entry.text })) }
      }
    }
  }
}
mkdirSync('logs', { recursive: true })
writeFileSync('logs/leaders-candidates.json', JSON.stringify(result, null, 2), 'utf8')
for (const [country, byYear] of Object.entries(result)) for (const [year, value] of Object.entries(byYear)) {
  console.log(`${country} ${year}: ${value.entries.map(entry => `${entry.name}（${entry.role}，${entry.text}）`).join('；')}`)
}
