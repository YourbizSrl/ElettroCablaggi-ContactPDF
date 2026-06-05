const escape = (str) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

exports.main = async (event) => {
  // DEBUG: restituisce info sull'evento per trovare l'URL reale
  const requestInfo = {
    parameters: event.parameters,
    request: event.request,
    context: event.context,
    body: event.body,
  };
  // Se la query contiene "debug=1", ritorna il dump dell'evento
  if ((event.parameters || {}).debug === "1") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestInfo, null, 2),
    };
  }

  const p = event.parameters || {};
  const name = escape(p.name) || "Contatto";
  const email = escape(p.email) || "N/A";
  const phone = escape(p.phone) || "N/A";
  const company = escape(p.company) || "N/A";

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Scheda Contatto - ${name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    p { line-height: 1.8; font-size: 15px; }
    b { color: #555; display: inline-block; width: 110px; }
    .actions { margin-top: 32px; }
    button { padding: 10px 24px; font-size: 14px; cursor: pointer; background: #0066cc; color: white; border: none; border-radius: 4px; }
    button:hover { background: #0052a3; }
    @media print { .actions { display: none; } }
  </style>
</head>
<body>
  <h1>Scheda Contatto</h1>
  <p><b>Nome:</b> ${name}</p>
  <p><b>Email:</b> ${email}</p>
  <p><b>Telefono:</b> ${phone}</p>
  <p><b>Azienda:</b> ${company}</p>
  <div class="actions">
    <button onclick="window.print()">Stampa / Salva PDF</button>
  </div>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: html,
  };
};
