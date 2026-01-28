/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   mainAI.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/02 13:19:51 by anilchen          #+#    #+#             */
/*   Updated: 2025/12/17 13:06:46 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as BABYLON from "@babylonjs/core";
import { AIConfig } from "./AIconfig";
import { GameContext } from "../config";

// --- Internal AI state (persistent between frames) ---
let fakeTargetZ = 0;
let holdFrames = 0;
let lastBallX = 0;
let lastBallZ = 0;
let panicActive = false;
let smoothedOffset = 0;
let lastVelocityX = 0;

/**
 * Main AI controller for the right paddle (player2).
 * Predicts ball trajectory, applies reaction delay, panic behavior,
 * and smooth motion for a realistic opponent.
 */
export function callAI(
  ctx: GameContext,
  ballSpeed: number,
  config: AIConfig
): void {
  const paddleX = ctx.player2.position.x;
  const playableMinZ = -4;
  const playableMaxZ = 4;
  const wallMinZ = -4.9;
  const wallMaxZ = 4.9;

  // --- Step 1: Compute ball velocity and detect direction changes ---
  const { velocityX, velocityZ, velocityXFlipped } = computeBallVelocity(ctx.ball);

  // --- Step 2: Determine if ball is approaching and manage panic state ---
  const { isApproaching, isPanic } = updatePanicState(ctx.ball, paddleX, velocityX, config);

  // --- Step 3: Predict where the ball will hit the paddle line (Z coordinate) ---
  let predictedZ = isApproaching
    ? predictImpactPosition(ctx.ball, paddleX, velocityX, velocityZ, wallMinZ, wallMaxZ)
    : ctx.ball.position.z;

  // --- Step 4: Update AI target based on panic, offsets, and holdFrames ---
  if (isApproaching) {
    updateTarget(predictedZ, ballSpeed, config, isPanic);
  } else {
    relaxWhenBallIsAway(velocityXFlipped);
  }

  // --- Step 5: Move paddle smoothly toward the current target ---
  movePaddle(ctx.player2, fakeTargetZ, ballSpeed, config, isPanic, playableMinZ, playableMaxZ);

  // --- Step 6: Store last values for next frame ---
  lastBallX = ctx.ball.position.x;
  lastBallZ = ctx.ball.position.z;
  lastVelocityX = velocityX;
}

/* -------------------------------------------------------------------------- */
/*                             Helper Subfunctions                            */
/* -------------------------------------------------------------------------- */

/** Estimates current ball velocity and detects X-direction flips. */
function computeBallVelocity(ball: BABYLON.Mesh) {
  const deltaX = ball.position.x - lastBallX;
  const deltaZ = ball.position.z - lastBallZ;
  const velocityX = Math.abs(deltaX) < 0.01 ? Math.sign(deltaX) * 0.01 : deltaX;
  const velocityZ = deltaZ;
  const velocityXFlipped = Math.sign(velocityX) !== Math.sign(lastVelocityX) && velocityX > 0;
  return { velocityX, velocityZ, velocityXFlipped };
}

/** Determines if the ball is approaching the AI paddle and updates panic state. */
function updatePanicState(
  ball: BABYLON.Mesh,
  paddleX: number,
  velocityX: number,
  config: AIConfig
) {
  const reactionPoint = 0; // Delay reaction until ball passes this x
  const ballApproaching = ball.position.x < paddleX && velocityX < 0 && ball.position.x < reactionPoint;

  const distToPaddle = paddleX - ball.position.x;
  const hysteresis = config.panicHysteresis ?? 0;
  const enterThresh = config.reactionThreshold;
  const exitThresh = enterThresh + hysteresis;

  if (ballApproaching) {
    if (distToPaddle < enterThresh) panicActive = true;
    else if (distToPaddle > exitThresh) panicActive = false;
  } else {
    panicActive = false;
  }

  return { isApproaching: ballApproaching, isPanic: panicActive };
}

/** Predicts the future Z position where the ball will reach the paddle line. */
function predictImpactPosition(
  ball: BABYLON.Mesh,
  paddleX: number,
  velocityX: number,
  velocityZ: number,
  wallMinZ: number,
  wallMaxZ: number
): number {
  const distX = Math.abs(paddleX - ball.position.x);

  // --- 1. If the ball is far away — don't predict precisely, stay closer to center ---
  if (distX > 2.5) {
    // Move slightly toward the center, loosely following ball direction
    return BABYLON.Scalar.Lerp(ball.position.z, 0, 0.2);
  }

  // --- 2. When the ball is closer — simulate wall bounces ---
  const timeToImpact = (paddleX - ball.position.x) / velocityX;
  let simTime = timeToImpact;
  let simZ = ball.position.z;
  let simVz = velocityZ;

  const maxBounces = 3;
  for (let b = 0; b < maxBounces && simTime > 0; b++) {
    const dtToWall = simVz < 0 ? (wallMinZ - simZ) / simVz : (wallMaxZ - simZ) / simVz;
    if (dtToWall > 0 && dtToWall < simTime) {
      simTime -= dtToWall;
      simZ += simVz * dtToWall;
      simZ = simVz < 0 ? 2 * wallMinZ - simZ : 2 * wallMaxZ - simZ;
      simVz = -simVz;
    } else {
      simZ += simVz * simTime;
      break;
    }
  }

  // --- 3. If prediction jumps too sharply — smooth it out ---
  if (Math.abs(simZ - ball.position.z) > 2) {
    simZ = BABYLON.Scalar.Lerp(ball.position.z, simZ, 0.3);
  }

  return simZ;
}

