/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   players.ts                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/24 16:50:54 by anilchen          #+#    #+#             */
/*   Updated: 2025/12/16 17:07:51 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as BABYLON from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core";
import { GameContext } from "./config";

/**
 * Asynchronously load player meshes for both sides.
 * - Loads two GLB files in parallel.
 * - Picks the mesh (non-root) for each player, positions and configures them.
 * - Adds them as shadow casters and enables collision/picking as needed.
 *
 * Returns a tuple [player1, player2] when resolved.
 */
export async function loadPlayers(
    ctx: GameContext,
    shadowGen: BABYLON.ShadowGenerator
): Promise<[BABYLON.Mesh, BABYLON.Mesh]> {
    // Load both player models concurrently for faster startup
    const [result1, result2] = await Promise.all([
        SceneLoader.ImportMeshAsync("", "/game/models/", "player1.glb", ctx.scene),
        SceneLoader.ImportMeshAsync("", "/game/models/", "player2.glb", ctx.scene),
    ]);
    // Pick the first non-root mesh from each loaded result (the actual visible mesh)
    const player1 = result2.meshes.find(m => m.name !== "__root__" && m instanceof BABYLON.Mesh) as BABYLON.Mesh;
    const player2 = result1.meshes.find(m => m.name !== "__root__" && m instanceof BABYLON.Mesh) as BABYLON.Mesh;

    if (!player1 || !player2) {
        throw new Error("ERROR: One of the meshes was not found.");
    }

    // Position players on opposite sides, set base height and orientation
    player1.position.set(-9.5, 2, 0);
    player2.position.set(9.5, 2, 0);
    player1.rotation = player2.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

    // Enable collision and picking for gameplay interactions
    player1.checkCollisions = true;
    player2.checkCollisions = true;
    player1.isPickable = true;
    player2.isPickable = true;

    // Have players cast shadows so they appear anchored in the scene
    shadowGen.addShadowCaster(player1);
    shadowGen.addShadowCaster(player2);
    // Return players in order expected by the rest of the code
    ctx.player1 = player1;
    ctx.player2 = player2;
    return [player1, player2];
}

/**
 * Wire up player controls and optional AI control for player2.
 *
 * - Executes inside the engine render loop to update positions each frame.
 * - Keyboard controls: W/S for left player, ArrowUp/ArrowDown for right player (when not using AI).
 * - Enforces Z bounds and a fixed step movement to keep movement deterministic.
 */
export function setupPlayerControls(
    inputMap: Record<string, boolean>,
    ctx: GameContext,
    mode: "ai" | "1v1" | "tournament",
) {
    // Allowed movement bounds (same as playable area used elsewhere)
    const minZ = -4;
    const maxZ = 4;
    const step = 0.14;
    // Register movement logic before each render frame
    ctx.scene.onBeforeRenderObservable.add(() => {
        // Player1 keyboard controls (W/S move up/down within bounds)
        if (inputMap["w"] && ctx.player1.position.z - step >= minZ) {
            ctx.player1.position.z -= step;
        }
        if (inputMap["s"] && ctx.player1.position.z + step <= maxZ) {
            ctx.player1.position.z += step;
        }
        // Player2 keyboard controls are applied only if AI is not enabled
        if (mode === "1v1" || mode === "tournament") {

            if (inputMap["ArrowUp"] && ctx.player2.position.z - step >= minZ) {
                ctx.player2.position.z -= step;
            }
            if (inputMap["ArrowDown"] && ctx.player2.position.z + step <= maxZ) {
                ctx.player2.position.z += step;
            }
        }
    });
}