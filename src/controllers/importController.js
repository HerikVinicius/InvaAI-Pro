const XLSX = require('xlsx');
const pdfParse = require('pdf-parse');
const xml2js = require('xml2js');
const Product = require('../models/Product');
const { success, error } = require('../utils/apiResponse');

const getTenantProductModel = (req) => req.db.model('Product', Product.schema);

// Flexible column name aliases
const HEADER_MAP = {
  nome:             'name',
  name:             'name',
  produto:          'name',
  description:      'name',
  codigo:           'sku',
  code:             'sku',
  sku:              'sku',
  referencia:       'sku',
  ref:              'sku',
  preco:            'price',
  price:            'price',
  valor:            'price',
  valor_compra:     'price',
  preco_venda:      'price',
  quantidade:       'quantity',
  qty:              'quantity',
  qtd:              'quantity',
  estoque:          'quantity',
  stock:            'quantity',
  categoria:        'category',
  category:         'category',
};

const normalizeHeader = (h) =>
  HEADER_MAP[(h || '').toString().toLowerCase().trim().replace(/[^a-z_]/g, '')] || null;

const parseRow = (row) => {
  const result = {};
  for (const [key, val] of Object.entries(row)) {
    const mapped = normalizeHeader(key);
    if (mapped) result[mapped] = val;
  }
  return result;
};

const coerceRow = (raw) => {
  const name = (raw.name || '').toString().trim();
  const sku = (raw.sku || '').toString().trim().toUpperCase();
  const price = parseFloat((raw.price || '0').toString().replace(',', '.'));
  const quantity = parseInt((raw.quantity || '0').toString(), 10);
  const category = (raw.category || 'Importado').toString().trim();
  return { name, sku, price, quantity, category };
};

const validateRow = ({ name, sku, price, quantity }) => {
  if (!name) return 'Nome obrigatório';
  if (!sku) return 'SKU obrigatório';
  if (isNaN(price) || price < 0) return 'Preço inválido';
  if (isNaN(quantity) || quantity < 0) return 'Quantidade inválida';
  return null;
};

// --- Parsers ---

const parseXlsx = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return raw.map(parseRow);
};

const parseTxt = (buffer) => {
  const text = buffer.toString('utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Auto-detect delimiter: tab > semicolon > comma
  const delimiters = ['\t', ';', ','];
  const header = lines[0];
  const delimiter = delimiters.find((d) => header.includes(d)) || ',';

  const headers = header.split(delimiter).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(delimiter);
    const row = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });
    return parseRow(row);
  });
};

const parsePdf = async (buffer) => {
  const data = await pdfParse(buffer);
  const lines = data.text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Heuristic: try to find a header row with at least two known columns.
  let headerIdx = -1;
  let delimiter = null;

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const delimiters = ['\t', ';', ',', '|'];
    for (const d of delimiters) {
      const parts = lines[i].split(d);
      if (parts.length >= 2 && parts.some((p) => normalizeHeader(p))) {
        headerIdx = i;
        delimiter = d;
        break;
      }
    }
    if (headerIdx >= 0) break;
  }

  if (headerIdx < 0) {
    // No table found in the PDF — try whitespace splitting.
    // Attempt lines like: "SKU  Product Name  10.00  5"
    const dataLines = lines.filter((l) => /\d/.test(l));
    return dataLines.map((line) => {
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 3) {
        const last2 = parts.slice(-2);
        const priceCandidate = parseFloat(last2[0]?.replace(',', '.'));
        const qtyCandidate = parseInt(last2[1], 10);
        if (!isNaN(priceCandidate) && !isNaN(qtyCandidate)) {
          const nameParts = parts.slice(0, -2);
          return parseRow({ nome: nameParts[0] || '', codigo: nameParts[1] || nameParts[0], preco: last2[0], quantidade: last2[1] });
        }
      }
      return {};
    });
  }

  const headers = lines[headerIdx].split(delimiter).map((h) => h.trim());
  return lines.slice(headerIdx + 1).map((line) => {
    const cols = line.split(delimiter);
    const row = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });
    return parseRow(row);
  });
};

