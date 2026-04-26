'use client'

import { Quotation } from '@/lib/types'
import { formatCurrency, formatShortDate, numberToWords } from '@/lib/document-utils'

interface QuotationPreviewProps {
  quotation: Quotation
}

export function QuotationPreview({ quotation }: QuotationPreviewProps) {
  return (
    <div 
      id="quotation-preview"
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
      <div style={{ textAlign: 'right', fontSize: '14px', marginBottom: '24px' }}>
        <p>{formatShortDate(quotation.date)} {quotation.city}</p>
      </div>

      {/* Title & Client */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          Cotizacion #{quotation.number}
        </h1>
        <p style={{ fontWeight: '600' }}>{quotation.client.companyName}</p>
        <p>NIT: {quotation.client.nit}</p>
        {quotation.client.location && <p>{quotation.client.location}</p>}
      </div>

      {/* Introduction */}
      <p style={{ marginBottom: '24px' }}>
        La presente cotizacion describe los aspectos principales que intervienen en:
      </p>

      {/* Items List */}
      <div style={{ marginBottom: '24px' }}>
        {quotation.items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ flex: 1 }}>
              - {item.quantity}{item.unit} {item.description} a {formatCurrency(item.unitPrice)}
            </span>
            <span style={{ fontWeight: '500', marginLeft: '16px' }}>
              Total = {formatCurrency(item.total)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{ 
        marginBottom: '24px', 
        paddingTop: '12px', 
        paddingBottom: '12px', 
        borderTop: '1px solid #d1d5db', 
        borderBottom: '1px solid #d1d5db' 
      }}>
        <p style={{ fontWeight: 'bold' }}>
          Total obra: {formatCurrency(quotation.total)} ({numberToWords(quotation.total).toLowerCase()})
        </p>
      </div>

      {/* Bank Info */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ marginBottom: '8px' }}>Para que sea pagada a la cuenta bancaria que se indica a continuacion:</p>
        <div style={{ paddingLeft: '16px' }}>
          <p><strong>Entidad:</strong> {quotation.bankInfo.entity}</p>
          <p><strong>Tipo de cuenta:</strong> {quotation.bankInfo.accountType}</p>
          <p><strong>Numero:</strong> {quotation.bankInfo.accountNumber}</p>
          <p><strong>Nombre:</strong> {quotation.bankInfo.accountHolder}</p>
        </div>
      </div>

      {/* Notes */}
      {quotation.notes && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontWeight: '500' }}>Observaciones:</p>
          <p style={{ fontSize: '14px' }}>{quotation.notes}</p>
        </div>
      )}

      {/* Legal Text */}
      {quotation.legalText && (
        <div style={{ marginBottom: '32px', fontSize: '12px', color: '#4b5563', lineHeight: '1.625' }}>
          <p>{quotation.legalText}</p>
        </div>
      )}

      {/* Signature */}
      <div style={{ marginTop: '48px', paddingTop: '16px', textAlign:'center', display: 'flex', justifyContent:'center' }}>
        <div style={{ width: '192px' }}>
          <div style={{ borderTop: '1px solid #111827', paddingTop: '8px' }}>
            <p style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{quotation.provider.name}</p>
            <p>{quotation.provider.documentNumber}</p>
            <p>Cel: {quotation.provider.phone}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
