import { Product } from '@/types';

// Google Sheets published URL (CSV format)
// Your published Google Sheet: https://docs.google.com/spreadsheets/d/e/2PACX-1vSrIPYfboA1fdIxPUT16pZDdD8tsHll-TIE5GpFYpZC62m6ApV0HRqCDPRi25kObSrmmiS31dFnorCC/pubhtml?gid=1920675260&single=true
// CSV export URL with gid=1920675260
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSrIPYfboA1fdIxPUT16pZDdD8tsHll-TIE5GpFYpZC62m6ApV0HRqCDPRi25kObSrmmiS31dFnorCC/pub?gid=1920675260&single=true&output=csv';

export async function fetchProductsFromGoogleSheets(): Promise<Product[]> {
  try {
    // Fetch data from Google Sheets (CSV format)
    const response = await fetch(GOOGLE_SHEETS_URL);
    const csvText = await response.text();
    
    // Parse CSV
    const rows = parseCSV(csvText);
    
    // Skip header row and map to Product type
    const products: Product[] = rows.slice(1).map((row: string[], index: number) => ({
      id: row[0] || String(index + 1),
      title: row[1] || '',
      description: row[2] || '',
      price: parseFloat(row[3] || '0'),
      category: row[4] || '',
      image: row[5] || '',
    }));
    
    return products;
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    // Fallback to local JSON file
    const productsData = await import('@/data/products.json');
    return productsData.default as Product[];
  }
}

function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n');
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

