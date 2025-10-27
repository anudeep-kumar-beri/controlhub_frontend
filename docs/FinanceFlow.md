{"id":"76390","variant":"standard","title":"FinanceFlow — Full Project Documentation (with Master Plus/Minus Sheets & ControlHub Integration)"}
# FinanceFlow — Full Project Documentation (with Master Plus/Minus Sheets & ControlHub Integration)

**Project name (suggested):** `FinanceFlow`  
**Purpose:** Personal, private web app (ControlHub module) to track investments (FDs, SIPs, etc.), liabilities, income, expenses and produce audit-friendly ledgers plus a compact Net P&L. Minimal, dark theme (CRED-like), white lines, subtle neon accents. Multi-page, persistent, exportable, and optionally cloud synced. Includes a Master “Plus/Minus” sheet (master ledger) and per-module sheets; full export & import support.







proceed with development
---

## 1. Executive summary
Build a secure, multi-page personal finance module that stores ledger items (investments, income, expenses, loans), auto-calculates Net Worth and Net P&L, provides audit/history views and export. The UI is intentionally minimal — focusing on ledger clarity and quick audit. Works offline with IndexedDB and can sync to ControlHub backend. Adds a **Master Plus/Minus Sheet** that aggregates inflows/outflows across all ledgers and appears as a spreadsheet-like view (editable or read-only) inside the module.

---

## 2. High-level goals
- Single source of truth for personal finances (assets & liabilities).  
- Clear, audit-ready ledger views and monthly/yearly reports.  
- Master Plus/Minus Sheet (aggregated balance sheet) always available.  
- Net Worth and Net P&L always visible.  
- Minimal, dark, accessible UI with subtle animations.  
- Portable: local-first with optional cloud backup/sync.  
- Export to Excel/PDF and easy data backup (Master sheet included).

---

## 3. Core features (MVP) — revised to include sheets
- Multi-page UI: Dashboard, Investments, Income, Expenses, Loans, **Master Sheet**, Audit/Exports, Settings.  
- CRUD for ledger items (Create / Read / Update / Delete).  
- **Master Plus/Minus Sheet** (aggregator): per-category inflow/outflow, net rows, editable summary cells, and per-month breakdown.  
- Auto-calculation: per-item returns (FD compounding), total invested, current value, Net P&L, Net Worth.  
- Date scoped reports (month / year / custom).  
- Export to `.xlsx` (multi-sheet workbook with `Master PlusMinus` sheet) and `.pdf`.  
- Local-first persistence (IndexedDB) + optional server sync.  
- Audit history with immutable change log (optional).  
- Authentication (optional for cloud usage) — local mode needs no sign-in.

---

## 4. Suggested tech stack
(unchanged, but with Sheet-centric additions)
- Frontend: React (hooks), Plain CSS (BEM/CSS Modules), optional Framer Motion.  
- Local DB: IndexedDB via `idb` or `idb-keyval`.  
- Sheet UI: lightweight spreadsheet component (e.g., `handsontable` community / `react-data-grid` / custom editable grid) for Master Sheet view.  
- Export: `SheetJS` (xlsx) to generate workbook with multiple sheets including `Master PlusMinus`.  
- PDF: `jsPDF`.  
- Backend (optional): Node.js + Express + MongoDB (new finance collections), with endpoints for master aggregation and export.  
- Sync: Web Worker + delta-sync endpoints (`/api/finance/changes`) + optional WebSockets.

---

## 5. Multi-page layout & route map (updated)
```
/ — Landing / quick login (optional)
/dashboard — Finance summary cards (Total Invested / Current Value / Net P&L / Last Audit Date)
/finance/investments — Investments ledger (table/list), Add Investment modal
/finance/income — Income ledger
/finance/expenses — Expenses ledger
/finance/loans — Loans & liabilities ledger
/finance/master-sheet — Master Plus/Minus Sheet (spreadsheet view)
/finance/audit — Historical audit, export controls, immutable change log viewer
/finance/settings — Theme, backup & sync preferences, export/import
/finance/help — Short user guide
```

**Navigation**: FinanceFlow entry inside ControlHub sidebar → subnav for ledger pages + Master Sheet.

---

## 6. Data model (example) — extended with inflow/outflow fields and sheet metadata

**Investment**
```json
{
  "id": "uuid",
  "type": "FD|MF|Stock|Other",
  "institution": "HDFC Bank",
  "amount": 100000,
  "interest_rate": 6.5,
  "start_date": "2025-10-01",
  "tenure_months": 12,
  "maturity_date": "2026-10-01",
  "status": "Active|Closed",
  "notes": "...",
  "computed": {
    "maturity_value": 106500,
    "interest_earned": 6500
  },
  "inflow": 100000,
  "outflow": 0
}
```

