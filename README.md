# PolityLens 政权多维分析平台

PolityLens 将历史政权拆分为民主与权利、国家能力和综合国力等维度，并把国家—年份档案放回对应的历史边界中查看。项目强调来源可追溯、缺失值不计分，以及原始数据与修正数据并存。

## 当前能力

- 以 ClioPatria 生成 1900—2024 共 27 组同年实控快照，覆盖界面全部可选年份，并保留 1654 条人文政治时段记录。
- 殖民地计入宗主国，傀儡政权单列，争议地区按目标年份实控；审校 Qing、Xinjiang、Manchukuo、Tibet 等东亚显示问题。
- 15 个国家—年份档案的国名、政权、领导人和来源展示。
- EIU 2024、V-Dem v16 历史五指数、世界银行 WDI/WGI、COW NMC 与《中国的民主》白皮书等数据来源分层展示。八国共筛选出 954 个 OWID 处理序列国家—年份；其中可能有前独立时期历史政权回填值，本项目不另行补缺。
- 地图、雷达图、时间线、比较图与可追溯的数据导入。

## 数据边界

主边界来自 [Seshat ClioPatria](https://github.com/Seshat-Global-History-Databank/cliopatria)，并用 [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps) 审校新疆、西藏和满洲国。快照表达目标年份的一种实控解释，不代表逐日国界研究。详细规则见 [历史边界说明](docs/historical-boundaries.md)和[真实数据与年份校验](docs/真实数据与年份校验.md)。

民主历史序列采用 [V-Dem v16（2026）](https://www.v-dem.net/data/the-v-dem-dataset/) 经 [Our World in Data 处理的 CSV](https://ourworldindata.org/grapher/electoral-democracy-index)，不能将其中每条历史值视为 V-Dem 对当代国家的直接原始观测。V-Dem 数据许可为 CC BY-SA 4.0；OWID 处理成果采用 CC BY，转载第三方数据仍遵循原提供方许可。

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

2026-09-29：27 个 ClioPatria 快照和筛选后的 954 条 OWID 处理序列国家—年份记录已纳入本地校验；尚未逐条区分历史政权回填值。来源、授权和数据边界见[真实数据与年份校验](docs/真实数据与年份校验.md)。
