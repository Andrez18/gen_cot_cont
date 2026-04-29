'use client'

import { Invoice } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/document-utils'

interface InvoicePreviewProps {
  invoice: Invoice
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  return (
    <div 
      id="invoice-preview"
      style={{ 
        backgroundColor: '#ffffff',
        color: '#111827',
        padding: '32px',
        maxWidth: '800px',
        margin: '0 auto',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'right', fontSize: '14px', marginBottom: '32px' }}>
        <p>{invoice.city}, {formatDate(invoice.date)}</p>
      </div>

      {/* Title */}
      <h1 style={{ 
        fontSize: '20px', 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: '32px'
      }}>
        Cuenta de cobro #{invoice.number}
      </h1>

      {/* Client Info */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <p style={{ fontWeight: '600' }}>{invoice.client.companyName}</p>
        <p>NIT: {invoice.client.nit}</p>
      </div>

      {/* DEBE A Section */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>DEBE A</p>
        <p style={{ fontWeight: '600' }}>{invoice.provider.name}</p>
        <p>CEDULA DE CIUDADANIA: {invoice.provider.documentNumber}</p>
      </div>

      {/* Amount */}
      <div style={{ 
        marginBottom: '24px', 
        paddingTop: '16px', 
        paddingBottom: '16px', 
        borderTop: '1px solid #d1d5db', 
        borderBottom: '1px solid #d1d5db' 
      }}>
        <p style={{ fontSize: '18px' }}>
          <span style={{ fontWeight: 'bold' }}>La suma de: </span>
          {formatCurrency(invoice.amount)} ({invoice.amountInWords})
        </p>
      </div>

      {/* Concept */}
      <div style={{ marginBottom: '32px' }}>
        <p>
          <span style={{ fontWeight: 'bold' }}>POR CONCEPTO DE: </span>
          {invoice.concept}
        </p>
      </div>

      {/* Bank Info */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ marginBottom: '12px' }}>Para que sea pagada a la cuenta bancaria que se indica a continuacion:</p>
        <div style={{ paddingLeft: '16px' }}>
          <p style={{ marginBottom: '4px' }}><strong>Entidad:</strong> {invoice.bankInfo.entity} - Cuenta de {invoice.bankInfo.accountType}</p>
          <p style={{ marginBottom: '4px' }}><strong>Tipo de cuenta:</strong> {invoice.bankInfo.accountType}</p>
          <p style={{ marginBottom: '4px' }}><strong>Numero:</strong> {invoice.bankInfo.accountNumber}</p>
          <p style={{ marginBottom: '4px' }}><strong>A nombre de:</strong> {invoice.bankInfo.accountHolder}</p>
        </div>
      </div>

      {/* Signature */}
      <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '224px', textAlign: 'center' }}>

          {/* Contenedor relativo para superponer firma y línea */}
          <div style={{ position: 'relative', height: '60px', marginBottom: '8px' }}>
            <img
              src="/firma.png"
              alt="Firma"
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                height: '80px',
                width: 'auto',
                objectFit: 'contain',
                zIndex: 0
              }}
            />

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: '1px solid #111827',
              zIndex: 1
            }} />

          </div>

          {/* Datos */}
          <p style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            {invoice.provider.name}
          </p>
          <p>{invoice.provider.documentNumber}</p>
          <p>Cel: {invoice.provider.phone}</p>

        </div>
      </div>
    </div>
  )
}