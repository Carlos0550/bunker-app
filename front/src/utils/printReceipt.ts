import { Sale } from "@/api/services/sales";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PrintReceiptOptions {
  sale: Sale;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  showLogo?: boolean;
}

import { formatCurrency } from "@/utils/helpers";

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta";
    case "TRANSFER":
      return "Transferencia";
    case "CREDIT":
      return "Crédito";
    default:
      return method;
  }
};

export function generateReceiptHTML(options: PrintReceiptOptions): string {
  const {
    sale,
    businessName = "BUNKER",
    businessAddress,
    businessPhone,
  } = options;

  const itemsHTML = sale.items
    .map(
      (item) => `
    <tr>
      <td style="text-align: left; padding: 2px 0;">
        ${item.productName}${item.isManual ? " (M)" : ""}
        <br>
        <small style="color: #666;">${item.quantity} x ${formatCurrency(item.unitPrice)}</small>
      </td>
      <td style="text-align: right; padding: 2px 0; white-space: nowrap;">
        ${formatCurrency(item.totalPrice)}
      </td>
    </tr>
  `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket #${sale.saleNumber}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 80mm;
          padding: 5mm;
          background: white;
          color: black;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .header h1 {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 10px;
          color: #333;
        }
        .info {
          margin-bottom: 10px;
          font-size: 11px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .items {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .items th {
          text-align: left;
          border-bottom: 1px solid #000;
          padding: 5px 0;
          font-size: 11px;
        }
        .items th:last-child {
          text-align: right;
        }
        .items td {
          font-size: 11px;
          vertical-align: top;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .totals {
          font-size: 11px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .totals-row.total {
          font-size: 14px;
          font-weight: bold;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        .payment {
          text-align: center;
          margin: 10px 0;
          padding: 5px;
          background: #f0f0f0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #000;
          font-size: 10px;
        }
        .footer p {
          margin-bottom: 3px;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${businessName}</h1>
        ${businessAddress ? `<p>${businessAddress}</p>` : ""}
        ${businessPhone ? `<p>Tel: ${businessPhone}</p>` : ""}
      </div>

      <div class="info">
        <div class="info-row">
          <span>Ticket:</span>
          <span><strong>#${sale.saleNumber}</strong></span>
        </div>
        <div class="info-row">
          <span>Fecha:</span>
          <span>${format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}</span>
        </div>
        ${
          sale.customer?.name
            ? `
        <div class="info-row">
          <span>Cliente:</span>
          <span>${sale.customer.name}</span>
        </div>
        `
            : ""
        }
        ${
          sale.user?.name
            ? `
        <div class="info-row">
          <span>Vendedor:</span>
          <span>${sale.user.name}</span>
        </div>
        `
            : ""
        }
      </div>

      <div class="divider"></div>

      <table class="items">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="divider"></div>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(sale.subtotal)}</span>
        </div>
        ${
          sale.discountValue && sale.discountValue > 0
            ? `
        <div class="totals-row">
          <span>Descuento${sale.discountType === "PERCENTAGE" ? ` (${sale.discountValue}%)` : ""}:</span>
          <span>-${formatCurrency(
            sale.discountType === "PERCENTAGE"
              ? (sale.subtotal * sale.discountValue) / 100
              : sale.discountValue,
          )}</span>
        </div>
        `
            : ""
        }
        ${
          sale.taxAmount > 0
            ? `
        <div class="totals-row">
          <span>IVA (${(sale.taxRate * 100).toFixed(0)}%):</span>
          <span>${formatCurrency(sale.taxAmount)}</span>
        </div>
        `
            : ""
        }
        <div class="totals-row total">
          <span>TOTAL:</span>
          <span>${formatCurrency(sale.total)}</span>
        </div>
      </div>

      <div class="payment">
        ${getPaymentMethodLabel(sale.paymentMethod)}
        ${sale.isCredit ? " (FIADO)" : ""}
      </div>

      ${
        sale.notes
          ? `
      <div class="info" style="font-size: 10px; font-style: italic;">
        Nota: ${sale.notes}
      </div>
      `
          : ""
      }

      <div class="footer">
        <p>¡Gracias por su compra!</p>
        <p>Conserve este ticket</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

export function printReceipt(options: PrintReceiptOptions): void {
  const html = generateReceiptHTML(options);

  
  const printFrame = document.createElement("iframe");
  printFrame.style.position = "absolute";
  printFrame.style.top = "-10000px";
  printFrame.style.left = "-10000px";
  printFrame.style.width = "80mm";
  printFrame.style.height = "0";
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow?.document;
  if (frameDoc) {
    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    
    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();

        
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 250);
    };
  }
}


export function isPrintingSupported(): boolean {
  return typeof window !== "undefined" && typeof window.print === "function";
}
