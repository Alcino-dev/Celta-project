import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SaleFormProps {
  product: any;
  onSubmit: (saleData: any) => void;
  onClose: () => void;
}

interface SaleFormData {
  quantity: number;
  discount: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
}

const SaleForm: React.FC<SaleFormProps> = ({ product, onSubmit, onClose }) => {
  const [quantity, setQuantity] = useState('1');
  const [discount, setDiscount] = useState('0');
  const [total, setTotal] = useState(product.salePrice);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNIF, setCustomerNIF] = useState('');

  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const disc = parseFloat(discount) || 0;
    const newTotal = (qty * product.salePrice) - disc;
    setTotal(Math.max(0, newTotal));
  }, [quantity, discount, product.salePrice]);

  const handleSubmit = async () => {
    const saleData = {
      quantity: parseInt(quantity),
      discount: parseFloat(discount),
      total: total,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        nif: customerNIF
      }
    };

    // Save sale record to AsyncStorage
    const saleRecord = {
      id: Date.now().toString(),
      productName: product.name,
      quantity: saleData.quantity,
      salePrice: product.salePrice,
      totalValue: saleData.total,
      profit: saleData.total - (product.costPrice * saleData.quantity),
      date: new Date().toISOString(),
      customerName: saleData.customer.name,
      customerPhone: saleData.customer.phone,
    };

    try {
      const existingSales = await AsyncStorage.getItem('saleHistory');
      const saleHistory = existingSales ? JSON.parse(existingSales) : [];
      saleHistory.push(saleRecord);
      await AsyncStorage.setItem('saleHistory', JSON.stringify(saleHistory));
    } catch (error) {
      console.error('Erro ao salvar histórico de vendas:', error);
    }

    onSubmit(saleData);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Realizar Venda</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.productInfo}>
          <MaterialIcons name="shopping-bag" size={24} color="#2196F3" />
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>
              Preço unitário: Kzs {product.salePrice.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.stockInfo}>
              Em estoque: {product.quantity} unidades
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.sectionTitle}>
            <MaterialIcons name="person" size={24} color="#2196F3" />
            <Text style={styles.sectionTitleText}>Informações do Cliente</Text>
          </View>

          <View style={styles.inputGroup}>
            <MaterialIcons name="person-outline" size={24} color="#2196F3" style={styles.inputIcon} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome do Cliente</Text>
              <Text style={styles.description}>Nome completo do cliente</Text>
              <TextInput
                style={styles.input}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Ex: Alcino Jaime"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <FontAwesome name="phone" size={24} color="#2196F3" style={styles.inputIcon} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone</Text>
              <Text style={styles.description}>Número para contato</Text>
              <TextInput
                style={styles.input}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="Ex: 928051534"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <MaterialIcons name="email" size={24} color="#2196F3" style={styles.inputIcon} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail</Text>
              <Text style={styles.description}>Endereço de e-mail do cliente</Text>
              <TextInput
                style={styles.input}
                value={customerEmail}
                onChangeText={setCustomerEmail}
                placeholder="Ex: alcino@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <MaterialIcons name="badge" size={24} color="#2196F3" style={styles.inputIcon} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>NIF</Text>
              <Text style={styles.description}>Número de Identificação Fiscal</Text>
              <TextInput
                style={styles.input}
                value={customerNIF}
                onChangeText={setCustomerNIF}
                placeholder="Ex: 123456789LA014"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.sectionTitle}>
            <MaterialIcons name="shopping-cart" size={24} color="#2196F3" />
            <Text style={styles.sectionTitleText}>Detalhes da Venda</Text>
          </View>

          <View style={styles.inputGroup}>
            <MaterialIcons name="shopping-cart" size={24} color="#2196F3" style={styles.inputIcon} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Quantidade</Text>
              <Text style={styles.description}>Quantas unidades serão vendidas?</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                placeholder="Ex: 1"
              />
            </View>
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <MaterialIcons name="attach-money" size={24} color="#2196F3" />
          <View>
            <Text style={styles.totalLabel}>Total da Venda</Text>
            <Text style={styles.totalValue}>
              Kzs {total.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!customerName || !customerPhone || !customerNIF) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!customerName || !customerPhone || !customerNIF}
        >
          <MaterialIcons name="check" size={24} color="#FFF" />
          <Text style={styles.submitButtonText}>Confirmar Venda</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  productInfo: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productDetails: {
    marginLeft: 12,
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  stockInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  inputIcon: {
    marginTop: 24,
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.8,
  },
});

export default SaleForm;