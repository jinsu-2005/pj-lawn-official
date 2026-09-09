import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 30,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: '#1e293b',
    lineHeight: 1.3
  },
  headerContainer: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#c9a84c',
    paddingBottom: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  brandCol: {
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  brandName: {
    fontSize: 19,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    lineHeight: 1.15,
    marginBottom: 2
  },
  brandTagline: {
    fontSize: 7.5,
    color: '#b45309',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    lineHeight: 1.2,
    marginBottom: 3
  },
  venueAddress: {
    fontSize: 7.2,
    color: '#475569',
    lineHeight: 1.25
  },
  receiptMetaRight: {
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  receiptTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 1.15,
    marginBottom: 3
  },
  badgeWrapper: {
    backgroundColor: '#dcfce7',
    borderWidth: 0.5,
    borderColor: '#86efac',
    borderRadius: 3,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    marginBottom: 3,
    alignSelf: 'flex-end'
  },
  receiptBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  metaItem: {
    fontSize: 7.2,
    color: '#64748b',
    lineHeight: 1.2,
    marginBottom: 1.5
  },
  metaValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a'
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#c9a84c',
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    marginTop: 6,
    marginBottom: 4
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    alignItems: 'center'
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    alignItems: 'center'
  },
  tableRowAlternate: {
    backgroundColor: '#fafaf9'
  },
  tableColLabel: {
    width: '42%',
    fontSize: 8,
    color: '#475569',
    fontFamily: 'Helvetica'
  },
  tableColValue: {
    width: '58%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'right'
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center'
  },
  financialLabel: {
    fontSize: 8,
    color: '#475569'
  },
  financialValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a'
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    backgroundColor: '#fefce8',
    borderTopWidth: 1.5,
    borderTopColor: '#c9a84c',
    alignItems: 'center'
  },
  highlightLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#854d0e'
  },
  highlightValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#854d0e'
  },
  settledRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    backgroundColor: '#f0fdf4',
    borderTopWidth: 1.5,
    borderTopColor: '#22c55e',
    alignItems: 'center'
  },
  settledLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#166534'
  },
  settledValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#166534'
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    padding: 6,
    marginTop: 4,
    marginBottom: 6
  },
  notesHeading: {
    fontSize: 7.2,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2
  },
  notesText: {
    fontSize: 6.8,
    color: '#64748b',
    lineHeight: 1.25,
    marginBottom: 1
  },
  signatoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  sealBox: {
    width: 120,
    height: 38,
    borderWidth: 1,
    borderColor: '#c9a84c',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbeb',
    paddingVertical: 2
  },
  sealText: {
    fontSize: 6.8,
    fontFamily: 'Helvetica-Bold',
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 1.15
  },
  signatureBox: {
    alignItems: 'flex-end'
  },
  signatureLine: {
    width: 130,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    marginBottom: 3
  },
  signatureText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    lineHeight: 1.2
  },
  signatureSubtext: {
    fontSize: 6.5,
    color: '#64748b',
    lineHeight: 1.2
  },
  footer: {
    marginTop: 8,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 6.5,
    lineHeight: 1.2,
    borderTopWidth: 0.5,
    borderTopColor: '#f1f5f9',
    paddingTop: 4
  }
});

interface BookingData {
  id: string;
  userName?: string;
  customerName?: string;
  userEmail?: string;
  customerEmail?: string;
  userPhone?: string;
  customerPhone?: string;
  eventDate: string;
  eventType: string;
  timeSlot?: string;
  guestCount: number;
  totalAmount?: number;
  estimatedAmount?: number;
  advanceAmount?: number;
  amountPaid?: number;
  paymentStatus: string;
  bookingStatus: string;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  paymentMethod?: string;
  paidAt?: any;
}

