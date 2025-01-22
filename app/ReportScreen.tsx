import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReportScreen() {
  const [addedProducts, setAddedProducts] = useState(0);
  const [editedProducts, setEditedProducts] = useState(0);
  const [deletedProducts, setDeletedProducts] = useState(0);
  const [soldProducts, setSoldProducts] = useState(0); // New state for sold products

  const loadData = async () => {
    try {
      const added = await AsyncStorage.getItem('addedProducts');
      const edited = await AsyncStorage.getItem('editedProducts');
      const deleted = await AsyncStorage.getItem('deletedProducts');
      const sold = await AsyncStorage.getItem('saleHistory'); // Load sale history
      if (added !== null) setAddedProducts(parseInt(added));
      if (edited !== null) setEditedProducts(parseInt(edited));
      if (deleted !== null) setDeletedProducts(parseInt(deleted));
      if (sold !== null) setSoldProducts(JSON.parse(sold).length); // Set sold products count
    } catch (error) {
      console.error('Failed to load data from AsyncStorage', error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh data every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAddProduct = async () => {
    const newCount = addedProducts + 1;
    setAddedProducts(newCount);
    await AsyncStorage.setItem('addedProducts', newCount.toString());
  };

  const handleEditProduct = async () => {
    const newCount = editedProducts + 1;
    setEditedProducts(newCount);
    await AsyncStorage.setItem('editedProducts', newCount.toString());
  };

  const handleDeleteProduct = async () => {
    const newCount = deletedProducts + 1;
    setDeletedProducts(newCount);
    await AsyncStorage.setItem('deletedProducts', newCount.toString());
  };

  const handleSellProduct = async () => { // New function to handle product sales
    const newCount = soldProducts + 1;
    setSoldProducts(newCount);
    await AsyncStorage.setItem('soldProducts', newCount.toString());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Relatório</Text>
      <Text>Produtos Adicionados: {addedProducts}</Text>
      <Text>Produtos Editados: {editedProducts}</Text>
      <Text>Produtos Deletados: {deletedProducts}</Text>
      <Text>Produtos Vendidos: {soldProducts}</Text> {/* Display sold products */}
      <Button title="Adicionar Produto" onPress={handleAddProduct} />
      <Button title="Editar Produto" onPress={handleEditProduct} />
      <Button title="Deletar Produto" onPress={handleDeleteProduct} />
      <Button title="Vender Produto" onPress={handleSellProduct} /> {/* Button to sell product */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
