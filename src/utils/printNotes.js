import logoUrl from '../assets/logo-bazar-el-chunky.png';
import { formatMoney } from './money.js';

const business = {
  name: 'Bazar El Chunky',
  phone: '+52 653-176-2945',
  address: 'Callejón Durango y Monterrey, 83430 San Luis Río Colorado, Son.',
  facebook: 'Bazar el Chunkyy',
  instagram: '@bazares_elchunky',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function row(label, value) {
  return `
    <div class="row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function numericLegacyFolio(prefix, record) {
  if (record?.folio) return record.folio;

  const source = String(record?.id || `${prefix}-${record?.fecha || ''}-${record?.descripcion || ''}`);
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash * 31) + source.charCodeAt(index)) % 1000000;
  }

  const year = String(record?.fecha || new Date().toISOString().slice(0, 10)).slice(0, 4);
  return `${prefix}-${year}-${String(hash || 1).padStart(6, '0')}`;
}

function lineItems(items = []) {
  if (!items.length) return '';

  return `
    <table>
      <thead>
        <tr>
          <th>Concepto</th>
          <th class="right">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item) => `
          <tr>
            <td>${escapeHtml(item.descripcion)}</td>
            <td class="right">${escapeHtml(formatMoney(item.monto))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function ventaItems(venta) {
  if (Array.isArray(venta.importes) && venta.importes.length) {
    return venta.importes
      .map((item, index) => {
        if (typeof item === 'number') {
          return {
            descripcion: venta.importes.length > 1
              ? `${venta.descripcion || 'Venta'} ${index + 1}`
              : venta.descripcion || 'Venta',
            monto: item,
          };
        }

        return {
          descripcion: item?.descripcion || item?.categoria || venta.descripcion || `Importe ${index + 1}`,
          monto: Number(item?.monto ?? item?.importe ?? item?.total ?? 0),
        };
      })
      .filter((item) => Number(item.monto || 0) > 0);
  }

  return [{ descripcion: venta.descripcion || 'Venta', monto: Number(venta.monto || 0) }];
}

function shell({ title, folio, reprint = false, body }) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)} ${escapeHtml(folio || '')}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #111;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
          }
          .note {
            width: 100%;
            max-width: 112mm;
            margin: 0 auto;
            border: 1px solid #d9d9d9;
            padding: 10mm;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #111;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .logo {
            width: 52mm;
            max-width: 100%;
            height: auto;
            object-fit: contain;
            background: #000;
          }
          h1 {
            font-size: 16px;
            margin: 6px 0 3px;
            letter-spacing: 0;
          }
          h2 {
            font-size: 15px;
            margin: 12px 0 8px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
          }
          .muted { color: #555; }
          .folio {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 8px;
            border: 1px solid #111;
            font-weight: 700;
          }
          .reprint {
            margin-top: 6px;
            font-size: 11px;
            font-weight: 700;
          }
          .row {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 4px 0;
            border-bottom: 1px solid #eee;
          }
          .row strong { text-align: right; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th, td {
            padding: 6px 0;
            border-bottom: 1px solid #eee;
            text-align: left;
          }
          .right { text-align: right; }
          .total {
            font-size: 16px;
            font-weight: 800;
          }
          .terms {
            margin: 8px 0 0;
            padding-left: 18px;
          }
          .terms li { margin: 4px 0; }
          .footer {
            margin-top: 14px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
          }
          .actions {
            text-align: center;
            margin: 12px 0;
          }
          .actions button {
            font-size: 14px;
            padding: 8px 12px;
          }
          @media print {
            .actions { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="actions">
          <button onclick="window.print()">Imprimir</button>
        </div>
        <main class="note">
          <section class="header">
            <img class="logo" src="${logoUrl}" alt="${escapeHtml(business.name)}" />
            <h1>${escapeHtml(business.name)}</h1>
            <div>${escapeHtml(business.phone)}</div>
            <div>${escapeHtml(business.address)}</div>
            <div>Facebook: ${escapeHtml(business.facebook)} · Instagram: ${escapeHtml(business.instagram)}</div>
            <div class="folio">${escapeHtml(folio || 'Sin folio')}</div>
            ${reprint ? '<div class="reprint">REIMPRESIÓN</div>' : ''}
          </section>
          ${body}
          <section class="footer">
            Gracias por su preferencia.
          </section>
        </main>
        <script>
          window.addEventListener('load', () => setTimeout(() => window.print(), 300));
        </script>
      </body>
    </html>
  `;
}

function openPrint(html) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para imprimir notas.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printVentaNota(venta, { reprint = false, clienteNombre = 'Cliente mostrador', cajeroNombre = '' } = {}) {
  const prefix = venta.tipo === 'abono' ? 'AB' : venta.tipo === 'apartado' ? 'A' : 'V';
  const items = ventaItems(venta);

  openPrint(shell({
    title: 'Nota de venta',
    folio: numericLegacyFolio(prefix, venta),
    reprint,
    body: `
      <h2>Nota de venta</h2>
      ${row('Fecha', `${venta.fecha || ''} ${venta.hora || ''}`)}
      ${row('Cliente', clienteNombre)}
      ${row('Cajero', venta.usuarioNombre || venta.usuarioEmail || cajeroNombre || '-')}
      ${lineItems(items)}
      ${row('Método de pago', venta.metodoPago || 'efectivo')}
      ${venta.metodoPago === 'dolares' ? row('Tipo de cambio', venta.tipoCambio || '-') : ''}
      ${Number(venta.recibidoUsd || 0) > 0 ? row('Dólares recibidos', `$${Number(venta.recibidoUsd || 0).toFixed(2)} USD`) : ''}
      ${Number(venta.equivalenteMxn || 0) > 0 ? row('Equivalente MXN', formatMoney(venta.equivalenteMxn)) : ''}
      ${Number(venta.cambioMxn || 0) > 0 ? row('Cambio', formatMoney(venta.cambioMxn)) : ''}
      <div class="row total"><span>Total</span><strong>${escapeHtml(formatMoney(venta.monto))}</strong></div>
    `,
  }));
}

export function printApartadoNota(apartado, { cliente, reprint = false } = {}) {
  openPrint(shell({
    title: 'Nota de apartado',
    folio: numericLegacyFolio('A', apartado),
    reprint,
    body: `
      <h2>Nota de apartado</h2>
      ${row('Fecha', apartado.fecha || apartado.createdAt?.toDate?.()?.toISOString?.()?.slice(0, 10) || '')}
      ${row('Cliente', cliente?.nombre || apartado.nombreCliente || 'Sin cliente')}
      ${cliente?.telefono ? row('Teléfono cliente', cliente.telefono) : ''}
      ${row('Artículo', apartado.descripcion || '-')}
      ${row('Total', formatMoney(apartado.total))}
      ${row('Abonado', formatMoney(apartado.abonado))}
      ${row('Saldo', formatMoney(apartado.saldo))}
      ${row('Fecha límite', apartado.fechaLimite || '-')}
      ${row('Estado', apartado.estatus || 'activo')}
      <h2>Condiciones</h2>
      <ul class="terms">
        <li>El apartado debe liquidarse antes de la fecha indicada.</li>
        <li>Los abonos no son reembolsables.</li>
        <li>El artículo se entrega únicamente al liquidar el saldo total.</li>
        <li>Conserve esta nota para cualquier aclaración.</li>
      </ul>
    `,
  }));
}
