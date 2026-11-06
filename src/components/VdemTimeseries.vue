<template>
  <!-- 新增（2026-11-06）：单国 V-Dem 五指数 1900—2025 长序列；参考 OWID Grapher 的单线+年份游标与 DW state-of-democracy 的长期趋势呈现。只读，不进入评分。 -->
  <div v-if="points.length" class="wgi-ts">
    <div class="wgi-ts-tabs" role="tablist" aria-label="V-Dem 指数切换">
      <button v-for="src in dataset.sources" :key="src.code" type="button" role="tab"
        :class="['wgi-ts-tab', { 'is-active': src.code === activeCode }]" :aria-selected="src.code === activeCode"
        @click="activeCode = src.code">{{ src.label }}</button>
    </div>
    <svg class="wgi-ts-svg" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="ariaLabel" preserveAspectRatio="xMidYMid meet">
      <g v-for="grid in yGrids" :key="`g-${grid}`">
        <line class="wgi-ts-grid" :x1="L" :x2="W - R" :y1="y(grid)" :y2="y(grid)" />
        <text class="wgi-ts-axis-label" :x="L - 5" :y="y(grid) + 3" text-anchor="end">{{ grid }}</text>
      </g>
      <text v-for="tick in xTicks" :key="`t-${tick}`" class="wgi-ts-axis-label" :x="x(tick)" :y="H - 8" text-anchor="middle">{{ tick }}</text>
      <line v-if="currentPoint" class="wgi-ts-current-line" :x1="x(year)" :x2="x(year)" :y1="T" :y2="H - B" />
      <path class="wgi-ts-line" :d="linePath" />
      <template v-for="point in points" :key="`d-${point.year}`">
        <circle v-if="point.value !== null && (point.status !== 'not_imputed' || point.year === year)" class="wgi-ts-dot"
          :class="{ 'is-current': point.year === year }" :cx="x(point.year)" :cy="y(point.value)" :r="point.year === year ? 3.2 : 2"
          :fill="point.status === 'not_imputed' ? undefined : 'none'" stroke="currentColor" />
      </template>
    </svg>
    <div class="wgi-ts-readout">
      <span class="wgi-ts-dim-name">{{ activeLabel }}（0—1）</span>
      <span v-if="currentPoint">档案 {{ year }} 年：<b>{{ fmt(currentPoint.value) }}</b></span>
      <span v-else>该序列覆盖 {{ points[0].year }}—{{ points[points.length - 1].year }} 年，当前 {{ year }} 年无对应记录。</span>
    </div>
    <p class="wgi-ts-note">实线仅连接相邻且未经 OWID 跨政权回填的年份；空心点为已回填或未核定的行，不连线。缺失年份保持断开，不插值。V-Dem 指数为专家编码的潜变量模型输出，与 EIU、WGI 量表不可直接比较。<a :href="dataset.processingUrl" target="_blank" rel="noopener noreferrer">OWID 方法 ↗</a></p>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { vdemSeriesFor, type VdemDataset, type VdemIndexCode } from '../data/vdem'

const W = 340, H = 210, L = 32, R = 14, T = 14, B = 26
const X_TICKS = [1900, 1925, 1950, 1975, 2000, 2025]

export default defineComponent({
  props: {
    iso: { type: String, required: true },
    year: { type: Number, required: true },
    dataset: { type: Object as PropType<VdemDataset>, required: true },
  },
  data: () => ({ activeCode: 'v2x_polyarchy' as VdemIndexCode, W, H, L, R, T, B }),
  computed: {
    points() { return vdemSeriesFor(this.dataset, this.iso, this.activeCode) },
    activeLabel(): string { return this.dataset.sources.find(item => item.code === this.activeCode)?.label ?? this.activeCode },
    yGrids(): number[] { return [0, 0.25, 0.5, 0.75, 1] },
    yearMin(): number { return this.dataset.period[0] },
    yearMax(): number { return this.dataset.period[1] },
    xTicks(): number[] { return X_TICKS.filter(tick => tick >= this.yearMin && tick <= this.yearMax) },
    currentPoint() { return this.points.find(point => point.year === this.year && point.value !== null) ?? null },
    linePath(): string {
      let path = ''
      let prev: number | null = null
      for (const point of this.points) {
        if (point.value === null || point.status !== 'not_imputed') { prev = null; continue }
        path += `${prev !== null && point.year === prev + 1 ? ' L' : ' M'}${this.x(point.year).toFixed(2)},${this.y(point.value).toFixed(2)}`
        prev = point.year
      }
      return path.trim()
    },
    ariaLabel(): string { return `${this.iso} V-Dem「${this.activeLabel}」${this.yearMin}—${this.yearMax} 年时间序列，纵轴 0 至 1。` },
  },
  methods: {
    x(year: number): number { return this.L + ((year - this.yearMin) / (this.yearMax - this.yearMin)) * (this.W - this.L - this.R) },
    y(value: number): number { return this.T + (1 - Math.min(1, Math.max(0, value))) * (this.H - this.T - this.B) },
    fmt(value: number | null): string { return value === null ? '—' : value.toFixed(3) },
  },
})
</script>
