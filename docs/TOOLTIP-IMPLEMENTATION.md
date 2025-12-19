# KPI Tooltips Implementation
**Date:** December 16, 2025  
**Status:** ✅ Complete - Ready for Testing

---

## 🎯 Overview

Added informative tooltips to all 26 KPI cards showing:
- **Calculation**: Plain English explanation of how the KPI is calculated
- **Data Sources**: Database tables and fields used
- **Formula**: SQL-like formula showing the exact calculation
- **Notes**: Additional context, warnings, or limitations

---

## 📋 Files Created/Modified

### **New Files:**

1. **`src/components/ui/tooltip.tsx`** - Tooltip component
   - Smart positioning (top/bottom based on space)
   - Hover and click to show/hide
   - Mobile-friendly
   - Dark theme for contrast

### **Modified Files:**

1. **`src/types/kpi.ts`**
   - Added `KPICalculationMeta` interface
   - Updated `KPIDefinition` to include `calculationMeta`
   - Added calculation metadata for all 26 KPIs

2. **`src/components/kpi-card.tsx`**
   - Added `calculationMeta` prop
   - Integrated `Tooltip` component in header
   - Shows info icon next to KPI title

3. **`src/components/kpi-section.tsx`**
   - Passes `calculationMeta` to `KPICard`

---

## 🎨 Tooltip Features

### **Visual Design:**
- **Dark background** (slate-900) for high contrast
- **Light text** (white/slate-300) for readability
- **Color coding**:
  - Blue for table names
  - Yellow for warning notes
  - Monospace font for SQL formulas
- **Arrow pointer** pointing to info icon
- **Smooth animations** (fade-in, zoom-in)

### **Behavior:**
- **Hover**: Shows tooltip
- **Click**: Toggles tooltip (mobile-friendly)
- **Auto-position**: Flips top/bottom based on available space
- **Max width**: 320px (responsive)
- **z-index**: 50 (appears above other content)

---

## 📊 Calculation Metadata Added

### **Sales & Approval Pipeline (4 KPIs)**

#### Total Sales
```typescript
calculation: "Counts all signed contracts in the selected period, excluding cancelled projects and duplicates."
dataSources: [timeline, project-data]
formula: "COUNT(*) WHERE contract-signed IS NOT NULL AND project-status != 'Cancelled'"
notes: "Filters out 161 duplicate projects and all cancelled projects."
```

#### Aveyo Approved
```typescript
calculation: "Counts distinct projects with an approved Scope of Work (SOW) timestamp, excluding cancelled projects."
dataSources: [customer-sow, project-data]
formula: "COUNT(DISTINCT project-id) WHERE sow-approved-timestamp IS NOT NULL"
notes: "Uses simple project-id field (not project-dev-id) for joining."
```

#### Pull Through Rate
```typescript
calculation: "Percentage of sales that remain active in the pipeline."
dataSources: [timeline, project-data]
formula: "(COUNT(Active + Complete + Pre-Approvals + New Lender + Finance Hold) / Total Sales) × 100"
notes: "Measures retention rate of signed contracts through the pipeline."
```

---

### **Install Operations (5 KPIs)**

#### Jobs ON HOLD
```typescript
calculation: "Counts all projects with 'On Hold' status, excluding duplicates."
dataSources: [project-data, timeline]
formula: "COUNT(*) WHERE project-status = 'On Hold'"
notes: "Currently 276 projects on hold. Highlighted to draw attention to bottlenecks."
```

#### Installs Complete
```typescript
calculation: "Counts installations marked as complete within the period, filtering out duplicates."
dataSources: [timeline]
formula: "COUNT(*) WHERE install-complete IS NOT NULL AND install-stage-status = 'Complete'"
notes: "Only counts installs with stage status 'Complete' (3,003 total records)."
```

#### Install Complete NO PTO
```typescript
calculation: "Counts completed installations that have not yet received Permission to Operate (PTO)."
dataSources: [timeline]
formula: "COUNT(*) WHERE install-complete IS NOT NULL AND pto-received IS NULL AND install-stage-status = 'Complete'"
notes: "Highlighted as a bottleneck indicator. Filtered by install-complete date within period."
```

#### Install Scheduled
```typescript
calculation: "Counts all installations scheduled within the selected period."
dataSources: [timeline]
formula: "COUNT(*) WHERE install-appointment IS NOT NULL AND install-appointment IN [period]"
notes: "Shows upcoming workload for installation teams."
```

---

### **Cycle Times (3 KPIs)**

All three cycle time KPIs include:
```typescript
notes: "TODO: Update to MEDIAN for more accurate representation. Only X% of projects have this data."
```

#### PP → Install Start
```typescript
calculation: "Average number of days between Perfect Packet approval and installation appointment. Lower is better."
dataSources: [timeline]
formula: "AVG(DATEDIFF(install-appointment, packet-approval)) WHERE both dates are NOT NULL"
notes: "TODO: Update to MEDIAN. Only 37.7% of projects have packet-approval dates (2,285 records)."
```

#### Install → M2 Approved
```typescript
calculation: "Average number of days between installation appointment and M2 milestone approval. Lower is better."
dataSources: [timeline, project-data]
formula: "AVG(DATEDIFF(m2-approved, install-appointment)) WHERE both dates are NOT NULL"
notes: "TODO: Update to MEDIAN. M2-approved coverage: 47.7% (2,893 records)."
```

#### PP → PTO
```typescript
calculation: "Average total cycle time from Perfect Packet approval to Permission to Operate. Lower is better."
dataSources: [timeline]
formula: "AVG(DATEDIFF(pto-received, packet-approval)) WHERE both dates are NOT NULL"
notes: "TODO: Update to MEDIAN. Complete cycle time metric. PTO-received coverage: 44.8% (2,713 records)."
```

