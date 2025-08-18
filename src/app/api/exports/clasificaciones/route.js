// src/app/api/exports/clasificaciones/route.js

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'

/** Ping rápido:
 *  http://localhost:3000/api/exports/clasificaciones?ping=1  -> {"ok":true}
 *  http://localhost:3000/api/exports/clasificaciones?selftest=1 -> descarga un PDF mínimo
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('ping')) return NextResponse.json({ ok: true })

  if (searchParams.get('selftest') === '1') {
    const { PDFDocument, StandardFonts } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 en puntos aprox
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    page.drawText('Self-test PDF OK', { x: 180, y: 800, size: 24, font: fontBold })
    const bytes = await pdfDoc.save()
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="selftest.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  }

  return NextResponse.json({ msg: 'Use POST con ?format=xlsx|pdf' })
}

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url)
    const format = (searchParams.get('format') || 'xlsx').toLowerCase()
    const { carreraId, rows } = await req.json()

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Sin datos para exportar' }, { status: 400 })
    }

    // ====== XLSX (sin cambios, funciona) ======
    if (format === 'xlsx') {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Clasificación')

      ws.columns = [
        { header: 'Posición', key: 'posicion', width: 10 },
        { header: 'Nombre',   key: 'nombre',   width: 28 },
        { header: 'Dorsal',   key: 'dorsal',   width: 10 },
        { header: 'Team',     key: 'team',     width: 18 },
        { header: 'Tiempo',   key: 'tiempo',   width: 12 },
        { header: 'Diferencia', key: 'diferencia', width: 12 },
      ]
      rows.forEach(r => ws.addRow(r))
      ws.getRow(1).font = { bold: true }
      ws.eachRow(row => {
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' },
          }
        })
      })
      const buf = await wb.xlsx.writeBuffer()
      return new Response(Buffer.from(buf), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="clasificaciones_${carreraId}.xlsx"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // ====== PDF con pdf-lib (sin streams, super estable) ======
    if (format === 'pdf') {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')

      // Doc A4
      const pdfDoc = await PDFDocument.create()
      let page = pdfDoc.addPage([595.28, 841.89]) // A4
      const width = page.getWidth()
      const height = page.getHeight()

      const margin = 40
      const tableLeft = margin
      const tableRight = width - margin
      const tableWidth = tableRight - tableLeft

      // Fuentes
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      // Helpers
      let y = height - margin
      const lineH = 16
      const headH = 22

      const drawText = (text, x, y, size = 11, bold = false, maxWidth) => {
        const fnt = bold ? fontBold : font
        let txt = String(text ?? '')
        if (maxWidth) {
          // Truncar con "…" si se pasa
          const ellipsis = '…'
          let w = fnt.widthOfTextAtSize(txt, size)
          const ellW = fnt.widthOfTextAtSize(ellipsis, size)
          while (w > maxWidth && txt.length > 0) {
            txt = txt.slice(0, -1)
            w = fnt.widthOfTextAtSize(txt, size) + ellW
          }
          if (fnt.widthOfTextAtSize(String(text ?? ''), size) > maxWidth) {
            txt = txt + ellipsis
          }
        }
        page.drawText(txt, { x, y, size, font: fnt, color: rgb(0, 0, 0) })
      }

      const newPage = () => {
        page = pdfDoc.addPage([595.28, 841.89])
        y = height - margin
      }

      // Título + fecha
      drawText(`Clasificación General — Carrera ${carreraId}`, margin, y, 16, true)
      y -= 20
      page.drawText(`Generado: ${new Date().toLocaleString()}`, {
        x: margin, y, size: 10, font, color: rgb(0.33, 0.33, 0.33),
      })
      y -= 18

      // Encabezados
      const headers = ['Posición', 'Nombre', 'Dorsal', 'Team', 'Tiempo', 'Diferencia']
      const widths  = [60,        180,      60,       120,    70,       80]
      const colX    = widths.reduce((acc, w, i) => {
        const x = i === 0 ? tableLeft : acc[i - 1] + widths[i - 1]
        acc.push(x); return acc
      }, [])

      // Dibuja encabezados
      headers.forEach((h, i) => drawText(h, colX[i], y, 11, true, widths[i]))
      // Línea separadora
      page.drawLine({
        start: { x: tableLeft, y: y - 4 },
        end: { x: tableLeft + tableWidth, y: y - 4 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      })
      y -= headH

      // Filas
      rows.forEach(r => {
        if (y < margin + 40) { newPage() } // salto de página simple

        const vals = [r.posicion, r.nombre, r.dorsal, r.team, r.tiempo, r.diferencia]
        vals.forEach((val, i) => drawText(String(val ?? ''), colX[i], y, 11, false, widths[i]))
        y -= lineH
      })

      const bytes = await pdfDoc.save()
      return new Response(Buffer.from(bytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="clasificaciones_${carreraId}.pdf"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 })
  } catch (e) {
    console.error('EXPORT_ERROR_TOP:', e)
    return NextResponse.json({ error: 'Error generando exportación' }, { status: 500 })
  }
}
