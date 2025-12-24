// @ts-ignore
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    // Read PDF buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;

    // Get first page
    const page = await pdf.getPage(1);

    // Extract text content
    const textContent = await page.getTextContent();
    const fullText = textContent.items.map((item: any) => item.str).join(' ');

    console.log('Full text:', fullText);

    // Define fields to extract (for reference, but now extracting all)
    const fields = [
      'Challan Generated On',
      'Establishment Name',
      'Wage Month',
      'Total Amount (Rs)',
      'Payment Date'
    ];

    console.log('Full text:', fullText);

    // Extract only the specified fields
    const extractedData: { [key: string]: string } = {};

    // Patterns for the desired fields
    const patterns = {
      'Challan Generated On': /(.+)Challan Generated On\s*:/,
      'Establishment Name': /(.+)Establishment Name\s*:/,
      'Total Amount (Rs)': /(.+)Total Amount \(Rs\)\s*:/,
      'Payment Date': /Payment Date\s*:\s*(.+)/,
      'Wage Month': /(.+)Wage Month\s*:/,
    };

    // Extract the fields
    Object.entries(patterns).forEach(([field, pattern]) => {
      const match = fullText.match(pattern);
      if (match) {
        extractedData[field] = match[1].trim();
      }
    });

    console.log('Extracted data:', extractedData);

    // Create Excel workbook with field names as column headers
    const wb = XLSX.utils.book_new();
    const headers = Object.keys(extractedData);
    const values = Object.values(extractedData);
    const wsData = [headers, values];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=extracted-data.xlsx',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
  }
}