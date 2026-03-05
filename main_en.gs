/**
 * pmax-location-performance-extractor - Google Ads Script for SMBs
 * Author: Thibault Fayol
 */
var CONFIG = { TEST_MODE: true };
function main(){
  var query = "SELECT campaign_criterion.location.geo_target_constant, metrics.cost_micros FROM location_view";
  var rows = AdsApp.search(query);
  while(rows.hasNext()){ Logger.log(rows.next().metrics.costMicros); }
}