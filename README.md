# PMax Location Performance Extractor

A Google Ads Script that extracts geographic performance data from Performance Max campaigns and exports it to Google Sheets.

## What It Does

- Queries location-level metrics for all PMax campaigns via GAQL
- Exports data to Google Sheets using batch `setValues()` for performance
- Calculates CTR and CPA per location
- Sends an email summary highlighting top and worst performing locations

## Setup

1. In Google Ads, go to **Tools > Bulk Actions > Scripts**
2. Click **+** to create a new script
3. Paste the contents of `main_en.gs` (or `main_fr.gs` for French)
4. Update the `CONFIG` block with your settings
5. **Authorize** the script when prompted
6. Create a Google Sheet and paste its URL into `CONFIG.SHEET_URL`
7. Set `TEST_MODE` to `false` when ready to export data
8. Schedule to run **weekly**

## CONFIG Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `TEST_MODE` | boolean | `true` | When true, logs only. When false, writes to Sheet and sends email. |
| `SHEET_URL` | string | — | URL of the Google Sheet for data export. |
| `EMAIL` | string | — | Email address for summary notifications. |
| `DATE_RANGE` | string | `LAST_30_DAYS` | GAQL date range. |
| `TOP_N` | number | `10` | Number of top/bottom locations to highlight in the email. |

## How It Works

1. Runs a GAQL query against `location_view` filtered to PMax campaigns
2. Collects clicks, impressions, cost, and conversions per location
3. Calculates CTR and CPA for each location
4. Writes all data to Google Sheets in a single batch operation
5. Sends an email with the top N locations (by conversions) and bottom N (by CPA)

## Requirements

- Google Ads account with active Performance Max campaigns
- Google Sheets (for data export)
- Script authorization for Sheets and email

## Languages

- `main_en.gs` — English
- `main_fr.gs` — French

## License

MIT — Thibault Fayol Consulting
