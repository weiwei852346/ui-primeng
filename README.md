# VLab Virtual Targets Dashboard (PrimeNG)

A standalone Angular 18 application using PrimeNG framework to display and manage virtual targets.

## Features

- **Left Sidebar Navigation** - Dark themed sidebar with menu
- **Virtual Targets Table** - PrimeNG data table with:
  - Search by name or ID
  - Platform filter (SIMICS/QEMU)
  - Sortable columns
  - Pagination (50 items per page)
  - Favorite toggle (star icon)
  - Show favorites only filter
- **Mock Data** - 12 sample virtual targets with various configurations
- **Responsive Design** - Modern, clean UI with smooth transitions

## Technology Stack

- **Angular 18** - Latest Angular framework with standalone components
- **PrimeNG 17** - UI component library
- **PrimeIcons** - Icon library
- **TypeScript** - Type-safe development
- **SCSS** - Styling with variables and nesting

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm start
```

Navigate to `http://localhost:4200/`

## Build

Build the project:

```bash
npm run build
```

Build output will be in `dist/ui-primeng/`

## Features Details

### Virtual Targets Table

- **Columns:**
  - Name (with favorite star and singleton indicator)
  - ID (barcode)
  - Type (SIMICS/QEMU)
  - Created By
  - Actions (Reserve button - display only)

- **Filters:**
  - Platform: SIMICS or QEMU radio buttons
  - Search: Filter by name or ID
  - Show favorites only: Checkbox to show only favorited targets

- **Sorting:**
  - Click column headers to sort ascending/descending
  - Sortable columns: Name, ID, Created By

- **Pagination:**
  - 50 items per page
  - Navigation controls at bottom of table

### Mock Data

The application includes 12 mock virtual targets with various configurations.

## Styling

The application uses a modern, clean design with:
- **Dark sidebar** - Gradient background
- **Light main content** - White cards on light gray background
- **Blue accent color** - For interactive elements
- **Smooth transitions** - Hover effects and animations

## Notes

- All data is mocked in services (no backend required)
- Reserve button is display-only (no functionality implemented)
- No authentication or permissions
- English only (no i18n)
