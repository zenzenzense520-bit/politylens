# PolityLens 政权多维分析平台

PolityLens 将历史政权拆分为民主与权利、国家能力和综合国力等维度，并把国家—年份档案放回对应的历史边界中查看。项目强调来源可追溯、缺失值不计分，以及原始数据与修正数据并存。

## 当前能力

- 以 ClioPatria 生成 1900—2024 共 27 组同年实控快照，覆盖界面全部可选年份，并保留 1654 条人文政治时段记录。
- 殖民地计入宗主国，傀儡政权单列，争议地区按目标年份实控；审校 Qing、Xinjiang、Manchukuo、Tibet 等东亚显示问题。
- 19 个国家—年份档案的国名、政权、领导人和来源展示；档案对应的 ClioPatria 边界面同步显示已核验领导人及来源。
- EIU 2024、V-Dem v16 历史五指数、12 国世界银行 WDI（14 项）与 WGI 2026 版六维估计值及标准误、COW NMC 与《中国的民主》白皮书等数据来源分层展示。12 国共筛选出 1376 个 OWID 处理序列国家—年份，并逐条标注 OWID 跨政权回填判定。
- 地图、雷达图、时间线、比较图与可追溯的数据导入。

## 数据边界

主边界来自 [Seshat ClioPatria](https://github.com/Seshat-Global-History-Databank/cliopatria)，并用 [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps) 审校新疆、西藏和满洲国。快照表达目标年份的一种实控解释，不代表逐日国界研究。详细规则见 [历史边界说明](docs/historical-boundaries.md)和[真实数据与年份校验](docs/真实数据与年份校验.md)。

民主历史序列采用 [V-Dem v16（2026）](https://www.v-dem.net/data/the-v-dem-dataset/) 经 [Our World in Data 处理的 CSV](https://ourworldindata.org/grapher/electoral-democracy-index)。固定版本的 OWID 回填规则未把现有八国列为目标；“未回填”仍不表示历史观测范围等同于今天国界。1937 年苏联仅凭 [V-Dem 国家编码单元](https://v-dem.net/documents/72/countryunit_v16.pdf)作显式映射。V-Dem 数据许可为 CC BY-SA 4.0；OWID 处理成果采用 CC BY，转载第三方数据仍遵循原提供方许可。

## 快速上手：本地预览

### 环境要求

- Node.js 20 或更高版本、npm（已在 Node 24 下验证）。
- 首次安装依赖需要网络；ArcGIS 底图在线加载，无需 API Key。
- Windows、macOS、Linux 均可。**日常开发只需 npm 命令，不依赖 bash。** `scripts/*.sh` 是附带日志的便捷封装，在 Windows 上需 **Git Bash**；注意 PATH 里的 `bash` 若指向 WSL，会找不到项目路径，请显式使用 Git Bash。

### 启动开发预览

```bash
npm ci
npm run dev
```

等待终端出现 `VITE ready` 后在浏览器打开 <http://127.0.0.1:5173/>（`npm run dev` 同时监听局域网地址）。需要写日志时可用 `bash scripts/dev.sh`。结束运行按 `Ctrl+C`。

### 数据校验与生产构建

```bash
node_modules/.bin/esbuild scripts/tests/data-check.ts --bundle --platform=node --format=cjs --outfile=logs/data-check.cjs
node logs/data-check.cjs        # 数据完整性回归，出现 PASS 即通过
npm run build                   # 生成 dist/
npm run preview -- --host 127.0.0.1 --port 4173
```

以上前两行等价于 `bash scripts/check.sh`；`build.sh`、`preview.sh` 同理。预览后打开 <http://127.0.0.1:4173/>。部署静态网站时发布整个 `dist/`，尤其是 `dist/data/`，不能只上传 HTML/JS。若 `npm run build` 报无法清空 `dist/`，说明有预览进程占用，先停止它。

### 界面说明

- 默认浏览深色 Apple 风格界面；左侧列表默认只显示当前地图年份的档案，点“全部”查看所有年份。
- 右侧“来源数据”分层展示 EIU、V-Dem（含 1900—2025 长序列，可展开）、世界银行 WDI（14 项）与 WGI（六维估计值 + 标准误及时间序列）。缺失值显示为 —，不插值。

### 数据同步（可选）

首次预览不需要同步。需要更新来源数据时，使用 Git Bash 和 PowerShell 7（`pwsh`）：

```bash
bash scripts/sync-data.sh          # 全量：边界、World Bank、ClioPatria、V-Dem、COW NMC，最后运行校验
bash scripts/sync-world-bank.sh    # 仅世界银行 WDI + WGI
```

同步日志写入 `logs/`；`.env.local` 仅用于本机配置，不应提交。世界银行接口偶发 502/503/504 时，脚本会自动退避重试。

### 常见问题

- `npm ci` 报 Node 版本不兼容：升级到 Node.js 20 或更高版本。
- 地图空白：确认能访问 `/data/cliopatria/manifest.json` 与对应 `snapshots/.../world_<year>.geojson`，并确认部署时完整发布了 `dist/data/`；底图需要联网。
- 5173 或 4173 端口被占用：停止旧进程，或用 `npm run dev -- --port <端口>`。
- 在 Windows 运行 `bash scripts/*.sh` 提示找不到文件：PATH 中的 `bash` 是 WSL，改用 Git Bash，或直接运行上面的 npm / node 命令。
## 验证状态

2026-11-04：27 个 ClioPatria 快照和筛选后的 1376 条 OWID 处理序列国家—年份记录纳入本地校验，且有逐条回填状态；世界银行 WDI 覆盖 12 国 1960—2025 年七项年度指标，含 IMF GFS 财政比率且保留缺失；WGI 2026 更新版六维估计值与标准误已发布年份延至 2025。19 个可选档案对应边界面具备领导人来源；全球其他实体仍待逐项核证。来源、授权和数据边界见[真实数据与年份校验](docs/真实数据与年份校验.md)。
