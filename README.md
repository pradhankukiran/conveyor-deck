# ConveyorDeck

ConveyorDeck is a working web prototype for creating modular conveyor layout drawings and generating early-stage sales pricing.

The goal is to validate the configurator workflow in a browser before moving the product to a standalone Windows desktop application.

## What It Does

- Build a modular conveyor chain from a component library.
- Drag modules onto a 2D grid canvas.
- Snap modules into valid chain positions.
- Generate side elevation and top-view drawing output.
- Edit conveyor width from 100 mm to 1200 mm in 50 mm increments.
- Configure belt, motor, gearbox, controls, customer, title, and drawing number.
- Add accessory quantities for retainers, supports, enclosures, castors, wheels, VSD, and emergency stop.
- Override support pair counts.
- Override module/accessory pricing from an admin-style panel.
- Show compatibility warnings for width, belt, motor, gearbox, and controls.
- Generate BOM and indicative pricing.
- Export quotation PDF.
- Export Excel costing/BOM workbook.
- Import/export project JSON files.
- Persist local working state in the browser.

## Current Status

This is a functional prototype, not a production-released quoting system.

The app uses real geometry, drawing, BOM, export, and rules logic. Pricing values, catalogue data, and engineering rules are currently representative and must be validated against the real company standards before production use.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Konva / React Konva
- jsPDF
- SheetJS `xlsx`
- Vitest

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:5173/
```

## Scripts

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm preview
```

## Main Areas

- `src/components/CanvasArea.tsx` - interactive 2D drawing canvas.
- `src/components/ModulePalette.tsx` - draggable module library.
- `src/components/PropertiesPanel.tsx` - drawing setup, accessories, BOM, rules, pricing overrides.
- `src/modules/registry.ts` - module catalogue and pricing metadata.
- `src/lib/store.ts` - persisted application state.
- `src/lib/chainGeometry.ts` - conveyor geometry engine.
- `src/lib/bom.ts` - BOM and pricing calculation.
- `src/lib/rules.ts` - compatibility warning engine.
- `src/lib/exportPdf.ts` - quotation PDF generation.
- `src/lib/exportExcel.ts` - Excel workbook export.
- `src/lib/projectFile.ts` - JSON project import/export.

## Demo Notes

The Reset to PACT button seeds a sample conveyor:

```text
feed -> straight -> 30 degree up -> straight -> 30 degree down -> straight -> drive
```

Use this to demonstrate the core flow:

```text
Select module -> drag to canvas -> snap into chain -> edit specs -> review BOM -> export PDF/Excel
```

## Important Caveats

- Prices are placeholder/indicative.
- Engineering rules require validation against real company standards.
- Accessory workflow is quantity/configuration based; individual accessory canvas placement is not yet CAD-style.
- PDF output is quotation-demo quality and should be aligned with final company drawing standards.
- No formal customer UAT or production QA sign-off has been completed.

## Suggested Next Steps

- Replace placeholder module data and prices with the real catalogue.
- Validate support spacing, motor, gearbox, belt, and width rules with engineering.
- Add accessory canvas placement for retainers, guards, E-stops, and support overrides.
- Add a dedicated admin screen backed by a database/config file.
- Add project list/save management.
- Add more automated tests around exports and edge-case chain layouts.
- Port the validated domain model to the future C# desktop application.
