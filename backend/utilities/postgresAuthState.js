import { query } from '../config/db.js';
import { BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS whatsapp_auth_state (
      key         TEXT PRIMARY KEY,
      value       JSONB NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

function serialize(value) {
  return JSON.stringify(value, BufferJSON.replacer);
}

function reviveBuffers(obj) {
  if (obj === null || obj === undefined) return obj;
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return JSON.parse(str, BufferJSON.reviver);
}

async function getValue(key) {
  const result = await query(
    'SELECT value::text FROM whatsapp_auth_state WHERE key = $1',
    [key]
  );
  if (result.rows.length === 0) return null;
  const raw = result.rows[0].value;
  if (raw === null || raw === undefined) return null;
  return reviveBuffers(raw);
}

async function setValue(key, value) {
  const json = serialize(value);
  await query(
    `INSERT INTO whatsapp_auth_state (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = now()`,
    [key, json]
  );
}

async function deleteValue(key) {
  await query('DELETE FROM whatsapp_auth_state WHERE key = $1', [key]);
}

export async function usePostgresAuthState() {
  await ensureTable();

  let creds = await getValue('creds');
  if (!creds || !creds.noiseKey) {
    creds = initAuthCreds();
    await setValue('creds', creds);
  }

  const keys = {
    async get(category, ids) {
      const result = {};
      if (!ids || ids.length === 0) return result;

      const dbKeys = ids.map((id) => `${category}:${id}`);
      const res = await query(
        'SELECT key, value::text FROM whatsapp_auth_state WHERE key = ANY($1)',
        [dbKeys]
      );

      const prefix = `${category}:`;
      for (const row of res.rows) {
        const id = row.key.slice(prefix.length);
        const revived = reviveBuffers(row.value);
        if (revived !== null && revived !== undefined) {
          result[id] = revived;
        }
      }
      return result;
    },

    async set(data) {
      const toSave = [];
      const toDelete = [];

      for (const category of Object.keys(data)) {
        for (const id of Object.keys(data[category])) {
          const value = data[category][id];
          const key = `${category}:${id}`;
          if (value === undefined || value === null) {
            toDelete.push(key);
          } else {
            toSave.push({ key, json: serialize(value) });
          }
        }
      }

      if (toDelete.length > 0) {
        await query('DELETE FROM whatsapp_auth_state WHERE key = ANY($1)', [toDelete]);
      }

      if (toSave.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < toSave.length; i += chunkSize) {
          const chunk = toSave.slice(i, i + chunkSize);
          const params = [];
          const valuesSql = chunk.map((item, idx) => {
            params.push(item.key, item.json);
            return `($${idx * 2 + 1}, $${idx * 2 + 2}::jsonb, now())`;
          }).join(', ');

          await query(
            `INSERT INTO whatsapp_auth_state (key, value, updated_at)
             VALUES ${valuesSql}
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
            params
          );
        }
      }
    },
  };

  async function saveCreds(updatedCreds) {
    if (updatedCreds) {
      Object.assign(creds, updatedCreds);
    }
    await setValue('creds', creds);
  }

  return {
    state: { creds, keys },
    saveCreds,
  };
}

export async function resolveLidFromDb(lidNumber) {
  const reverse = await getValue(`lid-mapping:${lidNumber}_reverse`);
  if (reverse) return typeof reverse === 'string' ? reverse : reverse;

  const direct = await getValue(`lid-mapping:${lidNumber}`);
  if (direct) return typeof direct === 'string' ? direct : direct;

  return null;
}
