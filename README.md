# Aveyo KPI Executive Dashboard

A modern, real-time executive dashboard for tracking key performance indicators across sales, operations, and financials.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)

## ✨ Features

- 📊 **145+ Real-time KPIs** across 6 business categories
- 🔄 **Live Database Integration** with MySQL (DigitalOcean)
- 📈 **Trend Analysis** with period-over-period comparisons
- 🎯 **Goal Tracking** with visual progress indicators
- ⚡ **Performance Optimized** with 15-minute caching
- 🎨 **Beautiful UI** with responsive Tailwind design
- 🔒 **Secure** with SSL/TLS encryption and environment variables
- 🛠️ **Custom KPI Builder** - Create and manage custom metrics without coding (NEW!)
  - Visual formula editor with @ autocomplete
  - SQL and expression formulas
  - Live formula testing
  - Pre-built templates
  - Full database schema reference

## 🎯 KPI Categories

### 1. Sales & Approval Pipeline
- Total Sales
- Aveyo Approved
- Pull Through Rate
- Sales Goals

### 2. Install Operations
- Installs Complete
- Jobs ON HOLD
- Install Complete NO PTO
- Install Scheduled

### 3. Cycle Times
- Avg Days PP → Install Start
- Avg Days Install → M2 Approved
- Avg Days PP → PTO

### 4. Residential Financials
- Outstanding A/R (M2/M3)
- Revenue Received
- Install Complete M2 Not Approved
- Total Holdback & DCA

### 5. Active Pipeline
- Active Projects without PTO

### 6. Commercial Division
- Total KW Scheduled & Installed
- Commercial A/R & Revenue

## 🛠️ KPI Formula Admin (NEW!)

Create and manage custom KPI metrics without writing code! The KPI Admin feature provides a powerful interface for defining dynamic formulas using either SQL queries or JavaScript expressions.

### Key Features

- **Visual Formula Editor** - Rich text editor with @ autocomplete for database fields
- **Real-Time Validation** - Instant feedback on formula syntax and security
- **Formula Templates** - Pre-built patterns for common calculations
- **Live Testing** - Test formulas with different time periods before saving
- **Field Reference** - Browse complete database schema while editing
- **Security Hardened** - SQL injection prevention and input validation

### Access KPI Admin

1. Click the **Database icon** in the header navigation
2. Sign in with Supabase credentials
3. Create, edit, or delete custom KPIs

### Documentation

