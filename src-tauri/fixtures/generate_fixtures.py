import os
import zipfile

def create_simple_xlsx(filename, sheet_name, headers, rows, extra_comment=""):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    # Collect all strings
    all_strings = list(headers)
    for row in rows:
        for cell in row:
            if cell not in all_strings:
                all_strings.append(cell)
    
    if "" not in all_strings:
        all_strings.append("")
    
    str_to_idx = {s: i for i, s in enumerate(all_strings)}

    def col_letter(col_idx):
        return chr(ord('A') + col_idx)

    sheet_rows = []
    # Header row (row 1)
    hdr_cells = "".join(f'<c r="{col_letter(ci)}1" t="s"><v>{str_to_idx[h]}</v></c>' for ci, h in enumerate(headers))
    sheet_rows.append(f'<row r="1">{hdr_cells}</row>')

    for ri, row in enumerate(rows, start=2):
        row_cells = []
        for ci, val in enumerate(row):
            row_cells.append(f'<c r="{col_letter(ci)}{ri}" t="s"><v>{str_to_idx[val]}</v></c>')
        sheet_rows.append(f'<row r="{ri}">{"".join(row_cells)}</row>')

    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>'''

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

    wb_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>'''

    workbook = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <!-- {extra_comment} -->
  <sheets>
    <sheet name="{sheet_name}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>'''

    sst_items = "".join(f"<si><t>{s}</t></si>" for s in all_strings)
    shared_strings = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{len(all_strings)}" uniqueCount="{len(all_strings)}">
  {sst_items}
</sst>'''

    sheet_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    {"".join(sheet_rows)}
  </sheetData>
</worksheet>'''

    with zipfile.ZipFile(filename, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('xl/_rels/workbook.xml.rels', wb_rels)
        z.writestr('xl/workbook.xml', workbook)
        z.writestr('xl/sharedStrings.xml', shared_strings)
        z.writestr('xl/worksheets/sheet1.xml', sheet_xml)

if __name__ == '__main__':
    headers = ["Matrícula", "Nome", "Rua", "Numero", "Bairro", "Quadra", "Lote", "Complemento"]

    # 1. Incomplete address v1
    rows_inc_v1 = [
        ["MATR-INCOMPLETE-101", "Proprietário Incompleto", "RUA DAS PALMEIRAS", "", "CENTRO", "", "", ""]
    ]
    create_simple_xlsx('fixtures/test_incomplete_v1.xlsx', 'endereco', headers, rows_inc_v1, "v1")

    # 2. Incomplete address v2 (different file hash, same property data)
    rows_inc_v2 = [
        ["MATR-INCOMPLETE-101", "Proprietário Incompleto", "RUA DAS PALMEIRAS", "", "CENTRO", "", "", ""]
    ]
    create_simple_xlsx('fixtures/test_incomplete_v2.xlsx', 'endereco', headers, rows_inc_v2, "v2-updated-timestamp-hash")

    # 3. Batch reconciliation test fixture (associated, ambiguous, rejected)
    rows_recon = [
        ["MATR-RECON-1", "Titular 1", "RUA ALFA", "10", "CENTRO", "1", "2", ""],
        ["MATR-RECON-2", "Titular 2", "RUA BETA", "20", "CENTRO", "3", "4", ""],
        ["MATR-DUPLA", "Titular Duplo", "RUA DO COMERCIO", "50", "CENTRO", "", "", ""],
        ["", "", "", "", "", "", "", ""]
    ]
    create_simple_xlsx('fixtures/test_batch_reconciliation.xlsx', 'endereco', headers, rows_recon, "batch-reconciliation")
    print("Fixtures generated successfully!")
