import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import ProductForm from '../../components/ProductForm';
import SaleForm from '../../components/SaleForm';
import Header from '../../components/Header';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';

interface Product {
  id: string;
  name: string;
  photo: string;
  salePrice: number;
  costPrice: number;
  quantity: number;
}

interface StockMetrics {
  totalProducts: number;
  totalOutflow: number;
  totalInflow: number;
}

interface StockNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  timestamp: number;
}

// Configure as notificações globalmente
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const StockScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<StockMetrics>({
    totalProducts: 0,
    totalOutflow: 0,
    totalInflow: 0,
  });
  const [isProductModalVisible, setProductModalVisible] = useState(false);
  const [isSaleModalVisible, setSaleModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const resetAllData = async () => {
    await AsyncStorage.multiSet([
      ['products', JSON.stringify([])],
      ['totalInflow', '0'],
      ['totalOutflow', '0'],
      ['totalProfit', '0']
    ]);
    setProducts([]);
    setMetrics({
      totalProducts: 0,
      totalOutflow: 0,
      totalInflow: 0,
    });
  };

  const forceCleanTrackingData = async () => {
    try {
      // Remover completamente as chaves do AsyncStorage
      await AsyncStorage.removeItem('newlyAddedProducts');
      await AsyncStorage.removeItem('editedProducts');
      await AsyncStorage.removeItem('zeroStockProducts');
      
      // Reinicializar com arrays vazios
      await AsyncStorage.multiSet([
        ['newlyAddedProducts', '[]'],
        ['editedProducts', '[]'],
        ['zeroStockProducts', '[]']
      ]);
      
      console.log('Dados de rastreamento limpos com sucesso');
    } catch (error) {
      console.error('Erro ao limpar dados de rastreamento:', error);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        const totalInStock = products.reduce((acc, product) => {
          return acc + (Number(product.quantity) || 0);
        }, 0);

        setMetrics(prevMetrics => ({
          ...prevMetrics,
          totalProducts: totalInStock,
        }));

        console.log('Métricas atualizadas:', {
          totalInStock,
          produtos: products.map(p => ({ nome: p.name, quantidade: p.quantity }))
        });
      } catch (error) {
        console.error('Erro ao atualizar métricas:', error);
      }
    };

    updateMetrics();
  }, [products]);

  const calculateMetrics = async () => {
    try {
      const totalInStock = products.reduce((acc, product) => {
        const quantity = Number(product.quantity) || 0;
        return acc + quantity;
      }, 0);
      
      const storedInflow = await AsyncStorage.getItem('totalInflow') || '0';
      const storedOutflow = await AsyncStorage.getItem('totalOutflow') || '0';

      const newMetrics = {
        totalProducts: totalInStock,
        totalInflow: Number(storedInflow),
        totalOutflow: Number(storedOutflow),
      };

      console.log('Métricas atualizadas:', newMetrics);
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
    }
  };

  const saveProducts = async (newProducts: Product[]) => {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(newProducts));
      setProducts(newProducts);
      
      const totalInStock = newProducts.reduce((acc, product) => {
        return acc + (Number(product.quantity) || 0);
      }, 0);
      
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        totalProducts: totalInStock,
      }));
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
    }
  };

  const configureNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      console.log('Status da permissão de notificações:', finalStatus);

      if (finalStatus !== 'granted') {
        alert('Precisamos da sua permissão para enviar notificações!');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Schedule a test notification to ensure notifications are working
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Notificação de Teste",
          body: "Esta é uma notificação de teste para garantir que as notificações estão funcionando.",
        },
        trigger: { seconds: 2 },
      });
      
    } catch (error) {
      console.error('Erro ao configurar notificações:', error);
    }
  };

  const checkLowStock = async (productsToCheck: Product[]) => {
    try {
      const lowStockProducts = productsToCheck.filter(p => p.quantity <= 2);
      console.log('Produtos com estoque baixo:', lowStockProducts);
      
      if (lowStockProducts.length > 0) {
        // Carregar notificações existentes
        const storedNotifications = await AsyncStorage.getItem('stockNotifications') || '[]';
        const currentNotifications = JSON.parse(storedNotifications);
        
        const newNotifications = [];
        
        for (const product of lowStockProducts) {
          const title = "⚠️ Estoque Baixo!";
          const body = `O produto ${product.name} está com apenas ${product.quantity} unidades em estoque.`;
          
          // Enviar notificação push
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { productId: product.id },
            },
            trigger: null,
          });
          
          // Adicionar à lista de notificações do app
          newNotifications.push({
            id: Date.now().toString() + product.id,
            title,
            body,
            read: false,
            timestamp: Date.now()
          });
        }
        
        // Atualizar lista de notificações no AsyncStorage
        const updatedNotifications = [...newNotifications, ...currentNotifications];
        await AsyncStorage.setItem('stockNotifications', JSON.stringify(updatedNotifications));
        console.log('Notificações salvas:', newNotifications);
      }
    } catch (error) {
      console.error('Erro ao verificar estoque baixo:', error);
    }
  };

  // Adicione este useEffect para testar as notificações quando a tela carregar
  useEffect(() => {
    configureNotifications();
  }, []);

  const loadProducts = async () => {
    try {
      const storedProducts = await AsyncStorage.getItem('products');
      const loadedProducts = storedProducts ? JSON.parse(storedProducts) : [];
      setProducts(loadedProducts);
      
      await checkLowStock(loadedProducts);
      
      const storedInflow = await AsyncStorage.getItem('totalInflow') || '0';
      const storedOutflow = await AsyncStorage.getItem('totalOutflow') || '0';

      setMetrics(prevMetrics => ({
        ...prevMetrics,
        totalInflow: Number(storedInflow),
        totalOutflow: Number(storedOutflow),
      }));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      const newProduct = {
        ...product,
        id: Date.now().toString(),
        salePrice: Number(product.salePrice),
        costPrice: Number(product.costPrice),
        quantity: Number(product.quantity),
      };

      // Atualizar lista de produtos adicionados
      const newlyAddedProductsData = await AsyncStorage.getItem('newlyAddedProducts') || '[]';
      const newlyAddedProducts = JSON.parse(newlyAddedProductsData);
      newlyAddedProducts.push({
        name: newProduct.name,
        addDate: new Date().toISOString()
      });
      await AsyncStorage.setItem('newlyAddedProducts', JSON.stringify(newlyAddedProducts));

      const newProducts = [...products, newProduct];
      await saveProducts(newProducts);
      setProductModalVisible(false);
      
      // Verificar estoque baixo ao adicionar
      await checkLowStock(newProducts);
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      alert('Erro ao salvar o produto. Por favor, tente novamente.');
    }
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    try {
      const newProducts = products.map(p => 
        p.id === updatedProduct.id ? {
          ...updatedProduct,
          quantity: Number(updatedProduct.quantity),
          salePrice: Number(updatedProduct.salePrice),
          costPrice: Number(updatedProduct.costPrice),
        } : p
      );

      // Atualizar lista de produtos editados
      const editedProductsData = await AsyncStorage.getItem('editedProducts') || '[]';
      const editedProducts = JSON.parse(editedProductsData);
      
      // Adicionar novo registro de edição (mantém histórico completo)
      editedProducts.push({
        name: updatedProduct.name,
        editDate: new Date().toISOString(),
        changes: {
          quantity: updatedProduct.quantity,
          salePrice: updatedProduct.salePrice,
          costPrice: updatedProduct.costPrice
        }
      });
      
      await AsyncStorage.setItem('editedProducts', JSON.stringify(editedProducts));

      // Verificar e atualizar produtos com estoque zero
      const zeroStockProducts = newProducts.filter(p => p.quantity === 0).map(p => ({
        name: p.name,
        date: new Date().toISOString()
      }));
      await AsyncStorage.setItem('zeroStockProducts', JSON.stringify(zeroStockProducts));

      await AsyncStorage.setItem('products', JSON.stringify(newProducts));
      setProducts(newProducts);
      
      setProductModalVisible(false);
      setIsEditMode(false);
      setSelectedProduct(null);
      
      console.log('Produto editado:', updatedProduct);

      // Verificar estoque baixo ao editar
      await checkLowStock(newProducts);
    } catch (error) {
      console.error('Erro ao editar produto:', error);
      alert('Erro ao editar o produto. Por favor, tente novamente.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const newProducts = products.filter(p => p.id !== productId);
    await saveProducts(newProducts);
  };

  const handleSale = async (quantity: number, salePrice: number, customer: { name: string, email: string, phone: string, nif: string }) => {
    try {
      if (!selectedProduct) return;

      // Verificar se há estoque suficiente
      if (selectedProduct.quantity < quantity) {
        alert('Quantidade insuficiente em estoque!');
        return;
      }

      // Atualizar estoque do produto
      const updatedProducts = products.map(p => {
        if (p.id === selectedProduct.id) {
          const newQuantity = Number(p.quantity) - Number(quantity);
          return {
            ...p,
            quantity: newQuantity
          };
        }
        return p;
      });

      // Após atualizar o produto, verificar estoque zero
      const updatedProduct = updatedProducts.find(p => p.id === selectedProduct.id);
      if (updatedProduct && updatedProduct.quantity === 0) {
        const zeroStockProducts = JSON.parse(await AsyncStorage.getItem('zeroStockProducts') || '[]');
        zeroStockProducts.push({
          name: updatedProduct.name,
          date: new Date().toISOString()
        });
        await AsyncStorage.setItem('zeroStockProducts', JSON.stringify(zeroStockProducts));
      }

      // Atualizar saídas
      const currentOutflow = await AsyncStorage.getItem('totalOutflow') || '0';
      const newOutflow = Number(currentOutflow) + Number(quantity);
      await AsyncStorage.setItem('totalOutflow', newOutflow.toString());

      // Atualizar métricas imediatamente
      const totalInStock = updatedProducts.reduce((acc, product) => {
        return acc + (Number(product.quantity) || 0);
      }, 0);

      setMetrics(prevMetrics => ({
        ...prevMetrics,
        totalProducts: totalInStock,
        totalOutflow: newOutflow // Atualizar saídas nas métricas
      }));

      // Atualizar estados
      setProducts(updatedProducts);

      // Atualizar lucro diário
      const currentDailyProfit = await AsyncStorage.getItem('dailyProfit') || '0';
      const currentProfit = parseFloat(currentDailyProfit.replace(',', '.'));
      const newDailyProfit = (currentProfit + (quantity * salePrice - quantity * selectedProduct.costPrice)).toFixed(2).replace('.', ',');
      await AsyncStorage.setItem('dailyProfit', newDailyProfit);

      // Atualizar valor de vendas diárias
      const currentDailySales = await AsyncStorage.getItem('dailySales') || '0';
      const currentValue = parseFloat(currentDailySales.replace(',', '.'));
      const newDailySales = (currentValue + (quantity * salePrice)).toFixed(2).replace('.', ',');
      await AsyncStorage.setItem('dailySales', newDailySales);

      // Salvar produtos no AsyncStorage
      await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));

      // Obter informações da empresa
      const userDataString = await AsyncStorage.getItem('userData');
      const userData = userDataString ? JSON.parse(userDataString) : {};

      // Convert logo URL to base64
      const logoBase64 = await fetch(userData.logo)
        .then(response => response.blob())
        .then(blob => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }));

      // Enviar fatura por email
      if (customer.email) {
        const invoiceData = {
          invoiceNumber: Date.now().toString(),
          date: new Date().toLocaleDateString(),
          companyInfo: {
            name: userData.companyName || 'Nome da Empresa',
            logo: logoBase64 || 'URL do Logo',
            address: userData.address || 'Endereço da Empresa',
            phone: userData.phone || 'Telefone da Empresa',
            email: userData.email || 'Email da Empresa',
            nif: userData.nif || 'NIF da Empresa'
          },
          customerInfo: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: 'Endereço do Cliente'
          },
          items: [
            {
              name: selectedProduct.name,
              quantity: quantity,
              price: salePrice,
              total: quantity * salePrice
            }
          ],
          subtotal: quantity * salePrice,
          tax: 0, // Adicione a taxa se necessário
          total: quantity * salePrice
        };

        const invoiceHTML = await generateInvoicePDF(invoiceData);
        const { uri } = await Print.printToFileAsync({ html: invoiceHTML });

        try {
          const result = await MailComposer.composeAsync({
            recipients: [customer.email],
            subject: `Fatura ${invoiceData.invoiceNumber}`,
            body: `
Prezado(a) ${customer.name},

Segue em anexo a fatura referente à sua compra.

Agradecemos a preferência!

Atenciosamente,
${invoiceData.companyInfo.name}
          `,
            attachments: [uri],
            isHtml: true
          });

          console.log('Resultado do envio:', result);

          if (result.status === 'sent') {
            console.log('Email enviado com sucesso');
            alert('Fatura enviada por email com sucesso!');
          } else {
            console.log('Email não enviado:', result.status);
            alert('O email pode não ter sido enviado. Por favor, verifique com o cliente.');
          }
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
          alert('Não foi possível enviar o email. ' + emailError.message);
        }
      } else {
        console.log('Nenhum email fornecido para envio da fatura');
        alert('Nenhum email fornecido. A fatura não será enviada.');
      }

      // Verificar estoque baixo após a venda
      await checkLowStock(updatedProducts);

      // Atualizar métricas na UI
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        totalProducts: updatedProducts.reduce((acc, p) => acc + Number(p.quantity), 0),
        totalOutflow: newOutflow
      }));

      // Limpar estado e fechar modal
      setSaleModalVisible(false);
      setSelectedProduct(null);

      // Feedback de sucesso
      alert('Venda realizada com sucesso!');

    } catch (error) {
      console.error('Erro ao processar venda:', error);
      alert(error.message || 'Erro ao processar a venda. Por favor, tente novamente.');
    }
  };

  // Função para gerar o HTML do PDF
  const generateInvoicePDF = async (invoiceData) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Fatura ${invoiceData.invoiceNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 40px;
              color: #333;
              background-color: #f5f5f5;
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #eee;
              padding: 40px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              background-color: #fff;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #0098f9;
              padding-bottom: 10px;
            }
            
            .company-info, .customer-info {
              margin-bottom: 20px;
            }
            
            .company-info h2, .customer-info h2 {
              color: #0098f9;
              margin-bottom: 10px;
            }
            
            .company-info p, .customer-info p {
              margin: 2px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            table, th, td {
              border: 1px solid #ddd;
            }
            
            th, td {
              padding: 12px;
              text-align: left;
            }
            
            th {
              background-color: #0098f9;
              color: #fff;
            }
            
            .totals {
              text-align: right;
            }
            
            .totals p {
              margin: 0;
              padding: 8px 0;
              font-size: 16px;
            }
            
            .totals p:last-child {
              font-size: 18px;
              font-weight: bold;
              color: #0098f9;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div>
                <h1>Fatura</h1>
                <p>Número: ${invoiceData.invoiceNumber}</p>
                <p>Data: ${invoiceData.date}</p>
              </div>
              <div>
                <img src="${invoiceData.companyInfo.logo}" alt="Logo da Empresa" style="max-width: 150px;">
              </div>
            </div>
            <div class="company-info">
              <h2>${invoiceData.companyInfo.name}</h2>
              <p>${invoiceData.companyInfo.address}</p>
              <p>${invoiceData.companyInfo.phone}</p>
              <p>${invoiceData.companyInfo.email}</p>
              <p>NIF: ${invoiceData.companyInfo.nif}</p>
            </div>
            <div class="customer-info">
              <h2>Cliente</h2>
              <p>${invoiceData.customerInfo.name}</p>
              <p>${invoiceData.customerInfo.address}</p>
              <p>${invoiceData.customerInfo.phone}</p>
              <p>${invoiceData.customerInfo.email}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantidade</th>
                  <th>Preço Unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="totals">
              <p>Subtotal: ${invoiceData.subtotal.toFixed(2)}</p>
              <p>Taxa: ${invoiceData.tax.toFixed(2)}</p>
              <p>Total: ${invoiceData.total.toFixed(2)}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const saveNotification = async (title: string, body: string) => {
    try {
      const storedNotifications = await AsyncStorage.getItem('stockNotifications');
      const notifications: StockNotification[] = storedNotifications 
        ? JSON.parse(storedNotifications) 
        : [];

      const newNotification: StockNotification = {
        id: Date.now().toString(),
        title,
        body,
        read: false,
        timestamp: Date.now()
      };

      const updatedNotifications = [newNotification, ...notifications];
      await AsyncStorage.setItem('stockNotifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
    }
  };

  // Adicionar função para limpar histórico antigo
  const cleanupOldHistory = async () => {
    try {
      // Manter apenas últimos 30 dias de histórico
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Limpar histórico de produtos editados
      const editedProductsData = await AsyncStorage.getItem('editedProducts') || '[]';
      const editedProducts = JSON.parse(editedProductsData);
      const filteredEditedProducts = editedProducts.filter(product => 
        new Date(product.editDate) > thirtyDaysAgo
      );
      await AsyncStorage.setItem('editedProducts', JSON.stringify(filteredEditedProducts));

      // Limpar histórico de produtos adicionados
      const newlyAddedProductsData = await AsyncStorage.getItem('newlyAddedProducts') || '[]';
      const newlyAddedProducts = JSON.parse(newlyAddedProductsData);
      const filteredNewProducts = newlyAddedProducts.filter(product => 
        new Date(product.addDate) > thirtyDaysAgo
      );
      await AsyncStorage.setItem('newlyAddedProducts', JSON.stringify(filteredNewProducts));

    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  };

  // Adicionar ao useEffect inicial
  useEffect(() => {
    loadProducts();
    cleanupOldHistory(); // Limpa histórico antigo ao iniciar o app
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          '#0098f9',  // Azul claro
          '#00bcd4',  // Ciano
          '#2196f3'   // Azul material
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      >
        <Header metrics={metrics} />
      </LinearGradient>
      
      <ScrollView style={styles.productList}>
        {products.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Image 
              source={require('../../assets/images/Empty-stock.png')} 
              style={styles.emptyStateImage}
            />
            <Text style={styles.emptyStateText}>Estoque Vazio</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map(product => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => {
                  setSelectedProduct(product);
                  setSaleModalVisible(true);
                }}
              >
                <Image source={{ uri: product.photo }} style={styles.productImage} />
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                
                <View style={styles.infoContainer}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Venda:</Text>
                    <Text style={styles.infoValue}>{product.salePrice.toFixed(2)} Kzs</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Custo:</Text>
                    <Text style={styles.infoValue}>{product.costPrice.toFixed(2)} Kzs</Text>
                  </View>
                  
                  <View style={[
                    styles.quantityContainer,
                    product.quantity <= 2 && styles.lowStock
                  ]}>
                    <Text style={[
                      styles.quantityText,
                      product.quantity <= 2 && styles.lowStockText
                    ]}>
                      Estoque: {product.quantity} unid.
                    </Text>
                  </View>
                </View>

                <BlurView intensity={20} style={styles.actionButtonsContainer}>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setSelectedProduct(product);
                        setIsEditMode(true);
                        setProductModalVisible(true);
                      }}
                    >
                      <LinearGradient
                        colors={['#1a73e8', '#0098f9', '#00bcd4', '#2196f3']}
                        locations={[0, 0.3, 0.6, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={20} color="#FFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={() => handleDeleteProduct(product.id)}
                    >
                      <LinearGradient
                        colors={['#EF5350', '#F44336', '#E53935', '#D32F2F']}
                        locations={[0, 0.3, 0.6, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setProductModalVisible(true)}
      >
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={isProductModalVisible} animationType="slide">
        <ProductForm
          onSubmit={isEditMode ? handleEditProduct : handleAddProduct}
          onClose={() => {
            setProductModalVisible(false);
            setIsEditMode(false);
            setSelectedProduct(null);
          }}
          initialData={isEditMode ? selectedProduct : undefined}
        />
      </Modal>

      <Modal visible={isSaleModalVisible} animationType="slide">
        <SaleForm
          product={selectedProduct}
          onSubmit={(saleData) => {
            if (selectedProduct) {
              handleSale(saleData.quantity, selectedProduct.salePrice, saleData.customer);
            }
            setSaleModalVisible(false);
            setSelectedProduct(null);
          }}
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
    backgroundColor: '#F5F5F5',
  },
  headerBackground: {
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  productList: {
    flex: 1,
    padding: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  productImage: {
    width: '70%',
    height: 100,
    borderRadius: 8,
    marginBottom: 6,
    alignSelf: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1a1a1a',
    height: 32,
    lineHeight: 16,
    textAlign: 'left',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    width: '40%',
    textAlign: 'left',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    width: '60%',
    textAlign: 'right',
  },
  quantityContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
    textAlign: 'center',
  },
  lowStock: {
    backgroundColor: '#ffebee',
  },
  lowStockText: {
    color: '#d32f2f',
  },
  actionButtonsContainer: {
    marginTop: 6,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 6,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
    opacity: 0.3
  },
  emptyStateText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '500',
  },
});

export default StockScreen;