- **User Guide:** [`docs/KPI-FORMULA-ADMIN.md`](docs/KPI-FORMULA-ADMIN.md)
- **Setup Guide:** [`docs/KPI-ADMIN-SETUP.md`](docs/KPI-ADMIN-SETUP.md)
- **Implementation:** [`KPI-ADMIN-IMPLEMENTATION-SUMMARY.md`](KPI-ADMIN-IMPLEMENTATION-SUMMARY.md)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MySQL database access
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lahvjal/exec-dash.git
   cd exec-dash
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   DB_HOST=your-database-host
   DB_PORT=25060
   DB_USER=your-username
   DB_PASSWORD=your-password
   DB_NAME=your-database-name
   DB_SSL=true
   ```

4. **Test database connection**
   ```bash
   node scripts/test-connection.js
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open dashboard**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── kpi/          # KPI data API
│   │   │   ├── kpis/         # KPI CRUD API (NEW)
│   │   │   └── db-schema/    # Database schema API (NEW)
│   │   ├── kpis/             # KPI admin page (NEW)
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Dashboard page
│   ├── components/           # React components
│   │   ├── header.tsx
│   │   ├── kpi-card.tsx
│   │   ├── kpi-section.tsx
│   │   ├── time-filter.tsx
│   │   ├── field-selector.tsx        # Field autocomplete (NEW)
│   │   ├── formula-editor.tsx        # Formula editor (NEW)
│   │   ├── kpi-form-modal.tsx        # KPI form (NEW)
│   │   └── field-reference-panel.tsx # Field browser (NEW)
│   ├── hooks/
│   │   └── use-kpi-data.ts   # Data fetching hook
│   ├── lib/
│   │   ├── db.ts             # MySQL connection
│   │   ├── supabase.ts       # Supabase client
│   │   ├── kpi-service.ts    # KPI calculations (1000+ lines)
│   │   └── formula-validator.ts # Formula validation (NEW)
│   └── types/
│       └── kpi.ts            # TypeScript types
├── supabase-migrations/      # Supabase migrations (NEW)
│   └── create-custom-kpis-table.sql
├── scripts/
│   ├── explore-db.js         # Schema exploration tool
│   └── test-connection.js    # Connection tester
├── docs/                     # Comprehensive documentation
│   ├── KPI-DATA-SOURCE-GUIDE.md
│   ├── KPI-VISUAL-SUMMARY.md
│   ├── kpi-database-mapping.md
│   └── test-results.md
└── .env.local                # Environment variables (not committed)
```

## 🗄️ Database Schema

The dashboard connects to a MySQL database with these main tables:

- **project-data** (6,055 rows) - Financial data, milestones, system specs
- **timeline** (6,055 rows) - Project timeline dates and statuses
- **work-orders** (11,828 rows) - Installation and inspection scheduling

See [docs/kpi-database-mapping.md](docs/kpi-database-mapping.md) for complete schema details.

## 📊 Time Periods

The dashboard supports multiple time periods:

- **Current Week** - Monday to Sunday of current week
- **Previous Week** - Last week
- **MTD** - Month to date
- **YTD** - Year to date
- **Next Week** - Following week

## 🔧 Configuration

### Updating Goals

Goals are currently defined in `src/lib/kpi-service.ts`:

```typescript
const GOALS = {
  total_sales: {
    current_week: 50,
    mtd: 200,
    ytd: 2400,
  },
  // ... more goals
};
```

### API Endpoints

- **Single KPI**: `GET /api/kpi?kpiId=total_sales&period=current_week`
- **Batch KPIs**: `POST /api/kpi` with JSON body

### Caching

- Cache TTL: 15 minutes
- Automatic invalidation
- Per-KPI + period caching

## 🧪 Testing

### Test Database Connection
```bash
node scripts/test-connection.js
```

### Explore Database Schema
```bash
node scripts/explore-db.js
```

### Test KPI Calculations
```bash
curl "http://localhost:3000/api/kpi?kpiId=total_sales&period=current_week"
```

## 📚 Documentation

Complete documentation available in the `/docs` directory:

- **[KPI Data Source Guide](docs/KPI-DATA-SOURCE-GUIDE.md)** - Detailed explanation of each KPI
- **[Visual Summary](docs/KPI-VISUAL-SUMMARY.md)** - Quick reference with diagrams
- **[Database Mapping](docs/kpi-database-mapping.md)** - SQL queries and table relationships
- **[Test Results](docs/test-results.md)** - Validation and performance tests
- **[Database Setup](README-DATABASE.md)** - Connection guide and troubleshooting

## 🔒 Security

- ✅ Environment variables for credentials
- ✅ SSL/TLS enforced for database connections
- ✅ API routes run server-side only
- ✅ Parameterized SQL queries (no injection)
- ✅ `.env.local` in `.gitignore`

## 🎨 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS 3.4
- **Database**: MySQL 8.0 with mysql2
- **API**: Next.js API Routes
- **Caching**: In-memory caching
- **Icons**: Lucide React

## 📈 Performance

- First load: ~1-2 seconds (database query)
- Cached requests: <50ms
- 15-minute cache TTL
- Connection pooling enabled
- Batch API endpoint for multiple KPIs

## 🤝 Contributing

This is a private dashboard for Aveyo. For questions or issues, contact the development team.

## 📝 License

Private - Aveyo Internal Use Only

## 🎯 Roadmap

### Short-term
- [ ] Move goals to database
- [ ] Add user authentication
- [ ] Implement real-time refresh button
- [ ] Add export functionality (CSV/PDF)

### Long-term
- [ ] Historical trend charts
- [ ] Alert system for KPIs in danger status
- [ ] Drill-down to project details
- [ ] Role-based access control

## 📞 Support

For questions about:
- **Database schema**: See [docs/kpi-database-mapping.md](docs/kpi-database-mapping.md)
- **Test results**: See [docs/test-results.md](docs/test-results.md)
- **KPI calculations**: See [src/lib/kpi-service.ts](src/lib/kpi-service.ts)

---

**Built with ❤️ for Aveyo**



