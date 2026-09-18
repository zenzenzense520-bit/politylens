<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark"><span></span><span></span><span></span></div>
        <div><div class="brand-name">POLITY<span>LENS</span></div><div class="brand-sub">政权多维分析平台 / BETA</div></div>
      </div>
      <div class="top-meta"><span class="status-dot"></span> 来源可追溯 · 缺失不计分 <span class="divider"></span> 1900—2024 <button class="icon-button" @click="showMethod = true">ⓘ</button></div>
    </header>

    <main class="workspace">
      <aside class="sidebar panel">
        <div class="panel-heading"><div><span class="eyebrow">01 / SAMPLE SET</span><h2>政权—年份</h2></div><span class="count-badge">{{ allRegimes.length }}</span></div>
        <div class="search-box"><span>⌕</span><input v-model="search" placeholder="搜索国家或政权" /></div>
        <div class="filter-row"><button :class="{ active: activeFilter === 'all' }" @click="activeFilter = 'all'">全部</button><button :class="{ active: activeFilter === 'democracy' }" @click="activeFilter = 'democracy'">已有 EIU</button><button :class="{ active: activeFilter === 'capacity' }" @click="activeFilter = 'capacity'">历史档案</button></div>
        <div class="import-tools"><input ref="importFile" type="file" accept=".csv,.json,application/json,text/csv" hidden @change="importFileData" /><button @click="$refs.importFile.click()">＋ 导入真实数据</button><small>CSV / JSON · 必须带来源版本</small><small v-if="importMessage" class="import-message">{{ importMessage }}</small></div>
        <div class="regime-list">
          <button v-for="item in filteredRegimes" :key="item.id" class="regime-item" :class="{ selected: current.id === item.id }" @click="selectRegime(item)">
            <span class="country-dot" :style="{ background: item.color }"></span><span class="regime-copy"><strong>{{ item.country }}</strong><small>{{ item.regime }} · {{ item.year }}</small></span><span class="regime-score">{{ observedValue(item, "eiu") === null ? "—" : observedValue(item, "eiu").toFixed(2) }}<small>EIU</small></span>
          </button>
        </div>
        <div class="sidebar-footer"><span class="legend-line"></span><span>当前选中</span><span class="legend-ring"></span><span>对比集合</span></div>
      </aside>

      <section class="map-column">
        <div class="map-toolbar"><div><span class="eyebrow">GEOPOLITICAL FIELD</span><h1>制度结构，置于历史坐标中</h1></div><div class="map-controls"><span>地图年份</span><select aria-label="地图年份" v-model.number="historicalYear"><option v-for="year in mapYears" :key="year" :value="year">{{ year }}</option></select><label class="strict-toggle"><input type="checkbox" v-model="strictBoundaries" />仅限同年边界</label><span>图标着色</span><select aria-label="图标着色指标" v-model="mapMetric"><option value="eiu">EIU 原版评分</option><option value="dri">民主与权利</option><option value="capacity">国家能力</option><option value="pp">Pp 国力</option></select></div></div>
        <div class="map-stage panel">
          <div ref="arcgis" class="arcgis-container" aria-label="ArcGIS 世界底图"></div>
          <div class="map-overlay"><span class="map-provider">ARCGIS / HISTORICAL GEOJSON</span><span class="map-scale">图标 {{ historicalYear }} · 边界 {{ boundarySelection.snapshotYear === null ? "缺失" : boundarySelection.snapshotYear }}</span></div>
          <div class="boundary-notice" role="status">{{ boundaryStatus }}<small v-if="strictBoundaries">当前仅显示同年边界；关闭后可使用不晚于目标年的最近快照。</small><small v-else>缺少同年快照时使用不晚于目标年的最近快照，并明确标注参考年份；图标仍只显示 {{ historicalYear }} 年的 {{ mapRecords.length }} 个档案。</small></div><div class="map-legend"><span><i class="legend-swatch democratic"></i>高值</span><span><i class="legend-swatch authoritarian"></i>低值</span><span>灰色：无观测</span><span><i class="legend-swatch selected-swatch"></i>当前</span></div>
          <div class="map-crosshair">＋<span>0° / 0°</span></div>
        </div>
        <div class="map-footnote"><span>◉ {{ historicalYear }} 年图标 · 共 {{ mapRecords.length }} 条</span><span>边界来源：historical-basemaps · 修正字段与上游原始字段并存</span></div>
      </section>

      <aside class="inspector panel">
        <div class="inspector-header"><div><span class="eyebrow">02 / REGIME PROFILE</span><h2>{{ current.country }} <span>{{ current.year }}</span></h2><p>{{ current.regime }}</p><p class="leader-line"><b>领导人</b> {{ current.leader }} <a v-if="current.leaderSource" :href="current.leaderSource.url" target="_blank" rel="noopener noreferrer">来源 ↗</a></p></div><button class="compare-button" :class="{ active: compareIds.includes(current.id) }" @click="toggleCompare(current)">{{ compareIds.includes(current.id) ? '已加入比较' : '+ 加入比较' }}</button></div>
        <p v-if="current.year !== historicalYear" class="source-note">地图正在浏览 {{ historicalYear }} 年；右侧保留所选 {{ current.country }} {{ current.year }} 年档案，二者不是同年观测。</p><source-observations :iso="current.iso" :year="current.year" /><p class="source-note">以下为自定义模型：未建立可核验维度映射时留空，不用 EIU 或 GDP 自动代填。</p><div class="metric-strip"><div><small>DRI / 民主与权利</small><strong class="cyan">{{ score(current) }}</strong><em>/ 10</em></div><div><small>CAP / 国家能力</small><strong class="amber">{{ capacity(current) }}</strong><em>/ 10</em></div><div><small>Pp / 国力</small><strong class="mint">{{ ppResult.status === 'calculated' ? ppResult.value.toFixed(0) : '—' }}</strong><em>指数</em></div></div>
        <div class="chart-card" id="institution-chart"><div class="card-title"><span>{{ currentEiu ? "EIU 原版五维结构" : "DRI 八维结构（待补证）" }}</span><a v-if="currentEiu" :href="`https://rulesofactivism.com/wp-content/uploads/2025/03/Democracy-Index-2024.pdf#page=${currentEiu.page}`" target="_blank" rel="noopener noreferrer">↗ 原报告</a><button v-else @click="openEvidence('competition')">↗ 查看依据</button></div><div ref="radar" class="chart radar-chart"></div><div class="chart-caption"><span>{{ currentEiu ? "原报告五维，权重实验不改变 EIU" : "无已核验维度数据，暂不绘制雷达" }}</span></div></div>
        <div class="capacity-card"><div class="card-title"><span>国家能力 / CAP</span><span class="score-chip">{{ capacity(current) }} / 10</span></div><div v-for="dimension in capacityDimensions" :key="dimension.key" class="bar-row" @click="openEvidence(dimension.key)"><span>{{ dimension.label }}</span><div class="bar-track"><i :style="{ width: `${current.capacity[dimension.key] * 10}%` }"></i></div><b>{{ current.capacity[dimension.key] === null ? '—' : current.capacity[dimension.key].toFixed(1) }}</b></div></div>
        <div class="power-card"><div class="card-title"><span>国力五组件 / Pp</span><button @click="scrollToComparison">双轴比较 ↗</button></div><div class="power-grid"><div v-for="component in PP_COMPONENTS" :key="component.key" class="power-cell"><span>{{ component.short }} {{ component.label }}</span><strong>{{ currentPp[component.key] === null ? '—' : currentPp[component.key].toFixed(component.key === 'S' || component.key === 'W' ? 2 : 0) }}</strong><div class="mini-track"><i :style="{ width: `${(currentPp[component.key] || 0) / component.max * 100}%` }"></i></div></div></div><div class="pp-equation"><span>Pp 国力方程</span><strong v-if="ppResult.status === 'calculated'">{{ ppResult.value.toFixed(0) }}</strong><strong v-else>UNAVAILABLE</strong><small>Pp = (C + E + M) × (S + W)</small></div></div>
      </aside>
    </main>

    <section class="bottom-grid">
      <div class="timeline panel"><div class="panel-heading compact"><div><span class="eyebrow">03 / TIME MACHINE</span><h2>制度变化不是一条直线</h2></div><span class="year-display">{{ current.year }}</span></div><div class="timeline-track"><div class="timeline-line"></div><button v-for="event in current.events" :key="event.year" class="event-node" :style="{ left: eventPosition(event.year) }" @click="jumpEvent(event)"><span></span><small>{{ event.year }}</small><strong>{{ event.title }}</strong></button></div><div class="event-detail"><span class="event-kicker">{{ activeEvent.year }} / EVENT BREAK</span><strong>{{ activeEvent.title }}</strong><small>历史导航提示；不构成评分依据</small><p>{{ activeEvent.text }}</p></div></div>
      <div class="weight-lab panel"><div class="panel-heading compact"><div><span class="eyebrow">04 / THEORY LAB</span><h2>换一套民主理论</h2></div><span class="live-dot">LIVE</span></div><div class="preset-tabs"><button v-for="(preset, key) in presets" :key="key" :class="{ active: selectedPreset === key }" @click="applyPreset(key)">{{ preset.label }}</button></div><div class="weight-list"><label v-for="dimension in driDimensions" :key="dimension.key"><span>{{ dimension.short }}</span><input type="range" min="0" max="30" v-model.number="weights[dimension.key]" @input="selectedPreset = 'custom'" /><b>{{ weights[dimension.key] }}%</b></label></div><div class="weight-footer"><span>当前模型</span><strong>{{ modelLabel }}</strong><span class="weight-total" :class="{ warning: weightTotal !== 100 }">权重 {{ weightTotal }}%</span></div></div>
      <div class="comparison panel"><div class="panel-heading compact"><div><span class="eyebrow">05 / COMPARISON</span><h2>二维关系</h2></div><select aria-label="比较横轴" v-model="xAxis"><option value="eiu">EIU 原版指数</option><option value="gdpPerCapita">人均 GDP</option><option value="dri">民主与权利</option><option value="capacity">国家能力</option><option value="pp">Pp 国力</option></select></div><p class="source-note">仅比较地图年份 {{ historicalYear }} 的同年观测，缺失值不入图。</p><div ref="scatter" class="chart scatter-chart"></div><div class="axis-labels"><span>X · {{ axisLabel(xAxis) }}</span><label>Y · <select v-model="yAxis"><option value="gdpPerCapita">人均 GDP（美元）</option><option value="eiu">EIU 原版指数</option><option value="capacity">CAP（自定义）</option></select></label></div></div>
    </section>

    <div v-if="drawerOpen" class="drawer-backdrop" @click.self="drawerOpen = false"><aside class="evidence-drawer"><button class="close-button" @click="drawerOpen = false">×</button><span class="eyebrow">EVIDENCE CHAIN / SCORE → EVIDENCE</span><h2>{{ evidenceTitle }}</h2><div class="evidence-score">{{ evidenceValue }} <small>/ 10</small></div><div class="evidence-block"><span>原始事实</span><p>{{ currentEvidence.claim }}</p></div><div class="evidence-block"><span>模型解释</span><p>{{ currentEvidence.rationale }}</p></div><div class="evidence-block"><span>置信度</span><strong class="confidence-large">{{ currentEvidence.confidence }} · {{ currentEvidence.status }}</strong></div><div class="evidence-block"><span>方法参考（不支撑当前数值）</span><a v-for="item in current.sources" :key="item.name" :href="item.url" target="_blank">{{ item.name }} ↗</a></div><div class="disclaimer">原有演示评分已退出默认分析。真实观测请查看来源面板；自定义维度在完成独立证据映射前保留缺失，外部导入值不等于已获本平台核验。</div></aside></div>
    <div v-if="showMethod" class="modal-backdrop" @click.self="showMethod = false"><div class="method-modal"><button class="close-button" @click="showMethod = false">×</button><span class="eyebrow">ABOUT THE MODEL</span><h2>三个坐标，而不是一个总分</h2><p>PolityLens 将民主与权利、国家治理能力、综合国力拆开观察。每个指数都可以继续展开到维度、原始事实、来源和置信度，避免把价值判断伪装成单一排名。</p><div class="model-columns"><div><b>DRI</b><span>8 个制度与权利维度</span></div><div><b>CAP</b><span>5 个国家治理维度</span></div><div><b>NCI</b><span>7 个国力板块</span></div></div><button class="primary-button" @click="showMethod = false">返回分析台</button></div></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import SourceObservations from './components/SourceObservations.vue'
