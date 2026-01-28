/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pause.ts                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/12/16 14:18:51 by anilchen          #+#    #+#             */
/*   Updated: 2026/01/02 13:22:41 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { createPauseMenu } from "./UI";
import { GameContext, gameState } from "./config";

let escListener: ((e: KeyboardEvent) => void) | null = null;

export async function pauseService(
    ctx: GameContext
): Promise<void> {
    gameState.pauseMenu = await createPauseMenu(ctx);
    console.log("Pause menu created:", gameState.pauseMenu);
    // Toggle pause menu visibility when Escape is pressed
    // Remove old listener if exists
    if (escListener) {
        window.removeEventListener("keydown", escListener);
    }
    // pause menu visibility when browser is hidden by user
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (!gameState.isPaused && gameState.pauseMenu) {
                gameState.isPaused = true;
                gameState.pauseMenu.show();
            }
        }
    });
    // pause menu visibility when browser tab was changed by user
    window.addEventListener("blur", () => {
        if (!gameState.isPaused && gameState.pauseMenu) {
            gameState.isPaused = true;
            gameState.pauseMenu.show();
        }
    });
    // Create new listener
    escListener = (e: KeyboardEvent) => {
        if (e.key === "Escape" || e.key === " ") {
            console.log("Pause key pressed:", e.key, "current pauseMenu:", gameState.pauseMenu);

            gameState.isPaused = !gameState.isPaused;
            if (gameState.isPaused) {
                gameState.pauseMenu!.show();
            } else {
                gameState.pauseMenu!.hide();
            }
        }
    };
    // Register new ESC listener
    window.addEventListener("keydown", escListener);
}