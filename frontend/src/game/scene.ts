/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   scene.ts                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/24 16:14:04 by anilchen          #+#    #+#             */
/*   Updated: 2026/01/02 13:23:32 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import * as GUI from "babylonjs-gui";
import * as BABYLON from "@babylonjs/core";
import { initBallMovement } from "./ball";
import { startCountdown, createGameMenu, createPauseMenu } from "./UI";
import { loadPlayers, setupPlayerControls } from "./players";
import { GameContext } from "./config";
import { pauseService } from "./pause"
import { session } from '@/state/session';
//import { api } from "@/api/client";
import { TournamentNextMatch } from "@/api/types";
import { getForcedTournamentId } from "@/state/gameMode";

async function setupTournamentContext(
    match: { id: number; p1: string; p2: string },
    wrapper: TournamentNextMatch
): Promise<void> {

    console.log("setupTournamentContext wrapper:", wrapper);

    const next = wrapper.nextMatch;
    if (!next) {
        console.error("No nextMatch found in wrapper!");
        match.id = 0;
        match.p1 = "Player 1";
        match.p2 = "Player 2";
        return;
    }

    match.id = next.id;
    console.log("match.id:", match.id);

    match.p1 = next.player1?.alias ?? "Player 1";
    console.log("match.p1:", match.p1);

    match.p2 = next.player2?.alias ?? "Player 2";
    console.log("match.p2:", match.p2);
}


export async function createEmptyContext(
    canvas: HTMLCanvasElement,
    scene: BABYLON.Scene,
    engine: BABYLON.Engine,
    mode: "ai" | "1v1" | "tournament",
    nextMatch: TournamentNextMatch,
    onTournamentMatchEnd?: (matchId: number, scoreP1: number, scoreP2: number) => Promise<void>
): Promise<GameContext> {
    // let p1 = "Player 1";
    // let p2 = "Player 2";

    let id: number | null = null
    let match = { id: 0, p1: "", p2: "" };

    if (mode === "ai") {
        match.p1 = session.user()?.username ?? "Player 1";
        match.p2 = "AI";
        match.id = 0;
    }
    else if (mode === "1v1") {
        match.p1 = session.user()?.username ?? "Player 1";
        match.p2 = ""; // user will type later
        match.id = 0;
    }
    else if (mode === "tournament") {
        //const match = { id: 0, p1: "", p2: "" };
        id = getForcedTournamentId();
        console.log("tournament id: ", id)
        console.log("loading setupTournamentContext()")
        //console.log("createEmptyContext nextMatch: ", nextMatch)
        await setupTournamentContext(match, nextMatch);
    }

    return {
        engine,
        scene,
        canvas,

        // 3D objects (will be assigned later)
        ball: null!,
        table: null!,
        player1: null!,
        player2: null!,
        topwall: null!,
        bottomwall: null!,

        camera: null!,
        ui: null!,

        // Gameplay
        mode,
        aiSettings: null,   // later set in createGameMenu
        defaultSpeed: { value: 0 },
        speed: { value: 0 },
        tournamentId: id,
        onTournamentMatchEnd,
        match: {
            p1_username: match.p1,
            p2_username: match.p2,
            matchId: match.id,
        },
        score: { p1: 0, p2: 0 },
    };
}

// Scene module:
// - Builds and returns a fully prepared Babylon.js Scene for the game.
// - Loads models, creates lights, UI, players and starts the ball logic.
// - createScene is the entry point used by the engine bootstrap code.

//let escListener: ((e: KeyboardEvent) => void) | null = null;

// Create and configure the main camera.
// Uses an ArcRotateCamera positioned above and to the side of the table.
// Camera is configured but not attached to user input to keep a fixed view(to attach, uncomment the line).
function createCamera(
    ctx: GameContext
): void {

    const camera = new BABYLON.ArcRotateCamera("camera",
        Math.PI / 2,   // Y-axis rotation angle (sideways)
        Math.PI / 5,   // tilt from above (~60°)
        20,            // distance from the center
        BABYLON.Vector3.Zero(),
        ctx.scene
    );
    //camera.attachControl(canvas, true);
    camera.setTarget(BABYLON.Vector3.Zero());
    ctx.camera = camera;
}

// Create lighting and shadow generator.
// - Hemispheric light provides ambient fill.
// - Directional light produces strong shadows (used by ShadowGenerator).
// - Returns the ShadowGenerator for meshes that need to cast/receive shadows.
function creteLightAndShadows(
    scene: BABYLON.Scene,
): BABYLON.ShadowGenerator {

    // ambient / fill light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.3;
    // directional light for distinct shadows and depth
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0, -10, -1.5), scene);
    dirLight.intensity = 0.7;
    // Shadow generator with blur for softer shadows
    const shadowGen = new BABYLON.ShadowGenerator(2048, dirLight);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 3;
    return shadowGen;
}

// Create floor and assign a texture.
// Floor is large to cover the scene and receives shadows from objects.
function createFloor(
    scene: BABYLON.Scene,
): void {

    const floor = BABYLON.MeshBuilder.CreateBox("floor", { width: 145, depth: 140, height: 1 }, scene);
    const floortexture = new BABYLON.Texture("game/textures/shadow.png", scene);
    const floormaterial = new BABYLON.StandardMaterial("floortexture", scene);
    floormaterial.diffuseTexture = floortexture;
    floor.material = floormaterial;
    floor.position = new BABYLON.Vector3(0, -0.5, 0)
    floor.receiveShadows = true;
}


// Import the main table model asynchronously.
// Adjusts position/rotation after the model is loaded and disables it as a shadow caster.
function importTable(
    ctx: GameContext,
    shadowGen: BABYLON.ShadowGenerator,
): void {

    SceneLoader.ImportMeshAsync(
        "",           // load all meshes from the file
        "/game/models/",    // base path (Vite serves from public/models/)
        "table.glb", // model file name
        ctx.scene
    ).then((result) => {
        // The GLB may contain multiple meshes; pick the table mesh
        const table = result.meshes[1];
        table.position.y = 1;
        table.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
        table.receiveShadows = true;
        // Remove table from shadow casters to avoid self-shadow artifacts
        shadowGen.removeShadowCaster(table);
        ctx.table = table
    });
}

// Import a decorative "beauty" mesh used as scenery at given Z positions.
function importBeautyBox(
    scene: BABYLON.Scene,
    posZ: number
): void {

    SceneLoader.ImportMeshAsync(
        "",           // load all meshes from the file
        "/game/models/",    // base path (Vite serves from public/models/)
        "service.glb",// model file name
        scene
    ).then((result) => {
        // The GLB may contain multiple meshes; pick the table mesh
        const box = result.meshes[1];
        box.position.y = 0.5;
        box.position.z = posZ;
        box.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
        box.receiveShadows = true;
    });
}

// Create invisible service / wall boxes used for collision boundaries.
// These are thin boxes placed at Z extents to simulate table bounds.
function makeServiceBox(
    name: string,
    zpos: number,
): BABYLON.Mesh {

    const mesh = BABYLON.MeshBuilder.CreateBox(name, { width: 40, depth: 0.1, height: 5 });
    mesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);
    mesh.position.x = 0;
    mesh.position.y = 1.5;
    mesh.position.z = zpos;
    mesh.checkCollisions = true;
    mesh.isVisible = false;
    return mesh
}

// Create the ball mesh used by the game.
// Adds shadow casting and basic white material.
function createBall(
    scene: BABYLON.Scene,
    shadowGen: BABYLON.ShadowGenerator,
): BABYLON.Mesh {

    const ball = BABYLON.MeshBuilder.CreateIcoSphere("ball", { radius: 0.3, subdivisions: 4 })
    ball.position.y = 2;
    ball.checkCollisions = true;
    const ballmaterial = new BABYLON.StandardMaterial("ball_texture", scene);
    ballmaterial.diffuseColor = BABYLON.Color3.White();
    ball.material = ballmaterial;
    shadowGen.addShadowCaster(ball);
    return ball;
}

/**
 * createScene - assemble and configure the full game scene.
 *
 * Responsibilities:
 * - Create scene, camera, lights, background and collision boundaries.
 * - Create UI overlay and pause/menu handling.
 * - Load players and wire up controls (keyboard or AI).
 * - Instantiate the ball and start the ball movement after a countdown.
 *
 * Parameters:
 * - canvas: HTMLCanvasElement used by the engine
 * - engine: Babylon Engine instance
 *
 * Returns:
 * - A fully prepared BABYLON.Scene ready for rendering.
 */
