import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Image, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
export default function RegisterScreen() {
  const [companyName, setCompanyName] = useState('');
  const [nif, setNif] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [logo, setLogo] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      const userData = {
        companyName,
        nif,
        email,
        phone,
        logo,
        password,
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      Toast.show({
        type: 'success',
        text1: 'Cadastro realizado com sucesso!',
      });

      router.push('/LoginScreen');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao cadastrar',
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <MaterialIcons name="add-a-photo" size={40} color="#666" />
            <Text>Adicionar Logo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <MaterialIcons name="business" size={24} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Nome da Empresa"
          value={companyName}
          onChangeText={setCompanyName}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="description" size={24} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="NIF"
          value={nif}
          onChangeText={setNif}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={24} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="phone" size={24} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Telefone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={24} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Cadastrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
        <Text style={styles.loginText}>Já tem uma conta? Faça login</Text>
      </TouchableOpacity>
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
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
  },
}); 