// --- XML (NF-e) parser ---
// Parses the official SEFAZ NF-e XML format.
// Structure: <NFe><infNFe><det><prod>
// Fields: <cProd>, <xProd>, <qCom>, <vUnCom>, <vProd>, <NCM>
const parseXml = async (buffer) => {
  const xmlStr = buffer.toString('utf8');
  const parser = new xml2js.Parser({ explicitArray: false });

  try {
    const result = await parser.parseStringPromise(xmlStr);

    const items = [];

    // Try different common structures for NF-e XML
    let detArray = [];

    // Structure 1: NFe > infNFe > det
    if (result?.NFe?.infNFe?.det) {
      const det = result.NFe.infNFe.det;
      detArray = Array.isArray(det) ? det : [det];
    }
    // Structure 2: nfeProc > NFe > infNFe > det
    else if (result?.nfeProc?.NFe?.infNFe?.det) {
      const det = result.nfeProc.NFe.infNFe.det;
      detArray = Array.isArray(det) ? det : [det];
    }
    // Structure 3: Root is nf or nota
    else if (result?.nf?.det) {
      const det = result.nf.det;
      detArray = Array.isArray(det) ? det : [det];
    }
    // Structure 4: Try to find det anywhere in the XML
    else {
      const findDet = (obj) => {
        if (!obj || typeof obj !== 'object') return [];

        if (obj.det) {
          const det = obj.det;
          return Array.isArray(det) ? det : [det];
        }

        for (const key in obj) {
          const found = findDet(obj[key]);
          if (found.length > 0) return found;
        }
        return [];
      };
      detArray = findDet(result);
    }

    if (!detArray || detArray.length === 0) {
      console.log('[ImportController] No det/products found in XML structure');
      return [];
    }

    // Extract products from each detail item
    for (const detail of detArray) {
      const prod = detail?.prod || detail;
      if (!prod) continue;

      // Extract fields with multiple possible names (case-insensitive fallbacks)
      const cProd = (
        prod.cProd || prod.CProd || prod.codigo || prod.Codigo ||
        prod.code || prod.Code || prod.sku || prod.SKU || ''
      ).toString().trim();

      const xProd = (
        prod.xProd || prod.XProd || prod.nome || prod.Nome ||
        prod.descricao || prod.Descricao || prod.description || prod.Description || ''
      ).toString().trim();

      const qCom = parseFloat(
        (prod.qCom || prod.QCom || prod.qtd || prod.Qtd ||
         prod.quantidade || prod.Quantidade || '0').toString()
      );

      const vUnCom = parseFloat(
        (prod.vUnCom || prod.VUnCom || prod.valor || prod.Valor ||
         prod.vUnit || prod.VUnit || '0').toString()
      );

      const vProd = parseFloat(
        (prod.vProd || prod.VProd || prod.total || prod.Total || '0').toString()
      );

      // Validate
      if (!cProd || !xProd) {
        console.log('[ImportController] Skipping product: missing cProd or xProd');
        continue;
      }

      // Calculate unit price
      let unitPrice = vUnCom;
      if ((unitPrice <= 0 || isNaN(unitPrice)) && vProd > 0 && qCom > 0) {
        unitPrice = vProd / qCom;
      }

      // Fallback: use vProd if available
      if ((unitPrice <= 0 || isNaN(unitPrice)) && vProd > 0) {
        unitPrice = vProd;
      }

      // Only add if we have a valid price and product info
      if (unitPrice > 0) {
        items.push({
          sku: cProd.toUpperCase(),
          name: xProd,
          quantity: Math.max(1, Math.round(qCom || 1)),
          costPrice: Math.round(unitPrice * 100) / 100,
          category: 'Importado',
        });
      }
    }

    console.log(`[ImportController] parseXml extracted ${items.length} products`);
    return items;
  } catch (err) {
    console.error('[ImportController] XML parsing error:', err.message);
    throw new Error(`Erro ao processar XML: ${err.message}`);
  }
};

// --- NF-e / DANFE parser ---
// The DANFE PDF layout (as extracted by pdf-parse) places the product CODE and
// numeric fields on one line, and the product DESCRIPTION on the next line(s).
//
// Data row format (real DANFE):
//   B0876XRYGT 85094050 500 6108 UN 1 133,00 133,00 133,00 15,96 0,00 12 0
//   ^-- SKU/ASIN   NCM  CST CFOP UNIT QTY  UNIT_PRICE  TOTAL ...
//
// Description follows on the next non-numeric line(s):
//   MULTIPROCESSADOR COMPACTO BMP900P
//   PLUS 127V, BRITANIA
//
// Strategy:
//   1. Find the "DADOS DOS PRODUTOS" section marker.
//   2. Match data rows: starts with an alphanumeric code (no spaces), followed
//      by NCM (8 digits), then numbers for CST/CFOP/UNID/QTY/prices.
//   3. Collect description from subsequent text lines until the next data row.