**Income / Expense / Loan** include:
- `inflow` (positive amounts credited), `outflow` (positive amounts debited), `category`, `recurrence`, `tags`, `attachments`.

**MasterSheetRow**
```json
{
  "id":"row-uuid",
  "label":"Investments",
  "inflow_total": 120000,
  "outflow_total": 0,
  "net": 120000,
  "notes":"FD + SIP summary",
  "monthly_breakdown": {
     "2025-10": {"inflow":50000,"outflow":0},
     "2025-11": {"inflow":70000,"outflow":0}
  }
}
```

**Audit log item**
```json
{
  "item_id":"uuid",
  "action":"create|update|delete",
  "user":"local",
  "timestamp":"ISO",
  "before":{...},
  "after":{...}
}
```

---

## 7. API design (cloud sync & master sheet endpoints)
(Existing endpoints plus master sheet & export)

- `POST /auth/login` → returns JWT  
- `GET /api/v1/records?type=investment&from=...&to=...`  
- `POST /api/v1/records` → create record  
- `PUT /api/v1/records/:id` → update  
- `DELETE /api/v1/records/:id` → soft delete + audit log  
- `GET /api/v1/summary` → totals (invested, currentValue, netPnl, netWorth)  
- **GET /api/v1/master-sheet?from=YYYY-MM&to=YYYY-MM** → returns aggregated master sheet rows and monthly breakdown (computed server-side)  
- **POST /api/v1/master-sheet/save** → save user-edited master sheet overrides (optional)  
- `POST /api/v1/backup` → upload backup (for restore)  
- `GET /api/v1/changes?since=timestamp` → delta sync

**API considerations:**
- Use timestamps and change versions for conflict resolution.  
- Master sheet endpoint produces canonical aggregation; optional user edits are stored as overrides with provenance (original vs override).  
- Delta-based sync (changes) for efficiency.

---

## 8. Syncing & offline strategy (master sheet specifics)
- **Local-first**: All writes go to IndexedDB immediately. Master Sheet reads from local aggregated collections.  
- **Sync worker**: background job pushes local ledger writes, receives server changes, and recomputes master sheet.  
- **Master recompute**: On receiving new deltas, client recomputes local master and updates the Master Sheet view; server also recomputes authoritative master.  
- **Overrides & conflicts**: If a user edits Master Sheet cells (notes or manual adjustments), store as `override` records with `source: 'user'`. Conflicts show in a lightweight UI and log.  
- **Real-time updates**: Optional WebSocket informs other devices that master sheet changed.

---

## 9. UI/UX & style guide (Master Sheet behavior)
- **Master Sheet view** is a spreadsheet-like grid (readable, sparse) styled to match ControlHub neon theme.  
- **Default mode**: Read-only aggregation (auto-updating).  
- **Edit mode** (toggle): allows editing of notes, and specific cells (e.g., manually adjust a monthly estimate). Edits create override records and get flagged in Audit.  
- **Columns**:
  - Label (Investments / Income / Expenses / Loans / Other)  
  - Inflow (period total)  
  - Outflow (period total)  
  - Net (computed)  
  - Monthly breakdown (expandable row)  
  - Notes / Manual override indicator  
- **Row actions**: drill down → opens ledger filtered to that category and timeframe.  
- **Keyboard shortcuts**: basic navigation (arrow keys), quick edit (Enter), save (Ctrl+S).  
- **Accessibility**: ARIA attributes for grid, focus states, and high contrast.  
- **Animations**: subtle cell highlight on update (fade), row expand slide (100–180ms).

---

## 10. Calculations & formulas (master sheet)
- **Per-row net** = `inflow_total - outflow_total`  
- **Master Total Inflow** = sum of all row `inflow_total` in the period  
- **Master Total Outflow** = sum of all row `outflow_total`  
- **Master Net** = `Master Total Inflow - Master Total Outflow`  
- **Monthly Net Series** = monthly sums for trend (used for tiny sparklines in Dashboard)  
- **FD compounding**: same formula with configurable `n` (compounding frequency).  
- **Overrides**: if a cell has `override`, present `computed` value vs `override` (with tooltip and audit note).

---

## 11. Exports & reports (Master sheet included)
- **Excel export (SheetJS)**: workbook with sheets:
  - `Investments`  
  - `Income`  
  - `Expenses`  
  - `Loans`  
  - `AuditLog`  
  - **`Master PlusMinus`** (aggregated rows + monthly columns)
- **PDF**: Dashboard snapshot + Master Plus/Minus table.  
- **Export footer**: generation metadata + optional encryption (password-protect zip).  
- **Import (CSV/Excel)**: map columns to ledger fields; imported rows produce ledger records and automatically update master sheet.

---

