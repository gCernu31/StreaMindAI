import crypto from 'crypto';

function getKey() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex) return null;
  const buf = Buffer.from(hex, 'hex');
  if (buf.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY deve essere 32 byte (64 caratteri hex)');
  return buf;
}

export function encrypt(text) {
  if (!text) return text;
  const key = getKey();
  if (!key) return text; // chiave non configurata: nessuna cifratura (dev)
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(data) {
  if (!data) return data;
  const key = getKey();
  if (!key) return data; // chiave non configurata: testo già in chiaro (dev)
  const parts = data.split(':');
  if (parts.length !== 3) return data; // testo in chiaro legacy, restituisce as-is
  try {
    const [ivHex, tagHex, encHex] = parts;
    const iv        = Buffer.from(ivHex, 'hex');
    const tag       = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher  = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return data; // fallback: restituzione del dato grezzo
  }
}