import { buildProfiles } from './data/profiles'
import { eiuFor, eiuDimensions } from './data/observations'
import { historicalYears, selectBoundary, metricColor } from './utils/historical'
import { loadWorldBank } from './api/worldBank'
import ArcGISMap from '@arcgis/core/Map.js'
import MapView from '@arcgis/core/views/MapView.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer.js'
import Graphic from '@arcgis/core/Graphic.js'
import Point from '@arcgis/core/geometry/Point.js'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol.js'
import { regimes as historicalRegimes, driDimensions, capacityDimensions, presets } from './data/regimes'
import { importRecords, parseImportText } from './data/importer'
import { driScore, capacityScore, axisValue } from './utils/scoring'
import { calculatePp, PP_COMPONENTS, PP_MAX_REFERENCE } from './utils/powerEquation'
import { codingFor } from './data/ppCoding'
import { loadNmc, nmcFor } from './api/nmc'

// 修改：真实观测与历史档案分层，选择记录时同步地图年份。
const regimes = buildProfiles(historicalRegimes)
export default {
  name: 'App',
  components: { SourceObservations },
  // 修改：将国力组件定义暴露给 Vue 2 模板，避免运行时未定义警告。
  data: () => ({ regimes, driDimensions, capacityDimensions, presets, historicalYears, PP_COMPONENTS, historicalYear: 1938, strictBoundaries: false, boundaryStatus: '正在初始化地图', boundaryRequest: 0, worldBank: null, nmc: null, current: regimes[4], importedRegimes: [], importMessage: '', importRejected: [], search: '', activeFilter: 'all', mapMetric: 'eiu', selectedPreset: 'liberal', weights: { ...presets.liberal.weights }, compareIds: ['germany-1938', 'germany-1932', 'china-1966', 'usa-2020'], xAxis: 'eiu', yAxis: 'gdpPerCapita', drawerOpen: false, evidenceKey: 'competition', showMethod: false, showComparison: false, activeEvent: regimes[4].events[0], charts: {}, arcgisView: null, arcgisMap: null, arcgisLayer: null, historicalLayer: null }),
  computed: {
    boundarySelection() { return selectBoundary(this.historicalYear, this.strictBoundaries) },
    mapYears() { return [...new Set([...this.historicalYears, ...this.allRegimes.map(item => item.year), ...this.current.events.map(event => event.year)])].sort((a, b) => a - b) },
    mapRecords() { return this.allRegimes.filter(item => item.year === this.historicalYear) },
    currentEiu() { return eiuFor(this.current.iso, this.current.year) },
    chartDimensions() { return this.currentEiu ? eiuDimensions.map((short, index) => ({ short, key: index })) : this.driDimensions },
    allRegimes() { return [...this.regimes, ...this.importedRegimes] },
    filteredRegimes() { return this.allRegimes.filter((item) => `${item.country}${item.regime}${item.year}`.toLowerCase().includes(this.search.toLowerCase())).filter((item) => this.activeFilter === 'all' || (this.activeFilter === 'democracy' ? Boolean(eiuFor(item.iso, item.year)) : item.year < 2024)) },
    weightTotal() { return Object.values(this.weights).reduce((sum, value) => sum + Number(value), 0) },
    modelLabel() { return this.selectedPreset === 'custom' ? '自定义权重' : this.presets[this.selectedPreset].label },
    currentEvidence() { return this.current.evidence[this.evidenceKey] || evidenceFallback(this.evidenceKey, this.current) },
    evidenceTitle() { return [...this.driDimensions, ...this.capacityDimensions].find((item) => item.key === this.evidenceKey)?.label || '指标依据' },
    evidenceValue() { return this.current.dri[this.evidenceKey] ?? this.current.capacity[this.evidenceKey] ?? '—' },
    currentPp() { return this.ppFor(this.current) },
    ppResult() { return calculatePp(this.currentPp) },
  },
  watch: { current() { this.refreshCharts(); this.refreshMap() }, weights: { deep: true, handler: 'refreshCharts' }, mapMetric: 'refreshMap', historicalYear() { this.refreshHistoricalBoundary(); this.refreshMap(); this.refreshScatter() }, strictBoundaries: 'refreshHistoricalBoundary', compareIds: 'refreshScatter', xAxis: 'refreshScatter', yAxis: 'refreshScatter' },
  async mounted() { try { this.worldBank = await loadWorldBank() } catch (error) { this.importMessage = error.message }; try { this.nmc = await loadNmc() } catch (error) { this.importMessage = this.importMessage || error.message }; this.$nextTick(() => { this.initCharts(); this.initMap(); this.refreshCharts() }); window.addEventListener('resize', this.resizeCharts) },
  beforeDestroy() { Object.values(this.charts).forEach((chart) => chart.dispose()); if (this.historicalLayer) this.historicalLayer.destroy(); if (this.arcgisView) this.arcgisView.destroy(); window.removeEventListener('resize', this.resizeCharts) },
  methods: {
    score(item) { const value = driScore(item, this.weights); return value === null ? '—' : value.toFixed(1) },
    capacity(item) { const value = capacityScore(item); return value === null ? '—' : value.toFixed(1) },
    ppFor(item) { const record = nmcFor(this.nmc, item.iso, item.year); const coding = codingFor(item.id); return { C: record?.c ?? null, E: record?.e ?? null, M: record?.m ?? null, S: coding?.s ?? null, W: coding?.w ?? null } },
    selectRegime(item) { this.current = item; this.historicalYear = item.year; this.activeEvent = item.events?.[0] || { year: item.year, title: '未导入事件', text: '该记录尚未提供事件时间线。' } },
    toggleCompare(item) { this.compareIds = this.compareIds.includes(item.id) ? this.compareIds.filter((id) => id !== item.id) : [...this.compareIds, item.id] },
    applyPreset(key) { this.selectedPreset = key; this.weights = { ...this.presets[key].weights } },
    openEvidence(key) { this.evidenceKey = key; this.drawerOpen = true },
    importFileData(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const records = parseImportText(String(reader.result), file.name); const result = importRecords(records, { retrievedAt: new Date().toISOString().slice(0, 10) }); this.importedRegimes = result.records; this.importRejected = result.rejected; this.importMessage = `已导入 ${result.records.length} 条，拒绝 ${result.rejected.length} 条。${result.rejected.length ? '请补齐来源版本、抓取日期和基础字段。' : ''}`; if (result.records[0]) this.selectRegime(result.records[0]) } catch (error) { this.importMessage = `导入失败：${error.message}` } finally { event.target.value = '' } }; reader.readAsText(file, 'utf-8') },
    pointColor(item) { const value = this.observedValue(item, this.mapMetric); return metricColor(value, this.mapMetric === 'pp' ? PP_MAX_REFERENCE : 10) },
    capacityColor(value) { if (value === null) return '#718b88'; if (value >= 80) return '#70d8c7'; if (value >= 60) return '#f2bd70'; return '#da7566' },
    eventPosition(year) { const min = Math.min(...this.current.events.map((event) => event.year)); const max = Math.max(...this.current.events.map((event) => event.year)); return `${max === min ? 50 : ((year - min) / (max - min)) * 90 + 5}%` },
    jumpEvent(event) { this.activeEvent = event; this.historicalYear = event.year },
    scrollToComparison() { const element = this.$el.querySelector('.comparison'); if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' }) },
    axisLabel(axis) { return { eiu: 'EIU 民主指数', gdpPerCapita: '人均 GDP（美元）', dri: 'DRI（自定义）', capacity: 'CAP（自定义）', pp: 'Pp 国力' }[axis] || axis },
    observedValue(item, axis) { if (axis === 'eiu') return eiuFor(item.iso, item.year)?.score ?? null; if (axis === 'gdpPerCapita') return this.worldBank?.records.find(row => row.iso === item.iso && row.year === item.year && row.code === 'NY.GDP.PCAP.CD')?.value ?? null; if (axis === 'pp') return calculatePp(this.ppFor(item)).value ?? null; return axisValue(item, axis, this.weights) },
    initCharts() { this.charts.radar = echarts.init(this.$refs.radar); this.charts.scatter = echarts.init(this.$refs.scatter) },
    // 修改：0—10 雷达量表分为 5 段，使刻度步长保持为清晰的 2。
    refreshCharts() { if (!this.charts.radar) return; this.charts.radar.setOption({ radar: { center: ['50%', '52%'], radius: '68%', splitNumber: 5, axisName: { color: '#8fa7a4', fontSize: 10 }, splitLine: { lineStyle: { color: '#263b3d' } }, splitArea: { areaStyle: { color: ['#102022', '#0c191b'] } }, axisLine: { lineStyle: { color: '#2b4242' } }, indicator: this.chartDimensions.map((item) => ({ name: item.short, min: 0, max: 10 })) }, series: [{ type: 'radar', data: this.currentEiu || Object.values(this.current.dri).every(value => Number.isFinite(value)) ? [{ value: this.currentEiu ? this.currentEiu.dimensions : this.driDimensions.map((item) => this.current.dri[item.key]), areaStyle: { color: 'rgba(102, 211, 197, .20)' }, lineStyle: { color: '#70d8c7', width: 2 }, itemStyle: { color: '#f5c06f' } }] : [] }] }, { notMerge: true }); this.refreshScatter() },
    // 修改：固定量表使用明确刻度，避免 ECharts 在空数据年份反复尝试对齐刻度。
    refreshScatter() { if (!this.charts.scatter) return; const data = this.mapRecords.map((item) => ({ name: `${item.country} ${item.year}`, value: [this.observedValue(item, this.xAxis), this.observedValue(item, this.yAxis)], itemStyle: { color: item.color || '#70d8c7' }, id: item.id })).filter((item) => item.value.every((value) => Number.isFinite(value))); this.charts.scatter.setOption({ grid: { left: 42, right: 18, top: 16, bottom: 28 }, tooltip: { trigger: 'item', formatter: (params) => `${params.data.name}<br>横轴 ${params.value[0].toFixed(1)} · 纵轴 ${params.value[1].toFixed(1)}` }, xAxis: { type: 'value', alignTicks: false, interval: this.xAxis === 'gdpPerCapita' ? undefined : this.xAxis === 'pp' ? 100 : 2, min: 0, max: this.xAxis === 'gdpPerCapita' ? null : this.xAxis === 'pp' ? PP_MAX_REFERENCE : 10, splitLine: { lineStyle: { color: '#1c3032' } }, axisLabel: { color: '#708b88', fontSize: 9 } }, yAxis: { type: 'value', alignTicks: false, interval: this.yAxis === 'gdpPerCapita' ? undefined : this.yAxis === 'pp' ? 100 : 2, min: 0, max: this.yAxis === 'gdpPerCapita' ? null : this.yAxis === 'pp' ? PP_MAX_REFERENCE : 10, splitLine: { lineStyle: { color: '#1c3032' } }, axisLabel: { color: '#708b88', fontSize: 9 } }, series: [{ type: 'scatter', symbolSize: (value, params) => this.compareIds.includes(params.data.id) ? 13 : 8, data }] }, { notMerge: true }); this.charts.scatter.off('click'); this.charts.scatter.on('click', (params) => { const found = this.allRegimes.find((item) => item.id === params.data.id); if (found) this.selectRegime(found) }) },
    // 修改：取消带现代国界的底图；只绘制已确认年份的本地历史图层。
    initMap() {
      if (!this.$refs.arcgis) return
      this.arcgisLayer = new GraphicsLayer()
      this.arcgisMap = new ArcGISMap({ basemap: null, layers: [this.arcgisLayer] })
      this.arcgisView = new MapView({ container: this.$refs.arcgis, map: this.arcgisMap, center: [20, 25], zoom: 2,
        constraints: { minZoom: 1, maxZoom: 8 }, ui: { components: ['zoom', 'compass'] } })
      this.arcgisView.on('click', async event => {
        try {
          const response = await this.arcgisView.hitTest(event)
          const result = response.results.find(item => item.graphic?.attributes?.id)
          const found = result && this.mapRecords.find(item => item.id === result.graphic.attributes.id)
          if (found) this.selectRegime(found)
        } catch (error) { this.boundaryStatus = `地图选取失败：${error.message}` }
      })
      this.arcgisView.when(() => { this.refreshHistoricalBoundary(); this.refreshMap() }).catch(error => { this.boundaryStatus = `地图初始化失败：${error.message}` })
    },
    async refreshHistoricalBoundary() {
      if (!this.arcgisMap) return
      const request = ++this.boundaryRequest
      if (this.historicalLayer) { this.arcgisMap.remove(this.historicalLayer); this.historicalLayer.destroy(); this.historicalLayer = null }
      const selection = this.boundarySelection
      this.boundaryStatus = selection.message
      if (selection.snapshotYear === null) return
      this.boundaryStatus = `正在加载 ${selection.snapshotYear} 年边界…`
      const layer = new GeoJSONLayer({ url: `/data/historical-basemaps/corrected/world_${selection.snapshotYear}.geojson`,
        title: `历史边界快照 ${selection.snapshotYear}`, opacity: 0.9,
        renderer: { type: 'simple', symbol: { type: 'simple-fill', color: [38, 101, 98, 0.3], outline: { color: [112, 216, 199, 0.78], width: 0.8 } } },
        popupTemplate: { title: '{DISPLAY_NAME}', content: [{ type: 'text', text: `${selection.message}。{ADMIN_STATUS}` },
          { type: 'fields', fieldInfos: [{ fieldName: 'LEADER', label: '领导人' }, { fieldName: 'SUBJECTO', label: '管辖主体（修正后）' }, { fieldName: 'SOURCE_NAME', label: '上游原始名称' }, { fieldName: 'BORDERPRECISION', label: '上游精度代码' }, { fieldName: 'CORRECTION_SOURCE', label: '修正依据' }] }] } })
      this.historicalLayer = layer
      this.arcgisMap.add(layer, 0)
      try { await layer.load(); if (request === this.boundaryRequest) this.boundaryStatus = selection.message }
      catch (error) {
        if (request !== this.boundaryRequest) return
        this.arcgisMap.remove(layer); layer.destroy(); this.historicalLayer = null
        this.boundaryStatus = `历史边界加载失败：${error.message}`
      }
    },
    refreshMap() { if (!this.arcgisLayer || !this.arcgisView) return; this.arcgisLayer.removeAll(); this.mapRecords.filter((item) => item.coords).forEach((item) => { const graphic = new Graphic({ geometry: new Point({ longitude: item.coords[0], latitude: item.coords[1] }), symbol: new SimpleMarkerSymbol({ color: this.pointColor(item), size: this.current.id === item.id ? 17 : 10, outline: { color: '#e9fff6', width: this.current.id === item.id ? 2 : 1 } }), attributes: { country: item.country, regime: item.regime, leader: item.leader || '领导人资料待补充', year: item.year, id: item.id, observationStatus: item.observationStatus || '外部导入（未独立核验）' }, popupTemplate: { title: '{country} · {year}', content: '<b>政权：</b>{regime}<br/><b>领导人：</b>{leader}<br/><b>数据状态：</b>{observationStatus}' } }); this.arcgisLayer.add(graphic) }); if (this.current.coords && this.current.year === this.historicalYear) this.arcgisView.goTo({ center: this.current.coords, zoom: 3.2 }, { duration: 450 }).catch(error => { if (error.name !== 'AbortError' && error.name !== 'view:goto-interrupted') this.importMessage = '地图定位失败：' + error.message }) },
    resizeCharts() { Object.values(this.charts).forEach((chart) => chart.resize()) },
  },
}
function evidenceFallback(key, regime) { return { claim: '该国家—年份尚无此自定义维度的已核验观测。', rationale: '真实来源保持原始指标和单位，不根据叙述推算分数。', confidence: '未评定', status: '缺失' } }
</script>





