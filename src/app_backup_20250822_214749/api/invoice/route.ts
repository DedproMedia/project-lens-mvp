import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(_req: NextRequest) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawRectangle({ x: 0, y: height-80, width, height: 80, color: rgb(0, 0.2, 0.4) });
  page.drawText('INVOICE', { x: 40, y: height-50, size: 24, font, color: rgb(1,1,1) });
  page.drawText('Project Lens — Demo', { x: 40, y: height-70, size: 10, font, color: rgb(1,1,1) });

  let y = height-120;
  const lines = [
    'Bill To: Client Co.',
    'Invoice #: INV-0001',
    'Issue Date: 2025-08-20',
    'Due Date: 2025-09-01',
    '',
    'Items:',
    ' - Design Work (10h) £1000',
    ' - Photography (5h) £1000',
    '',
    'Subtotal: £2000',
    'Tax (10%): £200',
    'Total: £2200'
  ];
  for (const l of lines) {
    page.drawText(l, { x: 40, y, size: 12, font, color: rgb(0.2,0.2,0.2) });
    y -= 16;
  }

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename=invoice.pdf' }
  });
}
