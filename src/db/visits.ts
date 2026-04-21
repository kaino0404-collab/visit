import { db } from './db'
import type { Visit, ExtractedEvent } from '../types'
import { todayISO } from '../utils/dateUtils'
import { refreshNextVisit } from './hospitals'

export function getVisitsByHospital(hospitalId: number): Visit[] {
  return db.getAllSync<Visit>(
    'SELECT * FROM visits WHERE hospital_id = ? ORDER BY visit_date DESC, created_at DESC',
    [hospitalId]
  )
}

export function getUpcomingVisits(days = 7): Array<Visit & { hospital_name: string }> {
  const today = todayISO()
  const until = new Date()
  until.setDate(until.getDate() + days)
  const untilStr = until.toISOString().split('T')[0]

  return db.getAllSync<Visit & { hospital_name: string }>(
    `SELECT v.*, h.name as hospital_name
     FROM visits v
     JOIN hospitals h ON h.id = v.hospital_id
     WHERE v.visit_date BETWEEN ? AND ? AND v.is_completed = 0
     ORDER BY v.visit_date ASC, v.time ASC`,
    [today, untilStr]
  )
}

export function insertVisits(hospitalId: number, events: ExtractedEvent[]): void {
  for (const e of events) {
    db.runSync(
      `INSERT INTO visits (hospital_id, visit_date, visit_type, time, location, content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [hospitalId, e.date, e.type, e.time ?? null, e.location ?? null, e.content]
    )
  }
  refreshNextVisit(hospitalId)
}

export function markVisitComplete(visitId: number): void {
  db.runSync(
    `UPDATE visits SET is_completed = 1 WHERE id = ?`,
    [visitId]
  )
  const row = db.getFirstSync<{ hospital_id: number }>(
    'SELECT hospital_id FROM visits WHERE id = ?', [visitId]
  )
  if (row) refreshNextVisit(row.hospital_id)
}

export function deleteVisit(visitId: number): void {
  const row = db.getFirstSync<{ hospital_id: number }>(
    'SELECT hospital_id FROM visits WHERE id = ?', [visitId]
  )
  db.runSync('DELETE FROM visits WHERE id = ?', [visitId])
  if (row) refreshNextVisit(row.hospital_id)
}
