# data/medicines — source research for P2-1 (medicine data)

**Status 2026-10-15: loaded and in use.** `janaushadhi_mrp.csv` is the PMBI product list (2,439 rows, downloaded from the portal's CSV button on 2026-10-15). `brands.csv.gz` is the Indian Medicine Dataset with discontinued and non-allopathic rows removed and each composition normalised into a comparable key (246,064 brands). Both are built by `scripts/load_medicines.py build` and loaded into Postgres by `scripts/load_medicines.py load`; the app reads them through `GET /medicines/search` and `POST /medicines/scan`. Raw downloads go in `raw/` (gitignored). 1,029 of the 1,566 Jan Aushadhi products that have a parsed composition have at least one matching brand. NPPA ceiling prices (section 2 below) are still not used.

Researched 2026-10-14. Nothing large is committed here yet. Files were downloaded to a scratchpad only to count rows and read column names.

## 1. Jan Aushadhi (PMBI) product list with MRP — official, not yet downloaded

| Field | Value |
|---|---|
| Page | https://janaushadhi.gov.in/product-portfolio/product-mrp-list |
| Issuer | Pharmaceuticals & Medical Devices Bureau of India (PMBI), Department of Pharmaceuticals |
| Format | Web table with PDF and CSV download buttons (per the portal's own page) |
| Columns (as shown on the page) | Sr. No., Drug Code, Generic Name, Unit Size, MRP, Group Name |
| Date | Live list, no edition date found |
| License | Government of India public information; no explicit licence found. Confirm before redistributing |

How far I got: the portal is a React single-page app. The table is filled from a POST call to `/api/v1/website/getAllProductForWeb` on a separate API host that the bundle reads from an environment variable, so the data can't be fetched with a plain request without more reverse-engineering. The scripted download was **not completed**. The quickest route is a human opening the page and pressing the CSV button, then dropping the file into `data/medicines/raw/` (gitignored). Old official PDFs exist but are stale (Dec 2014 `https://www.pmbi.co.in/old-data/PriceListDec2014.pdf`, Oct 2015 `https://www.pmbi.co.in/old-data/New_MRP_Oct15.pdf`); do not use them for prices.

## 2. NPPA ceiling prices — official, PDF only

| Field | Value |
|---|---|
| Index page | https://nppa.gov.in/en/therapeuticcategorywiseceilingpricelist |
| Issuer | National Pharmaceutical Pricing Authority (NPPA), Department of Pharmaceuticals |
| Format | PDF only. No Excel or CSV master list found |
| Files tested | Cardio-vascular category list (https://nppa.gov.in/storage/uploads/pdf/2845-fb-posts-cardio-ea1e3eda2076b6367cf9a9685da62f95.pdf, 1 MB, text layer present, about 70 rows) and the 2023 gazette order S.O. 2125(E) dated 4 May 2023 (https://nppa.gov.in/storage/uploads/tender/4c44ea663cc0e2ad9a03aad668cdd20c.pdf, 200 KB) |
| Other category PDFs on the same page | anti-cancer, anti-diabetes, anti-HIV, anti-TB (same naming pattern, under `/storage/uploads/pdf/2845-fb-posts-...`) |
| Columns (read from the cardio list) | serial number, formulation (generic name), dosage form and strength, unit, ceiling price in Rs per unit |
| Date | Per-category lists carry no date on the page. Ceiling prices are revised each April for the annual WPI change (the order above is one such revision and cites DPCO 2013 paras 4, 6, 10, 11, 14, 16, 17 and 18) |
| License | Government of India public information; no explicit licence found |

Parsing note: the text layer exists, so `pdftotext -layout` works, but formulations with several strengths span rows and need joining. Expect roughly 750 scheduled formulations in total across categories, per NPPA's own newsletter; the category PDFs I opened did not add up to a complete list, so cross-check against the gazette annexures before relying on coverage.

## 3. Brand → composition dataset (public, not official)

| Field | Value |
|---|---|
| Chosen dataset | Indian Medicine Dataset, https://github.com/junioralive/Indian-Medicine-Dataset |
| Raw file | https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/main/DATA/indian_medicine_data.csv (31.8 MB) |
| Format | CSV (a JSON copy is also in the repo) |
| Rows | 253,973 (header excluded; matches the README's TOTAL MEDICINES) |
| Columns | `id`, `name`, `price(₹)`, `Is_discontinued`, `manufacturer_name`, `type`, `pack_size_label`, `short_composition1`, `short_composition2` |
| Example row | `1, Augmentin 625 Duo Tablet, 223.42, FALSE, Glaxo SmithKline Pharmaceuticals Ltd, allopathy, strip of 10 tablets, Amoxycillin (500mg), Clavulanic Acid (125mg)` |
| Date | Repository last pushed 2026-06-27; the repo gives no price date; the related Kaggle A-Z dataset reports prices as of November 2022, so treat prices as indicative, not current |
| License | MIT (repo-level, per the GitHub API). The upstream facts were scraped from a commercial site, so the data's provenance is unclear; use for matching composition, not as a price authority |
| Kaggle equivalent | "A-Z Medicine Dataset of India" (uploader shudhanshusingh), same shape; downloading from Kaggle needs a login, so the GitHub copy is used instead |

Data quality notes: two composition columns (a medicine with three or more salts is truncated or missing); salt names carry stray spaces and mixed spelling (`Amoxycillin` vs `Amoxicillin`), and strengths are embedded in the string like `Amoxycillin  (500mg)`, so P2-1 needs a normalisation pass. The `Is_discontinued` flag should be used to drop dead brands.

## Suggested join for P2-1

Jan Aushadhi generic name + strength → normalised composition key → brand rows in dataset 3 → NPPA ceiling price where the formulation is scheduled. Prices shown to patients should always cite the PMBI MRP or NPPA ceiling, never the scraped brand price.
