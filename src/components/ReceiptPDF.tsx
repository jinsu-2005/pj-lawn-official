import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
    paddingBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 12,
    color: '#666666'
  },
  section: {
    margin: 10,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 5
  },
  label: {
    fontSize: 12,
    color: '#666666',
    width: '40%'
  },
  value: {
    fontSize: 12,
    color: '#111111',
    width: '60%',
    textAlign: 'right',
    fontWeight: 'medium'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#111111'
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111111'
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111111'
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999999',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10
  }
});

interface BookingData {
  id: string;
  userName: string;
  eventDate: string;
  eventType: string;
  guestCount: number;
  totalAmount?: number;
  advanceAmount?: number;
  paymentStatus: string;
  bookingStatus: string;
}

export const ReceiptDocument = ({ booking }: { booking: BookingData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>PJ Lawn</Text>
        <Text style={styles.subtitle}>Booking Receipt & Confirmation</Text>
        <Text style={styles.subtitle}>Date Issued: {format(new Date(), 'MMM dd, yyyy')}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Booking ID</Text>
          <Text style={styles.value}>{booking.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Customer Name</Text>
          <Text style={styles.value}>{booking.userName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Event Date</Text>
          <Text style={styles.value}>{format(new Date(booking.eventDate), 'MMMM dd, yyyy')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Event Type</Text>
          <Text style={styles.value}>{booking.eventType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Guests</Text>
          <Text style={styles.value}>{booking.guestCount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{booking.bookingStatus.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Status</Text>
          <Text style={styles.value}>{booking.paymentStatus.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Total Amount</Text>
          <Text style={styles.value}>Rs. {booking.totalAmount?.toLocaleString() || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Advance Paid</Text>
          <Text style={styles.value}>Rs. {booking.advanceAmount?.toLocaleString() || '0'}</Text>
        </View>
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Balance Due</Text>
          <Text style={styles.totalValue}>
            Rs. {((booking.totalAmount || 0) - (booking.advanceAmount || 0)).toLocaleString()}
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Thank you for choosing PJ Lawn. For any queries, please contact us at +91 94897 24975.
      </Text>
    </Page>
  </Document>
);

export const DownloadReceiptButton = ({ booking, className }: { booking: BookingData, className?: string }) => (
  <PDFDownloadLink 
    document={<ReceiptDocument booking={booking} />} 
    fileName={`PJ_Lawn_Receipt_${booking.id}.pdf`}
    className={className}
  >
    {/* Use a function as child per React-PDF docs to handle loading state */}
    {(params) => (params.loading ? 'Generating PDF...' : 'Download Receipt')}
  </PDFDownloadLink>
);
