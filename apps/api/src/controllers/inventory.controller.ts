import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../db';

export async function getInventory(req: AuthRequest, res: Response) {
  const { warehouse_id } = req.query;
  try {
    const query = warehouse_id
      ? `SELECT i.*, w.name as warehouse_name FROM inventory i
         LEFT JOIN warehouses w ON i.warehouse_id = w.id
         WHERE i.warehouse_id = $1 ORDER BY i.name`
      : `SELECT i.*, w.name as warehouse_name FROM inventory i
         LEFT JOIN warehouses w ON i.warehouse_id = w.id ORDER BY i.name`;
    const result = await pool.query(query, warehouse_id ? [warehouse_id] : []);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getLowStock(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      `SELECT i.*, w.name as warehouse_name FROM inventory i
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.quantity <= i.low_stock_threshold ORDER BY i.quantity ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createInventoryItem(req: AuthRequest, res: Response) {
  const { name, description, unit, quantity, low_stock_threshold, warehouse_id, supplier } = req.body;
  if (!name || !unit) {
    res.status(400).json({ error: 'name and unit are required' });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO inventory (name, description, unit, quantity, low_stock_threshold, warehouse_id, supplier)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, unit, quantity || 0, low_stock_threshold || 10, warehouse_id, supplier]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateInventoryItem(req: AuthRequest, res: Response) {
  const { name, description, unit, quantity, low_stock_threshold, supplier } = req.body;
  if (!name || !unit) {
    res.status(400).json({ error: 'name and unit are required' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE inventory SET
        name                = $1,
        description         = COALESCE($2, description),
        unit                = $3,
        quantity            = $4,
        low_stock_threshold = $5,
        supplier            = COALESCE($6, supplier),
        updated_at          = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, description ?? null, unit, quantity, low_stock_threshold, supplier ?? null, req.params.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteInventoryItem(req: AuthRequest, res: Response) {
  try {
    await pool.query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
