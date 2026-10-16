<template>
  <section class="source-observations">
    <!-- 修改：统一标题改为来源数据，避免把 OWID 的历史回填值误称为直接观测。 -->
    <div class="card-title"><span>来源数据 · {{ year }}</span><span class="score-chip">{{ iso }}</span></div>
    <p v-if="eiu">EIU 民主指数 <strong>{{ eiu.score.toFixed(2) }} / 10</strong> · 排名 {{ eiu.rank }}（并列沿用原表）</p>
    <p v-else>当前国家—年份暂无已接入的 EIU 评分。</p>
    <div v-if="eiu" class="eiu-bars">
      <div v-for="(label, index) in labels" :key="label" class="bar-row"><span>{{ label }}</span><div class="bar-track"><i :style="{ width: `${eiu.dimensions[index] * 10}%` }"></i></div><b>{{ eiu.dimensions[index].toFixed(2) }}</b></div>
      <a :href="`${source.report}#page=${eiu.page}`" target="_blank" rel="noopener noreferrer">原报告表 2 · 第 {{ eiu.page }} 页 ↗</a>
      <p class="source-note">{{ source.version }} · 核验 {{ source.retrievedAt }}。{{ source.note }}</p>
    </div>
    <!-- 修改：逐行展示 OWID 回填状态，并为 1923—1990 年苏联映射说明 V-Dem 编码单元和边界差异。 -->
    <p v-if="vdemError" role="alert">{{ vdemError }}</p>
    <div v-else-if="vdemRecord" class="eiu-bars">
      <div class="card-title"><span>V-Dem 历史指数 · OWID 处理版</span><span class="score-chip">{{ vdemDataset?.version }}</span></div>
      <div v-for="item in vdemRows" :key="item.code" class="bar-row">
        <span>{{ item.label }}</span><div class="bar-track"><i :style="{ width: `${(item.value ?? 0) * 100}%` }"></i></div>
        <b>{{ item.value === null ? '—' : item.value.toFixed(3) }}</b>
      </div>
      <p class="source-note">OWID 实体：{{ vdemRecord.sourceEntity }}。{{ vdemStatusText }}指数范围 0—1。<a :href="vdemRows[0].url" target="_blank" rel="noopener noreferrer">指标来源 ↗</a> <a :href="vdemDataset?.processingUrl" target="_blank" rel="noopener noreferrer">OWID 方法 ↗</a></p>
      <p v-if="vdemMapping" class="source-note">此处将 RUS 年度序列用于苏联（SUN），依据 V-Dem v16 编码单元 {{ vdemMapping.vdemCountryUnitId }}，仅限 {{ vdemMapping.firstYear }}—{{ vdemMapping.lastYear }} 年。该评分对应 V-Dem 当年的政治单元，不等于本地图所含全部殖民地或边界范围。<a :href="vdemMapping.sourceUrl" target="_blank" rel="noopener noreferrer">编码单元说明 ↗</a></p>
      <p class="source-note">{{ vdemDataset?.note }}</p>
    </div>
    <p v-else-if="vdemDataset && iso === 'SUN' && (year === 1922 || year === 1991)" class="source-note">{{ year }} 年处于苏联成立或解体的过渡期，未自动映射 RUS 年度评分。<a :href="vdemDataset.sovietMapping.sourceUrl" target="_blank" rel="noopener noreferrer">V-Dem 编码单元说明 ↗</a></p>
    <p v-else-if="vdemDataset" class="source-note">该国家—年份没有可对应的 V-Dem/OWID 指数。</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-else-if="!dataset">正在加载世界银行观测…</p>
    <div v-else>
      <!-- 修改：WDI 保持原始经济与人口数值；六维 WGI 将估计值和标准误成对展示。 -->
      <div class="card-title source-group-title"><span>WDI · 经济、人口与财政</span><span class="score-chip">{{ wdiRows.length }} 项</span></div>
      <div v-for="row in wdiRows" :key="row.code" class="observation-row">
        <a :href="row.url" target="_blank" rel="noopener noreferrer">{{ row.label }} ↗</a><strong>{{ format(row.value) }}</strong>
        <small>{{ row.unit }} · {{ year }} · {{ row.code }} · 源更新 {{ row.updated }}</small>
      </div>
      <table class="wgi-table">
        <caption>WGI 六维 · {{ dataset.wgiVersion }} <a :href="dataset.wgiMethodologyUrl" target="_blank" rel="noopener noreferrer">方法 ↗</a></caption>
        <thead><tr><th scope="col">维度</th><th scope="col">估计值</th><th scope="col">标准误（SE）</th></tr></thead>
        <tbody>
          <tr v-for="row in wgiRows" :key="row.code">
            <th scope="row"><a v-if="row.sourceUrl" :href="row.sourceUrl" target="_blank" rel="noopener noreferrer">{{ row.label }} ↗</a><span v-else>{{ row.label }}</span></th>
            <td>{{ formatWgi(row.estimate) }}</td><td><a v-if="row.standardErrorUrl" :href="row.standardErrorUrl" target="_blank" rel="noopener noreferrer" :aria-label="`${row.label}标准误 ${formatWgi(row.standardError)}，查看来源`">{{ formatWgi(row.standardError) }}</a><span v-else>{{ formatWgi(row.standardError) }}</span></td>
          </tr>
        </tbody>
      </table>
      <!-- 修改：明确 WGI 2026 更新的实际年份缺口、模型不确定性与 CAP 的边界。 -->
      <p class="source-note">世界银行 · 抓取 {{ dataset.retrievedAt.slice(0, 10) }}。WDI 七项覆盖八国 1960—2024 年；税收占 GDP 与不含赠款财政收入占 GDP 来自 IMF GFS，年度覆盖稀疏，— 保留为缺失，不用于自动评分。WGI 2026 版接入 1996、1998、2000、2002 及 2003—2025 年，1997、1999、2001 年无记录。2025 年数据已存，地图档案暂止于 2024 年。标准误不是置信区间；WGI 是模型估计，不能直接当作 CAP 评分或地图实控疆域的观测；现价 GDP 不适合直接衡量跨年实际增长。</p>
    </div>
    <details v-if="iso === 'CHN'">
      <summary>{{ paper.title }} · 官方制度视角（2021）</summary>
      <p>{{ paper.publisher }} · {{ paper.publishedAt }}。此文本不是 {{ year }} 年的独立实证评分。</p>
      <div v-for="section in paper.sections" :key="section.title"><strong>{{ section.title }}</strong><p>{{ section.text }}</p><small>{{ section.section }}</small></div>
      <a :href="paper.url" target="_blank" rel="noopener noreferrer">官方全文（最高检转载新华社）↗</a>
    </details>
  </section>
