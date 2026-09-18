# PolityLens 首版说明

PolityLens 是一个把政权拆成多个可解释维度的分析工作台。首版以 `Regime-Year`（政权—年份）为基本数据单元，不生成民主、国家能力和国力的合并总分。

## 三层模型

- 原始数据：国家、政权、领导人、年份、坐标、事实依据、来源和置信度。
- 指标层：民主与权利 DRI 八维、国家能力 CAP 五维、综合国力 NCI 七板块。
- 可视化层：ArcGIS 底图与本地指标图层、雷达图、能力条、时间事件、权重实验室和双轴散点图。

## 数据边界

当前 `src/data/regimes.js` 中的分数是合成占位值，用于验证交互和模型结构；它们没有来自任何已发布数据库，不构成对任何政权的事实判断或权威评级。界面中的公开链接目前只提供方法参考，不支撑当前数值。后续接入真实数据时，必须为每个数值记录原始下载地址、版本/发布日期、时间范围、量纲、缺失值处理和可比性说明。

计划核验的公开资料包括 EIU、V-Dem、World Bank WGI、Correlates of War NMC、World Bank 和 IMF；历史地图参考 [historical-basemaps](historical-boundaries.md)。它们只能在完成数据许可、时间口径、指标定义和复现记录后进入数据层，不应直接拼接为一个未经说明的排名。

## 借鉴 World Monitor

参考 [koala73/worldmonitor](https://github.com/koala73/worldmonitor) 的工程思想：地图引擎与图层目录分离、数据来源可归因、数据不可用时保留 unavailable 状态、不同主题通过面板组合呈现。本项目只借鉴公开的产品与架构思路，不复制其代码、品牌、界面资源或数据；World Monitor 的 AGPL-3.0 许可也不应被误认为本项目的代码许可。

## 开发

## 地图配置

地图工作台使用 ArcGIS Maps SDK for JavaScript 提供真实底图，政权点位使用本地 `RegimeYear` 合成占位值。密钥放在未纳入版本控制的 `.env.local` 中，变量名为 `VITE_ARCGIS_API_KEY`；可参考 `.env.example` 配置。由于浏览器地图密钥会随页面加载暴露，生产环境必须在 ArcGIS 控制台限制来源域名和服务权限，并定期轮换密钥。

当前仅使用 ArcGIS 底图和本地 Graphic 点位，没有声称从 ArcGIS 获取历史制度或国力评分。后续如果接入 ArcGIS FeatureServer 或行政边界，应记录图层服务 URL、服务拥有者、许可和抓取时间；高权限 token 应通过后端代理，不应放进前端。

```bash
npm install
bash scripts/dev.sh
bash scripts/build.sh
```

Vue 2 已进入维护末期。本项目按需求使用 Vue 2.7，评分函数保持纯函数边界，以便未来迁移到 Vue 3。
