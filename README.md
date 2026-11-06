# PolityLens 政权多维分析平台

PolityLens 将历史政权拆分为民主与权利、国家能力和综合国力等维度，并把国家—年份档案放回对应的历史边界中查看。项目强调来源可追溯、缺失值不计分，以及原始数据与修正数据并存。

## 当前能力

- 以 ClioPatria 生成 1900—2024 共 27 组同年实控快照，覆盖界面全部可选年份，并保留 1654 条人文政治时段记录。
- 殖民地计入宗主国，傀儡政权单列，争议地区按目标年份实控；审校 Qing、Xinjiang、Manchukuo、Tibet 等东亚显示问题。
- 19 个国家—年份档案的国名、政权、领导人和来源展示；档案对应的 ClioPatria 边界面同步显示已核验领导人及来源。
- EIU 2024、V-Dem v16 历史五指数、12 国世界银行 WDI 与 WGI 2026 版六维估计值及标准误、COW NMC 与《中国的民主》白皮书等数据来源分层展示。12 国共筛选出 1376 个 OWID 处理序列国家—年份，并逐条标注 OWID 跨政权回填判定。
- 地图、雷达图、时间线、比较图与可追溯的数据导入。

## 数据边界

主边界来自 [Seshat ClioPatria](https://github.com/Seshat-Global-History-Databank/cliopatria)，并用 [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps) 审校新疆、西藏和满洲国。快照表达目标年份的一种实控解释，不代表逐日国界研究。详细规则见 [历史边界说明](docs/historical-boundaries.md)和[真实数据与年份校验](docs/真实数据与年份校验.md)。

民主历史序列采用 [V-Dem v16（2026）](https://www.v-dem.net/data/the-v-dem-dataset/) 经 [Our World in Data 处理的 CSV](https://ourworldindata.org/grapher/electoral-democracy-index)。固定版本的 OWID 回填规则未把现有八国列为目标；“未回填”仍不表示历史观测范围等同于今天国界。1937 年苏联仅凭 [V-Dem 国家编码单元](https://v-dem.net/documents/72/countryunit_v16.pdf)作显式映射。V-Dem 数据许可为 CC BY-SA 4.0；OWID 处理成果采用 CC BY，转载第三方数据仍遵循原提供方许可。

## 快速上手：本地预览

### 环境要求

- Windows 10/11、macOS 或 Linux；Windows 请安装 Git for Windows，并在 **Git Bash** 中运行下列命令。
- Node.js 20 或更高版本、npm。
- 首次安装依赖需要网络。

### 启动开发预览

在项目根目录打开 Git Bash 或终端，执行：

```bash
npm ci
bash scripts/dev.sh
```

等待终端出现 `VITE ready` 后，在浏览器打开 <http://127.0.0.1:5173/>。结束运行按 `Ctrl+C`。ArcGIS 使用的是本地 ClioPatria GeoJSON 历史边界，不需要 ArcGIS API Key；地图要素和来源信息随项目数据加载。

### 检查与生产预览

```bash
bash scripts/check.sh
bash scripts/build.sh
bash scripts/preview.sh
```

生产预览启动后打开 <http://127.0.0.1:4173/>。`build.sh` 生成 `dist/`；部署静态网站时发布 `dist/` 目录，并将网站根路径映射到 `index.html`。地图数据位于 `dist/data/`，部署时必须与页面一并发布，不能只上传 HTML/JS 文件。

### 数据同步（可选）

首次预览不需要同步数据。需要更新来源数据时，使用 Windows Git Bash 和 PowerShell 7：

```bash
bash scripts/sync-data.sh
```

同步会更新历史边界、World Bank、ClioPatria、V-Dem 和 COW NMC，并在最后运行完整数据校验。运行、构建、同步日志写入 `logs/`；`.env.local` 仅用于本机配置，不应提交。当前预览无需配置其中的在线地图密钥。

### 常见问题

- `npm ci` 报 Node 版本不兼容：升级到 Node.js 20 或更高版本后重试。
- 地图空白：确认服务器能读取 `/data/cliopatria/manifest.json` 和对应的 `snapshots/.../world_<year>.geojson`，并确认部署时完整发布了 `dist/data/`。
- 5173 或 4173 端口被占用：停止占用该端口的旧进程，或通过 `scripts/dev.sh --port <端口>` 启动开发服务器；生产预览脚本默认使用 4173。

## 验证状态

2026-11-04：27 个 ClioPatria 快照和筛选后的 1376 条 OWID 处理序列国家—年份记录纳入本地校验，且有逐条回填状态；世界银行 WDI 覆盖 12 国 1960—2025 年七项年度指标，含 IMF GFS 财政比率且保留缺失；WGI 2026 更新版六维估计值与标准误已发布年份延至 2025。19 个可选档案对应边界面具备领导人来源；全球其他实体仍待逐项核证。来源、授权和数据边界见[真实数据与年份校验](docs/真实数据与年份校验.md)。
