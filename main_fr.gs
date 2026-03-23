/**
 * --------------------------------------------------------------------------
 * PMax Location Performance Extractor — Script Google Ads
 * --------------------------------------------------------------------------
 * Extrait les performances geographiques des campagnes Performance Max et
 * les exporte dans Google Sheets avec resume par email.
 *
 * Auteur:  Thibault Fayol — Thibault Fayol Consulting
 * Site:    https://thibaultfayol.com
 * Licence: MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  TEST_MODE: true,
  SHEET_URL: "https://docs.google.com/spreadsheets/d/VOTRE_SHEET_ID/edit",
  EMAIL: "vous@domaine.com",
  DATE_RANGE: "LAST_30_DAYS",
  TOP_N: 10
};

function main() {
  try {
    Logger.log("=== Extracteur Geo PMax ===");
    Logger.log("Mode : " + (CONFIG.TEST_MODE ? "TEST (simulation)" : "PRODUCTION"));

    var query =
      "SELECT campaign.name, campaign_criterion.location.geo_target_constant, " +
      "metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions " +
      "FROM location_view " +
      "WHERE campaign.advertising_channel_type = 'PERFORMANCE_MAX' " +
      "AND segments.date DURING " + CONFIG.DATE_RANGE;

    var rows = AdsApp.search(query);
    var donnees = [];

    while (rows.hasNext()) {
      var row = rows.next();
      var cout = row.metrics.costMicros / 1000000;
      var localisation = row.campaignCriterion.location.geoTargetConstant || "(inconnue)";

      donnees.push({
        campagne: row.campaign.name,
        localisation: localisation,
        clicks: row.metrics.clicks,
        impressions: row.metrics.impressions,
        cout: cout,
        conversions: row.metrics.conversions,
        ctr: row.metrics.impressions > 0 ? (row.metrics.clicks / row.metrics.impressions * 100) : 0,
        cpa: row.metrics.conversions > 0 ? (cout / row.metrics.conversions) : 0
      });
    }

    Logger.log("Localisations extraites : " + donnees.length);

    if (donnees.length === 0) {
      Logger.log("Aucune donnee geo PMax trouvee.");
      return;
    }

    donnees.sort(function(a, b) { return b.cout - a.cout; });

    if (!CONFIG.TEST_MODE) {
      ecrireDansSheet(donnees);
    }

    var logLimit = Math.min(donnees.length, 10);
    for (var i = 0; i < logLimit; i++) {
      var d = donnees[i];
      Logger.log("  " + d.campagne + " | " + d.localisation + " | Clics: " + d.clicks +
                 " | Cout: " + d.cout.toFixed(2) + " | Conv: " + d.conversions);
    }

    envoyerResume(donnees);
    Logger.log("=== Termine ===");

  } catch (e) {
    Logger.log("ERREUR : " + e.message);
    MailApp.sendEmail(CONFIG.EMAIL, "Extracteur Geo PMax — Erreur Script",
      "Erreur :\n\n" + e.message + "\n\nStack : " + e.stack);
  }
}

function ecrireDansSheet(donnees) {
  var sheet = SpreadsheetApp.openByUrl(CONFIG.SHEET_URL).getActiveSheet();
  sheet.clearContents();

  var output = [["Campagne", "Localisation", "Clics", "Impressions", "CTR %", "Cout", "Conversions", "CPA"]];
  for (var i = 0; i < donnees.length; i++) {
    var d = donnees[i];
    output.push([d.campagne, d.localisation, d.clicks, d.impressions, d.ctr.toFixed(2), d.cout.toFixed(2), d.conversions, d.cpa.toFixed(2)]);
  }

  sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
  Logger.log("Sheet mis a jour avec " + donnees.length + " lignes.");
}

function envoyerResume(donnees) {
  var compte = AdsApp.currentAccount().getName();
  var parConv = donnees.slice().sort(function(a, b) { return b.conversions - a.conversions; });
  var avecConv = donnees.filter(function(d) { return d.conversions > 0; });
  var parCpa = avecConv.slice().sort(function(a, b) { return b.cpa - a.cpa; });

  var sujet = "Rapport Geo PMax : " + donnees.length + " localisations — " + compte;

  var corps = "Extracteur Performance Geographique PMax\n";
  corps += "Compte : " + compte + "\n";
  corps += "Periode : " + CONFIG.DATE_RANGE + "\n";
  corps += "Total localisations : " + donnees.length + "\n\n";

  corps += "TOP " + CONFIG.TOP_N + " LOCALISATIONS (par conversions) :\n";
  corps += "-------------------------------------------\n";
  var topLimit = Math.min(parConv.length, CONFIG.TOP_N);
  for (var i = 0; i < topLimit; i++) {
    var t = parConv[i];
    corps += (i + 1) + ". " + t.localisation + " (" + t.campagne + ")\n";
    corps += "   Conv: " + t.conversions + " | Cout: " + t.cout.toFixed(2) + " | CPA: " + t.cpa.toFixed(2) + "\n";
  }

  corps += "\nFLOP " + CONFIG.TOP_N + " LOCALISATIONS (CPA le plus eleve) :\n";
  corps += "-------------------------------------------\n";
  var bottomLimit = Math.min(parCpa.length, CONFIG.TOP_N);
  for (var j = 0; j < bottomLimit; j++) {
    var b = parCpa[j];
    corps += (j + 1) + ". " + b.localisation + " (" + b.campagne + ")\n";
    corps += "   Conv: " + b.conversions + " | Cout: " + b.cout.toFixed(2) + " | CPA: " + b.cpa.toFixed(2) + "\n";
  }

  MailApp.sendEmail(CONFIG.EMAIL, sujet, corps);
  Logger.log("Email de resume envoye a " + CONFIG.EMAIL);
}