</template>
<script lang="ts">
// Vue3 升级：Vue.extend 已移除，改用 defineComponent
import { defineComponent } from 'vue'
import { eiuFor, eiuDimensions, eiuSource, whitePaper, wgiPairsFor } from '../data/observations'
import type { WorldBankDataset } from '../data/observations'
import { loadWorldBank } from '../api/worldBank'
import { loadVdem } from '../api/vdem'
import { vdemFor, vdemMappingFor, type VdemDataset } from '../data/vdem'
// 修改：机构评分、经济观测、官方制度文本分层展示且年份精确匹配。
export default defineComponent({
  props: { iso: { type: String, required: true }, year: { type: Number, required: true } },
  data: () => ({ dataset: null as WorldBankDataset | null, error: '', vdemDataset: null as VdemDataset | null, vdemError: '', labels: eiuDimensions, source: eiuSource, paper: whitePaper }),
  computed: {
    eiu() { return eiuFor(this.iso, this.year) },
    vdemRecord() { return vdemFor(this.vdemDataset, this.iso, this.year) },
    vdemMapping() { return vdemMappingFor(this.vdemDataset, this.iso, this.year) },
    vdemStatusText() {
      const status = this.vdemRecord?.owidImputationStatus
      if (status === 'not_imputed') return '该行未经过 OWID 跨政权回填；这不代表现代国界内的直接观测。'
      if (status === 'imputed') return '该行经过 OWID 跨政权回填。'
      return '该行是否经过 OWID 跨政权回填尚未核定。'
    },
    vdemRows() { return (this.vdemDataset?.sources ?? []).map(source => ({ ...source, value: this.vdemRecord?.values[source.code] ?? null })) },
    wdiRows() {
      return (this.dataset?.sources ?? []).filter(source => source.sourceId === 2).map(source => ({ ...source,
        value: this.dataset?.records.find(row => row.iso === this.iso && row.year === this.year && row.code === source.code)?.value ?? null,
      }))
    },
    wgiRows() { return this.dataset ? wgiPairsFor(this.dataset, this.iso, this.year) : [] },
  },
  async mounted() {
    try { this.dataset = await loadWorldBank() }
    catch (error) { this.error = error instanceof Error ? error.message : '真实观测加载失败' }
    try { this.vdemDataset = await loadVdem() }
    catch (error) { this.vdemError = error instanceof Error ? error.message : 'V-Dem 观测加载失败' }
  },
  methods: {
    format(value: number | null) { return value === null ? '—' : value.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) },
    formatWgi(value: number | null) { return value === null ? '—' : value.toFixed(3) },
  },
})
</script>
