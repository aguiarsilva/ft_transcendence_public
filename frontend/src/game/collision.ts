/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   collision.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/31 16:34:45 by anilchen          #+#    #+#             */
/*   Updated: 2025/12/10 15:07:58 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as BABYLON from "@babylonjs/core";
import { GameContext } from "./config";

let flashTimeout: number | null = null;

/**
 * Briefly flashes the ball with a blue color to indicate an event
 * (for example, collision or goal). Uses a short timeout to restore
 * the original emissive color.
 *
 * @param ball - The Babylon.js mesh representing the ball.
 * @param scene - The active Babylon.js scene (not directly used here, but may be needed for future effects).
 */
function flashBall(ball: BABYLON.Mesh, scene: BABYLON.Scene) {
    // Get the ball's material and remember its original emissive color
    const mat = ball.material as BABYLON.StandardMaterial;
    const originalColor = mat.emissiveColor.clone();

    // --- Debounce: prevent overlapping flashes ---
    // If a flash is already in progress, exit early
    if (flashTimeout) return;

    // Change the emissive color to blue for a short visual flash
    mat.emissiveColor = new BABYLON.Color3(0, 0, 1);

    // Schedule color restoration after 80 milliseconds
    flashTimeout = setTimeout(() => {
        mat.emissiveColor = originalColor; // Restore original color
        flashTimeout = null;               // Clear flag so new flashes are allowed
    }, 80);
}


/**
 * Checks intersection with players and walls.
 */
function detectCollisions(
    ray: BABYLON.Ray,
    ctx: GameContext
) {
    return {
        player1: ray.intersectsMesh(ctx.player1, true),
        player2: ray.intersectsMesh(ctx.player2, true),
        top: ray.intersectsMesh(ctx.topwall, true),
        bottom: ray.intersectsMesh(ctx.bottomwall, true),
    };
}

/**
 * Handles ball collision with top/bottom walls.
 */
function handleWallCollision(
    hits: ReturnType<typeof detectCollisions>,
    ball: BABYLON.Mesh,
    scene: BABYLON.Scene,
    newDirection: BABYLON.Vector3,
    normals: BABYLON.Vector3[]
) {
    if (hits.top.hit || hits.bottom.hit) {
        flashBall(ball, scene);
        newDirection.z *= -1; // Reverse vertical direction
        normals.push(new BABYLON.Vector3(0, 0, hits.top.hit ? -1 : 1));
    }
}

/**
 * Handles collision with player paddles and computes bounce angle.
 */
function handlePlayerCollision(
    hits: ReturnType<typeof detectCollisions>,
    ctx: GameContext,
    newDirection: BABYLON.Vector3,
    normals: BABYLON.Vector3[]
) {
    let collidedWith: BABYLON.AbstractMesh | null = null;

    // Determine which player was hit (nearest intersection)
    if (hits.player1.hit && (!hits.player2.hit || hits.player1.distance <= (hits.player2.distance ?? Infinity))) {
        flashBall(ctx.ball, ctx.scene);
        collidedWith = ctx.player1;
    } else if (hits.player2.hit) {
        flashBall(ctx.ball, ctx.scene);
        collidedWith = ctx.player2;
    }

    // If no player hit, exit early
    if (!collidedWith) return;

    const isPlayer1 = collidedWith === ctx.player1;
    const speed = newDirection.length();

    // Compute relative hit position (to add angle variation)
    const relativeIntersectZ = (ctx.ball.position.z - collidedWith.position.z) / (collidedWith.scaling.z / 2);
    const clampedZ = Math.max(-1, Math.min(1, relativeIntersectZ));
    const MAX_BOUNCE_ANGLE = Math.PI / 4;
    const bounceAngle = clampedZ * MAX_BOUNCE_ANGLE;

    const newDirX = isPlayer1 ? -1 : 1;
    const newDirZ = Math.sin(bounceAngle);

    // Apply new reflection direction with same speed
    newDirection.copyFrom(
        new BABYLON.Vector3(newDirX, 0, newDirZ).normalize().scaleInPlace(speed)
    );

    normals.push(new BABYLON.Vector3(isPlayer1 ? -1 : 1, 0, 0));
}

