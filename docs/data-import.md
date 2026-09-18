# 真实数据导入协议

PolityLens 不在前端猜测数据。导入文件必须同时携带观测值和来源元数据；缺少来源版本、抓取日期或基础身份字段的记录会被拒绝。

## 支持格式

- `.json`：数组，或 `{ "records": [] }` / `{ "data": [] }`
- `.csv`：第一行是字段名，文本字段中的逗号需要使用双引号包裹

## 必填字段

```text
country,iso,year,sourceId,sourceVersion,retrievedAt
```

`sourceId` 必须存在于 `src/data/sourceCatalog.js`。`sourceVersion` 填写数据集版本、发布日期或报告版本，不能写 `latest` 这种不可复现的值。`retrievedAt` 使用 `YYYY-MM-DD`。

## 可选字段

```text
id,regime,leader,longitude,latitude,observationStatus
```

民主与权利字段使用 `dri_` 前缀，例如 `dri_competition`；国家能力使用 `capacity_` 前缀；七个国力板块使用 `power_` 前缀。

Pp 方程输入使用：

```text
pp_C,pp_E,pp_M,pp_S,pp_W
```

五个输入必须都是经过数据字典说明的 0-100 归一化观测值。只要其中一个缺失，Pp 就显示 `UNAVAILABLE`，不会按 0 计算。

## 当前来源边界

- EIU Democracy Index：官方页面说明 60 项指标、五大类和 0-10 评分；详细数据的使用必须遵守 EIU 条款。
- 中国的民主：国务院新闻办公室公开政策文本；它是文本证据，不是跨国可比的数值数据集。
- V-Dem：民主多维历史测量，导入时需要保留数据版本和变量代码。
- World Bank WGI：国家治理指标，导入时需要保留维度、估计值/标准误和版本。
- COW NMC：物质能力变量，不直接等同于 Pp 或现代综合国力。
- World Bank Indicators API：宏观原始指标，导入时必须保留指标代码、单位和年份。
- historical-basemaps：历史边界 GeoJSON 参考图层，不是现代国界替代品；当前已下载快照和许可见 `docs/historical-boundaries.md`。

这些来源不能未经口径说明直接加总。当前 `src/data/regimes.js` 的数值仍是合成占位值，不属于以上来源的已发布观测。
