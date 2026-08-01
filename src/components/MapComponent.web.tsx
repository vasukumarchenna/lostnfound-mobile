import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapComponent(props: any) {
  return (
    <View style={[props.style, styles.container]}>
      <Text style={styles.text}>Map view not available on web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  text: {
    color: '#94a3b8',
  },
});
