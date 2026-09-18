import { findSource } from './sourceCatalog'

const numberOrNull = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const number = Number(String(value).trim())
  return Number.isFinite(number) ? number : null
}

const textOrNull = (value) => {
  const text = value === null || value === undefined ? '' : String(value).trim()
  return text || null
}

export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (char === ',' && !quoted) { row.push(cell); cell = ''; continue }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(cell); rows.push(row); row = []; cell = ''; continue
    }
    cell += char
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const headers = (rows.shift() || []).map((header) => header.trim())
  return rows.filter((values) => values.some((value) => value.trim())).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])))
}

export function parseImportText(text, fileName = '') {
  const trimmed = text.trim()
  if (fileName.toLowerCase().endsWith('.csv') || trimmed.startsWith('country,')) return parseCsv(trimmed)
  const parsed = JSON.parse(trimmed)
  return Array.isArray(parsed) ? parsed : parsed.records || parsed.data || []
}

export function normalizeRecord(raw, context = {}) {
  const sourceId = textOrNull(raw.sourceId || context.sourceId)
  const source = findSource(sourceId)
  const year = numberOrNull(raw.year)
  const longitude = numberOrNull(raw.longitude ?? raw.lon ?? raw.lng)
  const latitude = numberOrNull(raw.latitude ?? raw.lat)
  const id = textOrNull(raw.id) || `${raw.iso || raw.country}-${year}`
  const dri = Object.fromEntries(['competition', 'pluralism', 'liberties', 'ruleOfLaw', 'checks', 'participation', 'localDemocracy', 'inclusion'].map((key) => [key, numberOrNull(raw[`dri_${key}`])]))
  const capacity = Object.fromEntries(['administration', 'fiscal', 'law', 'integrity', 'services'].map((key) => [key, numberOrNull(raw[`capacity_${key}`])]))
  // 修改：国力 pp 改由 NMC + ppCoding 统一合成，导入字段不再提供 power/pp。
  return {
    id, country: textOrNull(raw.country), iso: textOrNull(raw.iso), regime: textOrNull(raw.regime), leader: textOrNull(raw.leader), year, coords: longitude !== null && latitude !== null ? [longitude, latitude] : null,
    dri, capacity, events: [], evidence: {}, sources: source ? [source] : [], sourceId, source, sourceVersion: textOrNull(raw.sourceVersion || context.sourceVersion), retrievedAt: textOrNull(raw.retrievedAt || context.retrievedAt), observationStatus: textOrNull(raw.observationStatus) || 'imported',
  }
}

export function validateRecord(record) {
  const errors = []
  if (!record.country) errors.push('缺少 country')
  if (!record.iso) errors.push('缺少 iso')
  if (!Number.isInteger(record.year)) errors.push('year 必须是整数')
  if (!record.sourceId || !record.source) errors.push('缺少可核验 sourceId')
  if (!record.sourceVersion) errors.push('缺少 sourceVersion')
  if (!record.retrievedAt) errors.push('缺少 retrievedAt')
  return errors
}

export function importRecords(rawRecords, context = {}) {
  const records = rawRecords.map((raw) => normalizeRecord(raw, context))
  const rejected = records.map((record, index) => ({ index, id: record.id, errors: validateRecord(record) })).filter((item) => item.errors.length)
  return { records: records.filter((record) => validateRecord(record).length === 0), rejected }
}
