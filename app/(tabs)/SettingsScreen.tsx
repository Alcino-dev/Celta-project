import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView, TextInput, Image, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import Modal from 'react-native-modal';
import * as ImagePicker from 'expo-image-picker';

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [lowStockAlert, setLowStockAlert] = useState(2);
  const [autoBackup, setAutoBackup] = useState(false);
  const [version, setVersion] = useState('1.0.0');
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [profileData, setProfileData] = useState({
    businessName: '',
    email: '',
    nif: '',
    image: '' // URL da imagem ou base64
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const scaleValue = new Animated.Value(1);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);

  useEffect(() => {
    loadSettings();
    loadProfileData();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setNotificationsEnabled(parsedSettings.notifications ?? true);
        setDarkMode(parsedSettings.darkMode ?? false);
        setLowStockAlert(parsedSettings.lowStockAlert ?? 2);
        setAutoBackup(parsedSettings.autoBackup ?? false);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async (key: string, value: any) => {
    try {
      const currentSettings = await AsyncStorage.getItem('appSettings');
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      const newSettings = { ...settings, [key]: value };
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const loadProfileData = async () => {
    try {
      // Carrega dados do userData primeiro
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setProfileData({
          businessName: userData.companyName || '',
          email: userData.email || '',
          nif: userData.nif || '',
          image: userData.logo || ''
        });
      }

      // Verifica se existem dados específicos do perfil que sobrescrevem os dados do usuário
      const profileDataString = await AsyncStorage.getItem('profileData');
      if (profileDataString) {
        const savedProfileData = JSON.parse(profileDataString);
        setProfileData(prevData => ({
          ...prevData,
          ...savedProfileData
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const saveProfileData = async () => {
    try {
      animateButton();
      setSaveSuccess(true);
      
      // Primeiro, atualiza o userData com os novos dados do perfil
      const userDataString = await AsyncStorage.getItem('userData');
      const userData = userDataString ? JSON.parse(userDataString) : {};
      
      const updatedUserData = {
        ...userData,
        companyName: profileData.businessName,
        email: profileData.email,
        nif: profileData.nif,
        logo: profileData.image
      };

      // Salva os dados atualizados em ambos os locais
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      await AsyncStorage.setItem('profileData', JSON.stringify(profileData));
      
      // Mostra feedback visual de sucesso
      setTimeout(() => {
        setSaveSuccess(false);
        setIsProfileModalVisible(false);
        Alert.alert('Sucesso', 'Dados do perfil atualizados com sucesso!');
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar dados do perfil:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar os dados do perfil.');
    }
  };

  const resetAllData = async () => {
    Alert.alert(
      'Zerar Todos os Dados',
      'Tem certeza que deseja zerar todos os dados da aplicação? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sim, Zerar Tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              const keysToReset = {
                'dailySales': '0,00',
                'dailyProfit': '0,00',
                'saleHistory': JSON.stringify([]),
                'totalInflow': '0',
                'totalOutflow': '0',
                'products': JSON.stringify([]),
                'metrics': JSON.stringify({
                  totalProducts: 0,
                  totalOutflow: 0,
                  totalInflow: 0
                })
              };

              await AsyncStorage.multiSet(Object.entries(keysToReset));
              Alert.alert('Sucesso', 'Todos os dados foram zerados.');
            } catch (error) {
              console.error('Erro ao zerar dados:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao zerar os dados.');
            }
          }
        }
      ]
    );
  };

  const exportData = async () => {
    // Implementar exportação de dados
    Alert.alert('Em breve', 'Função de exportação será implementada em breve.');
  };

  const importData = async () => {
    // Implementar importação de dados
    Alert.alert('Em breve', 'Função de importação será implementada em breve.');
  };

  const pickImage = async () => {
    try {
      // Solicitar permissão para acessar a galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Erro', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      // Abrir seletor de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        // Atualizar o estado com a nova imagem
        setProfileData({
          ...profileData,
          image: `data:image/jpeg;base64,${result.assets[0].base64}`
        });
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0098f9', '#00bcd4', '#2196f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Configurações de Usuário e Configurações de Notificações</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="notifications" size={24} color="#333" />
              <Text style={styles.settingText}>Notificações</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => {
                setNotificationsEnabled(value);
                saveSettings('notifications', value);
              }}
            />
          </View>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setIsProfileModalVisible(true)}
          >
            <View style={styles.settingInfo}>
              <Icon name="person" size={24} color="#333" />
              <Text style={styles.settingText}>Editar Dados do Perfil</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Versão</Text>
            <Text style={styles.aboutValue}>{version}</Text>
          </View>
          <TouchableOpacity 
            style={styles.aboutItem}
            onPress={() => setIsPrivacyModalVisible(true)}
          >
            <Text style={styles.aboutLabel}>Política de Privacidade</Text>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.aboutItem}
            onPress={() => setIsTermsModalVisible(true)}
          >
            <Text style={styles.aboutLabel}>Termos de Uso</Text>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetAllData}>
            <Icon name="delete-forever" size={24} color="#FFF" />
            <Text style={styles.resetButtonText}>Zerar Todos os Dados</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        isVisible={isProfileModalVisible}
        onBackdropPress={() => setIsProfileModalVisible(false)}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropTransitionOutTiming={0}
      >
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#0098f9', '#00bcd4', '#2196f3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalHeaderTitle}>Editar Dados do Perfil</Text>
          </LinearGradient>

          <ScrollView style={styles.modalBody}>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {profileData.image ? (
                <Image 
                  source={{ uri: profileData.image }} 
                  style={styles.profileImage}
                />
              ) : (
                <LinearGradient
                  colors={['#e0e0e0', '#f5f5f5']}
                  style={styles.imageUploadPlaceholder}
                >
                  <Icon name="add-a-photo" size={32} color="#666" />
                  <Text style={styles.imageUploadText}>Adicionar Imagem</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Icon name="business" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome da Empresa"
                value={profileData.businessName}
                onChangeText={(text) => setProfileData({...profileData, businessName: text})}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="email" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                value={profileData.email}
                onChangeText={(text) => setProfileData({...profileData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="assignment" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="NIF"
                value={profileData.nif}
                onChangeText={(text) => setProfileData({...profileData, nif: text})}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setIsProfileModalVisible(false)}
            >
              <LinearGradient
                colors={['#FF5252', '#FF1744', '#D50000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <View style={styles.buttonContent}>
                  <Icon name="close" size={24} color="#FFF" />
                  <Text style={styles.buttonText}>Cancelar</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <Animated.View style={[
              { transform: [{ scale: scaleValue }] },
              styles.actionButton
            ]}>
              <TouchableOpacity 
                onPress={saveProfileData}
                disabled={saveSuccess}
              >
                <LinearGradient
                  colors={saveSuccess 
                    ? ['#4CAF50', '#45A849', '#388E3C']
                    : ['#2196F3', '#1E88E5', '#1976D2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonContent}>
                    <Icon 
                      name={saveSuccess ? "check" : "save"} 
                      size={24} 
                      color="#FFF" 
                    />
                    <Text style={styles.buttonText}>
                      {saveSuccess ? "Salvo!" : "Salvar"}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Modal>

      <Modal
        isVisible={isPrivacyModalVisible}
        onBackdropPress={() => setIsPrivacyModalVisible(false)}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#0098f9', '#00bcd4', '#2196f3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalHeaderTitle}>Política de Privacidade</Text>
            <TouchableOpacity 
              style={styles.closeIconButton}
              onPress={() => setIsPrivacyModalVisible(false)}
            >
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.modalBody}>
            <Text style={styles.policyText}>
              <Text style={styles.policyTitle}>1. Coleta de Dados{'\n'}</Text>
              Coletamos apenas os dados necessários para o funcionamento do aplicativo, incluindo:{'\n\n'}
              • Informações do seu negócio (nome, NIF, email){'\n'}
              • Dados de produtos e estoque{'\n'}
              • Histórico de vendas{'\n'}
              • Métricas de desempenho{'\n\n'}

              <Text style={styles.policyTitle}>2. Armazenamento{'\n'}</Text>
              • Todos os dados são armazenados localmente no seu dispositivo{'\n'}
              • Não utilizamos servidores externos{'\n'}
              • Você tem controle total sobre seus dados{'\n\n'}

              <Text style={styles.policyTitle}>3. Uso dos Dados{'\n'}</Text>
              Os dados são utilizados exclusivamente para:{'\n\n'}
              • Gerenciar seu estoque{'\n'}
              • Processar vendas{'\n'}
              • Gerar relatórios{'\n'}
              • Calcular métricas de desempenho{'\n\n'}

              <Text style={styles.policyTitle}>4. Compartilhamento{'\n'}</Text>
              • Não compartilhamos seus dados com terceiros{'\n'}
              • Não coletamos dados para marketing{'\n'}
              • Não vendemos informações dos usuários{'\n\n'}

              <Text style={styles.policyTitle}>5. Seus Direitos{'\n'}</Text>
              Você tem o direito de:{'\n\n'}
              • Acessar todos os seus dados{'\n'}
              • Exportar suas informações{'\n'}
              • Excluir todos os dados{'\n'}
              • Fazer backup dos dados
            </Text>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        isVisible={isTermsModalVisible}
        onBackdropPress={() => setIsTermsModalVisible(false)}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#0098f9', '#00bcd4', '#2196f3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalHeaderTitle}>Termos de Uso</Text>
            <TouchableOpacity 
              style={styles.closeIconButton}
              onPress={() => setIsTermsModalVisible(false)}
            >
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.modalBody}>
            <Text style={styles.policyText}>
              <Text style={styles.policyTitle}>1. Uso do Aplicativo{'\n'}</Text>
              Ao utilizar nosso aplicativo, você concorda em:{'\n\n'}
              • Usar o aplicativo apenas para fins legais{'\n'}
              • Fornecer informações verdadeiras{'\n'}
              • Não usar o aplicativo para atividades fraudulentas{'\n'}
              • Respeitar as leis locais de comércio{'\n\n'}

              <Text style={styles.policyTitle}>2. Responsabilidades do Usuário{'\n'}</Text>
              Você é responsável por:{'\n\n'}
              • Manter a segurança de seus dados{'\n'}
              • Fazer backups regulares{'\n'}
              • Manter suas informações atualizadas{'\n'}
              • Proteger suas credenciais de acesso{'\n\n'}

              <Text style={styles.policyTitle}>3. Limitações{'\n'}</Text>
              O aplicativo é fornecido "como está", com as seguintes condições:{'\n\n'}
              • Não garantimos disponibilidade 100% do tempo{'\n'}
              • Podem ocorrer erros ou interrupções{'\n'}
              • Atualizações podem modificar funcionalidades{'\n'}
              • Recursos podem ser alterados ou removidos{'\n\n'}

              <Text style={styles.policyTitle}>4. Propriedade Intelectual{'\n'}</Text>
              • O aplicativo e seu conteúdo são protegidos por direitos autorais{'\n'}
              • Não é permitida a cópia ou modificação do aplicativo{'\n'}
              • A marca e logo são propriedade exclusiva{'\n\n'}

              <Text style={styles.policyTitle}>5. Alterações nos Termos{'\n'}</Text>
              • Podemos alterar estes termos a qualquer momento{'\n'}
              • Mudanças significativas serão notificadas{'\n'}
              • O uso contínuo implica aceitação dos novos termos
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5252',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  aboutLabel: {
    fontSize: 16,
    color: '#333',
  },
  aboutValue: {
    fontSize: 16,
    color: '#666',
  },
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
  },
  modalHeader: {
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  closeIconButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  imageUploadPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  policyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    lineHeight: 36,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageUpload: {
    height: 100,
    width: 100,
    alignSelf: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 50,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageUploadText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SettingsScreen; 