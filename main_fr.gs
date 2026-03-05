/**
 * --------------------------------------------------------------------------
 * pmax-location-performance-extractor - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Author: Thibault Fayol - Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */
var CONFIG = { TEST_MODE: true, SHEET_URL: "https://docs.google.com/..." };
function main() {
    Logger.log("Extraction des métriques PMax Localisation...");
    var query = "SELECT campaign.name, campaign_criterion.location.geo_target_constant, metrics.cost_micros, metrics.conversions FROM location_view WHERE metrics.cost_micros > 0";
    var rows = AdsApp.search(query);
    var count = 0;
    while(rows.hasNext()) { 
        var row = rows.next();
        count++;
    }
    Logger.log("A extrait " + count + " métriques de ciblages géographiques.");
}
