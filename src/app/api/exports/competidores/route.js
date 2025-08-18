// src/app/api/exports/competidores/route.js

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'

// GET de verificación rápida:
//  - ping:     /api/exports/competidores?ping=1
//  - selftest: /api/exports/competidores?selftest=1  (descarga un PDF mínimo)
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('ping')) return NextResponse.json({ ok: true })

  if (searchParams.get('selftest') === '1') {
    const { PDFDocument, StandardFonts } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 aprox
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    page.drawText('Self-test PDF OK — Competidores', { x: 120, y: 800, size: 20, font: fontBold })
    const bytes = await pdfDoc.save()
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="selftest_competidores.pdf"',
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
    // rows: [{ nombre, cedula, edad, team, dorsal }]

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Sin datos para exportar' }, { status: 400 })
    }

    if (format === 'xlsx') {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Competidores')

      ws.columns = [
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Cédula', key: 'cedula', width: 18 },
        { header: 'Edad',   key: 'edad',   width: 8  },
        { header: 'Team',   key: 'team',   width: 20 },
        { header: 'Dorsal', key: 'dorsal', width: 10 },
      ]

      rows.forEach(r => ws.addRow({
        nombre: r.nombre ?? '',
        cedula: r.cedula ?? '',
        edad: r.edad ?? '',
        team: r.team ?? '',
        dorsal: r.dorsal ?? '',
      }))

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
          'Content-Disposition': `attachment; filename="competidores_${carreraId}.xlsx"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    if (format === 'pdf') {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')

      const pdfDoc = await PDFDocument.create()
      let page = pdfDoc.addPage([595.28, 841.89]) // A4
      const width = page.getWidth()
      const height = page.getHeight()

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const margin = 40
      const tableLeft = margin
      const tableRight = width - margin
      const tableWidth = tableRight - tableLeft

      let y = height - margin
      const lineH = 16
      const headH = 22

      const drawText = (text, x, y, size = 11, bold = false, maxWidth) => {
        const fnt = bold ? fontBold : font
        let txt = String(text ?? '')
        if (maxWidth) {
          // truncar con …
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

      // Título
      drawText(`Competidores Inscritos — Carrera ${carreraId}`, margin, y, 16, true)
      y -= 20
      page.drawText(`Generado: ${new Date().toLocaleString()}`, {
        x: margin, y, size: 10, font, color: rgb(0.33, 0.33, 0.33),
      })
      y -= 18

      // Encabezados y anchos de columnas
      const headers = ['Nombre', 'Cédula', 'Edad', 'Team', 'Dorsal']
      const widths  = [220,      110,      40,     140,    60]
      const colX    = widths.reduce((acc, w, i) => {
        const x = i === 0 ? tableLeft : acc[i - 1] + widths[i - 1]
        acc.push(x); return acc
      }, [])

      headers.forEach((h, i) => drawText(h, colX[i], y, 11, true, widths[i]))
      // Línea separadora
      page.drawLine({
        start: { x: tableLeft, y: y - 4 },
        end:   { x: tableLeft + tableWidth, y: y - 4 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      })
      y -= headH

      // Filas
      rows.forEach(r => {
        if (y < margin + 40) newPage()
        const vals = [r.nombre, r.cedula, r.edad, r.team, r.dorsal]
        vals.forEach((val, i) => drawText(String(val ?? ''), colX[i], y, 11, false, widths[i]))
        y -= lineH
      })

      const bytes = await pdfDoc.save()
      return new Response(Buffer.from(bytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="competidores_${carreraId}.pdf"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 })
  } catch (e) {
    console.error('EXPORT_COMPETIDORES_ERROR:', e)
    return NextResponse.json({ error: 'Error generando exportación' }, { status: 500 })
  }
}
