import * as OTPAuth from 'otpauth'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ─── Encryption helpers ─────────────────────────────────────────
// AES-256-GCM for encrypting the TOTP secret at rest.

function getEncryptionKey(): Buffer {
  const raw = process.env.MFA_ENCRYPTION_KEY
  if (!raw) throw new Error('MFA_ENCRYPTION_KEY no configurada')
  return Buffer.from(raw.padEnd(64, '0').slice(0, 64), 'hex')
}

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptSecret(ciphertext: string): string {
  const key = getEncryptionKey()
  const [ivHex, tagHex, encHex] = ciphertext.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}

// ─── TOTP helpers ───────────────────────────────────────────────

export function createTOTP(secret?: string) {
  return new OTPAuth.TOTP({
    issuer: 'CotiFactura',
    label: 'Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret ?? new OTPAuth.Secret({ size: 20 }),
  })
}

export function generateQRData(totp: InstanceType<typeof OTPAuth.TOTP>): string {
  return totp.toString()
}

export function verifyTOTP(secretBase32: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: 'CotiFactura',
    label: 'Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  })
  const delta = totp.validate({ token, window: 1 })
  return delta !== null
}

// ─── DB helpers ──────────────────────────────────────────────────

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export interface MFAStatus {
  enabled: boolean
  createdAt: string | null
}

export async function getMFAStatus(): Promise<MFAStatus> {
  const db = adminClient()
  const { data, error } = await db
    .from('admin_mfa')
    .select('enabled, created_at')
    .eq('id', 1)
    .maybeSingle()

  // Si la tabla no existe, retornar como deshabilitado (no explotar)
  if (error) {
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      console.warn('Tabla admin_mfa no existe. Ejecuta la migración supabase/migrations/20260817_admin_mfa.sql')
      return { enabled: false, createdAt: null }
    }
    console.error('getMFAStatus error:', error.message)
  }

  return {
    enabled: data?.enabled ?? false,
    createdAt: data?.created_at ?? null,
  }
}

export async function enableMFA(encryptedSecret: string): Promise<void> {
  const db = adminClient()
  const { error } = await db
    .from('admin_mfa')
    .upsert({ id: 1, secret: encryptedSecret, enabled: true }, { onConflict: 'id' })
  if (error) {
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      throw new Error('La tabla admin_mfa no existe. Ejecuta la migración SQL: supabase/migrations/20260817_admin_mfa.sql')
    }
    throw new Error(`Error guardando configuración MFA: ${error.message}`)
  }
}

export async function disableMFA(): Promise<void> {
  const db = adminClient()
  const { error } = await db
    .from('admin_mfa')
    .update({ enabled: false })
    .eq('id', 1)
  if (error) {
    throw new Error(`Error desactivando MFA: ${error.message}`)
  }
}

export async function getEncryptedSecret(): Promise<string | null> {
  const db = adminClient()
  const { data, error } = await db
    .from('admin_mfa')
    .select('secret')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    console.error('getEncryptedSecret error:', error.message)
    return null
  }
  return data?.secret ?? null
}