---

### **Residential Financials (5 KPIs)**

#### A/R (M2/M3)
```typescript
calculation: "Sum of M2 (80% of contract) and M3 (20% of contract) amounts that have been submitted but not yet received."
dataSources: [accounting (pending), project-data]
formula: "SUM(contract-price * 0.8 WHERE M2 submitted NOT received) + SUM(contract-price * 0.2 WHERE M3 submitted NOT received)"
notes: "⚠️ Awaiting accounting table implementation. M2 = 80%, M3 = 20% of contract price."
```

#### Install M2 Not Approved
```typescript
calculation: "Sum of M2 milestone amounts (80% of contract price) for completed installations that haven't received M2 approval."
dataSources: [timeline, project-data]
formula: "SUM(contract-price * 0.8) WHERE install-complete IS NOT NULL AND m2-approved IS NULL"
notes: "Highlighted to show financial bottleneck. Represents money ready to bill but paperwork incomplete."
```

#### Total Holdback & Total DCA
```typescript
notes: "⚠️ Data source not yet identified in database schema."
```

---

### **Active Pipeline (1 KPI)**

#### Active NO PTO
```typescript
calculation: "Counts all projects with active statuses that have not yet received Permission to Operate (PTO)."
dataSources: [project-data, timeline]
formula: "COUNT(*) WHERE project-status IN ('Active', 'Complete', 'Pre-Approvals', 'New Lender', 'Finance Hold') AND pto-received IS NULL"
notes: "No time period filter - shows all active projects without PTO. Excludes duplicates and cancelled projects."
```

---

### **Commercial Division (6 KPIs)**

#### Total KW Scheduled
```typescript
calculation: "Sum of system sizes (in KW) for installations scheduled but not yet completed in the period."
dataSources: [timeline, project-data]
formula: "SUM(system-size) WHERE install-appointment IN [period] AND install-complete IS NULL"
notes: "Measures planned installation capacity. Excludes duplicates."
```

#### Total KW Installed
```typescript
calculation: "Sum of system sizes (in KW) for installations completed within the period."
dataSources: [timeline, project-data]
formula: "SUM(system-size) WHERE install-complete IN [period]"
notes: "Measures actual installation capacity delivered. System-size has 100% coverage."
```

#### Commercial A/R & Revenue
```typescript
notes: "⚠️ Commercial filter not yet implemented. Currently shows same as residential."
```

---

## 🎯 Usage

### **For Users:**
1. Hover over the info icon (ℹ️) next to any KPI title
2. Tooltip appears showing calculation details
3. Click the icon to toggle on mobile devices

### **For Developers:**
To add/update tooltip content for a KPI:

1. Open `src/types/kpi.ts`
2. Find the KPI definition in `DASHBOARD_SECTIONS`
3. Update the `calculationMeta` object:

```typescript
{
  id: "your_kpi_id",
  name: "Your KPI Name",
  // ... other properties
  calculationMeta: {
    calculation: "Plain English explanation",
    dataSources: [
      {
        table: "table_name",
        fields: ["field1", "field2"]
      }
    ],
    formula: "SQL-like formula",
    notes: "Optional additional context or warnings"
  }
}
```

---

## ✅ Testing Checklist

- [ ] Tooltips appear on hover
- [ ] Tooltips toggle on click (mobile)
- [ ] Tooltips position correctly (top/bottom based on space)
- [ ] All 26 KPIs have tooltips
- [ ] Formula text is readable
- [ ] Table names are highlighted in blue
- [ ] Warning notes are highlighted in yellow
- [ ] Tooltips don't overflow viewport
- [ ] Tooltips work on mobile devices
- [ ] Info icons don't interfere with trend badges

---

## 📱 Responsive Behavior

- **Desktop**: Tooltip appears on hover, 320px wide
- **Tablet**: Click to toggle, responsive width
- **Mobile**: Click to toggle, max-width adjusted for small screens
- **Position**: Auto-flips top/bottom based on available space

---

## 🎨 Styling Details

### **Tooltip Container:**
- Background: `bg-slate-900`
- Text: `text-white`
- Border radius: `rounded-lg`
- Shadow: `shadow-xl`
- Padding: `p-4`
- Width: `w-80` (320px)

### **Content Sections:**
- **Calculation**: White text, slate-300 for description
- **Data Sources**: Blue-400 for table names, monospace font for fields
- **Formula**: Slate-300 text, slate-800 background, monospace font
- **Notes**: Yellow-400 heading for warnings

### **Info Icon:**
- Size: `h-4 w-4`
- Color: `text-slate-400` (default), `text-slate-600` (hover)
- Cursor: `cursor-help`
- Transition: Color transition on hover

---

## 🚀 Future Enhancements

1. **Add examples**: Show sample calculations with actual data
2. **Add links**: Link to related KPIs or documentation
3. **Add visuals**: Include small diagrams for complex calculations
4. **Add history**: Show how the calculation has changed over time
5. **Keyboard navigation**: Add keyboard shortcuts to open tooltips
6. **Copy to clipboard**: Allow copying formula text

---

## 📊 Impact

### **For Users:**
- ✅ **Transparency**: Users can see exactly how each metric is calculated
- ✅ **Trust**: Understanding the data sources builds confidence
- ✅ **Education**: Learn about the business metrics and database structure
- ✅ **Debugging**: Quickly identify why a number might be unexpected

### **For Developers:**
- ✅ **Documentation**: Calculation logic is documented in code
- ✅ **Maintenance**: Easy to update when formulas change
- ✅ **Onboarding**: New developers can understand the system faster
- ✅ **Debugging**: Clear mapping between UI and database queries

---

**Status:** ✅ Complete and ready for use!

**All 26 KPIs now have informative tooltips with calculation details.** 🎉
