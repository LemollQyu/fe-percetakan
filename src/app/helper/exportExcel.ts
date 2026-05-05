import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export const exportReportToExcel = ({
  orders,
  summary,
  breakdown,
  type,
}: any) => {
  const wb = XLSX.utils.book_new();

  // ORDERS
  const ordersData = orders.map((o: any, i: number) => ({
    No: i + 1,
    Layanan: o.service_name_snapshot,
    Kode: o.order_code?.code ?? "",
    Total: o.total_price_snapshot,
    Qty: o.quantity,
    Tanggal: new Date(o.updated_at).toLocaleString("id-ID"),
  }));

  const wsOrders = XLSX.utils.json_to_sheet(ordersData);
  wsOrders["!cols"] = [
    { wch: 5 }, // No
    { wch: 30 }, // Layanan
    { wch: 18 }, // Kode
    { wch: 18 }, // Total
    { wch: 6 }, // Qty
    { wch: 22 }, // Tanggal
  ];

  // SUMMARY
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ["Laporan", type],
    [],
    ["Total Order", summary.total_orders],
    ["Pendapatan", summary.total_revenue],
  ]);
  wsSummary["!cols"] = [{ wch: 16 }, { wch: 20 }];

  // BREAKDOWN
  const wsBreakdown = XLSX.utils.json_to_sheet(
    (breakdown || []).map((b: any) => ({
      Tanggal: new Date(b.date).toLocaleDateString("id-ID"),
      Order: b.total_orders,
      Pendapatan: b.total_revenue,
    })),
  );
  wsBreakdown["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.utils.book_append_sheet(wb, wsBreakdown, "Breakdown");

  const buffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `laporan-${type}.xlsx`);
};

