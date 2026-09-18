# 历史边界图层

PolityLens 首版使用 [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps) 的 GeoJSON 快照作为历史边界参考。

## 当前快照

2026-09-18 已下载并核验：`1900`、`1914`、`1920`、`1930`、`1938`、`1945`、`1960`、`1994`、`2000`、`2010`。来源固定为上游提交 `da7a4b735ecef70aebdc9c73e409d8a2500d50f3`；`manifest.json` 保存每份文件的 SHA-256、要素数与抓取时间。

选中档案时，地图年份跟随档案年份，图标只显示同年记录。现代国界底图已取消，历史层不再叠加现代国家边界，也不再依赖 ArcGIS API Key。ArcGIS 运行库的部分资源仍可能需要网络。

默认使用不晚于目标年的最近快照，并在界面显示真实快照年和相差年数，不做边界插值。因此 1932 → 1930、1937 → 1930、1966 → 1960、1995 → 1994、2024 → 2010，原先这些年份空白的问题已经消除。用户可开启“仅限同年边界”；没有同年快照时地图会明确提示并移除边界。这些较早快照只是参考，不代表目标年份的精确边界。

同年快照也不代表该年每一天的边界完全一致。1938 年等存在年内重大变化，当前上游没有提供统一的月日基准。尚未逐条交叉考证边界，不宣称已经补全逐年国界。

文件位置：

```text
public/data/historical-basemaps/index.json
public/data/historical-basemaps/manifest.json
public/data/historical-basemaps/raw/world_<年份>.geojson
public/data/historical-basemaps/corrected/world_<年份>.geojson
```

## 字段

- `NAME` / `DISPLAY_NAME`：界面使用的国家或区域名称
- `SUBJECTO` / `PARTOF`：经过本项目审校的管辖与所属字段
- `SOURCE_NAME` / `SOURCE_SUBJECTO` / `SOURCE_PARTOF`：上游原始字段，便于复核
- `LEADER`：该边界条目的领导人；尚未逐国核验时明确写为“待补充”
- `ADMIN_STATUS` / `CORRECTION_SOURCE`：修正说明与依据
- `BORDERPRECISION`：1 近似、2 中等、3 由国际法确定

数据为 WGS84 / EPSG:4326。ArcGIS 只提供底图，历史边界由本地 `GeoJSONLayer` 提供。

## 已审校的东亚规则

- 1900 年上游 `Manchu Empire` 改为正式政权名 `Qing Empire`；1914 年仍沿用该名称的要素按年份改为 `China`，同时保留原始名称。
- 上游单列的新疆区域统一标为 `China · Xinjiang`，`SUBJECTO` 与 `PARTOF` 均为 `China`。其他年份中，新疆随中国整体几何显示。
- 1938 年从日本复合几何中移除东北中国大面，以 1930 年上游满洲几何单列 `Manchukuo`，标明其为日本实际控制的傀儡政权，不计入日本帝国领土；朝鲜半岛另列为日本统治区域。
- 1966 年使用 1960 年快照时，西藏区域显示为 `China · Tibet`，`SUBJECTO` 与 `PARTOF` 均为 `China`。

这些规则针对当前产品的显示错误做审校，不替代逐年、逐日的完整边界研究。修正参考包括 [清朝](https://en.wikipedia.org/wiki/Qing_dynasty)、[清朝统治下的新疆](https://en.wikipedia.org/wiki/Xinjiang_under_Qing_rule)、[西藏自治区](https://en.wikipedia.org/wiki/Tibet_Autonomous_Region)以及 [Google Arts & Culture 的满洲国条目](https://artsandculture.google.com/entity/manchukuo/m0fctx?hl=en)。

## 重要限制

该仓库明确说明项目仍在持续修订，历史边界需要与其他来源交叉核验后才适合学术使用。古代和前现代区域可能重叠，现代海岸线与历史海岸线也不一定一致。首版只把数据作为历史可视化参考，不把它自动转换成主权、民主或国家能力事实。

历史边界数据的许可和归属以仓库内 `LICENSE` 与上游仓库说明为准；本项目不移除原始数据文件中的来源边界。使用或重新分发前，应继续检查 GPL-3.0 对派生数据和项目发布方式的要求。
