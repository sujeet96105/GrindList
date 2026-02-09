import { getDb } from './db';
import { Category } from '../types/taxonomy';

export async function insertCategory(category: Category) {
  const db = await getDb();
  await db.executeSql(
    `INSERT OR REPLACE INTO categories
    (id, name, color, created_at, updated_at, deleted_at)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      category.id,
      category.name,
      category.color ?? null,
      category.createdAt,
      category.updatedAt,
      category.deletedAt ?? null,
    ]
  );
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  const [results] = await db.executeSql(
    `SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE`
  );
  const rows = results.rows;
  const categories: Category[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows.item(i);
    categories.push({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
  return categories;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT * FROM categories WHERE id = ? LIMIT 1`, [id]);
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
