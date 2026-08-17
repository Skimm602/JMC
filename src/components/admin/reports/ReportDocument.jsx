import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

/**
 * The downloadable side of the analytics tab — same computeReport() shape
 * the on-screen dashboard reads, laid out as a document rather than a page.
 * Plain @react-pdf primitives, not DOM/Tailwind: this renders on the server,
 * inside the route handler in src/app/api/admin/reports, with no browser
 * involved.
 */

const peso = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n ?? 0))

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#0b1f38', fontFamily: 'Helvetica' },
  eyebrow: { fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: '#4c6484' },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  meta: { fontSize: 9, color: '#4c6484', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  stat: { flex: 1, borderWidth: 1, borderColor: '#c2d8ec', padding: 12 },
  statLabel: { fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#4c6484' },
  statValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  section: { marginTop: 26 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  table: { borderWidth: 1, borderColor: '#c2d8ec' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#c2d8ec' },
  trLast: { flexDirection: 'row' },
  th: { flex: 1, padding: 6, fontSize: 8, letterSpacing: 0.5, textTransform: 'uppercase', color: '#4c6484', backgroundColor: '#e2edf9' },
  td: { flex: 1, padding: 6, fontSize: 9.5 },
  tdRight: { flex: 1, padding: 6, fontSize: 9.5, textAlign: 'right' },
  low: { color: '#b8391a' },
  empty: { padding: 10, fontSize: 9.5, color: '#4c6484' },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 8, color: '#4c6484', textAlign: 'center' },
})

function Table({ columns, rows, empty }) {
  return (
    <View style={styles.table}>
      <View style={styles.tr}>
        {columns.map((col, i) => (
          <Text key={i} style={[styles.th, col.right && { textAlign: 'right' }]}>
            {col.label}
          </Text>
        ))}
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : (
        rows.map((row, i) => (
          <View key={i} style={i === rows.length - 1 ? styles.trLast : styles.tr}>
            {columns.map((col, j) => (
              <Text key={j} style={col.right ? styles.tdRight : styles.td}>
                {col.render(row)}
              </Text>
            ))}
          </View>
        ))
      )}
    </View>
  )
}

export default function ReportDocument({ report }) {
  const { period, label, totals, monthly, topProducts, lowStock } = report

  return (
    <Document title={`VIP Solar — ${period === 'monthly' ? 'Monthly' : 'Yearly'} report — ${label}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>VIP Solar — {period === 'monthly' ? 'Monthly' : 'Yearly'} report</Text>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.meta}>
          Generated {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} · paid,
          processing, shipped and completed orders only
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>{peso(totals.revenue)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Orders</Text>
            <Text style={styles.statValue}>{totals.orders}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Average order value</Text>
            <Text style={styles.statValue}>{peso(totals.avgOrderValue)}</Text>
          </View>
        </View>

        {period === 'yearly' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue by month</Text>
            <Table
              columns={[
                { label: 'Month', render: (r) => r.label },
                { label: 'Orders', render: (r) => String(r.orders), right: true },
                { label: 'Revenue', render: (r) => peso(r.revenue), right: true },
              ]}
              rows={monthly}
              empty="No months in this year."
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top products</Text>
          <Table
            columns={[
              { label: 'Product', render: (r) => r.name },
              { label: 'Units sold', render: (r) => String(r.unitsSold), right: true },
              { label: 'Revenue', render: (r) => peso(r.revenue), right: true },
            ]}
            rows={topProducts}
            empty="No sales in this period."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Low stock ({lowStock.length})</Text>
          <Table
            columns={[
              { label: 'Product', render: (r) => r.name },
              { label: 'In stock', render: (r) => String(r.stock), right: true },
              { label: 'Retail price', render: (r) => peso(r.retailPrice), right: true },
            ]}
            rows={lowStock}
            empty="Nothing is low right now."
          />
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}