## 12. Security & privacy (Master sheet specifics)
- Default: **local-only**; master sheet never leaves device unless user triggers sync/export.  
- Cloud sync: encrypt finance docs server-side and, optionally, client-side with `FINANCE_ENCRYPTION_KEY`.  
- Audit trail: all manual master edits generate audit log entries.  
- Export: offer encrypted export (password).  
- Data deletion: soft-delete with retention and purge process.

---

## 13. Testing & QA (Master sheet)
- Unit tests: aggregation logic, monthly breakdown, override behavior.  
- Integration tests: ledger create/update → master recompute → export.  
- E2E tests: open Master Sheet → toggle edit → make manual edit → save → export → reimport.  
- Accessibility tests: keyboard navigation and screen-reader compatibility for grid.  
- Performance tests: large data sets (10k rows) to ensure IndexedDB + aggregation perform acceptably (use chunking & web worker).

---

## 14. Dev & folder structure (suggested) — updated for Master Sheet
```
/financeflow
  /frontend
    /public
    /src
      /components
        /MasterSheet
          MasterSheet.jsx
          MasterGrid.jsx
          MasterRow.jsx
          masterSheet.css
      /pages
        Dashboard.jsx
        Investments.jsx
        Income.jsx
        Expenses.jsx
        Loans.jsx
        MasterSheetPage.jsx
        Audit.jsx
        Settings.jsx
      /utils
        financeCalc.js
        sheetExport.js   // SheetJS wrappers (include Master sheet)
      /db
        indexedDBAdapter.js
        financeStore.js
  /backend (optional)
    /src
      /controllers
        financeController.js
        masterSheetController.js
      /models
        Investment.js
        Income.js
        Expense.js
        Loan.js
        MasterSheetOverride.js
      /routes
        financeRoutes.js
        masterSheetRoutes.js
    server.js
  /docs
  .env.example
  docker-compose.yml (optional)
```

---

## 15. CI/CD & deployment (notes)
- Add export API load testing (large Excel generation).  
- Ensure background sync worker runs safely in deployed environment (use rate-limiting for server sync).  
- Schedule DB backups and keep export endpoint authenticated if used in cloud mode.

---

## 16. Roadmap & advanced add-ons (Master sheet oriented)
- Auto-categorization suggestions for imported bank CSVs to populate Master Sheet rows.  
- Scheduled projections: forecast monthly master sheet for next 12 months based on recurring inflows/outflows.  
- Maturity reminders tied to Master Sheet rows (e.g., upcoming FD maturity shows in Master Sheet monthly column).  
- Two-way sync with Google Sheets (optional): sync `Master PlusMinus` sheet bi-directionally for power users.  
- Family/shared master sheet (read-only or controlled edits).

---

## 17. Implementation checklist (MVP + Master sheet)
1. Scaffold React app + dark theme (integrate into ControlHub).  
2. Implement IndexedDB layer & financeStore; seed sample data.  
3. Build ledger pages (Investments, Income, Expenses, Loans).  
4. Implement `financeCalc.js` with aggregation and FD formulas.  
5. Build **MasterSheetPage** and `MasterGrid` component (read-only aggregation).  
6. Add Master Sheet edit-mode with overrides & audit logging.  
7. Export to Excel (SheetJS) including `Master PlusMinus` sheet.  
8. Add settings for backup/import and sync toggles.  
9. Add backend master-sheet endpoints for optional cloud sync.  
10. Tests & deploy.

---

## 18. Short user guide (Master Sheet usage)
- Open ControlHub → FinanceFlow → **Master Sheet**.  
- Default view shows aggregated inflows/outflows and net by category for selected period.  
- Click a row to drill into the underlying ledger filtered to that category and period.  
- **Toggle Edit** to make manual adjustments or add notes — edits create overrides and appear in Audit.  
- Use **Export → Excel** to download workbook that includes `Master PlusMinus` sheet.  
- Use **Settings → Backup** to export `.xlsx` and store offline; enable cloud sync if you want encrypted backups.

---

## 19. Appendix: sample Master Sheet layout (columns)
| Row Label | Inflow (Period) | Outflow (Period) | Net | Jan-YYYY | Feb-YYYY | ... | Dec-YYYY | Notes | Override |
|-----------|------------------|------------------:|-----:|---------:|---------:|-----:|---------:|-------|---------:|

Each monthly column is auto-filled from ledger entries; override cells show a small badge indicating manual adjustment.

---

## 20. Final notes
- The **Master Plus/Minus Sheet** is a first-class feature designed for auditability and quick financial oversight.  
- Keep default behavior local-first and opt-in for cloud features to preserve privacy.  
- Integration into ControlHub as module 8 provides seamless life-data correlation while keeping finance data logically separated and secure.