// Safely format event date to prevent UTC timezone date-shift errors
function formatSafeDate(dateStr: string): string {
  if (!dateStr) return 'Date TBD';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD constructed in local time
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(d.getTime())) {
        return format(d, 'EEEE, MMMM do, yyyy');
      }
    }
    const fallback = new Date(`${dateStr}T00:00:00`);
    return isNaN(fallback.getTime()) ? dateStr : format(fallback, 'EEEE, MMMM do, yyyy');
  } catch {
    return dateStr;
  }
}

export const ReceiptDocument = ({ booking }: { booking: BookingData }) => {
  const customerName = booking.userName || booking.customerName || 'Valued Guest';
  const customerPhone = booking.userPhone || booking.customerPhone || 'Not provided';
  const customerEmail = booking.userEmail || booking.customerEmail || 'Not provided';
  const eventDateFormatted = formatSafeDate(booking.eventDate);
  
  // Authoritative financial calculations
  const totalVenueFee = Number(booking.totalAmount || booking.estimatedAmount || 0);
  const cumulativeAmountPaid = Number(
    booking.amountPaid !== undefined 
      ? booking.amountPaid 
      : booking.paymentStatus === 'fully_paid' 
        ? totalVenueFee 
        : (booking.advanceAmount || 0)
  );
  const balanceDue = Math.max(0, totalVenueFee - cumulativeAmountPaid);
  const isFullySettled = balanceDue === 0 && cumulativeAmountPaid > 0;

  const receiptNumber = `PJL-REC-${booking.id.slice(0, 8).toUpperCase()}`;
  const currentDate = format(new Date(), 'dd MMMM yyyy, hh:mm a');

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.brandCol}>
            <Text style={styles.brandName}>PJ Lawn</Text>
            <Text style={styles.brandTagline}>Open-Air Venue & Luxury Banquet</Text>
            <Text style={styles.venueAddress}>Parvathipuram, Nagercoil, Kanyakumari Dist.</Text>
            <Text style={styles.venueAddress}>Tamil Nadu, India &bull; PIN: 629003</Text>
            <Text style={styles.venueAddress}>Phone: +91 94897 24975 &bull; contact@pjlawn.com</Text>
          </View>

          <View style={styles.receiptMetaRight}>
            <Text style={styles.receiptTitle}>Official Receipt</Text>
            <View style={styles.badgeWrapper}>
              <Text style={styles.receiptBadge}>
                {booking.bookingStatus === 'confirmed' ? '✓ CONFIRMED BOOKING' : booking.bookingStatus === 'completed' ? '✓ COMPLETED EVENT' : 'BOOKING ACKNOWLEDGEMENT'}
              </Text>
            </View>
            <Text style={styles.metaItem}>Receipt No: <Text style={styles.metaValue}>{receiptNumber}</Text></Text>
            <Text style={styles.metaItem}>Booking ID: <Text style={styles.metaValue}>{booking.id}</Text></Text>
            <Text style={styles.metaItem}>Issued: <Text style={styles.metaValue}>{currentDate}</Text></Text>
          </View>
        </View>

        {/* Guest & Reservation Particulars */}
        <Text style={styles.sectionTitle}>1. Guest & Event Particulars</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableRowAlternate]}>
            <Text style={styles.tableColLabel}>Customer / Host Name</Text>
            <Text style={styles.tableColValue}>{customerName}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>Contact Phone</Text>
            <Text style={styles.tableColValue}>{customerPhone}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlternate]}>
            <Text style={styles.tableColLabel}>Contact Email</Text>
            <Text style={styles.tableColValue}>{customerEmail}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>Event Date</Text>
            <Text style={styles.tableColValue}>{eventDateFormatted}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlternate]}>
            <Text style={styles.tableColLabel}>Occasion / Event Type</Text>
            <Text style={styles.tableColValue}>{booking.eventType || 'Private Event'}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>Venue Slot & Timings</Text>
            <Text style={styles.tableColValue}>{booking.timeSlot || '5:00 PM – 10:00 PM'}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlternate]}>
            <Text style={styles.tableColLabel}>Expected Guests</Text>
            <Text style={styles.tableColValue}>{booking.guestCount || 0} Guests</Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.tableColLabel}>Venue Location</Text>
            <Text style={styles.tableColValue}>PJ Lawn, Nagercoil</Text>
          </View>
        </View>

        {/* Payment & Financial Settlement */}
        <Text style={styles.sectionTitle}>2. Payment Breakdown & Settlement</Text>
        <View style={styles.table}>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Total Venue Base Fee</Text>
            <Text style={styles.financialValue}>Rs. {totalVenueFee.toLocaleString()}</Text>
          </View>
          
          <View style={[styles.financialRow, styles.tableRowAlternate]}>
            <Text style={styles.financialLabel}>
              {booking.paymentStatus === 'fully_paid' ? 'Total Amount Paid' : 'Advance Paid Online'}
            </Text>
            <Text style={styles.financialValue}>Rs. {cumulativeAmountPaid.toLocaleString()}</Text>
          </View>

          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Payment Status</Text>
            <Text style={styles.financialValue}>
              {booking.paymentStatus === 'fully_paid' 
                ? 'PAID IN FULL' 
                : booking.paymentStatus === 'advance_paid' 
                  ? 'ADVANCE PAID (PARTIAL)' 
                  : 'PENDING'}
            </Text>
          </View>

          {booking.cashfreePaymentId && (
            <View style={[styles.financialRow, styles.tableRowAlternate]}>
              <Text style={styles.financialLabel}>Gateway Transaction Reference</Text>
              <Text style={styles.financialValue}>{booking.cashfreePaymentId}</Text>
            </View>
          )}

          {isFullySettled ? (
            <View style={styles.settledRow}>
              <Text style={styles.settledLabel}>Balance Due</Text>
              <Text style={styles.settledValue}>Rs. 0 (Fully Settled ✓)</Text>
            </View>
          ) : (
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>Balance Due (at Venue or Online)</Text>
              <Text style={styles.highlightValue}>Rs. {balanceDue.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Booking Terms & Important Notes */}
        <View style={styles.notesBox} wrap={false}>
          <Text style={styles.notesHeading}>Terms & Conditions</Text>
          <Text style={styles.notesText}>
            1. Booking is locked and confirmed upon receipt of advance deposit.
          </Text>
          <Text style={styles.notesText}>
            2. Any outstanding balance must be settled online or in person on or prior to the event date.
          </Text>
          <Text style={styles.notesText}>
            3. Cancellations and modifications are governed by PJ Lawn's standard reservation & refund policies.
          </Text>
          <Text style={styles.notesText}>
            4. For event planning, decor setups, catering access, or itinerary queries, please message our Venue Manager on WhatsApp (+91 94897 24975).
          </Text>
        </View>

        {/* Signatures & Official Endorsement */}
        <View style={styles.signatoryContainer} wrap={false}>
          <View style={styles.sealBox}>
            <Text style={styles.sealText}>PJ LAWN</Text>
            <Text style={styles.sealText}>NAGERCOIL</Text>
            <Text style={[styles.sealText, { fontSize: 6, marginTop: 1, color: '#92400e' }]}>VERIFIED & REGISTERED</Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Authorized Signatory</Text>
            <Text style={styles.signatureSubtext}>PJ Lawn Management Team</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} wrap={false}>
          This is an official system-generated receipt issued by PJ Lawn, Nagercoil. Valid without manual signature when verified against Booking ID {booking.id}.
        </Text>

      </Page>
    </Document>
  );
};

export const DownloadReceiptButton = ({ booking, className }: { booking: BookingData, className?: string }) => (
  <PDFDownloadLink 
    document={<ReceiptDocument booking={booking} />} 
    fileName={`PJ_Lawn_Receipt_${booking.id}.pdf`}
    className={className}
  >
    {(params) => (params.loading ? 'Generating Receipt PDF...' : 'Download Official Receipt')}
  </PDFDownloadLink>
);
