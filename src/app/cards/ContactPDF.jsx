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
        .map((r) => "<tr><td>" + r.label + "</td><td>" + r.value + "</td></tr>")
        .join("");

      const html = [
        "<!DOCTYPE html><html lang='it'><head><meta charset='UTF-8'>",
        "<style>",
        "body{font-family:Arial,sans-serif;padding:28px;color:#333;margin:0}",
        "h1{font-size:20px;color:#0066cc;border-bottom:2px solid #0066cc;padding-bottom:8px;margin-bottom:18px}",
        "table{width:100%;border-collapse:collapse}",
        "td{padding:9px 12px;border-bottom:1px solid #eee;font-size:14px}",
        "td:first-child{font-weight:bold;color:#555;width:140px}",
        "#btn{margin-top:20px;padding:10px 20px;background:#0066cc;color:white;border:none;border-radius:4px;font-size:13px;cursor:pointer}",
        "#btn:hover{background:#0052a3}",
        "#ok{display:none;margin-top:12px;padding:10px;background:#e8f5e9;border:1px solid #66bb6a;border-radius:4px;font-size:13px;color:#2e7d32}",
        "@media print{#btn,#ok{display:none !important}}",
        "</style>",
        "<script>function sp(){document.execCommand('selectAll');document.getElementById('ok').style.display='block';document.getElementById('btn').style.display='none';try{window.print();}catch(e){}}<\/script>",
        "</head><body>",
        "<h1>" + docTitle + "</h1>",
        "<table>" + tableRows + "</table>",
        "<button id='btn' onclick='sp()'>Stampa / Salva PDF</button>",
        "<div id='ok'>Testo selezionato! Ora premi <b>Ctrl+P</b> &rarr; Salva come PDF</div>",
        "</body></html>",
      ].join("");

      const encoded = btoa(unescape(encodeURIComponent(html)));
      actions.openIframeModal({
        uri: "data:text/html;base64," + encoded,
        height: 450,
        width: 650,
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
