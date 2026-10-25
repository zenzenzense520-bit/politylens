<template>
  <!-- 修改（2026-10-25）：单国 WGI 六维 1996—2025 时间序列，单图维度切换，EST 折线 + ±1 SE 参考带，不做显著性结论。 -->
  <div v-if="active" class="wgi-ts">
    <div class="wgi-ts-tabs" role="tablist" aria-label="WGI 维度切换">
      <button v-for="dim in dimensions" :key="dim.code" type="button" role="tab"
        :class="['wgi-ts-tab', { 'is-active': dim.code === activeDim }]"
        :aria-selected="dim.code === activeDim" @click="activeDim = dim.code">
        {{ dim.label }}<span>{{ dim.code }}</span>
      </button>
    </div>
    <svg class="wgi-ts-svg" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="ariaLabel" preserveAspectRatio="xMidYMid meet">
      <g v-for="grid in yGrids" :key="`grid-${grid}`">
        <line class="wgi-ts-grid" :class="{ 'is-zero': grid === 0 }" :x1="L" :x2="W - R" :y1="y(grid)" :y2="y(grid)" />
        <text class="wgi-ts-axis-label" :x="L - 5" :y="y(grid) + 3" text-anchor="end">{{ grid }}</text>
      </g>
      <g v-for="tick in xTicks" :key="`tick-${tick}`">
        <text class="wgi-ts-axis-label" :x="x(tick)" :y="H - 8" text-anchor="middle">{{ tick }}</text>
      </g>
      <line v-if="currentPoint" class="wgi-ts-current-line" :x1="x(currentPoint.year)" :x2="x(currentPoint.year)" :y1="T" :y2="H - B" />
      <path class="wgi-ts-band" :d="bandPath" />
      <path class="wgi-ts-line" :d="linePath" />
      <template v-for="point in active.points" :key="`dot-${point.year}`">
        <circle v-if="point.estimate !== null" class="wgi-ts-dot" :class="{ 'is-current': point.year === year }"
          :cx="x(point.year)" :cy="y(point.estimate)" :r="point.year === year ? 3.2 : 2" />
      </template>
    </svg>
    <div class="wgi-ts-readout">
      <span class="wgi-ts-dim-name">{{ active.label }}（{{ activeDim }}）</span>
      <span v-if="currentPoint">档案 {{ currentPoint.year }} 年：EST <b>{{ fmt(currentPoint.estimate) }}</b> · SE <b>{{ fmt(currentPoint.standardError) }}</b></span>
      <span v-else>该序列覆盖 {{ yearMin }}—{{ yearMax }} 年，当前档案 {{ year }} 年不在发布年份内。</span>
    </div>
    <p v-if="isHistorical" class="wgi-ts-warn">以下为该分析主体（{{ iso }}）1996—2025 年的现代 WGI 序列，与 {{ year }} 年档案不属同一时代，仅作现代背景参照，不代表该历史政权，也不参与该档案评分。</p>
    <p class="wgi-ts-note">实线为估计值（EST），浅色带为逐年估计值 ±1 个标准误（SE）的参考范围，<strong>不是置信区间</strong>；相邻年份带重叠是常态，本图不判断年份间变化是否显著。纵轴固定 −2.5～+2.5，便于跨维度、跨国家比较。<a :href="dataset.wgiMethodologyUrl" target="_blank" rel="noopener noreferrer">WGI 官方方法 ↗</a></p>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { wgiDimensions, wgiSeriesFor, type WgiDimensionCode, type WgiSeries } from '../data/observations'
import type { WorldBankDataset } from '../data/observations'

// 绘图区与固定纵轴刻度（−2.5～+2.5），与 WGI 刻度面板保持一致。
const W = 340
const H = 210
const L = 32
const R = 14
const T = 14
const B = 26
const Y_MIN = -2.5
const Y_MAX = 2.5
const X_TICK_YEARS = [1996, 2000, 2005, 2010, 2015, 2020, 2025]

export default defineComponent({
  props: {
    iso: { type: String, required: true },
    year: { type: Number, required: true },
    dataset: { type: Object as PropType<WorldBankDataset>, required: true },
  },
  data: () => ({ dimensions: wgiDimensions, activeDim: 'VA' as WgiDimensionCode, W, H, L, R, T, B }),
  computed: {
    series(): WgiSeries[] { return wgiSeriesFor(this.dataset, this.iso) },
    active(): WgiSeries | undefined { return this.series.find(item => item.code === this.activeDim) },
    yearMin(): number { return this.dataset.wgiYears[0] },
    yearMax(): number { return this.dataset.wgiYears[this.dataset.wgiYears.length - 1] },
    yGrids(): number[] { return [-2, -1, 0, 1, 2] },
    xTicks(): number[] { return this.dataset.wgiYears.filter(year => X_TICK_YEARS.includes(year)) },
    isHistorical(): boolean { return this.year < this.yearMin },
    currentPoint(): WgiSeries['points'][number] | null {
      return this.active?.points.find(point => point.year === this.year) ?? null
    },
    linePath(): string {
      if (!this.active) return ''
      let path = ''
      let started = false
      for (const point of this.active.points) {
        if (point.estimate === null) { started = false; continue }
        path += `${started ? ' L' : 'M'}${this.x(point.year).toFixed(2)},${this.y(point.estimate).toFixed(2)}`
        started = true
      }
      return path.trim()
    },
    bandPath(): string {
      if (!this.active) return ''
      const points = this.active.points.filter(point => point.estimate !== null && point.standardError !== null)
      if (points.length === 0) return ''
      const upper = points.map((point, index) =>
        `${index === 0 ? 'M' : 'L'}${this.x(point.year).toFixed(2)},${this.y((point.estimate as number) + (point.standardError as number)).toFixed(2)}`).join(' ')
      const lower = [...points].reverse().map(point =>
        `L${this.x(point.year).toFixed(2)},${this.y((point.estimate as number) - (point.standardError as number)).toFixed(2)}`).join(' ')
      return `${upper} ${lower} Z`
    },
    ariaLabel(): string {
      return `${this.iso} WGI${this.active ? `「${this.active.label}」` : ''} ${this.yearMin}—${this.yearMax} 年估计值与标准误时间序列，纵轴 −2.5 至 +2.5。`
    },
  },
  methods: {
    x(year: number): number {
      const span = this.yearMax - this.yearMin
      return this.L + ((year - this.yearMin) / span) * (this.W - this.L - this.R)
    },
    y(value: number): number {
      const clamped = Math.min(Y_MAX, Math.max(Y_MIN, value))
      return this.T + ((Y_MAX - clamped) / (Y_MAX - Y_MIN)) * (this.H - this.T - this.B)
    },
    fmt(value: number | null): string { return value === null ? '—' : value.toFixed(3) },
  },
})
</script>
