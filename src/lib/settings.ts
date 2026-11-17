import { prisma } from './prisma';
import crypto from 'crypto';

/**
 * Helper terpusat untuk membaca dan menyimpan Setting ke database.
 * Mendukung Prisma model Setting sekaligus raw SQL fallback untuk menjamin
 * tidak ada error 'Cannot read properties of undefined (reading upsert)'
 * saat Next.js dev server belum me-restart Prisma instance.
 */

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  try {
    if ((prisma as any).setting) {
      const s = await (prisma as any).setting.findUnique({ where: { key } });
      if (s) return s.value;
    }
  } catch (err) {
    // Fallback ke raw SQL jika prisma.setting bermasalah
  }

  try {
    const rows = await (prisma as any).$queryRawUnsafe(
      'SELECT value FROM setting WHERE `key` = ? LIMIT 1',
      key
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return (rows[0] as any).value ?? defaultValue;
    }
  } catch (err) {
    console.warn(`[Settings] Gagal membaca key "${key}":`, err);
  }

  return defaultValue;
}

export async function getSettings(keys: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!keys.length) return map;

  try {
    if ((prisma as any).setting) {
      const list = await (prisma as any).setting.findMany({
        where: { key: { in: keys } },
      });
      list.forEach((item: any) => map.set(item.key, item.value));
      return map;
    }
  } catch (err) {
    // Fallback ke raw SQL
  }

  try {
    const placeholders = keys.map(() => '?').join(',');
    const rows = await (prisma as any).$queryRawUnsafe(
      `SELECT \`key\`, value FROM setting WHERE \`key\` IN (${placeholders})`,
      ...keys
    );
    if (Array.isArray(rows)) {
      rows.forEach((r: any) => map.set(r.key, r.value));
    }
  } catch (err) {
    console.warn('[Settings] Gagal membaca multiple keys:', err);
  }

  return map;
}

export async function setSetting(key: string, value: string): Promise<void> {
  try {
    if ((prisma as any).setting) {
      await (prisma as any).setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      return;
    }
  } catch (err) {
    // Fallback ke raw SQL
  }

  try {
    const id = crypto.randomUUID();
    await (prisma as any).$executeRawUnsafe(
      'INSERT INTO setting (id, `key`, value, updatedAt) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE value = VALUES(value), updatedAt = NOW()',
      id,
      key,
      value
    );
  } catch (err) {
    console.error(`[Settings] Gagal menyimpan key "${key}":`, err);
    throw err;
  }
}

