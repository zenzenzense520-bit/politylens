# 历史边界图层

PolityLens 的主历史图层来自 [Seshat Global History Databank / ClioPatria](https://github.com/Seshat-Global-History-Databank/cliopatria)。当前固定上游提交 `ad28a691b7c07c1fca89d0e0636d324667d2a258`，原始数据为 CC BY 4.0。项目保留来源提交、输入文件 SHA-256、抓取时间、每份快照哈希与要素数。

## 当前快照

界面使用 27 个同年快照：`1900`、`1914`、`1919`、`1920`、`1925`、`1928`、`1929`、`1930`、`1931`、`1932`、`1933`、`1937`、`1938`、`1941`、`1945`、`1954`、`1960`、`1965`、`1966`、`1978`、`1992`、`1994`、`1995`、`2000`、`2010`、`2020`、`2024`。这些年份覆盖现有全部国家档案，因此不再用 1930 冒充 1932，也不再用 2010 冒充 2024。

快照从 ClioPatria 的政治实体时段记录筛选：只有 `FromYear ≤ 目标年 ≤ ToYear` 的 `POLITY` 要素进入地图，括号包围的帝国聚合面不直接绘制，避免与组成地区重复。ClioPatria 自身说明几何是一种历史领土解释；本项目据此展示目标年份快照，不宣称精确到月日。

## 领土关系口径

- 殖民地保留自身名称，同时把 `ADMIN_NAME` 设为宗主国，分析时计入本国领土。
- 傀儡政权作为独立分析主体，不并入控制国；1932—1945 年满洲国按此规则单列。
- 争议地区按目标年份实际控制者计入，并以 `de_facto_control` 标明，不把实控表达成主权裁决。
- 复合政治关系若没有足够证据，不自动推断为殖民地。
- 新疆在所有目标年份均归入中国；1966 年西藏归入中华人民共和国。上游目标年几何漏出参考点时，使用 historical-basemaps 已审校区域面补足并标注为派生修改。

地图点击边界面会显示国名、分析主体、领土口径、有效年份、ClioPatria 实体名及 Wikipedia、Wikidata、Seshat 链接。15 个已核验国家—年份同时显示真实领导人和来源；其他边界明确显示“领导人资料待补充”。

## 文件与字段

```text
public/data/cliopatria/manifest.json
public/data/cliopatria/entities.json
public/data/cliopatria/snapshots/<年代>/world_<年份>.geojson
public/data/cliopatria/ATTRIBUTION.md
public/data/historical-basemaps/{raw,corrected}/world_<年份>.geojson
```

关键派生字段包括 `DISPLAY_NAME`、`ADMIN_NAME`、`TERRITORIAL_STATUS`、`POLICY_NOTE`、`SOURCE_NAME`、`LEADER` 和来源链接。坐标为 WGS84 / EPSG:4326；`Area` 沿用 ClioPatria 的 EPSG:6933 面积字段。

## 限制与许可

ClioPatria 数据按 CC BY 4.0 署名使用；historical-basemaps 的审校参考继续保留其上游许可。边界图用于比较和追溯，不替代国际法判断。领导人目前只对界面已有 15 个国家—年份档案完成逐条核验，其余实体保留明确缺失状态。