const parseNfe = (text) => {
  const brNum = (s) => parseFloat((s || '').replace(/\./g, '').replace(',', '.')) || 0;

  const isNfe = /NOTA FISCAL|NF-?E|DANFE|CHAVE DE ACESSO/i.test(text);
  if (!isNfe) return [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const items = [];

  // Two DANFE layouts observed from pdf-parse:
  //
  // Layout A (Amazon/emissores que colam tudo numa linha):
  //   B0876XRYGT850940505006108UN1133,00133,00...
  //   ^SKU^^NCM+CST+CFOP(12+d)^^UNIT^^QTY+prices^
  //   Description on the NEXT line(s).
  //
  // Layout B (Full Commerce / MercadoPago — SKU separado):
  //   Line N:   "05010103937009"            ← só o SKU/código
  //   Line N+1: "Vodka Ciroc 750ml220860001006108un1209,90209,90..."
  //             ^description^^NCM+CST+CFOP^^UNIT^^QTY+prices^
  //
  // Unified strategy:
  //   - Detect Layout B: a line that is ONLY a product code (pure alphanumeric,
  //     no spaces, 4-20 chars) followed by a line that ends with digits+unit+numbers.
  //   - Detect Layout A: a line that STARTS with a code immediately followed by
  //     a run of 12+ digits (NCM+CST+CFOP).

  const UNIT_RE = /(un|pc|kg|cx|lt|mt|sc|fd|bd|pt|gr|ml|m2|m3|par|jg|ct|rl|vda|amp|dz|gl|tb|frs|env|cj|kit|sv|mwh)/i;
  // Unit anchored after CFOP (4 digits) and before quantity (digit) — avoids false matches like "750ml"
  const UNIT_AFTER_CFOP = /(\d{4})(un|pc|kg|cx|lt|mt|sc|fd|bd|pt|gr|ml|m2|m3|par|jg|ct|rl|vda|amp|dz|gl|tb|frs|env|cj|kit|sv|mwh)(\d)/i;

  // Pure SKU line: only alphanumeric + dash/dot, no spaces, 4-25 chars
  const isPureSku = (l) => /^[A-Z0-9][A-Z0-9\-.]{3,24}$/i.test(l) && !/^(CÓDIGO|DADOS|CÁLCULO|TRANSPORTADOR|INFORMAÇÕES|INSCRIÇÃO|PRODUTO)/i.test(l);

  // Layout A: line starts with SKU directly followed by 12+ digits (NCM+CST+CFOP)
  const isLayoutARow = (l) => /^[A-Z0-9][A-Z0-9\-.]+?\d{12,}/i.test(l);

  // Extract QTY and UNIT_PRICE from the number blob after the unit of measure.
  // E.g. afterUnit = "1209,90209,90172,12..." → { qty:1, price:209.90 }
  // E.g. afterUnit = "1133,00133,00..." → { qty:1, price:133.00 }
  const extractQtyPrice = (afterUnit) => {
    const s = afterUnit.trim();
    // Find shortest integer prefix such that what follows starts with digits,comma (BR decimal)
    for (let len = 1; len <= 8; len++) {
      const rest = s.slice(len);
      if (/^\d+,\d{2}/.test(rest)) {
        const priceM = rest.match(/^(\d+,\d{2})/);
        return { qty: parseInt(s.slice(0, len), 10), price: brNum(priceM[1]) };
      }
    }
    // Fallback: grab first two numbers
    const nums = s.match(/\d+(?:,\d+)?/g) || [];
    if (nums.length < 2) return null;
    return { qty: Math.round(brNum(nums[0])), price: brNum(nums[1]) };
  };

  // Parse a data blob (everything after SKU prefix, starting from digit run) → { qty, price } | null
  // Uses CFOP-anchored unit detection to avoid false matches on digits inside NCM.
  const parseNumericBlob = (afterSku) => {
    // Try CFOP-anchored unit first (most reliable)
    const cfopM = afterSku.match(UNIT_AFTER_CFOP);
    if (cfopM) {
      const unitEnd = cfopM.index + 4 + cfopM[2].length;
      return extractQtyPrice(afterSku.slice(unitEnd));
    }
    // Fallback: find any unit letter sequence
    const unitM = afterSku.match(UNIT_RE);
    if (!unitM) return null;
    return extractQtyPrice(afterSku.slice(unitM.index + unitM[0].length));
  };

  // Parse Layout B description line: "Vodka Ciroc 750ml220860001006108un1209,90..."
  // The unit of measure sits between the CFOP (4 digits) and the quantity (digit).
  // Returns { name, qty, price } or null
  const parseLayoutBDescLine = (l) => {
    const unitM = l.match(UNIT_AFTER_CFOP);
    if (!unitM) return null;
    // unitM.index points to the 4-digit CFOP; unit starts 4 chars later
    const unitStart = unitM.index + 4;
    const unitEnd = unitStart + unitM[2].length;
    const afterUnit = l.slice(unitEnd);
    const beforeUnit = l.slice(0, unitStart); // includes CFOP at the end
    // Strip trailing digit run (NCM 8d + CST + CFOP 4d = 12-16 digits)
    const nameM = beforeUnit.match(/^(.*?)\d{12,}$/);
    const name = (nameM ? nameM[1] : beforeUnit).trim();
    if (!name) return null;
    const qtyPrice = extractQtyPrice(afterUnit.trim());
    if (!qtyPrice || qtyPrice.price <= 0) return null;
    return { name, qty: qtyPrice.qty, price: qtyPrice.price };
  };

  const skipLine = (l) =>
    /^(CÓDIGO|DADOS DO PRODUTO|DADOS DOS PRODUTOS|CÁLCULO|TRANSPORTADOR|INFORMAÇÕES|INSCRIÇÃO)/i.test(l) ||
    /VALOR TOTAL|B\.CALC|ALIQUOTA|NCM\/SH|TOTAL DA NF/i.test(l);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (skipLine(line)) continue;

    // --- Layout B detection: current line is a pure SKU code ---
    if (isPureSku(line) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const parsed = parseLayoutBDescLine(nextLine);
      if (parsed) {
        items.push({
          sku: line.toUpperCase(),
          name: parsed.name,
          quantity: Math.max(1, parsed.qty),
          costPrice: parsed.price,
          category: 'Importado',
        });
        i++; // skip the description+data line
        continue;
      }
    }

    // --- Layout A detection: SKU immediately followed by 12+ digit run ---
    if (!isLayoutARow(line)) continue;

    const concatM = line.match(/^([A-Z0-9][A-Z0-9\-.]*?)(\d{12,})(.*)$/i);
    if (!concatM) continue;
    const [, sku, , afterDigits] = concatM;
    if (!sku || sku.length < 2) continue;

    const qtyPrice = parseNumericBlob(afterDigits);
    if (!qtyPrice || qtyPrice.price <= 0) continue;

    // Description on following lines
    const descParts = [];
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j];
      if (isLayoutARow(next) || isPureSku(next)) break;
      if (/^(CÁLCULO|TRANSPORTADOR|DADOS ADICIONAIS|INFORMAÇÕES|TOTAL DA NF)/i.test(next)) break;
      if (/^\d[\d\s.,]*$/.test(next)) { j++; continue; }
      if (/VALOR TOTAL|B\.CALC|ALIQUOTA|NCM\/SH|CST|CFOP/i.test(next)) { j++; continue; }
      if (/ao aceitar|voce autoriza|tributos incidentes|legislacao tributaria|recuperar tributos/i.test(next)) { j++; continue; }
      descParts.push(next);
      j++;
    }
    i = j - 1;

    items.push({
      sku: sku.toUpperCase(),
      name: descParts.join(' ').trim() || sku.toUpperCase(),
      quantity: Math.max(1, qtyPrice.qty),
      costPrice: qtyPrice.price,
      category: 'Importado',
    });
  }

  return items;
};

