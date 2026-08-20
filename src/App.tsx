import React, { useState } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraScreen } from './screens/CameraScreen';
import { RankedMatch } from './screens/RankedMatchScreen';
import { ExerciseType, Player } from './types/exercise';
import { useKeepAwake } from 'expo-keep-awake';

export default function App() {
  const [exerciseType, setExerciseType] = useState('ranked');
  const [showStartScreen, setShowStartScreen] = useState(true);
  const players = [
    { id: '1', name: 'Player 1', avatar: 'avatar1', elo: 1247, rank: 'Silver', badge: 'Badge1' },
    { id: '2', name: 'Player 2', avatar: 'avatar2', elo: 4024, rank: 'Grandmaster', badge: 'Badge2' },
  ];

  const startMode = (mode: 'pushup' | 'ranked') => {
    setShowStartScreen(false);
    setExerciseType(mode);
  };

  return (
    <>
      {showStartScreen && (
        <View style={styles.startContainer}>
          <View style={styles.startBox}>
            <Text style={styles.startText}>PUSHUP COUNTER</Text>
            <Text style={styles.startSub}>Count your own reps</Text>
            <TouchableOpacity onPress={() => startMode('pushup')} style={styles.startButton}>
              <Text style={styles.buttonText}>Start Solo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.startBox} style={{ marginTop: 20 }}>
            <Text style={styles.startText}>RANKED MATCH</Text>
            <Text style={styles.startSub}>1vs1 Competition</Text>
            <TouchableOpacity onPress={() => startMode('ranked')} style={styles.startButton}>
              <Text style={styles.buttonText}>Start Match</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {!showStartScreen && (
        <>
          <StatusBar style="light" backgroundColor="#000" />
          {exerciseType === 'ranked' && (
            <RankedMatch player1={players[0]} player2={players[1]} />
          )}
          {!exerciseType === 'ranked' && (
            <CameraScreen exerciseType={exerciseType} onExerciseChange={setExerciseType} />
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  startContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBox: {
    backgroundColor: '#2a2a3e',
    padding: 30,
    borderRadius: 15,
    marginHorizontal: 20,
    width: '80%',
  },
  startText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 10,
  },
  startSub: {
    color: '#888',
    fontSize: 12,
    marginBottom: 20,
  },
  startButton: {
    padding: 15,
    backgroundColor: '#e91e63',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});