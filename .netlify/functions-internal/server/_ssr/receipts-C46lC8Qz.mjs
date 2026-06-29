//#region node_modules/.nitro/vite/services/ssr/assets/receipts-C46lC8Qz.js
function downloadDueReceipt(receipt) {
	const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Oyesile Estate Receipt</title>
    <style>
      body { font-family: Georgia, serif; background:#f7f5ef; color:#1f2937; padding:24px; }
      .card { max-width:640px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:24px; }
      h1 { margin:0 0 8px; font-size:28px; }
      p { margin:0; }
      .muted { color:#6b7280; }
      .row { display:flex; justify-content:space-between; gap:16px; padding:12px 0; border-bottom:1px solid #f0f0f0; }
      .row:last-child { border-bottom:none; }
      .amount { font-size:28px; font-weight:700; margin:16px 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="muted">Oyesile Estate</p>
      <h1>Payment Receipt</h1>
      <p class="muted">Download generated from your resident dashboard.</p>
      <p class="amount">${formatMoney(receipt.amount, receipt.currency)}</p>
      <div class="row"><span>Payment for</span><strong>${escapeHtml(receipt.title)}</strong></div>
      <div class="row"><span>Resident</span><strong>${escapeHtml(receipt.residentName || "Resident")}</strong></div>
      <div class="row"><span>Reference</span><strong>${escapeHtml(receipt.reference || "Not available")}</strong></div>
      <div class="row"><span>Date paid</span><strong>${escapeHtml(formatDateTime(receipt.paidAt))}</strong></div>
    </div>
  </body>
</html>`;
	const blob = new Blob([html], { type: "text/html" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${slugify(receipt.title || "due")}-receipt.html`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
function formatMoney(amount, currency = "NGN") {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency,
		maximumFractionDigits: 0
	}).format(amount);
}
function formatDateTime(value) {
	if (!value) return (/* @__PURE__ */ new Date()).toLocaleString();
	return new Date(value).toLocaleString();
}
function slugify(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
function escapeHtml(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}
//#endregion
export { downloadDueReceipt as t };
