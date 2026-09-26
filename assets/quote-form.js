/* Builds a mailto: to sales@ with the three quote fields. No server. */
(function () {
  var form = document.querySelector("[data-quote-form]");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    if (form.querySelector('[name="gateway"]')) {
      var fields = [
        ["Gateway", "gateway"],
        ["Destination country", "destination_country"],
        ["Destination city", "destination_city"],
        ["Cargo description", "cargo_description"],
        ["Volume (m³)", "volume_m3"],
        ["Weight (tons)", "weight_tons"],
        ["Number of trucks", "truck_count"],
        ["Cargo ready date", "cargo_ready_date"],
        ["TIR needed", "tir_needed"],
        ["Contact name", "contact_name"],
        ["Company", "company"],
        ["Email", "email"],
        ["WeChat", "wechat"],
        ["Telegram", "telegram"],
        ["WhatsApp", "whatsapp"]
      ];
      var quoteLines = fields.map(function (pair) {
        var value = fd.get(pair[1]);
        return pair[0] + ": " + (value == null ? "" : String(value).trim());
      });
      var country = String(fd.get("destination_country") || "").trim();
      var city = String(fd.get("destination_city") || "").trim();
      var subject = "Road Freight Quote Request — " + country + (city ? " / " + city : "");
      var body = ["CargoIranTruck road freight inquiry", "", quoteLines.join("\n"), "", "Please reply with a formal quote including its reference number and validity date."] .join("\n");
      location.href = "mailto:sales@cargoirantruck.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      return;
    }
    function v(name) {
      var x = fd.get(name);
      return (x == null ? "" : String(x)).trim();
    }
    var hub = v("hub");
    var dest = v("dest");
    var hs = v("hs");
    var kg = v("kg");
    var cbm = v("cbm");
    var lithium = fd.get("lithium") ? "yes" : "no";
    var oog = fd.get("oog") ? "yes" : "no";
    var notes = v("notes");
    var contact = v("contact");
    if (!hub || !dest || !kg || !cbm) {
      form.reportValidity();
      return;
    }
    var lines = [
      "China–Iran TIR quote request",
      "",
      "Origin hub: " + hub,
      "Destination customs: " + dest,
      "HS code: " + (hs || "(not given)"),
      "Gross weight kg: " + kg,
      "Volume CBM: " + cbm,
      "Class 9 lithium / chemicals (MSDS to follow): " + lithium,
      "Out-of-gauge (drawing to follow): " + oog,
      "Contact: " + (contact || "(see email From:)"),
      "",
      notes ? "Notes:\n" + notes : ""
    ];
    var body = lines.join("\n").replace(/\n+$/, "");
    var subject = "RFQ " + hub + " → " + dest + " / " + kg + " kg / " + cbm + " CBM";
    location.href =
      "mailto:sales@cargoirantruck.com?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);
  });
})();
