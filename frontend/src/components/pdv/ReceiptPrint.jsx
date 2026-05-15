import { useEffect, useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { fmt } from '../../utils/format';
import Button from '../ui/Button';

export default function ReceiptPrint({ receiptData, onClose }) {
  const printRef = useRef(null);
  const iframeRef = useRef(null);

  if (!receiptData) return null;

  const { store, sale, salesperson, items, totals, payment, customer } = receiptData;

  const handlePrint = () => {
    // Gerar HTML do recibo
    const receiptHTML = generateReceiptHTML();

    // Criar iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Escrever conteúdo no iframe
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(receiptHTML);
    doc.close();

    // Aguardar carregamento e imprimir
    iframe.onload = () => {
      iframe.contentWindow.print();
      // Remover iframe após impressão
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
              padding: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
              background: white;
              color: black;
              font-family: monospace;
              font-size: 12px;
              line-height: 1.4;
            }
            .receipt {
              width: 80mm;
              padding: 2mm;
              background: white;
              color: black;
            }
            .center { text-align: center; }
            .divider { border-bottom: 1px dashed #000; margin: 0.5rem 0; padding-bottom: 0.5rem; }
            .header { font-weight: bold; font-size: 14px; }
            .row { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${getReceiptContent()}
          </div>
        </body>
      </html>
    `;
  };

  const getReceiptContent = () => {

    const paymentMethodLabel = {
      'PIX': 'PIX',
      'DINHEIRO': 'Dinheiro',
      'CREDITO': 'Cartão Crédito',
      'DEBITO': 'Cartão Débito',
      'FIADO': 'Fiado',
      'SPLIT': 'Pagamento Dividido',
    };

    return `
      <!-- Store Header -->
      <div class="center divider">
        <div class="header">${store.fantasyName}</div>
        <div style="font-size: 11px;">CNPJ: ${store.cnpj}</div>
        <div style="font-size: 11px;">${store.address}</div>
        <div style="font-size: 11px;">${store.phone}</div>
      </div>

      <!-- Sale Info -->
      <div style="margin-bottom: 0.5rem; font-size: 11px;">
        <div>Data: ${sale.date}</div>
        <div>Hora: ${sale.time}</div>
        <div>Recibo: ${sale.id.slice(-8)}</div>
      </div>

      <!-- Vendedor -->
      ${salesperson ? `
        <div class="divider" style="font-size: 11px;">
          Vendedor: ${salesperson.name}
        </div>
      ` : ''}

      <!-- Customer -->
      ${customer ? `
        <div class="divider" style="font-size: 11px;">
          Cliente: ${customer.name}
        </div>
      ` : ''}

      <!-- Items Header -->
      <div style="margin-bottom: 0.5rem; border-bottom: 1px dashed #000; padding-bottom: 0.5rem;">
        <div class="row" style="font-weight: bold; margin-bottom: 0.25rem; font-size: 11px;">
          <span>ITEM</span>
          <span style="text-align: right;">QTD</span>
          <span style="text-align: right;">VLR</span>
        </div>

        <!-- Items -->
        ${items.map(item => `
          <div>
            <div style="font-size: 11px; margin-bottom: 0.1rem;">
              <div style="word-break: break-word;">${item.name.slice(0, 25)}</div>
              <div class="row" style="font-size: 10px;">
                <span>${item.quantity}x ${fmt(item.unitPrice)}</span>
                <span style="font-weight: bold;">${fmt(item.total)}</span>
              </div>
            </div>
            ${item.discountAmount > 0 ? `
              <div style="font-size: 10px; color: #666; margin-bottom: 0.25rem;">
                Desc: -${fmt(item.discountAmount)}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <!-- Totals -->
      <div style="margin-bottom: 0.5rem; border-bottom: 1px solid #000; padding-bottom: 0.5rem;">
        <div class="row" style="margin-bottom: 0.1rem; font-size: 11px;">
          <span>SUBTOTAL:</span>
          <span>${fmt(totals.subtotal)}</span>
        </div>

        ${totals.totalDiscount > 0 ? `
          <div class="row" style="margin-bottom: 0.1rem; font-size: 11px; color: #d97706;">
            <span>(-) DESCONTOS:</span>
            <span>-${fmt(totals.totalDiscount)}</span>
          </div>
        ` : ''}

        <div class="row" style="font-weight: bold; font-size: 13px; margin-top: 0.25rem; padding-top: 0.25rem;">
          <span>TOTAL:</span>
          <span>${fmt(totals.finalTotal)}</span>
        </div>
      </div>

      <!-- Payment Info -->
      <div class="divider" style="font-size: 11px;">
        <div style="font-weight: bold; margin-bottom: 0.1rem;">PAGAMENTO</div>
        ${payment.splits && payment.splits.length > 0 ?
          payment.splits.map(split => `
            <div>
              <div>${paymentMethodLabel[split.method] || split.method}: ${fmt(split.amount)}</div>
              ${split.installments && split.installments > 1 ? `
                <div style="font-size: 10px; color: #666;">
                  ${split.installments}x de ${fmt(split.amount / split.installments)}
                </div>
              ` : ''}
            </div>
          `).join('')
        :
          `
            <div>
              <div>${paymentMethodLabel[payment.method] || payment.method}</div>
              ${payment.installments > 1 ? `
                <div style="font-size: 10px; color: #666;">
                  ${payment.installments}x de ${fmt(totals.finalTotal / payment.installments)}
                </div>
              ` : ''}
            </div>
          `
        }
      </div>

      <!-- Footer -->
      <div style="text-align: center; font-size: 10px; color: #666; margin-top: 0.5rem;">
        <div>Obrigado pela compra!</div>
        <div style="margin-top: 0.25rem;">Volte sempre!</div>
      </div>
    `;
  };

  const fmt = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const paymentMethodLabel = {
    'PIX': 'PIX',
    'DINHEIRO': 'Dinheiro',
    'CREDITO': 'Cartão Crédito',
    'DEBITO': 'Cartão Débito',
    'FIADO': 'Fiado',
    'SPLIT': 'Pagamento Dividido',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
      {/* Modal Container */}
      <div className="bg-surface border border-border rounded-lg max-h-[90vh] overflow-hidden flex flex-col w-full max-w-2xl">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between bg-background/50">
          <h2 className="text-lg font-semibold">Prévia de Recibo</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll Container */}
        <div className="flex-1 overflow-y-auto">
          {/* Receipt Preview */}
          <div
            ref={printRef}
            className="bg-white text-black p-4 receipt-paper"
            style={{
              width: '300px',
              margin: '1rem auto',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.4',
            }}
          >
            {/* Store Header */}
            <div style={{ textAlign: 'center', marginBottom: '0.5rem', borderBottom: '1px dashed #000', paddingBottom: '0.5rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{store.fantasyName}</div>
              <div style={{ fontSize: '11px' }}>CNPJ: {store.cnpj}</div>
              <div style={{ fontSize: '11px' }}>{store.address}</div>
              <div style={{ fontSize: '11px' }}>{store.phone}</div>
            </div>

            {/* Sale Info */}
            <div style={{ marginBottom: '0.5rem', fontSize: '11px' }}>
              <div>Data: {sale.date}</div>
              <div>Hora: {sale.time}</div>
              <div>Recibo: {sale.id.slice(-8)}</div>
            </div>

            {/* Vendedor */}
            {salesperson && (
              <div style={{ marginBottom: '0.5rem', fontSize: '11px', borderBottom: '1px dashed #000', paddingBottom: '0.5rem' }}>
                Vendedor: {salesperson.name}
              </div>
            )}

            {/* Customer */}
            {customer && (
              <div style={{ marginBottom: '0.5rem', fontSize: '11px', borderBottom: '1px dashed #000', paddingBottom: '0.5rem' }}>
                Cliente: {customer.name}
              </div>
            )}

            {/* Items Table */}
            <div style={{ marginBottom: '0.5rem', borderBottom: '1px dashed #000', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '11px' }}>
                <span>ITEM</span>
                <span style={{ textAlign: 'right' }}>QTD</span>
                <span style={{ textAlign: 'right' }}>VLR</span>
              </div>

              {items.map((item, idx) => (
                <div key={idx}>
                  {/* Item Name and Unit Price */}
                  <div style={{ fontSize: '11px', marginBottom: '0.1rem' }}>
                    <div style={{ wordBreak: 'break-word' }}>{item.name.slice(0, 25)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span>{item.quantity}x {fmt(item.unitPrice)}</span>
                      <span style={{ fontWeight: 'bold' }}>{fmt(item.total)}</span>
                    </div>
                  </div>

                  {/* Item Discount */}
                  {item.discountAmount > 0 && (
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '0.25rem' }}>
                      Desc: -{fmt(item.discountAmount)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ marginBottom: '0.5rem', borderBottom: '1px solid #000', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem', fontSize: '11px' }}>
                <span>SUBTOTAL:</span>
                <span>{fmt(totals.subtotal)}</span>
              </div>

              {totals.totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem', fontSize: '11px', color: '#d97706' }}>
                  <span>(-) DESCONTOS:</span>
                  <span>-{fmt(totals.totalDiscount)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  marginTop: '0.25rem',
                  paddingTop: '0.25rem',
                }}
              >
                <span>TOTAL:</span>
                <span>{fmt(totals.finalTotal)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div style={{ marginBottom: '0.5rem', borderBottom: '1px dashed #000', paddingBottom: '0.5rem', fontSize: '11px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.1rem' }}>PAGAMENTO</div>
              {payment.splits && payment.splits.length > 0 ? (
                payment.splits.map((split, idx) => (
                  <div key={idx}>
                    <div>
                      {paymentMethodLabel[split.method] || split.method}: {fmt(split.amount)}
                    </div>
                    {split.installments && split.installments > 1 && (
                      <div style={{ fontSize: '10px', color: '#666' }}>
                        {split.installments}x de {fmt(split.amount / split.installments)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div>
                  <div>{paymentMethodLabel[payment.method] || payment.method}</div>
                  {payment.installments > 1 && (
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      {payment.installments}x de {fmt(totals.finalTotal / payment.installments)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '0.5rem' }}>
              <div>Obrigado pela compra!</div>
              <div style={{ marginTop: '0.25rem' }}>Volte sempre!</div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-border p-4 flex gap-2 bg-background/50">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Fechar
          </Button>
          <Button
            icon={Printer}
            onClick={handlePrint}
            className="flex-1"
          >
            Imprimir Recibo
          </Button>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
