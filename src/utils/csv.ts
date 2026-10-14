import { Item, ComputedItem } from '../types';

export function parseCSVText(text: string): Partial<Item>[] {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows = lines.map(line => {
    const res: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        res.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur.trim());
    return res;
  });

  let startIdx = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    if (rows[i][0] && /^\d+$/.test(rows[i][0].trim())) {
      startIdx = i;
      break;
    }
  }

  const parsed: Partial<Item>[] = [];
  for (let i = startIdx; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 3 || !r[0]) continue;
    const code = r[0].trim();
    const desc = (r[1] || '').trim().replace(/\s+/g, ' ');
    const stock = parseFloat(r[2] || '0') || 0;
    const cust_ord = parseFloat(r[3] || '0') || 0;
    const res_ord = parseFloat(r[4] || '0') || 0;
    const po_imp = parseFloat(r[5] || '0') || 0;
    const ship_imp = parseFloat(r[6] || '0') || 0;
    const lead_time = parseFloat(r[7] || '90') || 90;
    const avg6 = parseFloat(r[8] || '0') || 0;
    const avg12 = parseFloat(r[9] || '0') || 0;
    const avg3 = parseFloat(r[10] || '0') || 0;
    const recStr = (r[11] || '').trim();
    const erp_rec = recStr !== '' ? (parseFloat(recStr) || 0) : 0;
    const has_erp_rec = recStr !== '';

    parsed.push({
      id: code,
      code,
      desc: desc || `פריט ${code}`,
      stock,
      cust_ord,
      res_ord,
      po_imp,
      ship_imp,
      lead_time,
      avg6,
      avg12,
      avg3,
      erp_rec,
      has_erp_rec
    });
  }
  return parsed;
}

export function exportItemsToCsv(items: ComputedItem[], filename = 'דוח_המלצת_רכש.csv') {
  const headers = [
    'מק"ט פריט',
    'תאור',
    'קטגוריה',
    'סדרה',
    'מצאי',
    'הזמנות לקוח',
    'הזמנות שמורות',
    'הזמנות רכש',
    'משלוחי יבוא',
    'מלאי זמין',
    'זמן אספקה (ימים)',
    'צריכה ממוצעת (3)',
    'צריכה ממוצעת (6)',
    'צריכה ממוצעת (12)',
    'כמות מומלצת להזמנה',
    'הערות'
  ];

  const rows = items.map(i => [
    i.code,
    `"${(i.desc || '').replace(/"/g, '""')}"`,
    `"${(i.cat || '').replace(/"/g, '""')}"`,
    `"${(i.series || '').replace(/"/g, '""')}"`,
    i.stock,
    i.cust_ord,
    i.res_ord,
    i.po_imp,
    i.ship_imp,
    i.netAvail,
    i.lead_time,
    i.avg3,
    i.avg6,
    i.avg12,
    i.calcRec > 0 ? i.calcRec : 0,
    `"${(i.notes || '').replace(/"/g, '""')}"`
  ]);

  // \uFEFF ensures UTF-8 BOM so Excel opens Hebrew properly without mojibake
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