// --- Parse only (no DB write) ---
// Returns extracted rows with costPrice. Frontend will apply margin and call commit.

const parseFile = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Nenhum arquivo enviado.', 400);

    const { mimetype, originalname, buffer } = req.file;
    const ext = (originalname || '').toLowerCase().split('.').pop();

    let rows = [];

    if (ext === 'xml' || mimetype === 'application/xml' || mimetype === 'text/xml') {
      try {
        rows = await parseXml(buffer);
        console.log(`[ImportController] parseXml extracted ${rows.length} items`);
      } catch (err) {
        console.error('[ImportController] XML parsing error:', err.message);
        return error(res, `Erro ao processar XML: ${err.message}`, 422);
      }
    } else {
      return error(res, `Formato não suportado: ${ext}. Use apenas XML de NF-e.`, 400);
    }

    const valid = rows.filter((r) => r.name && r.sku);
    if (!valid.length) return error(res, 'Nenhum produto identificado no arquivo XML.', 422);

    return success(res, { products: valid, total: valid.length });
  } catch (err) {
    console.error('[ImportController] parseFile error:', err.message);
    return error(res, err.message || 'Falha ao processar arquivo.', 500);
  }
};

// --- Commit (DB write with pre-calculated prices) ---

const commitImport = async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || !products.length) {
      return error(res, 'Nenhum produto para importar.', 400);
    }

    const TenantProduct = getTenantProductModel(req);
    const log = [];
    let created = 0;
    let updated = 0;

    for (const item of products) {
      const sku = (item.sku || '').toString().trim().toUpperCase();
      const name = (item.name || '').toString().trim();
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const category = (item.category || 'Importado').toString().trim();

      if (!sku || !name) {
        log.push({ sku: sku || '?', name: name || '?', success: false, error: 'SKU ou nome ausente' });
        continue;
      }

      try {
        const existing = await TenantProduct.findOne({ sku });
        if (existing) {
          existing.name = name;
          existing.price = price;
          if (quantity > 0) existing.quantity = quantity;
          existing.category = category;
          await existing.save();
          log.push({ sku, name, success: true, action: 'updated' });
          updated++;
        } else {
          await TenantProduct.create({ name, sku, category, quantity, price, isActive: true });
          log.push({ sku, name, success: true, action: 'created' });
          created++;
        }
      } catch (e) {
        log.push({ sku, name, success: false, error: e.message });
      }
    }

    return success(res, {
      summary: { total: products.length, created, updated, errors: products.length - created - updated },
      log,
    });
  } catch (err) {
    console.error('[ImportController] commitImport error:', err.message);
    return error(res, err.message || 'Falha ao salvar produtos.', 500);
  }
};