export const previewReportAsHTML = ({
  orders,
  summary,
  breakdown,
  type,
  period,
}: any) => {
  const ordersRows = orders
    .map(
      (o: any, i: number) => `
      <tr>
        <td>${i + 1}</td>
        <td>${o.service_name_snapshot}<br/><span class="code">${o.order_code?.code ?? ""}</span></td>
        <td>${o.order_code?.code ?? ""}</td>
        <td class="right">${formatRupiah(o.total_price_snapshot)}</td>
        <td class="center">${o.quantity}</td>
        <td class="right">${new Date(o.updated_at).toLocaleString("id-ID")}</td>
      </tr>`,
    )
    .join("");

  const breakdownRows = (breakdown || [])
    .map(
      (b: any) => `
      <tr>
        <td>${new Date(b.date).toLocaleDateString("id-ID")}</td>
        <td class="center">${b.total_orders}</td>
        <td class="right">${formatRupiah(b.total_revenue)}</td>
      </tr>`,
    )
    .join("");

  // Encode the xlsx for the download button inside the preview page
  const wb = XLSX.utils.book_new();
  const ordersData = orders.map((o: any, i: number) => ({
    No: i + 1,
    Layanan: o.service_name_snapshot,
    Kode: o.order_code?.code,
    Total: o.total_price_snapshot,
    Qty: o.quantity,
    Tanggal: new Date(o.updated_at).toLocaleString("id-ID"),
  }));
  const wsSummaryData = XLSX.utils.aoa_to_sheet([
    ["Laporan", type],
    [],
    ["Total Order", summary.total_orders],
    ["Pendapatan", summary.total_revenue],
  ]);
  const wsBreakdownData = XLSX.utils.json_to_sheet(
    (breakdown || []).map((b: any) => ({
      Tanggal: new Date(b.date).toLocaleDateString("id-ID"),
      Order: b.total_orders,
      Pendapatan: b.total_revenue,
    })),
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(ordersData),
    "Orders",
  );
  XLSX.utils.book_append_sheet(wb, wsSummaryData, "Summary");
  XLSX.utils.book_append_sheet(wb, wsBreakdownData, "Breakdown");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
  const fileName = `laporan-${type}.xlsx`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview Laporan – ${period}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      background: #f5f6fa;
      color: #111;
    }

    .top-bar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      padding: 14px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    }
    .top-bar-left h1 { margin: 0 0 2px; font-size: 16px; font-weight: 600; letter-spacing: -0.3px; }
    .top-bar-left p  { margin: 0; font-size: 12px; color: #666; }

    .btn-download {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 18px;
      background: #111;
      color: #fff;
      font-size: 13px;
      font-weight: 500;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      text-decoration: none;
      font-family: inherit;
      transition: background 0.15s;
    }
    .btn-download:hover { background: #333; }

    .content {
      max-width: 960px;
      margin: 32px auto;
      padding: 0 24px 48px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #9ca3af;
      margin: 0 0 12px;
    }

    /* Summary cards */
    .summary-row {
      display: flex;
      gap: 14px;
    }
    .summary-card {
      flex: 1;
      background: #fff;
      border: 1px solid #eaedf5;
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04);
    }
    .summary-card .label { font-size: 11px; color: #888; margin: 0 0 6px; }
    .summary-card .value { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.6px; line-height: 1.1; }
    .summary-card .value.small { font-size: 18px; }

    /* Tables */
    .table-wrap {
      background: #fff;
      border: 1px solid #eaedf5;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead tr {
      background: #111;
    }
    thead th {
      padding: 10px 14px;
      text-align: left;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      color: #fff;
      white-space: nowrap;
    }
    thead th.right { text-align: right; }
    thead th.center { text-align: center; }

    tbody tr {
      border-bottom: 1px solid #f0f2f8;
      transition: background 0.1s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #fafafa; }

    td {
      padding: 11px 14px;
      vertical-align: middle;
      color: #111;
    }
    td.right  { text-align: right; }
    td.center { text-align: center; }
    td .code  { font-size: 10px; color: #6366f1; font-family: monospace; margin-top: 2px; }

    @media (max-width: 600px) {
      .top-bar { padding: 12px 16px; }
      .content { margin: 16px auto; padding: 0 16px 32px; }
      .summary-row { flex-direction: column; }
    }
  </style>
</head>
<body>

<div class="top-bar">
  <div class="top-bar-left">
    <h1>Laporan Penjualan</h1>
    <p>${period}</p>
  </div>
  <a class="btn-download" id="dl-btn" href="#" download="${fileName}">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    Download Excel
  </a>
</div>

<div class="content">

  <!-- Summary -->
  <div>
    <p class="section-title">Ringkasan</p>
    <div class="summary-row">
      <div class="summary-card">
        <p class="label">Total Order</p>
        <p class="value">${summary.total_orders}</p>
      </div>
      <div class="summary-card">
        <p class="label">Pendapatan</p>
        <p class="value small">${formatRupiah(summary.total_revenue)}</p>
      </div>
    </div>
  </div>

  <!-- Orders -->
  <div>
    <p class="section-title">Daftar Order</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:44px">No</th>
            <th>Layanan</th>
            <th>Kode</th>
            <th class="right">Total</th>
            <th class="center">Qty</th>
            <th class="right">Tanggal</th>
          </tr>
        </thead>
        <tbody>
          ${ordersRows}
        </tbody>
      </table>
    </div>
  </div>

  ${
    breakdown?.length
      ? `<!-- Breakdown -->
  <div>
    <p class="section-title">Rincian per Hari</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th class="center">Order</th>
            <th class="right">Pendapatan</th>
          </tr>
        </thead>
        <tbody>
          ${breakdownRows}
        </tbody>
      </table>
    </div>
  </div>`
      : ""
  }

</div>

<script>
  // Inject the xlsx as a data-URI so the download button works without a server
  const base64 = "${buffer}";
  const byteChars = atob(base64);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNums);
  const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  document.getElementById("dl-btn").href = URL.createObjectURL(blob);
</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};
