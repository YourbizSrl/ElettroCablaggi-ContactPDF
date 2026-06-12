import React, { useState } from "react";
import { Button, Text, Flex, Alert, LoadingSpinner } from "@hubspot/ui-extensions";
import { hubspot } from "@hubspot/ui-extensions";

hubspot.extend(({ context, actions }) => (
  <ContactPDFCard context={context} actions={actions} />
));

// Campi specifici per tipo oggetto (objectTypeId)
const OBJECT_CONFIG = {
  "0-1": {
    title: "Scheda Contatto",
    fields: [
      { key: "firstname",  label: "Nome" },
      { key: "lastname",   label: "Cognome" },
      { key: "email",      label: "Email" },
      { key: "phone",      label: "Telefono" },
      { key: "company",    label: "Azienda" },
    ],
  },
  "0-2": {
    title: "Scheda Azienda",
    fields: [
      { key: "name",       label: "Nome" },
      { key: "domain",     label: "Sito" },
      { key: "phone",      label: "Telefono" },
      { key: "industry",   label: "Settore" },
      { key: "city",       label: "Citta'" },
    ],
  },
  "0-3": {
    title: "Scheda Deal",
    fields: [
      { key: "dealname",    label: "Nome deal" },
      { key: "amount",      label: "Importo" },
      { key: "dealstage",   label: "Fase" },
      { key: "closedate",   label: "Chiusura" },
    ],
  },
  "0-5": {
    title: "Scheda Ticket",
    fields: [
      { key: "subject",               label: "Oggetto" },
      { key: "content",               label: "Descrizione" },
      { key: "hs_ticket_priority",    label: "Priorita'" },
      { key: "hs_pipeline_stage",     label: "Stato" },
    ],
  },
  "0-421": {
    title: "Appuntamento",
    fields: null,
  },
  "appointment": {
    title: "Appuntamento",
    fields: null,
  },
};

// Proprietà interne da escludere nel fallback '*'
const SKIP_KEYS = new Set([
  "hs_object_id","hs_createdate","hs_lastmodifieddate",
  "hs_was_imported","hs_created_by_user_id","hs_updated_by_user_id",
]);

