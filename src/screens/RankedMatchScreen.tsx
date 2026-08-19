import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Player, MatchState, ELOAdjustment } from '@/types/ranked';
import { PlayerProfile } from '@/components/PlayerProfile';
import { MatchTimer } from '@/components/MatchTimer';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { AdvantageBar } from '@/components/AdvantageBar';
import { calculateELOChange, applyELOAdjustment, determineRank, determineBadge } from '@/utils/eloUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RankedMatchProps {
  player1: Player;
  player2: Player;
  initialDuration?: number; // dalam detik, default 60
}

export const RankedMatch: React.FC<RankedMatchProps> = ({
  player1,
  player2,
  initialDuration = 60,
}) => {
  const [matchState, setMatchState] = useState<MatchState>({
    player1,
    player2,
    score1: 0,
    score2: 0,
    timer: initialDuration,
    duration: initialDuration,
    advantage: 'none',
    status: 'waiting',
  });

  const startMatch = useCallback(() => {
    setMatchState((prev) => ({
      ...prev,
      status: 'countdown',
    }));
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setMatchState((prev) => ({
      ...prev,
      status: 'active',
    }));
  }, []);

  const handlePoint = useCallback((player: 'p1' | 'p2') => {
    setMatchState((prev) => {
      let newScore1 = prev.score1;
      let newScore2 = prev.score2;

      if (player === 'p1') newScore1 += 1;
      else newScore2 += 1;

      // Update advantage
      let advantage: 'p1' | 'p2' | 'none' = 'none';
      if (newScore1 > newScore2) advantage = 'p1';
      else if (newScore2 > newScore1) advantage = 'p2';

      const newTimer = Math.max(0, prev.timer - 1);

      let newStatus = prev.status;
      if (newTimer <= 0) newStatus = 'finished';

      return {
        score1: newScore1,
        score2: newScore2,
        timer: newTimer,
        advantage,
        status: newStatus,
      };
    });
  }, []);

  const handleMatchFinish = useCallback(() => {
    setMatchState((prev) => {
      const adjustment = applyELOAdjustment(prev.player1, prev.player2);
      const newPlayer1 = {
        ...prev.player1,
        elo: adjustment.newWinnerELO,
        rank: determineRank(adjustment.newWinnerELO),
        badge: determineBadge(determineRank(adjustment.newWinnerELO)),
      };
      const newPlayer2 = {
        ...prev.player2,
        elo: adjustment.newLoserELO,
        rank: determineRank(adjustment.newLoserELO),
        badge: determineBadge(determineRank(adjustment.newLoserELO)),
      };

      return {
        ...prev,
        player1: newPlayer1,
        player2: newPlayer2,
        score1: 0,
        score2: 0,
        timer: prev.duration,
        advantage: 'none',
        status: 'waiting',
      };
    });
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.leftPanel}>
          <PlayerProfile player={matchState.player1} />
        </View>
        <View style={styles.rightPanel}>
          <PlayerProfile player={matchState.player2} />
        </View>
      </View>

      <View style={styles.matchArea}>
        <MatchTimer
          timer={matchState.timer}
          duration={matchState.duration}
          onTimeUp={handleMatchFinish}
        />

        <ScoreDisplay
          score1={matchState.score1}
          score2={matchState.score2}
          onReset={() => setMatchState((prev) => ({ ...prev, score1: 0, score2: 0 }))}
        />

        <AdvantageBar
          advantage={matchState.advantage}
          score1={matchState.score1}
          score2={matchState.score2}
        />
      </View>

      <View style={styles.controls}>
        {matchState.status === 'waiting' && (
          <TouchableOpacity style={styles.startButton} onPress={startMatch}>
            <Text style={styles.startButtonText}>MULAI PERANGAN</Text>
          </TouchableOpacity>
        )}

        {matchState.status === 'finished' && (
          <View style={styles.finishedContainer}>
            <Text style={styles.finishedText}>PERANGAN SELESAI</Text>
            <Text style={styles.finishedResult}>
              {matchState.score1 > matchState.score2 ? 'PLAYER KIRI MENANG!' : 'PLAYER KANAN MENANG!'}
            </Text>
            <TouchableOpacity style={styles.playAgainButton} onPress={handleMatchFinish}>
              <Text style={styles.playAgainText}>MAIN LAGI</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  leftPanel: {
    alignItems: 'flex-end',
    marginRight: 20,
  },
  rightPanel: {
    alignItems: 'flex-start',
    marginLeft: 20,
  },
  matchArea: {
    flex: 1,
    position: 'relative',
    padding: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  startButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finishedContainer: {
    padding: 30,
    textAlign: 'center',
    marginTop: 20,
  },
  finishedText: {
    fontSize: 20,
    color: '#e91e63',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  finishedResult: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  playAgainButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  playAgainText: {
    color: '#fff',
    fontSize: 14,
  },
});