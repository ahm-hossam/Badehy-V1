import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default function WorkoutTab() {
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.text}>No workouts assigned yet.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16 },
});


