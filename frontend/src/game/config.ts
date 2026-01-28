/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   config.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/13 16:13:58 by anilchen          #+#    #+#             */
/*   Updated: 2026/01/02 13:27:06 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as BABYLON from "@babylonjs/core";
import * as GUI from "babylonjs-gui";
import { AIConfig } from "./AI/AIconfig";
import { createPauseMenu } from "./UI";

type PauseMenu = {
  show: () => void;
  hide: () => void;
};


interface gameState {
    isPaused: boolean;
    pauseMenu: PauseMenu | null;
};

export const gameState: gameState = {
    isPaused: false,
    pauseMenu: null,
};


export interface GameContext {
    scene: BABYLON.Scene;
    engine: BABYLON.Engine;
    canvas: HTMLCanvasElement;

    // 3D objects
    ball: BABYLON.Mesh;
    table: BABYLON.AbstractMesh;
    player1: BABYLON.Mesh;
    player2: BABYLON.Mesh;
    topwall: BABYLON.Mesh;
    bottomwall: BABYLON.Mesh;

    // Camera
    camera: BABYLON.ArcRotateCamera;

    // UI
    ui: GUI.AdvancedDynamicTexture;
    scoreFrame?: GUI.Rectangle | null;

    // Gameplay
    mode: 'ai' | '1v1' | 'tournament';
    aiSettings: AIConfig | null;
    defaultSpeed: { value: number };
    speed: { value: number };
    tournamentId: number | null;
    onTournamentMatchEnd?: (matchId: number, scoreP1: number, scoreP2: number) => Promise<void>;
    
    match: {
        p1_username: string;
        p2_username: string;
        matchId: number;
    }

     score: {
        p1: number;
        p2: number;
    };
}


/**
 * Defines available game difficulty levels.
 * Each level affects the ball’s base movement speed.
 */
export const GAME_DIFFICULTY = {
    Easy: {
        ballSpeed: 0.09, // Slow ball movement
    },
    Medium: {
        ballSpeed: 0.1,  // Balanced speed
    },
    Hard: {
        ballSpeed: 0.13, // Fast and challenging
    },
} as const;

/**
 * Defines AI behavior parameters for each difficulty level.
 * These values control how quickly and accurately the AI paddle reacts.
 */
export const AI_DIFFICULTY: Record<string, AIConfig> = {
    Easy: {
        baseSpeed: 0.12,            // Very slow paddle movement
        reactionThreshold: 0.16,    // Reacts only when the ball is far
        offsetRange: 0.2,           // High inaccuracy (misses often)
        holdFramesMin: 6,           // Minimum delay before recalculating
        holdFramesMax: 12,          // Maximum delay before recalculating
        maxStep: 0.14,              // Maximum movement per frame
        smoothingFactor: 0.1,       // Movement smoothing
        focusZone: 1.2,             // Target area tolerance
        panicHysteresis: 0.2,       // Stability factor to reduce overreaction

    },
    Medium: {
        baseSpeed: 0.15,            // Fast paddle movement
        reactionThreshold: 0.1,     // Reacts quickly to nearby ball
        offsetRange: 0.1,          // High precision (almost no miss)
        holdFramesMin: 1,
        holdFramesMax: 3,
        maxStep: 0.28,
        smoothingFactor: 0.14,
        focusZone: 1.0,
        panicHysteresis: 0.1,


    },
    Hard: {
        baseSpeed: 0.17,            // Almost instantaneous reaction speed
        reactionThreshold: 0.07,    // Reacts in advance
        offsetRange: 0.05,          // Practically no misses
        holdFramesMin: 1,
        holdFramesMax: 2,
        maxStep: 0.32,              // Can move noticeably faster
        smoothingFactor: 0.16,      // Slightly sharper response
        focusZone: 0.85,            // Very precise targeting
        panicHysteresis: 0.08,      // Minimal hysteresis — reacts instantly


    }
};

/**
 * Combined configuration object passed to the game on start.
 * Contains ball speed, opponent type, and selected AI parameters.
 */
//export type GameConfig = {

    //mode: 'ai' | '1v1' | 'tournament'; // Game mode
    //ballSpeed: number;   // Ball movement speed
    //opponent: boolean;   // true = AI opponent, false = human player
    //aiSettings: AIConfig; // AI difficulty configuration
    //player2Name?: string | null;
//};
