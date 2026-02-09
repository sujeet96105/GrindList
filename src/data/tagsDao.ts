import { getDb } from './db';
import { Tag } from '../types/taxonomy';

export async function insertTag(tag: Tag) {
  const db = await getDb();
  await db.executeSql(
    `INSERT OR REPLACE INTO tags
    (id, name, color, created_at, updated_at, deleted_at)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      tag.id,
      tag.name,
      tag.color ?? null,
      tag.createdAt,
      tag.updatedAt,
      tag.deletedAt ?? null,
    ]
  );
}

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDb();
  const [results] = await db.executeSql(
    `SELECT * FROM tags WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE`
  );
  const rows = results.rows;
  const tags: Tag[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows.item(i);
    tags.push({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
  return tags;
}

export async function getTagById(id: string): Promise<Tag | null> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT * FROM tags WHERE id = ? LIMIT 1`, [id]);
  if (results.rows.length === 0) return null;
  const row = results.rows.item(0);
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}
