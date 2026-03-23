/**
 * --------------------------------------------------------------------------
 * PMax Location Performance Extractor — Google Ads Script
 * --------------------------------------------------------------------------
 * Extracts geographic performance data from Performance Max campaigns and
 * exports it to Google Sheets with email summary.
 *
 * Author:  Thibault Fayol — Thibault Fayol Consulting
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  TEST_MODE: true,
  SHEET_URL: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit",
  EMAIL: "you@domain.com",
  DATE_RANGE: "LAST_30_DAYS",
  TOP_N: 10
};

function main() {
  try {
    Logger.log("=== PMax Location Performance Extractor ===");
    Logger.log("Mode: " + (CONFIG.TEST_MODE ? "TEST (dry run)" : "LIVE"));

    var query =
      "SELECT campaign.name, campaign_criterion.location.geo_target_constant, " +
      "metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions " +
      "FROM location_view " +
      "WHERE campaign.advertising_channel_type = 'PERFORMANCE_MAX' " +
      "AND segments.date DURING " + CONFIG.DATE_RANGE;

    var rows = AdsApp.search(query);
    var data = [];

    while (rows.hasNext()) {
      var row = rows.next();
      var cost = row.metrics.costMicros / 1000000;
      var location = row.campaignCriterion.location.geoTargetConstant || "(unknown)";

      data.push({
        campaign: row.campaign.name,
        location: location,
        clicks: row.metrics.clicks,
        impressions: row.metrics.impressions,
        cost: cost,
        conversions: row.metrics.conversions,
        ctr: row.metrics.impressions > 0 ? (row.metrics.clicks / row.metrics.impressions * 100) : 0,
        cpa: row.metrics.conversions > 0 ? (cost / row.metrics.conversions) : 0
      });
    }

    Logger.log("Locations extracted: " + data.length);

    if (data.length === 0) {
      Logger.log("No PMax location data found.");
      return;
    }

    data.sort(function(a, b) { return b.cost - a.cost; });

    if (!CONFIG.TEST_MODE) {
      writeToSheet(data);
    }

    var logLimit = Math.min(data.length, 10);
    for (var i = 0; i < logLimit; i++) {
      var d = data[i];
      Logger.log("  " + d.campaign + " | " + d.location + " | Clicks: " + d.clicks +
                 " | Cost: " + d.cost.toFixed(2) + " | Conv: " + d.conversions);
    }

    sendSummary(data);
    Logger.log("=== Done ===");

  } catch (e) {
    Logger.log("ERROR: " + e.message);
    MailApp.sendEmail(CONFIG.EMAIL, "PMax Location Extractor — Script Error",
      "Error:\n\n" + e.message + "\n\nStack: " + e.stack);
  }
}

function writeToSheet(data) {
  var sheet = SpreadsheetApp.openByUrl(CONFIG.SHEET_URL).getActiveSheet();
  sheet.clearContents();

  var output = [["Campaign", "Location", "Clicks", "Impressions", "CTR %", "Cost", "Conversions", "CPA"]];
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    output.push([d.campaign, d.location, d.clicks, d.impressions, d.ctr.toFixed(2), d.cost.toFixed(2), d.conversions, d.cpa.toFixed(2)]);
  }

  sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
  Logger.log("Sheet updated with " + data.length + " rows.");
}

function sendSummary(data) {
  var account = AdsApp.currentAccount().getName();
  var byConv = data.slice().sort(function(a, b) { return b.conversions - a.conversions; });
  var withConv = data.filter(function(d) { return d.conversions > 0; });
  var byCpa = withConv.slice().sort(function(a, b) { return b.cpa - a.cpa; });

  var subject = "PMax Location Report: " + data.length + " locations — " + account;

  var body = "PMax Location Performance Extractor\n";
  body += "Account: " + account + "\n";
  body += "Date range: " + CONFIG.DATE_RANGE + "\n";
  body += "Total locations: " + data.length + "\n\n";

  body += "TOP " + CONFIG.TOP_N + " LOCATIONS (by conversions):\n";
  body += "-------------------------------------------\n";
  var topLimit = Math.min(byConv.length, CONFIG.TOP_N);
  for (var i = 0; i < topLimit; i++) {
    var t = byConv[i];
    body += (i + 1) + ". " + t.location + " (" + t.campaign + ")\n";
    body += "   Conv: " + t.conversions + " | Cost: " + t.cost.toFixed(2) + " | CPA: " + t.cpa.toFixed(2) + "\n";
  }

  body += "\nBOTTOM " + CONFIG.TOP_N + " LOCATIONS (highest CPA):\n";
  body += "-------------------------------------------\n";
  var bottomLimit = Math.min(byCpa.length, CONFIG.TOP_N);
  for (var j = 0; j < bottomLimit; j++) {
    var b = byCpa[j];
    body += (j + 1) + ". " + b.location + " (" + b.campaign + ")\n";
    body += "   Conv: " + b.conversions + " | Cost: " + b.cost.toFixed(2) + " | CPA: " + b.cpa.toFixed(2) + "\n";
  }

  MailApp.sendEmail(CONFIG.EMAIL, subject, body);
  Logger.log("Summary email sent to " + CONFIG.EMAIL);
}
