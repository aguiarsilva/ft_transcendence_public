/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ball.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/24 15:40:26 by anilchen          #+#    #+#             */
/*   Updated: 2026/01/02 14:58:30 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as BABYLON from "@babylonjs/core";
//import * as GUI from "babylonjs-gui";
import { showWinner, createScoreUI, createPauseMenu } from "./UI";
import { handleGoal, resetBall } from "./score";
import { handleCombinedCollision } from "./collision";
import { callAI } from "./AI/mainAI";
import type { GameContext } from "./config";
//import { session } from '@/state/session';
import { gameState } from "./config";
import { pauseService } from "./pause";

/**
 * Generates a random initial direction vector for the ball.
 * 
 * Alternates the horizontal (X) direction every two calls to keep gameplay balanced.
 */
export const getRandomDirection = (() => {
  let cur = 1;   // Current horizontal side: 1 = right, 2 = left
  let count = 0; // Counts how many times the same side was used

  // --- The actual function that gets exported ---
  return function (speed: number): BABYLON.Vector3 {
    // Determine horizontal direction based on the current state
    const directionX = cur === 1 ? 1 : -1;

    // Create a direction vector with small random variation on the Z axis
    const vec = new BABYLON.Vector3(
      directionX * speed * 0.8,                    // X → left/right
      0,                                           // Y → no vertical motion
      speed * 0.8 * (Math.random() < 0.5 ? -1 : 1) // Z → random forward/backward
    );

    // Update internal counters to alternate sides every two serves
    count++;
    if (count >= 2) {
      cur = cur === 1 ? 2 : 1; // Flip the side
      count = 0;
    }

    // Return the computed direction vector
    return vec;
  };
})();

/**
 * Initializes the main ball movement loop.
 * Handles:
 * - ball motion per frame
 * - wall and paddle collisions
 * - AI control if enabled
 * - goal scoring and win conditions
 * - game restart on victory
 *
 * @param ball - The Babylon.js mesh representing the ball.
 * @param scene - The active Babylon.js scene.
 * @param topwall - The top wall mesh.
 * @param bottomwall - The bottom wall mesh.
 * @param player1 - The left paddle mesh.
 * @param player2 - The right paddle mesh (or AI-controlled).
 * @param speed - Object holding current ball speed (mutable).
 * @param useAI - Whether AI controls player2.
 * @param config - Game configuration (speed, AI difficulty, etc.).
 * @param ui - GUI texture for displaying UI elements.
 * @param gameState - Holds pause state.
 */
export function initBallMovement(
  ctx: GameContext,
  //gameState: { isPaused: boolean }
): void {

  // --- Helper variables ---
  let prevPosRef: { value: BABYLON.Vector3 }; // Ball position from previous frame
  //let score = { p1: 0, p2: 0 };               // Current score
  const maxScore = 10;                        // Points needed to win
  let lastCollisionTime = { value: 0 };       // Collision cooldown timer
  let direction = getRandomDirection(ctx.speed.value); // Initial ball direction
  let winner: string;
  const scoreText = createScoreUI(ctx); // On-screen score display
  //console.log(speed.value);
  /**
   * Checks if any player reached the winning score.
   * If so, stops the loop and shows the winner screen.
   */
  function checkWinCondition(observer:
    BABYLON.Nullable<BABYLON.Observer<BABYLON.Scene>>
  ): void {
    if (ctx.score.p1 >= maxScore || ctx.score.p2 >= maxScore) {

      // Stop the main render loop observer
      ctx.scene.onBeforeRenderObservable.remove(observer);

      // Remove score UI
      ctx.ui.removeControl(scoreText);

      // Determine winner
      if (ctx.score.p1 > ctx.score.p2) {
        winner = ctx.match.p1_username ?? "Player 1";
      } else {
        winner = ctx.match.p2_username;
      }

      // Handle tournament match end
      if (ctx.mode === 'tournament' && ctx.onTournamentMatchEnd) {
        console.log('Tournament match ended, calling callback with matchId:', ctx.match.matchId, 'score:', score.p1, ':', score.p2);
        // Call the tournament match end callback
        ctx.onTournamentMatchEnd(ctx.match.matchId, ctx.score.p1, ctx.score.p2);
      } else {
        // Show winner screen and restart on button press for non-tournament modes
        showWinner(ctx, ctx.score, winner, () => {
          ctx.score.p1 = 0;
          ctx.score.p2 = 0;
          ctx.speed.value = ctx.defaultSpeed.value;
          //gameState.pauseMenu = createPauseMenu(ctx);
          pauseService(ctx);
          gameState.isPaused = false;
          console.log('Restart clicked, pauseMenu reset to null');
          console.log(ctx.speed.value);
          resetBall(ctx.ball, ctx.speed.value);

          // Restart game from scratch
          initBallMovement(ctx);//, gameState);
        });
      }
    }
  }

  // === MAIN GAME LOOP ===
  const observer = ctx.scene.onBeforeRenderObservable.add(() => {

    // --- Pause check ---
    if (gameState.isPaused) {
      return; // Skip frame while paused
    }

    // --- Save previous position ---
    prevPosRef = { value: ctx.ball.position.clone() };

    // --- Move the ball ---
    ctx.ball.position.addInPlace(direction);

    // --- Update AI if active ---
    if (ctx.mode === "ai" && ctx.aiSettings) {
      callAI(ctx, ctx.speed.value, ctx.aiSettings);
    }

    // --- Handle collisions (walls and paddles) ---
    direction = handleCombinedCollision(
      ctx,
      direction,
      lastCollisionTime,
      prevPosRef,
    );

    // --- Check for goals ---
    const newDir = handleGoal(ctx, ctx.score, scoreText, direction);
    if (newDir) {
      direction = newDir; // Reset ball and update direction/speed
    }

    // --- Check for win condition ---
    checkWinCondition(observer);
  });
}
