import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default function CheckinsTab() {
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.text}>Check-ins will appear here.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16 },
});


