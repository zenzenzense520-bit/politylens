# Pp 国力方程方法说明

## 方程与来源

PolityLens 的「国力」维度采用克莱因国力方程（Ray Cline）：

```
Pp = (C + E + M) × (S + W)
```

| 组件 | 含义 | 数据来源 | 量纲 |
|---|---|---|---|
| C | 基本实体（人口） | COW NMC `tpop` | 0–100 |
| E | 经济能力（能源 + 钢铁） | COW NMC `pec`、`irst` | 0–100 |
| M | 军事能力（军费 + 军队） | COW NMC `milex`、`milper` | 0–100 |
| S | 战略意图 | 专家编码 | 0–1 系数 |
| W | 国家意志 | 专家编码 | 0–1 系数 |

数据源：**Correlates of War — National Material Capabilities v7.0**（1816–2022），
下载地址 `https://correlatesofwar.org/data-sets/national-material-capabilities/`。
原始 CSV 固化在 `scripts/data/nmc-source.csv`，由 `scripts/data/generate-nmc.mjs` 生成 `public/data/observations/nmc.json`。

## 归一化规则

C/E/M 三个物质组件统一按「**值 / 当年全球最大值 × 100**」归一化，同年内相对可比：

- `C = tpop / max(tpop, 当年) × 100`
- `E = avg( pec / max(pec, 当年), irst / max(irst, 当年) ) × 100`
- `M = avg( milex / max(milex, 当年), milper / max(milper, 当年) ) × 100`

归一化只做同年相对比较，不跨年比较绝对值；原始值保留在 `nmc.json` 的 `raw` 字段，可追溯核验。

## S/W 专家编码

S（战略意图）与 W（国家意志）本质是主观系数，无法从物质能力数据推得。本项目对现有政权做
**0–1 专家编码**，编码表在 `src/data/ppCoding.js`，每个政权保留 `sNote` / `wNote` 说明依据。
编码属于主观判断，不冒充可复算的物质量化。

## 局限声明

1. **领土未纳入 C**：COW NMC 不含领土面积，C 当前只由总人口代理；如需精确，可后续引入
   COW Territorial Change 数据集。
2. **现代档案数据年错位**：NMC v7.0 最新到 2022 年，现代政权档案（2024）的 C/E/M 使用
   2022 年数据，`nmc.json` 以 `dataYear` 字段明确标注，不伪装成同年观测。
3. **S/W 主观性**：专家编码依赖公开历史叙事，不同研究者可能给出不同值；这是国力方程的
   固有限制，而非本平台的取舍。
4. **着色参考值**：地图着色以 `PP_MAX_REFERENCE = 300` 为参考量级（约当前样本最高 Pp），
   非理论最大值 600，不构成绝对排名。