// Legacy single-step handler kept for backwards compat
const importProducts = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Nenhum arquivo enviado.', 400);
    const { mimetype, originalname, buffer } = req.file;
    const ext = (originalname || '').toLowerCase().split('.').pop();
    let rows = [];
    if (ext === 'xlsx' || ext === 'xls' || mimetype.includes('spreadsheet') || mimetype.includes('excel')) {
      rows = parseXlsx(buffer);
    } else if (ext === 'txt' || ext === 'csv' || mimetype === 'text/plain' || mimetype === 'text/csv') {
      rows = parseTxt(buffer);
    } else if (ext === 'pdf' || mimetype === 'application/pdf') {
      rows = await parsePdf(buffer);
    } else {
      return error(res, `Formato não suportado: ${ext}.`, 400);
    }
    if (!rows.length) return error(res, 'Arquivo não contém dados legíveis.', 422);
    const TenantProduct = getTenantProductModel(req);
    const log = []; let created = 0; let updated = 0;
    for (const raw of rows) {
      const coerced = coerceRow(raw);
      const validationError = validateRow(coerced);
      if (validationError || !coerced.sku) {
        log.push({ sku: coerced.sku || '(sem código)', name: coerced.name || '(sem nome)', success: false, error: validationError || 'SKU ausente' });
        continue;
      }
      try {
        const existing = await TenantProduct.findOne({ sku: coerced.sku });
        if (existing) {
          existing.name = coerced.name || existing.name;
          existing.price = coerced.price || existing.price;
          if (coerced.quantity > 0) existing.quantity = coerced.quantity;
          if (coerced.category) existing.category = coerced.category;
          await existing.save();
          log.push({ sku: coerced.sku, name: coerced.name, success: true, action: 'updated' });
          updated++;
        } else {
          await TenantProduct.create({ ...coerced, isActive: true });
          log.push({ sku: coerced.sku, name: coerced.name, success: true, action: 'created' });
          created++;
        }
      } catch (e) {
        log.push({ sku: coerced.sku, name: coerced.name, success: false, error: e.message });
      }
    }
    return success(res, { summary: { total: rows.length, created, updated, errors: rows.length - created - updated }, log });
  } catch (err) {
    console.error('[ImportController] importProducts error:', err.message);
    return error(res, err.message || 'Falha na importação.', 500);
  }
};

// Debug endpoint — returns raw text extracted from the PDF (dev only)
const debugParsePdf = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Nenhum arquivo enviado.', 400);
    const data = await pdfParse(req.file.buffer);
    return res.json({ text: data.text, lines: data.text.split('\n').map((l, i) => `${i}: ${l}`) });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { importProducts, parseFile, commitImport, debugParsePdf };
