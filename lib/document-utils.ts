export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const UNITS = [
  '', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'
]

const TENS = [
  '', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'
]

const HUNDREDS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos'
]

function convertHundreds(n: number): string {
  if (n === 100) return 'cien'
  
  const hundred = Math.floor(n / 100)
  const remainder = n % 100
  
  let result = HUNDREDS[hundred]
  
  if (remainder > 0) {
    if (result) result += ' '
    
    if (remainder < 20) {
      result += UNITS[remainder]
    } else if (remainder < 30) {
      if (remainder === 20) {
        result += 'veinte'
      } else {
        result += 'veinti' + UNITS[remainder - 20]
      }
    } else {
      const ten = Math.floor(remainder / 10)
      const unit = remainder % 10
      result += TENS[ten]
      if (unit > 0) {
        result += ' y ' + UNITS[unit]
      }
    }
  }
  
  return result
}

export function numberToWords(amount: number): string {
  if (amount === 0) return 'cero pesos COP'
  
  const millions = Math.floor(amount / 1000000)
  const thousands = Math.floor((amount % 1000000) / 1000)
  const remainder = amount % 1000
  
  let result = ''
  
  if (millions > 0) {
    if (millions === 1) {
      result += 'un millón'
    } else {
      result += convertHundreds(millions) + ' millones'
    }
  }
  
  if (thousands > 0) {
    if (result) result += ' '
    if (thousands === 1) {
      result += 'mil'
    } else {
      result += convertHundreds(thousands) + ' mil'
    }
  }
  
  if (remainder > 0) {
    if (result) result += ' '
    result += convertHundreds(remainder)
  }
  
  // Capitalize first letter
  result = result.charAt(0).toUpperCase() + result.slice(1)
  
  return result + ' pesos COP'
}

export function generateDocumentNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${year}${month}${random}`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const DEFAULT_LEGAL_TEXT = `Para determinar la naturaleza de mis ingresos conforme a lo contemplado en el Título V Capítulo I del Estatuto Tributario modificado por la Ley 1819 de 2016, me permito certificar bajo la gravedad de juramento que: Mis ingresos corresponden a honorarios por prestación de servicios calificados y/o no calificados y no poseo 2 o más empleados o contratistas para el desarrollo de esta actividad, o en caso de haberlos contratado su vinculación no fue superior a 90 días de forma continua o discontinua. De acuerdo a lo anterior me permito solicitar que el valor de la presente cuenta de cobro sea llevado a la tabla de retención en la fuente sobre salarios Art. 383 del Estatuto Tributario para establecer el correspondiente descuento ya que mis ingresos no superan las 95 UVT mensuales. Adicionalmente certifico bajo la gravedad de juramento que he determinado mi ingreso base de cotización (IBC) para realizar los aportes al sistema de seguridad social integral observando estrictamente lo contemplado en el artículo 135 de la Ley 1753 de 2015, estableciendo como base el 40% del valor neto de mis ingresos, una vez deducidas las expensas propias de mi actividad durante el respectivo mes y en los casos en que es procedente tal depuración, expensas que cumplen con los requisitos del artículo 107 del Estatuto Tributario.`

export const DEFAULT_PROVIDER_INFO = {
  name: 'Jorge Vallejo',
  documentType: 'CC',
  documentNumber: '18.506.917',
  phone: '311 344 0070',
  email: '',
  address: '',
}

export const DEFAULT_BANK_INFO = {
  entity: 'Bancolombia',
  accountType: 'Ahorros',
  accountNumber: '91209711252',
  accountHolder: 'María Nathali Gómez Jiménez',
}

export const DEFAULT_CLIENT_INFO = {
  companyName: 'ANTIOQUEÑA COMBUSTIBLES S.A.S',
  nit: '900.207.854-8',
  location: 'EDS Manglar',
  contactPerson: '',
}
