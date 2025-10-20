import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default function NutritionTab() {
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.text}>Nutrition plan coming soon.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16 },
});


