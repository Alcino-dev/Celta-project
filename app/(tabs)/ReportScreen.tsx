import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  Button 
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const ReportScreen = () => {
  // Add formatNumber helper function at the top of the component
  const formatNumber = (value: number) => {
    try {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      console.error('Error formatting number:', error);
      return '0,00';
    }
  };

  const [selectedTimePeriod, setSelectedTimePeriod] = useState("monthly");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalInflow: 0,
    totalOutflow: 0,
    dailySales: '0',
    zeroStockCount: 0
  });
  const [productStats, setProductStats] = useState({
    zeroStockProducts: [],
    editedProducts: [],
    newlyAddedProducts: []
  });
  const [chartData, setChartData] = useState({
    barChart: { labels: [], data: [] },
    pieChart: []
  });

  const chartWidth = Dimensions.get("window").width - 40;

  // Update useFocusEffect to include dependencies
  useFocusEffect(
    useCallback(() => {
      loadMetrics();
    }, [selectedTimePeriod, selectedCategory]) // Add relevant dependencies
  );

  // Add this helper function near the top of the component
  const consolidateEditedProducts = (products) => {
    const productMap = new Map();
    
    products.forEach(product => {
      const key = product.name;
      if (productMap.has(key)) {
        productMap.get(key).count += 1;
        // Update the date to the most recent edit
        if (new Date(product.editDate) > new Date(productMap.get(key).editDate)) {
          productMap.get(key).editDate = product.editDate;
        }
      } else {
        productMap.set(key, { ...product, count: 1 });
      }
    });
    
    return Array.from(productMap.values());
  };

  const loadMetrics = async () => {
    try {
      // Buscar dados do AsyncStorage
      const productsData = await AsyncStorage.getItem('products');
      const saleHistoryData = await AsyncStorage.getItem('saleHistory');
      const dailySalesData = await AsyncStorage.getItem('dailySales') || '0';
      const dailyProfitData = await AsyncStorage.getItem('dailyProfit') || '0';
      const storedOutflow = await AsyncStorage.getItem('totalOutflow') || '0';
      const dailyProfit = await AsyncStorage.getItem('dailyProfit') || '0';

      // Modificar a leitura dos dados adicionais para manter o histórico
      const editedProductsData = await AsyncStorage.getItem('editedProducts');
      const zeroStockData = await AsyncStorage.getItem('zeroStockProducts');
      const newlyAddedProductsData = await AsyncStorage.getItem('newlyAddedProducts');

      if (!productsData) {
        return;
      }

      const parsedProducts = JSON.parse(productsData);
      const zeroStockProducts = zeroStockData ? JSON.parse(zeroStockData) : [];
      const editedProducts = editedProductsData ? JSON.parse(editedProductsData) : [];
      const newlyAddedProducts = newlyAddedProductsData ? JSON.parse(newlyAddedProductsData) : [];

      // Filtrar produtos mais antigos que 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const filterRecentProducts = (products) => {
        return products.filter(product => {
          const productDate = new Date(product.editDate || product.addDate || product.date);
          return productDate >= sevenDaysAgo;
        });
      };

      // Atualizar métricas com os dados filtrados
      setProductStats({
        zeroStockProducts: filterRecentProducts(zeroStockProducts),
        editedProducts: consolidateEditedProducts(filterRecentProducts(editedProducts)),
        newlyAddedProducts: filterRecentProducts(newlyAddedProducts)
      });

      // Parse dos dados
      const saleHistory = saleHistoryData ? JSON.parse(saleHistoryData) : [];
      const totalSoldItems = saleHistory.reduce((total, sale) => {
        return total + (sale.quantity || 0);
      }, 0);
      const totalProfit = parseFloat(dailyProfitData.replace(',', '.'));

      // Calcular crescimento baseado nas vendas de hoje vs ontem
      let growth = 0;
      const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const todaySales = saleHistory
        .filter(sale => sale.date.startsWith(today))
        .reduce((acc, sale) => acc + sale.totalValue, 0);

      const yesterdaySales = saleHistory
        .filter(sale => sale.date.startsWith(yesterday))
        .reduce((acc, sale) => acc + sale.totalValue, 0);

      if (yesterdaySales > 0) {
        growth = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
      }

      // Tentar converter considerando possível formato brasileiro
      const outflowValue = parseFloat(storedOutflow.replace(',', '.'));
      const profitValue = parseFloat(dailyProfit.replace(',', '.'));

      // Atualizar métricas com verificação de valores válidos
      setMetrics({
        totalProducts: parsedProducts.length,
        totalInflow: outflowValue || 0,
        totalOutflow: profitValue || 0,
        dailySales: totalSoldItems.toString(),
        zeroStockCount: zeroStockProducts.length
      });

      // Preparar dados para os gráficos
      const productSales = parsedProducts.map(product => {
        const productSales = saleHistory
          .filter(sale => 
            sale.productName === product.name && 
            sale.date.startsWith(today)
          );
        const totalQuantitySold = productSales.reduce((acc, sale) => acc + sale.quantity, 0);

        return {
          name: product.name,
          quantity: totalQuantitySold || 0 // Se não houver vendas, mostra 0
        };
      });

      // Ordenar por quantidade vendida
      const sortedProducts = [...productSales]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Calcular o total de vendas para percentagens
      const totalQuantitySold = productSales.reduce((acc, product) => acc + product.quantity, 0);

      // Atualizar dados dos gráficos
      setChartData({
        barChart: {
          labels: sortedProducts.map(p => p.name),
          data: sortedProducts.map(p => p.quantity)
        },
        pieChart: sortedProducts.map((product, index) => {
          const percentage = totalQuantitySold > 0 
            ? ((product.quantity / totalQuantitySold) * 100).toFixed(1)
            : '0';
          
          return {
            name: `${product.name} (${percentage}%)`,
            sales: product.quantity,
            color: ["#f39c12", "#e74c3c", "#8e44ad", "#27ae60", "#3498db"][index % 5],
            legendFontColor: "#7F7F7F",
            legendFontSize: 12
          };
        })
      });

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setMetrics({
        totalProducts: 0,
        totalInflow: 0,
        totalOutflow: 0,
        dailySales: '0',
        zeroStockCount: 0
      });
      setProductStats({
        zeroStockProducts: [],
        editedProducts: [],
        newlyAddedProducts: []
      });
      setChartData({
        barChart: { labels: [], data: [] },
        pieChart: []
      });
    }
  };

  const [fadeAnim, setFadeAnim] = useState(1);
  const [scaleAnim, setScaleAnim] = useState(1);

  // Modifique a função formatDate para retornar um objeto que indica se é hoje
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    // Compara se é o mesmo dia
    const isToday = date.toDateString() === today.toDateString();
    
    return {
      text: isToday ? 'Hoje' : date.toLocaleDateString(),
      isToday
    };
  };

  return (
    <View style={styles.container}>
      {/* Header com Gradiente - Removido padding superior extra */}
      <LinearGradient
        colors={['#0098f9', '#00bcd4', '#2196f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      >
        <BlurView intensity={40} style={styles.headerContent}>
          <Animated.View style={[styles.metricsContainer, {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }]}>
            <Text style={styles.headerTitle}>Indicadores de Desempenho</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total de Vendas</Text>
                <Text style={styles.metricValue}>{metrics.dailySales} unidades</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Lucro Líquido</Text>
                <Text style={styles.metricValue}>KZS {formatNumber(metrics.totalOutflow)}</Text>
              </View>
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <View style={styles.metricLabelContainer}>
                  <Text style={styles.metricLabel}>Produtos sem Stock</Text>
                  {metrics.zeroStockCount > 0 && (
                    <View style={styles.headerRedDot} />
                  )}
                </View>
                <Text style={styles.metricValue}>{metrics.zeroStockCount}</Text>
              </View>
              <View style={styles.metricItem}>
                <View style={styles.metricLabelContainer}>
                  <Text style={styles.metricLabel}>Produtos Adicionados</Text>
                  {productStats.newlyAddedProducts.length > 0 && (
                    <View style={styles.headerGreenDot} />
                  )}
                </View>
                <Text style={styles.metricValue}>
                  {productStats.newlyAddedProducts.length}
                </Text>
              </View>
            </View>
          </Animated.View>
        </BlurView>
      </LinearGradient>

      {/* Conteúdo dos Gráficos */}
      <ScrollView style={styles.scrollContent}>
        {/* Gráfico em Escada (Bar Chart) */}
        <Animated.View style={[styles.section, {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }]}>
          <Text style={styles.sectionTitle}>Produtos Mais Vendidos</Text>
          {chartData.barChart.labels.length > 0 ? (
            <BarChart
              data={{
                labels: chartData.barChart.labels,
                datasets: [{
                  data: chartData.barChart.data
                }]
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              }}
              fromZero
            />
          ) : (
            <Text style={styles.noDataText}>Nenhum produto vendido ainda</Text>
          )}
        </Animated.View>

        {/* Gráfico de Pizza */}
        <Animated.View style={[styles.section, {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }]}>
          <Text style={styles.sectionTitle}>Contribuição por Produto</Text>
          {chartData.pieChart.length > 0 ? (
            <PieChart
              data={chartData.pieChart}
              width={chartWidth}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor={"sales"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
              hasLegend
              center={[10, 10]}
              avoidFalseZero
            />
          ) : (
            <Text style={styles.noDataText}>Nenhum produto vendido ainda</Text>
          )}
        </Animated.View>

        {/* Adicionar novas seções após os gráficos existentes */}
        <Animated.View style={[styles.section, {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }]}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Produtos sem Stock</Text>
            <View style={styles.titleRightContainer}>
              {productStats.zeroStockProducts.length > 0 && (
                <View style={styles.redDot} />
              )}
            </View>
          </View>
          {productStats.zeroStockProducts.length > 0 ? (
            productStats.zeroStockProducts.map((product, index) => {
              const dateInfo = formatDate(product.date);
              return (
                <Text key={index} style={styles.productItem}>
                  {product.name} - <Text style={dateInfo.isToday ? styles.todayText : null}>
                    {dateInfo.text}
                  </Text>
                </Text>
              );
            })
          ) : (
            <Text style={styles.noDataText}>Todos os produtos têm stock disponível</Text>
          )}
        </Animated.View>

        <Animated.View style={[styles.section, {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }]}>
          <Text style={styles.sectionTitle}>Produtos Editados</Text>
          {productStats.editedProducts.length > 0 ? (
            productStats.editedProducts.map((product, index) => {
              const dateInfo = formatDate(product.editDate);
              return (
                <View key={index} style={styles.productItemContainer}>
                  <Text style={styles.productItem}>
                    {product.name} - <Text style={dateInfo.isToday ? styles.todayText : null}>
                      {dateInfo.text}
                    </Text>
                  </Text>
                  {product.count > 1 && (
                    <View style={styles.editCountContainer}>
                      <Text style={styles.editCountText}>{product.count}</Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.noDataText}>Nenhum produto editado</Text>
          )}
        </Animated.View>

        <Animated.View style={[styles.section, {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }]}>
          <Text style={styles.sectionTitle}>Produtos Adicionados</Text>
          {productStats.newlyAddedProducts.length > 0 ? (
            productStats.newlyAddedProducts.map((product, index) => {
              const dateInfo = formatDate(product.addDate);
              return (
                <Text key={index} style={styles.productItem}>
                  {product.name} - <Text style={dateInfo.isToday ? styles.todayText : null}>
                    {dateInfo.text}
                  </Text>
                </Text>
              );
            })
          ) : (
            <Text style={styles.noDataText}>Nenhum produto novo adicionado</Text>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerBackground: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerContent: {
    padding: 20,
    paddingTop: 10, // Ajustado para considerar a status bar
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metricsContainer: {
    marginTop: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricItem: {
    flex: 1,
    marginRight: 10,
  },
  metricLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollContent: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 24,
  },
  exportContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
  productItem: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    color: '#333',
  },
  todayText: {
    fontWeight: 'bold',
    color: '#0098f9' // opcional: pode adicionar uma cor diferente também
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    height: 24,
  },
  titleRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    marginTop: 1,
  },
  metricLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    marginTop: 1,
    shadowColor: '#FF0000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  headerGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
    marginTop: 1,
    shadowColor: '#00E676',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  productItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editCountContainer: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  editCountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ReportScreen;
