import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Share, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Header from '../components/Header';
import { orders, shop } from '../services/api';

const InvoiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params || {orderId:8};
  
  const [orderData, setOrderData] = useState(null);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shopExists, setShopExists] = useState(true);

  useEffect(() => {
    const fetchOrderAndShop = async () => {
      try {
        const data = await orders.getOrder(orderId);
        setOrderData(data);
        
        // Fetch current user's shop data
        try {
          const shopInfo = await shop.getMyShop();
          setShopData(shopInfo?.shop);
          setShopExists(true);
        } catch (shopError) {
          // Check if error is due to shop not existing
          const msg = String(shopError?.message || '').toLowerCase();
          if (msg.includes('not found') || msg.includes('404') || msg.includes('no shop') || msg.includes('shop_not_created')) {
            setShopExists(false);
          } else {
            console.error('Error fetching shop data:', shopError);
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderAndShop();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const order = orderData?.order || {};
  const items = order?.items || [];
  const subtotal = order?.order_subtotal_amount || 0;
  const shipping = order?.order_delivery_fee_amount || 0;
  const total = subtotal + shipping;

  const handlePrintInvoice = async () => {
    try {
      const invoiceContent = `
INVOICE #${order?.id || 'N/A'}
Date: ${new Date(order?.created_at).toLocaleDateString()}

SELLER:
${shopData?.name || 'N/A'}
${shopData?.bio_link || 'N/A'}
${shopData?.address && shopData?.city ? `${shopData.address}, ${shopData.city}` : shopData?.address || shopData?.city || 'N/A'}
Phone: ${shopData?.phone || 'N/A'}
WhatsApp: ${shopData?.whatsapp || shopData?.phone || 'N/A'}

BILL TO:
${order?.customer?.name || 'Customer'}
${order?.customer?.email || 'N/A'}
${order?.shipping_address?.address_line1 || 'N/A'}
${order?.shipping_address?.city && order?.shipping_address?.country ? `${order.shipping_address.city}, ${order.shipping_address.country}` : order?.shipping_address?.city || order?.shipping_address?.country || 'N/A'}

PAYMENT INFORMATION:
Currency: ${items[0]?.currency || 'INR'}
Total Payment: ${items[0]?.currency || 'INR'} ${total}

ORDER ITEMS:
${items.map(item => 
  `${item.post?.title || 'Item'} - Post ID: ${item.post_id || 'N/A'}\n  Price: ${items[0]?.currency || 'INR'} ${item.unit_price || 0} x ${item.quantity || 1} = ${items[0]?.currency || 'INR'} ${item.line_total || 0}`
).join('\n\n')}

SUMMARY:
Subtotal: ${items[0]?.currency || 'INR'} ${subtotal}
Shipping: ${items[0]?.currency || 'INR'} ${shipping}
Total: ${items[0]?.currency || 'INR'} ${total}

NOTES:
This is a system-generated bill. Contact seller for queries.

Generated on ${new Date().toLocaleDateString()}
      `.trim();

      await Share.share({
        message: invoiceContent,
        title: `Invoice #${order?.id || 'N/A'}`,
      });
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Invoice"
          headerType="page"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading invoice...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!orderData?.order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Invoice"
          headerType="page"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Invoice"
        headerType="page"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.printButton} onPress={handlePrintInvoice}>
            <Feather name="printer" size={18} color="#000" />
          </TouchableOpacity>
        }
      />
      {!shopExists && (
        <View style={styles.notificationBanner}>
          <Text style={styles.notificationText}>Create your shop first</Text>
        </View>
      )}
      <ScrollView style={styles.container}>
        {/* Invoice Header */}
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceTitleRow}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{order?.id || 'N/A'}</Text>
          </View>
          <View style={styles.invoiceDetailsRow}>
            <View style={styles.leftColumn}>
              <Text style={styles.detailLabel}>Seller:</Text>
              <Text style={{...styles.detailValue, fontWeight: 700, fontSize: 16, marginBottom: 2}}>{shopData?.name || 'N/A'}</Text>
              <Text style={styles.detailValue}>{shopData?.bio_link || 'N/A'}</Text>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>
                {shopData?.address && shopData?.city 
                  ? `${shopData.address}, ${shopData.city}`
                  : shopData?.address || shopData?.city || 'N/A'
                }
              </Text>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{shopData?.phone || 'N/A'}</Text>
              <Text style={styles.detailLabel}>WhatsApp:</Text>
              <Text style={styles.detailValue}>{shopData?.whatsapp || shopData?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.rightColumn}>
              <Text style={styles.detailLabel}>Order Date:</Text>
              <Text style={styles.detailValue}>{new Date(order?.created_at).toLocaleDateString()}</Text>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>{order?.order_status || 'Pending'}</Text>
            </View>
          </View>
        </View>

        {/* Bill To and Info Section */}
        <View style={styles.billToRow}>
          <View style={styles.billToCard}>
            <View style={styles.billToHeader}>
              <Text style={styles.sectionTitle}>Bill To</Text>
            </View>
            <Text style={styles.billToName}>{order?.customer?.name || 'Customer'}</Text>
            <Text style={styles.billToEmail}>{order?.customer?.email || 'N/A'}</Text>
            {/* <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Address</Text>
              <Text style={styles.addressText}>{order?.shipping_address?.address_line1 || 'N/A'}</Text>
              <Text style={styles.addressText}>
                {order?.shipping_address?.city && order?.shipping_address?.country 
                  ? `${order.shipping_address.city}, ${order.shipping_address.country}`
                  : order?.shipping_address?.city || order?.shipping_address?.country || 'N/A'
                }
              </Text>
            </View> */}
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Currency:</Text>
              <Text style={styles.infoValue}>{items[0]?.currency || 'INR'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Payment:</Text>
              <Text style={styles.infoValue}>INR {total}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.card}>
          <View style={styles.tableHeader}>
            <View style={styles.tableRow}>
              <View style={[styles.tableHeaderCell, { flex: 2 }]}>
                <Text>ITEM</Text>
              </View>
              <View style={styles.tableHeaderCell}>
                <Text>PRICE</Text>
              </View>
              <View style={styles.tableHeaderCell}>
                <Text>QTY</Text>
              </View>
              <View style={styles.tableHeaderCell}>
                <Text>TOTAL</Text>
              </View>
            </View>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={[styles.itemCell, { flex: 2 }]}>
                <Text style={styles.itemName}>{item.post?.title || 'Item'}</Text>
                <Text style={styles.itemId}>Post ID: {item.post_id || 'N/A'}</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>INR {item.unit_price || 0}</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{item.quantity || 1}</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>INR {item.line_total || 0}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>INR {subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>INR {shipping}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>INR {total}</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>
            This is a system-generated bill. Contact seller for queries.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Authorized Signature</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.generatedDate}>Generated on {new Date().toLocaleDateString()}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F6FA",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  invoiceHeader: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  invoiceTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  invoiceNumber: {
    fontSize: 18,
    color: "#6b7280",
  },
  invoiceDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  invoiceDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 8,
  },
  billToRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  billToCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  billToHeader: {
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  billToName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  billToEmail: {
    fontSize: 14,
    color: "#6b7280",
  },
  addressContainer: {
    marginTop: 12,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 2,
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "center",
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
  itemCell: {
    paddingRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  itemId: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 8,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 14,
    color: "#374151",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  notesText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  signatureSection: {
    alignItems: "center",
    marginTop: 20,
  },
  signatureLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: "#9ca3af",
    marginBottom: 8,
  },
  generatedDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  printButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  notificationBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  notificationText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
});

export default InvoiceScreen;