/**
 * Smoothly pushes the ball out of collision overlap using Lerp interpolation.
 */
function applySmoothPushOut(
    hits: ReturnType<typeof detectCollisions>,
    ball: BABYLON.Mesh,
    normals: BABYLON.Vector3[],
    newDirection: BABYLON.Vector3,
    radius: number
) {
    if (normals.length === 1 && (hits.top.hit || hits.bottom.hit)) {
        // Simple wall collision → push softly on Z axis
        const targetZ = ball.position.z + Math.sign(newDirection.z) * (radius + 0.05);
        ball.position.z = BABYLON.Scalar.Lerp(ball.position.z, targetZ, 0.4); // 0.4 = smoothness
    } else {
        // Combined collision (e.g. wall + player)
        const avgNormal = normals.reduce((acc, n) => acc.addInPlace(n), BABYLON.Vector3.Zero()).normalize();
        const pushTarget = ball.position.add(avgNormal.scale(radius + 0.05));
        ball.position = BABYLON.Vector3.Lerp(ball.position, pushTarget, 0.5);
    }
}

/**
 * Handles all ball collisions in a single step:
 * - Detects intersections with players and walls
 * - Calculates new movement direction
 * - Smoothly pushes the ball out of overlap
 * - Prevents double-triggering with a short cooldown
 */
export function handleCombinedCollision(
    ctx: GameContext,
    direction: BABYLON.Vector3,
    lastCollisionTimeRef: { value: number },
    prevPosRef: { value: BABYLON.Vector3 },
): BABYLON.Vector3 {

    const now = Date.now();

    // --- STEP 1: Compute ball movement vector since last frame ---
    const move = ctx.ball.position.subtract(prevPosRef.value);
    const moveLen = move.length();
    if (moveLen < 1e-6) return direction; // No movement → nothing to do

    const radius = ctx.ball.getBoundingInfo().boundingSphere.radiusWorld; //radius of ball
    const ray = new BABYLON.Ray(prevPosRef.value, move.normalize(), moveLen + radius);
    // prevPosRef.value The starting point of the ray—where the ball was in the previous 
    // frame.
    // move.normalize() The direction—where the ball was moving (the motion vector, 
    // normalized to a length of 1).
    // moveLen + radius The length of the ray—the distance traveled, moveLen, 
    // plus the radius of the ball (to take into account its volume, not just the center).

    // --- STEP 2: Detect collisions with all relevant meshes ---
    const hits = detectCollisions(ray, ctx);

    // --- STEP 3: Prevent duplicate collision triggers (cooldown) ---
    const baseCooldown = 40; // in ms
    if (now - lastCollisionTimeRef.value < baseCooldown) {
        prevPosRef.value.copyFrom(ctx.ball.position);
        return direction;
    }

    // --- STEP 4: Handle collision response ---
    let newDirection = direction.clone();
    const normals: BABYLON.Vector3[] = [];

    // 4a. Wall collision
    handleWallCollision(hits, ctx.ball, ctx.scene, newDirection, normals);

    // 4b. Player collision
    handlePlayerCollision(hits, ctx, newDirection, normals);

    // --- STEP 5: If no collision occurred, just update previous position ---
    if (normals.length === 0) {
        prevPosRef.value.copyFrom(ctx.ball.position);
        return newDirection;
    }

    // --- STEP 6: Smooth position correction (push-out) ---
    applySmoothPushOut(hits, ctx.ball, normals, newDirection, radius);

    // --- STEP 7: Update state references ---
    lastCollisionTimeRef.value = now;
    prevPosRef.value.copyFrom(ctx.ball.position);

    return newDirection;
}