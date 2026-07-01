import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ErrorTest() {
  // Intentionally crash on render to test the layout's ErrorBoundary
  useEffect(() => {
    console.log("Simulating a Javascript crash on error-test route...");
  }, []);

  if (Math.random() >= 0) {
    throw new Error("This is a simulated layout crash to test the ErrorBoundary!");
  }

  return (
    <View style={styles.container}>
      <Text>Simulated Crash Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