export async function createScene(
    canvas: HTMLCanvasElement,
    engine: BABYLON.Engine,
    mode: 'ai' | '1v1' | 'tournament',
    nextMatch: TournamentNextMatch,
    onTournamentMatchEnd?: (matchId: number, scoreP1: number, scoreP2: number) => Promise<void>
): Promise<BABYLON.Scene> {

    // Create a new Babylon.js scene
    const scene = new BABYLON.Scene(engine);
    // Create a map to track which keyboard keys are currently pressed
    const inputMap: { [key: string]: boolean } = {};
    scene.onKeyboardObservable.add((kbInfo) => {
        const key = kbInfo.event.key;

        switch (kbInfo.type) {
            // When a key is pressed down
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                inputMap[key] = true;
                break;
            // When a key is released
            case BABYLON.KeyboardEventTypes.KEYUP:
                inputMap[key] = false;
                break;
        }
    });
    // Enable collisions in the scene
    scene.collisionsEnabled = true;
    const ctx = await createEmptyContext(canvas, scene, engine, mode, nextMatch, onTournamentMatchEnd);
    // --- Scene setup ---
    // create camera, light and shadows
    createCamera(ctx);
    const shadowGen = creteLightAndShadows(scene);
    // create environment
    createFloor(scene);
    importTable(ctx, shadowGen);
    importBeautyBox(scene, 0);
    importBeautyBox(scene, -10);
    ctx.bottomwall = makeServiceBox("bottomwall", 5);
    ctx.topwall = makeServiceBox("topwall", -5);
    // Create main UI overlay for the game
    ctx.ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("MainUI", true, scene);
    ctx.ui.idealWidth = 1920;
    ctx.ui.idealHeight = 1080;
    ctx.ui.renderAtIdealSize = true;
    //create a pause meny and listen for events
    await pauseService(ctx);
    // --- Game setup ---
    // Create the main game menu (difficulty, opponent, etc.)
    createGameMenu(() => {
        ctx.ball = createBall(ctx.scene, shadowGen);
        loadPlayers(ctx, shadowGen).then(([player1, player2]) => {
            ctx.player1 = player1;
            ctx.player2 = player2;
            setupPlayerControls(inputMap, ctx, ctx.mode);
            startCountdown(ctx.ui, () => {
                initBallMovement(ctx);
            });
        });

    }, ctx, mode);

    // createGameMenu((config) => {
    //     // Create the game ball
    //     ctx.config = config;
    //     ctx.ball = createBall(scene, shadowGen)
    //     loadPlayers(ctx, shadowGen).then(([player1, player2]) => {
    //         // Initialize player controls (keyboard or AI)
    //         setupPlayerControls(inputMap, ctx, ctx.mode);
    //         // Start countdown before the ball moves
    //         startCountdown(ctx.ui, () => {
    //             ctx.speed = { value: config.ballSpeed };
    //             // Start the main ball movement and collision logic
    //             initBallMovement(
    //                 ctx,
    //                 gameState
    //             );
    //         });
    //     });
    // }, ctx, mode);

    // Return the complete scene to be rendered
    return scene;
}