const ContactPDFCard = ({ context, actions }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePDF = async () => {
    setLoading(true);
    setError(null);

    try {
      const typeId = context.crm.objectTypeId;
      const cfg = OBJECT_CONFIG[typeId];
      let docTitle = cfg ? cfg.title : "Scheda";
      let rows = [];

      if (cfg && cfg.fields) {
        const props = await actions.fetchCrmObjectProperties(
          cfg.fields.map((f) => f.key)
        );
        rows = cfg.fields.map((f) => ({
          label: f.label,
          value: props[f.key] || "N/A",
        }));
        // Titolo documento = nome/cognome per contatti
        if (typeId === "0-1") {
          const n = `${props.firstname || ""} ${props.lastname || ""}`.trim();
          if (n) docTitle = n;
        }
      } else {
        // Fetch tutto e filtra i non-null
        const all = await actions.fetchCrmObjectProperties("*");
        rows = Object.entries(all)
          .filter(([k, v]) => v && v !== "" && !SKIP_KEYS.has(k))
          .slice(0, 25)
          .map(([k, v]) => ({ label: k, value: String(v) }));
      }

      const tableRows = rows
        .map((r) =>
          "<tr>" +
          "<td class='cb-cell'><input type='checkbox' class='field-cb' checked onchange='updateBtn()'></td>" +
          "<td class='lbl'>" + r.label + "</td>" +
          "<td>" + r.value + "</td>" +
          "</tr>"
        )
        .join("");

      const safeTitle = docTitle.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

      const html = [
        "<!DOCTYPE html><html lang='it'><head><meta charset='UTF-8'>",
        "<script src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'><\/script>",
        "<style>",
        "body{font-family:Arial,sans-serif;padding:20px;color:#333;margin:0}",
        "h1{font-size:20px;color:#0066cc;border-bottom:2px solid #0066cc;padding-bottom:8px;margin-bottom:12px}",
        ".intro{font-size:13px;color:#666;margin-bottom:12px}",
        ".quick-actions{display:flex;gap:8px;margin-bottom:14px}",
        ".btn-sm{padding:5px 12px;font-size:12px;border:1px solid #ccc;background:#f5f5f5;border-radius:3px;cursor:pointer}",
        ".btn-sm:hover{background:#e8e8e8}",
        "table{width:100%;border-collapse:collapse}",
        "td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;vertical-align:middle}",
        "td.cb-cell{width:28px;text-align:center;padding:8px 4px}",
        "td.lbl{font-weight:bold;color:#555;width:130px}",
        "#btn-download{margin-top:16px;padding:10px 20px;background:#0066cc;color:white;border:none;border-radius:4px;font-size:13px;cursor:pointer}",
        "#btn-download:hover{background:#0052a3}",
        "#btn-download:disabled{background:#aaa;cursor:default}",
        "@media print{.quick-actions,#btn-download,.intro,.cb-cell{display:none !important}}",
        "</style>",
        "<script>",
        "var docTitle='" + safeTitle + "';",
        "function updateBtn(){var any=Array.from(document.querySelectorAll('.field-cb')).some(function(c){return c.checked;});document.getElementById('btn-download').disabled=!any;}",
        "function selAll(){document.querySelectorAll('.field-cb').forEach(function(c){c.checked=true;});updateBtn();}",
        "function deselAll(){document.querySelectorAll('.field-cb').forEach(function(c){c.checked=false;});updateBtn();}",
        "function downloadPDF(){",
        "  var btn=document.getElementById('btn-download');",
        "  if(typeof html2pdf==='undefined'){window.print();return;}",
        "  btn.disabled=true;btn.textContent='Generazione...';",
        "  var trs=Array.from(document.querySelectorAll('tr')).filter(function(tr){",
        "    var cb=tr.querySelector('input.field-cb');",
        "    return !cb||cb.checked;",
        "  });",
        "  var tbl='<table style=\"width:100%;border-collapse:collapse\">';",
        "  trs.forEach(function(tr){",
        "    var cells=tr.querySelectorAll('td:not(.cb-cell)');",
        "    if(!cells.length)return;",
        "    tbl+='<tr>';",
        "    cells.forEach(function(td){",
        "      var isLbl=td.classList.contains('lbl');",
        "      var s=isLbl?'font-weight:bold;color:#555;width:130px;':'';",
        "      tbl+='<td style=\"padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;'+s+'\">'+td.innerText+'</td>';",
        "    });",
        "    tbl+='</tr>';",
        "  });",
        "  tbl+='</table>';",
        "  var el=document.createElement('div');",
        "  el.style.padding='20px';",
        "  el.innerHTML='<h1 style=\"font-size:20px;color:#0066cc;border-bottom:2px solid #0066cc;padding-bottom:8px;margin-bottom:18px\">'+docTitle+'</h1>'+tbl;",
        "  html2pdf().from(el).set({",
        "    margin:10,filename:docTitle+'.pdf',",
        "    html2canvas:{scale:2},",
        "    jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}",
        "  }).save().then(function(){btn.disabled=false;btn.textContent='Scarica PDF';});",
        "}",
        "<\/script>",
        "</head><body>",
        "<h1>" + docTitle + "</h1>",
        "<p class='intro'>Seleziona i campi da includere nel PDF, poi clicca <b>Scarica PDF</b>.</p>",
        "<div class='quick-actions'>",
        "<button class='btn-sm' onclick='selAll()'>Seleziona tutto</button>",
        "<button class='btn-sm' onclick='deselAll()'>Deseleziona tutto</button>",
        "</div>",
        "<table>" + tableRows + "</table>",
        "<button id='btn-download' onclick='downloadPDF()'>Scarica PDF</button>",
        "</body></html>",
      ].join("");

      const encoded = btoa(unescape(encodeURIComponent(html)));
      actions.openIframeModal({
        uri: "data:text/html;base64," + encoded,
        height: 520,
        width: 680,
        title: "Scheda — " + docTitle,
      });
    } catch (e) {
      setError("Errore: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="md">
      <Text>Genera una scheda con i dati del record corrente.</Text>
      {error && <Alert title={error} variant="error" />}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Button onClick={generatePDF} variant="primary">
          Genera PDF
        </Button>
      )}
    </Flex>
  );
};
