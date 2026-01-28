import { startGame, GameInstance } from '../game/bootstrap';
import { gameState } from '@/game/config';
import { getForcedMode, getForcedTournamentId } from '@/state/gameMode';
import { api } from '@/api/client';
import { showAnnouncementModal, showTournamentWinnersModal } from '@/views/AnnouncementView';
import type { TournamentNextOrWinners } from '@/api/types';

let gameInstance: GameInstance | null = null;

async function handleTournamentMatchEnd(matchId: number, scoreP1: number, scoreP2: number) {
  console.log('handleTournamentMatchEnd called with matchId:', matchId, 'score:', scoreP1, ':', scoreP2);
  const tournamentId = getForcedTournamentId();
  if (!tournamentId) {
    console.error('No tournament ID in tournament mode');
    return;
  }

  try {
    // Submit the match result
    console.log('Submitting match result to backend...');
    await api.submitMatchResult(matchId, scoreP1, scoreP2);
    console.log('Match result submitted successfully, calling next endpoint');

    // Call next endpoint to get next match or winners
    const nextOrWinners = await api.getTournamentNextMatch(tournamentId);
    console.log('Next endpoint result:', nextOrWinners);

    if (nextOrWinners.completed && nextOrWinners.winners) {
      // Tournament finished - show winners modal
      const winnersWithAlias = nextOrWinners.winners
        .filter(w => w.alias !== null)
        .map(w => ({ place: w.place, alias: w.alias! }));
      showTournamentWinnersModal(winnersWithAlias);
    } else if (nextOrWinners.nextMatch) {
      // Show announcement for next match
      const p1 = nextOrWinners.nextMatch.player1?.alias || 'PLAYER 1';
      const p2 = nextOrWinners.nextMatch.player2?.alias || 'PLAYER 2';
      showAnnouncementModal({
        player1: p1,
        player2: p2,
        onStart: () => {
          // Restart the game with the new match
          const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
          if (canvas && gameInstance) {
            gameInstance.dispose();
            gameInstance = null;
          }
          startGame(canvas, 'tournament', nextOrWinners.nextMatch);
        }
      });
    }
  } catch (err) {
    console.error('Error handling tournament match end:', err);
    // Fallback: go back to tournament view
    window.location.hash = '#/tournaments';
  }
}

export function GameView(): string {
  return `
    <div class="game-container" style="width: 100vw; height: 100vh; margin: 0; padding: 0; overflow: hidden;">
      <canvas id="renderCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
    </div>
  `;
}

export function initGameHandlers(): void {
  // Use requestAnimationFrame to ensure canvas is in DOM after innerHTML is set
  requestAnimationFrame( async() => {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas not found!');
      return;
    }

    if (gameInstance) {
      gameInstance.dispose();
      gameInstance = null;
    }
    const mode = getForcedMode();
    //console.log("initGameHandlers mode: ", mode);
    let nextMatch = null;
    let nextOrWinners = null;
    if (mode === 'tournament') {
      const tournamentId = getForcedTournamentId();
      if (!tournamentId) {
        console.error("Tournament mode selected but no tournamentId found!");
      } else {
        try {
          nextOrWinners = await api.getTournamentNextMatch(tournamentId);
          console.log("Loaded tournament next or winners:", nextOrWinners);
          nextMatch = nextOrWinners.nextMatch;
        } catch (err) {
          console.error("Failed to load tournament match", err);
        }
      }
    }

    gameInstance = await startGame(canvas, mode, nextOrWinners, handleTournamentMatchEnd);
    console.log('Game started with tournament match end callback');
  });
}

export function cleanupGame(): void {
  if (gameInstance) {
    if (gameState.pauseMenu) {
      gameState.pauseMenu = null;
    }
    if (gameState.isPaused) {
      gameState.isPaused = false;
    }
    gameInstance.dispose();
    gameInstance = null;
  }
}