# PolityLens 政权多维分析平台

PolityLens 将历史政权拆分为民主与权利、国家能力和综合国力等维度，并把国家—年份档案放回对应的历史边界中查看。项目强调来源可追溯、缺失值不计分，以及原始数据与修正数据并存。

## 当前能力

- 1900—2010 共 10 组历史边界快照，并为缺少同年快照的年份提供明确标注的较早参考快照。
- 审校 Qing、Xinjiang、Manchukuo、Tibet 等东亚历史边界显示问题，同时保留上游原始字段。
- 15 个国家—年份档案的国名、政权、领导人和来源展示。
- EIU 2024、世界银行 WDI/WGI、COW NMC 与《中国的民主》白皮书等数据来源分层展示。
- 地图、雷达图、时间线、比较图与可追溯的数据导入。

## 数据边界

历史边界来自 [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps)。修正版用于解决当前产品中的已知显示错误，不代表逐年、逐日的完整国界研究。详细规则见 [历史边界说明](docs/historical-boundaries.md)和[真实数据与年份校验](docs/真实数据与年份校验.md)。

## 本地运行

Windows 环境使用 Git Bash，从项目根目录执行：

```bash
bash scripts/check.sh
bash scripts/build.sh
bash scripts/dev.sh --host 127.0.0.1 --port 5173
```

数据同步入口为：

```bash
bash scripts/sync-data.sh
```

运行日志统一写入 `logs/`，本地环境变量放在 `.env.local`，不会提交到仓库。

## 验证状态

2026-09-18：数据回归、生产构建和浏览器交互检查通过。浏览器测试覆盖历史年份回退、严格同年模式、15 个档案领导人展示和地图图标弹窗。
