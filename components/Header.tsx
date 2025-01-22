import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeaderProps {
  metrics: {
    totalProducts: number;
    totalOutflow: number;
    totalInflow: number;
  };
}

const Header: React.FC<HeaderProps> = ({ metrics }) => {
  return (
    <View style={styles.header}>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>Em Estoque</Text>
        <Text style={styles.metricValue}>{metrics.totalProducts}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>Saídas</Text>
        <Text style={styles.metricValue}>{metrics.totalOutflow}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#FFF',
    fontSize: 14,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Header; 