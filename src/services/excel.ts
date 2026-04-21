// @ts-ignore
global.Buffer = global.Buffer ?? require('buffer').Buffer

import ExcelJS from 'exceljs'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import type { Hospital, Visit } from '../types'
import { formatDate, visitTypeLabel } from '../utils/dateUtils'

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern', pattern: 'solid',
  fgColor: { argb: 'FFDBEAFE' }
}
const UPCOMING_FILL: ExcelJS.Fill = {
  type: 'pattern', pattern: 'solid',
  fgColor: { argb: 'FFFEF9C3' }
}
const BOLD_FONT: Partial<ExcelJS.Font> = { bold: true, size: 11 }
const TODAY = new Date().toISOString().split('T')[0]

export async function exportToExcel(
  hospitals: Hospital[],
  visitsByHospital: Record<number, Visit[]>
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'MedVisit'
  wb.created = new Date()

  buildSummarySheet(wb, hospitals)
  for (const h of hospitals) {
    buildHospitalSheet(wb, h, visitsByHospital[h.id] ?? [])
  }

  const buffer = await wb.xlsx.writeBuffer()
  const base64 = Buffer.from(buffer as ArrayBuffer).toString('base64')
  const date = TODAY.replace(/-/g, '')
  const uri = `${FileSystem.cacheDirectory}medvisit_${date}.xlsx`

  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64
  })

  const canShare = await Sharing.isAvailableAsync()
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: '업무일지 내보내기'
    })
  }
}

function buildSummarySheet(wb: ExcelJS.Workbook, hospitals: Hospital[]): void {
  const ws = wb.addWorksheet('병원목록')
  ws.columns = [
    { header: '병원명', key: 'name', width: 20 },
    { header: '원장명', key: 'doctor', width: 14 },
    { header: '전화번호', key: 'phone', width: 16 },
    { header: '성향/스타일', key: 'personality', width: 28 },
    { header: '최근방문일', key: 'last', width: 14 },
    { header: '다음방문일', key: 'next', width: 14 },
    { header: '메모', key: 'notes', width: 40 }
  ]

  const headerRow = ws.getRow(1)
  headerRow.font = BOLD_FONT
  headerRow.fill = HEADER_FILL
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.autoFilter = { from: 'A1', to: 'G1' }

  for (const h of hospitals) {
    const row = ws.addRow({
      name: h.name,
      doctor: h.doctor_name ?? '',
      phone: h.phone ?? '',
      personality: h.personality ?? '',
      last: h.last_visit ? formatDate(h.last_visit) : '',
      next: h.next_visit ? formatDate(h.next_visit) : '',
      notes: h.notes ?? ''
    })
    row.getCell('notes').alignment = { wrapText: true }
    if (h.next_visit && h.next_visit >= TODAY) {
      row.getCell('next').fill = UPCOMING_FILL
    }
  }
}

function buildHospitalSheet(wb: ExcelJS.Workbook, h: Hospital, visits: Visit[]): void {
  const name = h.name.slice(0, 31)
  const ws = wb.addWorksheet(name)
  ws.getColumn('A').width = 14
  ws.getColumn('B').width = 40

  const addInfoRow = (label: string, value: string | null) => {
    if (!value) return
    const row = ws.addRow([label, value])
    row.getCell(1).font = BOLD_FONT
    row.getCell(1).fill = HEADER_FILL
    row.getCell(2).alignment = { wrapText: true }
    row.height = 22
  }

  addInfoRow('병원명', h.name)
  addInfoRow('원장명', h.doctor_name)
  addInfoRow('전화번호', h.phone)
  addInfoRow('주소', h.address)
  addInfoRow('성향/스타일', h.personality)
  addInfoRow('메모', h.notes)

  if (visits.length === 0) return

  ws.addRow([])

  const sectionRow = ws.addRow(['─── 방문/약속 기록 ───'])
  sectionRow.getCell(1).font = BOLD_FONT
  ws.mergeCells(`A${sectionRow.number}:F${sectionRow.number}`)

  const headerRow = ws.addRow(['날짜', '구분', '시간', '장소', '내용', '완료'])
  headerRow.font = BOLD_FONT
  headerRow.fill = HEADER_FILL
  ws.getColumn('C').width = 8
  ws.getColumn('D').width = 16
  ws.getColumn('E').width = 40
  ws.getColumn('F').width = 6

  for (const v of visits) {
    const row = ws.addRow([
      formatDate(v.visit_date),
      visitTypeLabel(v.visit_type),
      v.time ?? '',
      v.location ?? '',
      v.content,
      v.is_completed ? '✓' : ''
    ])
    row.getCell(5).alignment = { wrapText: true }
    row.height = 22
    if (!v.is_completed && v.visit_date >= TODAY) {
      for (let c = 1; c <= 6; c++) row.getCell(c).fill = UPCOMING_FILL
    }
  }
}
