import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import SaleForm from '../../components/SaleForm'; // Ensure SaleForm is imported

interface SaleHistory {
  id: string;
  productName: string;
  quantity: number;
  salePrice: number;
  totalValue: number;
  profit: number;
  date: string;
  customerName?: string;
  customerPhone?: string;
}

interface StockNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  timestamp: number;
}

const HomeScreen = () => {
  const [showValue, setShowValue] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyNIF, setCompanyNIF] = useState('');
  const [dailySales, setDailySales] = useState('0,00');
  const [dailyProfit, setDailyProfit] = useState('0,00');
  const [saleHistory, setSaleHistory] = useState<SaleHistory[]>([]);
  const [notifications, setNotifications] = useState<StockNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isSaleModalVisible, setSaleModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setLogoUri(userData.logo);
          setCompanyName(userData.companyName || '');
          setCompanyEmail(userData.email || '');
          setCompanyNIF(userData.nif || '');
        }

        const dailySalesValue = await AsyncStorage.getItem('dailySales');
        
        if (dailySalesValue === null || dailySalesValue === undefined || dailySalesValue === 'NaN') {
          setDailySales('0,00');
          await AsyncStorage.setItem('dailySales', '0,00');
        } else {
          const numericValue = parseFloat(dailySalesValue.replace(',', '.'));
          if (isNaN(numericValue)) {
            setDailySales('0,00');
            await AsyncStorage.setItem('dailySales', '0,00');
          } else {
            const formattedValue = numericValue.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            setDailySales(formattedValue);
          }
        }

        const dailyProfitValue = await AsyncStorage.getItem('dailyProfit');
        if (dailyProfitValue === null || dailyProfitValue === undefined || dailyProfitValue === 'NaN') {
          setDailyProfit('0,00');
          await AsyncStorage.setItem('dailyProfit', '0,00');
        } else {
          const numericProfit = parseFloat(dailyProfitValue.replace(',', '.'));
          if (isNaN(numericProfit)) {
            setDailyProfit('0,00');
          } else {
            const formattedProfit = numericProfit.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            setDailyProfit(formattedProfit);
          }
        }

        const history = await AsyncStorage.getItem('saleHistory');
        if (history) {
          setSaleHistory(JSON.parse(history));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setDailySales('0,00');
        setDailyProfit('0,00');
      }
    };

    loadCompanyData();
    const refreshInterval = setInterval(loadCompanyData, 5000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const stored = await AsyncStorage.getItem('stockNotifications');
        
        if (stored) {
          const loadedNotifications = JSON.parse(stored);
          setNotifications(loadedNotifications);
          
          const unread = loadedNotifications.filter((n: StockNotification) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      tension: 10,
      friction: 2,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const markNotificationsAsRead = async () => {
    try {
      await AsyncStorage.setItem('stockNotifications', JSON.stringify([]));
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const handleSale = async (saleData: SaleHistory) => {
    try {
      const newSaleHistory = [...saleHistory, saleData];
      setSaleHistory(newSaleHistory);
      await AsyncStorage.setItem('saleHistory', JSON.stringify(newSaleHistory));

      // Update daily sales and profit
      const currentDailySales = await AsyncStorage.getItem('dailySales') || '0';
      const currentDailyProfit = await AsyncStorage.getItem('dailyProfit') || '0';

      const newDailySales = (parseFloat(currentDailySales.replace(',', '.')) + saleData.totalValue).toFixed(2).replace('.', ',');
      const newDailyProfit = (parseFloat(currentDailyProfit.replace(',', '.')) + saleData.profit).toFixed(2).replace('.', ',');

      await AsyncStorage.setItem('dailySales', newDailySales);
      await AsyncStorage.setItem('dailyProfit', newDailyProfit);

      setDailySales(newDailySales);
      setDailyProfit(newDailyProfit);
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
    }
  };

  const handleSaleSubmit = async (saleData: any) => {
    const saleRecord: SaleHistory = {
      id: Date.now().toString(),
      productName: selectedProduct?.name || '',
      quantity: saleData.quantity,
      salePrice: selectedProduct?.salePrice || 0,
      totalValue: saleData.total,
      profit: saleData.total - (selectedProduct?.costPrice || 0) * saleData.quantity,
      date: new Date().toISOString(),
      customerName: saleData.customer.name,
      customerPhone: saleData.customer.phone,
    };

    await handleSale(saleRecord);
    setSaleModalVisible(false);
    setSelectedProduct(null);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['#0098f9', '#00bcd4', '#2196f3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBackground}
        />
        <BlurView intensity={40} style={styles.headerTop}>
          <View style={styles.companyInfo}>
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={styles.logo}
              />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]} />
            )}
            <View style={styles.companyDetails}>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.companyEmail}>{companyEmail}</Text>
              <Text style={styles.companyNIF}>NIF: {companyNIF}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => {
              console.log('Abrindo notificações. Não lidas:', unreadCount);
              setShowNotifications(true);
            }}
          >
            <Icon name="notifications" size={24} color="#FFF" />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: '#FF0000' }]}>
                <Text style={styles.notificationCount}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </BlurView>

        <View style={styles.salesContainer}>
          <View style={styles.salesRow}>
            <BlurView intensity={40} style={styles.salesColumn}>
              <Text style={styles.salesLabel}>Venda (diária)</Text>
              <View style={styles.salesValueContainer}>
                <Text style={styles.salesValue}>
                  {showValue ? `KZS ${dailySales}` : '••••••'}
                </Text>
              </View>
            </BlurView>

            <BlurView intensity={40} style={[styles.salesColumn, styles.profitColumn]}>
              <Text style={styles.salesLabel}>Lucro (diário)</Text>
              <View style={styles.salesValueContainer}>
                <Text style={styles.salesValue}>
                  {showValue ? `KZS ${dailyProfit}` : '••••••'}
                </Text>
              </View>
            </BlurView>
          </View>
          <TouchableOpacity
            style={styles.visibilityButton}
            onPress={() => setShowValue(!showValue)}
          >
            <Icon
              name={showValue ? 'visibility' : 'visibility-off'}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Histórico de Vendas</Text>
          <Icon name="receipt-long" size={24} color="#0098f9" />
        </View>
        <ScrollView style={styles.historyList}>
          {saleHistory.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <Image 
                source={require('../../assets/images/empty-sales.png')} 
                style={styles.emptyHistoryImage}
              />
              <Text style={styles.emptyHistory}>Nenhuma venda realizada</Text>
            </View>
          ) : (
            saleHistory.map((sale) => (
              <View key={sale.id} style={[styles.historyItem, styles.elevatedBox]}>
                <LinearGradient
                  colors={['#ffffff', '#f8f9fa']}
                  style={styles.historyItemGradient}
                >
                  <View style={styles.historyItemHeader}>
                    <View style={styles.productNameContainer}>
                      <Icon name="shopping-bag" size={20} color="#0098f9" />
                      <Text style={styles.productName}>{sale.productName}</Text>
                    </View>
                    <Text style={styles.saleDate}>{formatDate(sale.date)}</Text>
                  </View>
                  <View style={styles.historyItemDetails}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Icon name="shopping-cart" size={16} color="#666" />
                        <Text style={styles.detailText}>Quantidade: {sale.quantity}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Icon name="attach-money" size={16} color="#666" />
                        <Text style={styles.detailText}>Preço: KZS {sale.salePrice.toFixed(2)}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.totalValue}>
                        <Icon name="calculate" size={16} color="#0098f9" /> Total: KZS {sale.totalValue.toFixed(2)}
                      </Text>
                      <Text style={styles.profit}>
                        <Icon name="trending-up" size={16} color="#4CAF50" /> Lucro: KZS {sale.profit.toFixed(2)}
                      </Text>
                    </View>
                    {(sale.customerName || sale.customerPhone) && (
                      <View style={styles.customerInfoContainer}>
                        {sale.customerName && (
                          <View style={styles.detailItem}>
                            <Icon name="person" size={16} color="#666" />
                            <Text style={styles.customerInfo}>{sale.customerName}</Text>
                          </View>
                        )}
                        {sale.customerPhone && (
                          <View style={styles.detailItem}>
                            <Icon name="phone" size={16} color="#666" />
                            <Text style={styles.customerInfo}>{sale.customerPhone}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showNotifications}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowNotifications(false);
          markNotificationsAsRead();
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => {
            setShowNotifications(false);
            markNotificationsAsRead();
          }}
        >
          <View style={styles.notificationPanel}>
            <Text style={styles.notificationTitle}>Notificações</Text>
            <ScrollView>
              {notifications.length === 0 ? (
                <Text style={styles.emptyNotifications}>Sem notificações</Text>
              ) : (
                notifications.map((notification) => (
                  <View key={notification.id} style={styles.notificationItem}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationText}>{notification.body}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.timestamp).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isSaleModalVisible} animationType="slide">
        <SaleForm
          product={selectedProduct}
          onSubmit={handleSaleSubmit}
          onClose={() => {
            setSaleModalVisible(false);
            setSelectedProduct(null);
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    overflow: 'hidden',
    marginBottom: 10,
    zIndex: 1,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 12,
    borderRadius: 100,
  },
  companyDetails: {
    gap: 2,
    zIndex: 1,
  },
  companyName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  companyEmail: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  companyNIF: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  notificationButton: {
    padding: 8,
  },
  salesContainer: {
    marginTop: 24,
    marginLeft: 10,
    position: 'relative',
    zIndex: 1,
  },
  salesLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  salesValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  salesValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  logoPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  salesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  historyItemGradient: {
    padding: 16,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saleDate: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: '#666',
    fontSize: 14,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0098f9',
  },
  profit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
  },
  customerInfoContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 4,
  },
  customerInfo: {
    fontSize: 14,
    color: '#666',
  },
  elevatedBox: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyHistoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyHistoryImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 5,
    opacity: 0.3
  },
  emptyHistory: {
    marginTop: -50,
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  notificationPanel: {
    backgroundColor: '#FFF',
    marginTop: 60,
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    maxHeight: '80%',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
  },
  emptyNotifications: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  notificationBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF0000',
    width: 10,
    height: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  salesColumn: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 10,
    padding: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  salesColumn1: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  visibilityButton: {
    position: 'absolute',
    top: -22,
    left: '50%',
    transform: [{ translateX: -12 }],
    zIndex: 2,
  },
  profitColumn: {
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
  },
});

export default HomeScreen;