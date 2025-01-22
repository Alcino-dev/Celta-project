import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

interface ProductFormProps {
  onSubmit: (product: any) => void;
  onClose: () => void;
  initialData?: any;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, onClose, initialData }) => {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhoto(initialData.photo);
      setSalePrice(initialData.salePrice.toString());
      setCostPrice(initialData.costPrice.toString());
      setQuantity(initialData.quantity.toString());
    }
  }, [initialData]);

  const pickImage = async () => {
    // Solicitar permissão para acessar a galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Desculpe, precisamos de permissão para acessar suas fotos!');
      return;
    }

    // Abrir o seletor de imagens
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!photo) {
      alert('Por favor, selecione uma imagem para o produto');
      return;
    }

    onSubmit({
      id: initialData?.id,
      name,
      photo,
      salePrice: Number(salePrice),
      costPrice: Number(costPrice),
      quantity: Number(quantity),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {initialData ? 'Editar Produto' : 'Novo Produto'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.inputGroup}>
          <MaterialIcons name="label" size={24} color="#2196F3" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome do Produto</Text>
            <Text style={styles.description}>Digite o nome completo do produto</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Coca-Cola 2L"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <MaterialIcons name="attach-money" size={24} color="#2196F3" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preço de Venda</Text>
            <Text style={styles.description}>Valor que será cobrado do cliente</Text>
            <TextInput
              style={styles.input}
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="decimal-pad"
              placeholder="Ex: 1000"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <FontAwesome5 name="money-bill-wave" size={24} color="#2196F3" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preço de Custo</Text>
            <Text style={styles.description}>Valor pago na compra do produto</Text>
            <TextInput
              style={styles.input}
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="decimal-pad"
              placeholder="Ex: 800"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <MaterialCommunityIcons name="package-variant" size={24} color="#2196F3" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quantidade</Text>
            <Text style={styles.description}>Número de unidades em estoque</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              placeholder="Ex: 10"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <MaterialIcons name="photo-camera" size={24} color="#2196F3" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Foto do Produto</Text>
            <Text style={styles.description}>Adicione uma imagem do produto</Text>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photoPreview} />
            ) : null}
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={pickImage}
            >
              <Text style={styles.photoButtonText}>
                {photo ? 'Alterar Foto' : 'Selecionar Foto'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>
          {initialData ? 'Salvar Alterações' : 'Adicionar Produto'}
        </Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
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
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  photoButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductForm; 