/** Updates the AI's target position based on prediction and current state. */
function updateTarget(predictedZ: number, ballSpeed: number, config: AIConfig, isPanic: boolean) {
  const playableMinZ = -4;
  const playableMaxZ = 4;

  const shouldUpdateTarget = isPanic || holdFrames <= 0;
  if (!shouldUpdateTarget) {
    holdFrames--;
    return;
  }

  // Add slight “human” inaccuracy when not in panic
  let targetOffset = 0;
  if (!isPanic) {
    const newOffset = (Math.random() - 0.5) * config.offsetRange * 0.7;
    smoothedOffset += (newOffset - smoothedOffset) * 0.3;
    targetOffset = smoothedOffset;
  }

  // --- 1. Smoothly update the target to prevent jitter ---
  const targetBeforeClamp = predictedZ + targetOffset;
  const smoothedTarget = BABYLON.Scalar.Lerp(fakeTargetZ, targetBeforeClamp, isPanic ? 0.6 : 0.8);

  // --- 2. Clamp within the playable zone ---
  const zoneMin = Math.max(playableMinZ, predictedZ - config.focusZone);
  const zoneMax = Math.min(playableMaxZ, predictedZ + config.focusZone);
  fakeTargetZ = Math.max(zoneMin, Math.min(zoneMax, smoothedTarget));

  // --- 3. Adaptive delay before next target recalculation ---
  const adaptiveHoldMin = Math.max(1, config.holdFramesMin * (1 - ballSpeed / 3));
  holdFrames = Math.floor(adaptiveHoldMin + Math.random() * (config.holdFramesMax - adaptiveHoldMin));

  if (isPanic) holdFrames = 0;
}


/** When ball is moving away, paddle gradually relaxes back to center. */
function relaxWhenBallIsAway(velocityXFlipped: boolean) {
  if (Math.abs(fakeTargetZ) > 0.1) fakeTargetZ *= 0.98;
  if (velocityXFlipped) {
    fakeTargetZ = 0;
    holdFrames = 0;
    panicActive = false;
  }
}


/** Smooth AI paddle movement with acceleration and deceleration control. */
function movePaddle(
  player2: BABYLON.AbstractMesh,
  targetZ: number,
  ballSpeed: number,
  config: AIConfig,
  isPanic: boolean,
  playableMinZ: number,
  playableMaxZ: number
) {
  const mesh = player2 as any; // safe type override
  const clampedTargetZ = Math.max(playableMinZ, Math.min(playableMaxZ, targetZ));
  const diff = clampedTargetZ - player2.position.z;
  const absDiff = Math.abs(diff);
  const direction = Math.sign(diff);

  // --- 1. Calculate desired speed (depends on distance and ball speed) ---
  let desiredSpeed = config.baseSpeed + ballSpeed * 0.15;
  if (absDiff < 1.0) desiredSpeed *= absDiff; // slows down when close to the target

  // --- 2. Panic mode: reacts slightly faster, but without jerky motion ---
  if (isPanic) desiredSpeed *= 1.15;

  // --- 3. Define maximum acceleration ---
  const maxAccel = 0.02 + ballSpeed * 0.02;
  const targetVelocity = direction * Math.min(desiredSpeed, config.maxStep);

  // --- 4. Initialize and smoothly update current velocity ---
  if (mesh.aiVelocityZ === undefined) mesh.aiVelocityZ = 0;
  let currentVel = mesh.aiVelocityZ as number;

  // Gradually approach the target velocity (smooth acceleration)
  currentVel += Math.max(-maxAccel, Math.min(maxAccel, targetVelocity - currentVel));

  // --- 5. Slow down if almost at target position ---
  if (absDiff < 0.03 && Math.abs(currentVel) < 0.02) {
    currentVel = 0;
  }

  // --- 6. Apply movement and clamp position within playable bounds ---
  player2.position.z = Math.max(
    playableMinZ,
    Math.min(playableMaxZ, player2.position.z + currentVel)
  );

  // --- 7. Store velocity for the next frame ---
  mesh.aiVelocityZ = currentVel;
}
