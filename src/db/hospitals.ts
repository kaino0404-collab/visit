import { db } from './db'
import type { Hospital, MergedData } from '../types'
import { todayISO } from '../utils/dateUtils'

export function getAllHospitals(): Hospital[] {
  return db.getAllSync<Hospital>(
    'SELECT * FROM hospitals ORDER BY updated_at DESC'
  )
}

export function getHospitalById(id: number): Hospital | null {
  return db.getFirstSync<Hospital>('SELECT * FROM hospitals WHERE id = ?', [id]) ?? null
}

export function getUpcomingHospitals(): Hospital[] {
  const today = todayISO()
  return db.getAllSync<Hospital>(
    'SELECT * FROM hospitals WHERE next_visit >= ? ORDER BY next_visit ASC',
    [today]
  )
}

export function insertHospital(data: {
  name: string
  doctor_name?: string | null
  personality?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
}): number {
  const result = db.runSync(
    `INSERT INTO hospitals (name, doctor_name, personality, phone, address, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.name, data.doctor_name ?? null, data.personality ?? null,
     data.phone ?? null, data.address ?? null, data.notes ?? null]
  )
  return result.lastInsertRowId
}

export function updateHospital(id: number, data: Omit<MergedData, 'new_events'>): void {
  db.runSync(
    `UPDATE hospitals SET
       doctor_name = COALESCE(?, doctor_name),
       personality = CASE WHEN ? IS NOT NULL THEN ? ELSE personality END,
       phone       = COALESCE(?, phone),
       address     = COALESCE(?, address),
       notes       = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
       updated_at  = datetime('now', 'localtime')
     WHERE id = ?`,
    [
      data.doctor_name,
      data.personality, data.personality,
      data.phone,
      data.address,
      data.notes, data.notes,
      id
    ]
  )
}

export function refreshNextVisit(hospitalId: number): void {
  const today = todayISO()
  const row = db.getFirstSync<{ visit_date: string }>(
    `SELECT visit_date FROM visits
     WHERE hospital_id = ? AND is_completed = 0 AND visit_date >= ?
     ORDER BY visit_date ASC LIMIT 1`,
    [hospitalId, today]
  )
  const lastRow = db.getFirstSync<{ visit_date: string }>(
    `SELECT visit_date FROM visits
     WHERE hospital_id = ? AND is_completed = 1
     ORDER BY visit_date DESC LIMIT 1`,
    [hospitalId]
  )
  db.runSync(
    `UPDATE hospitals SET next_visit = ?, last_visit = COALESCE(?, last_visit),
     updated_at = datetime('now', 'localtime') WHERE id = ?`,
    [row?.visit_date ?? null, lastRow?.visit_date ?? null, hospitalId]
  )
}

export function deleteHospital(id: number): void {
  db.runSync('DELETE FROM hospitals WHERE id = ?', [id])
}
