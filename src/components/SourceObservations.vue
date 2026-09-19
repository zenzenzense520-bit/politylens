<template>
  <section class="source-observations">
    <div class="card-title"><span>真实观测 · {{ year }}</span><span class="score-chip">{{ iso }}</span></div>
    <p v-if="eiu">EIU 民主指数 <strong>{{ eiu.score.toFixed(2) }} / 10</strong> · 排名 {{ eiu.rank }}（并列沿用原表）</p>
    <p v-else>当前国家—年份暂无已接入的 EIU 评分。</p>
    <div v-if="eiu" class="eiu-bars">
      <div v-for="(label, index) in labels" :key="label" class="bar-row"><span>{{ label }}</span><div class="bar-track"><i :style="{ width: `${eiu.dimensions[index] * 10}%` }"></i></div><b>{{ eiu.dimensions[index].toFixed(2) }}</b></div>
      <a :href="`${source.report}#page=${eiu.page}`" target="_blank" rel="noopener noreferrer">原报告表 2 · 第 {{ eiu.page }} 页 ↗</a>
      <p class="source-note">{{ source.version }} · 核验 {{ source.retrievedAt }}。{{ source.note }}</p>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-else-if="!dataset">正在加载世界银行观测…</p>
    <div v-else>
      <div v-for="row in rows" :key="row.code" class="observation-row">
        <a :href="row.url" target="_blank" rel="noopener noreferrer">{{ row.label }} ↗</a><strong>{{ format(row.value) }}</strong>
        <small>{{ row.unit }} · {{ year }} · {{ row.code }} · 源更新 {{ row.updated }}</small>
      </div>
      <p class="source-note">世界银行 · 抓取 {{ dataset.retrievedAt.slice(0, 10) }}。— 表示本次快照无观测。WGI 保留原始估计值，不等于 CAP；现价 GDP 不适合直接衡量跨年实际增长。</p>
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
import { eiuFor, eiuDimensions, eiuSource, whitePaper } from '../data/observations'
import type { WorldBankDataset } from '../data/observations'
import { loadWorldBank } from '../api/worldBank'
// 修改：机构评分、经济观测、官方制度文本分层展示且年份精确匹配。
export default defineComponent({
  props: { iso: { type: String, required: true }, year: { type: Number, required: true } },
  data: () => ({ dataset: null as WorldBankDataset | null, error: '', labels: eiuDimensions, source: eiuSource, paper: whitePaper }),
  computed: {
    eiu() { return eiuFor(this.iso, this.year) },
    rows() {
      return (this.dataset?.sources ?? []).map(source => ({ ...source,
        value: this.dataset?.records.find(row => row.iso === this.iso && row.year === this.year && row.code === source.code)?.value ?? null,
      }))
    },
  },
  async mounted() {
    try { this.dataset = await loadWorldBank() }
    catch (error) { this.error = error instanceof Error ? error.message : '真实观测加载失败' }
  },
  methods: { format(value: number | null) { return value === null ? '—' : value.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) } },
})
</script>
