/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   score.ts                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/24 15:52:20 by anilchen          #+#    #+#             */
/*   Updated: 2025/12/10 15:08:40 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as BABYLON from "@babylonjs/core";
import * as GUI from "babylonjs-gui";
import { getRandomDirection } from "./ball";
import { GameContext } from "./config";


/**
 * Resets the ball to the center position and assigns a new random direction.
 * @param ball - The Babylon.js mesh representing the ball.
 * @param speed - Current ball speed used to scale the new direction vector.
 * @returns A new normalized direction vector scaled by the given speed.
 */
export function resetBall(ball: BABYLON.Mesh, speed: number): BABYLON.Vector3 {
    // Move ball to the center of the field, slightly above ground level
    ball.position = new BABYLON.Vector3(0, 2, 0);
    // Return a new random direction vector with the given speed
    return getRandomDirection(speed);
}

/**
 * Handles goal detection and updates the game state accordingly.
 * - Increments the correct player’s score when the ball crosses a boundary.
 * - Updates the score text on screen.
 * - Slightly increases the ball’s speed after each goal.
 * - Resets the ball position and direction.
 *
 * @param ball - The Babylon.js mesh representing the ball.
 * @param score - Object storing player scores (p1 and p2).
 * @param scoreText - GUI text element displaying the current score.
 * @param speed - Object containing the current ball speed (mutable wrapper).
 * @param direction - Current ball direction vector (to be updated after reset).
 * @returns Updated direction vector for the ball after handling goals.
 */
export function handleGoal(
    ctx: GameContext,
    score: { p1: number; p2: number },
    scoreText: GUI.TextBlock,
    direction: BABYLON.Vector3
): BABYLON.Vector3 {
    const border = 12;

    // Ball passed right side → point for player 2
    if (ctx.ball.position.x > border) {
        score.p2++;
    }
    // Ball passed left side → point for player 1
    else if (ctx.ball.position.x < -border) {
        score.p1++;
    } 
    else {
        return direction; // No goal — nothing to change
    }

    // Common logic after any goal
    scoreText.text = `${score.p1} : ${score.p2}`;
    ctx.speed.value *= 1.035;
    return resetBall(ctx.ball, ctx.speed.value);
}
