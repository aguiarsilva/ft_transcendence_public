/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   UI.ts                                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/24 15:18:17 by anilchen          #+#    #+#             */
/*   Updated: 2026/01/02 14:44:03 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

//import * as BABYLON from "@babylonjs/core"
import * as GUI from "babylonjs-gui";
import { makeText, makeButton, makePanel, makeBackground } from "./UI_utils";
import { GAME_DIFFICULTY, AI_DIFFICULTY, GameContext, gameState } from "./config";
import { session } from "@/state/session";
import { api } from "@/api/client";

export async function showWinner(
    ctx: GameContext,
    //ui: GUI.AdvancedDynamicTexture,
    score: { p1: number; p2: number },
    winner: string,
    onRestart: () => void
) {
    //dark background
    const background = makeBackground();
    ctx.ui.addControl(background);
    // StackPanel to place everything inside vertically.
    const panel = makePanel()
    ctx.ui.addControl(panel);
    // print who is winner
    const winnertext = makeText(`${winner} wins`, 80, "white", "70px");
    panel.addControl(winnertext);
    //print score
    const scoreText = makeText(`Score: ${score.p1} : ${score.p2}`, 40, "white", "40px");
    panel.addControl(scoreText);

    // restart button
    const restartButton = makeButton("restartBtn", "Play Again", "30%", "50px", "white", "#444", 20);
    // if user push restart button
    restartButton.onPointerUpObservable.add(async () => {
        try {
            // Only submit match result if it's a real match (not local 1v1)
            if (ctx.match.matchId > 0) {
                await api.submitMatchResult(ctx.match.matchId, score.p1, score.p2);
            }
        } catch (error) {
            console.error("Failed to submit match result:", error);
        }
        if (ctx.mode === "1v1") {
            try {
                let match;
                const isRealUser = ctx.match.p2_username !== "Player 2";

                if (isRealUser) {
                    match = await api.createPvPMatch({
                        opponentUsername: ctx.match.p2_username
                    });
                } else {
                    match = await api.createPvPMatch({
                        opponentAlias: ctx.match.p2_username
                    });
                }
                ctx.match.matchId = match.id;
                ctx.match.p1_username = match.player1.alias;
                ctx.match.p2_username = match.player2.alias;

                console.log("New PvP match created:", ctx.match);

            } catch (err) {
                console.error("Failed to create new PvP match on restart:", err);
                alert("Could not start a new match.");
                return;
            }
        }
        background.dispose();
        panel.dispose();
        ctx.ui.rootContainer.clearControls();
        onRestart(); //restart game
    });

    //finish button
    const finishButton = makeButton("finishBtn", "Finish Game", "30%", "50px", "white", "#444", 20);
    finishButton.onPointerUpObservable.add(async () => {
        try {
            // Only submit match result if it's a real match (not local 1v1)
            if (ctx.match.matchId > 0) {
                await api.submitMatchResult(ctx.match.matchId, score.p1, score.p2);
            }
        } catch (error) {
            console.error("Failed to submit match result:", error);
        }

        ctx.ui.dispose();  //remove GUI
        gameState.pauseMenu = null
        gameState.isPaused = false;
        if (ctx.mode === "tournament") {
            console.log("Tournament match finished — returning to bracket");
            window.location.hash = "#/tournaments";
            return;
        }
        console.log('Finish clicked, pauseMenu reset to null');
        const user = session.user();
        if (user) {
            window.location.hash = "#/dashboard";
        } else {
            window.location.hash = "#/";
        }
    });
    // Adds a panel to the main UI (AdvancedDynamicTexture).
    if (ctx.mode !== 'tournament') {
        panel.addControl(restartButton);
    }
    panel.addControl(finishButton);
}



/**
 * Creates a centered score display at the top of the screen.
 * @param ui - The main GUI texture to attach the score UI to.
 * @returns The TextBlock displaying the score (e.g., "0 : 0").
 */
export function createScoreUI(
    ctx: GameContext,
): GUI.TextBlock {

    const frame = new GUI.Rectangle();
    frame.width = "20%";
    frame.height = "7%";
    frame.thickness = 3;
    frame.cornerRadius = 15;
    frame.color = "white";
    frame.background = "#00000080";
    //position
    frame.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    frame.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    frame.top = "15%";

    ctx.ui.addControl(frame);

    // Player 1 Name
    const p1 = makeText(ctx.match.p1_username, 20, "#60a5fa", "40px");
    p1.left = "-120px";
    //p1.top = "10px";
    p1.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    frame.addControl(p1);

    // Player 2 Name
    const p2 = makeText(ctx.match.p2_username, 20, "#fb2464ff", "40px");
    p2.left = "120px";
    // p2.top = "10px";
    p2.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    frame.addControl(p2);

    // Score text
    const scoreText = makeText("0 : 0", 40, "white", "60px");
    scoreText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    // scoreText.top = "10px";

    frame.addControl(scoreText);

    return scoreText;
}


/**
 * Displays a countdown (3 → 2 → 1 → START!) before the game begins.
 * Calls the provided callback once the countdown finishes.
 *
 * @param ui - The AdvancedDynamicTexture used to display GUI elements.
 * @param onComplete - Function to call after the countdown completes.
 */
export function startCountdown(ui: GUI.AdvancedDynamicTexture, onComplete: () => void) {
    // Create a centered text block for countdown numbers
    const text = new GUI.TextBlock();
    text.color = "white";
    text.fontSize = 120;
    text.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    text.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    ui.addControl(text);

    let count = 4; // Start at 4 so the first displayed number is 3

    const timer = setInterval(() => {
        count--;

        if (count > 0) {
            text.text = count.toString();
        } else if (count === 0) {
            text.text = "START!";
        } else {
            clearInterval(timer);
            ui.removeControl(text);
            onComplete(); // Trigger game start
        }
    }, 1000);
}


/**
 * Displays a list of selectable level buttons inside the given panel.
 *
 * @param panel - The parent StackPanel to hold all controls.
 * @param titleText - The title displayed above the level buttons.
 * @param levels - An array of level names (button labels).
 * @param onSelect - Callback triggered when a level is selected.
 */
function showLevelOptions(
    panel: GUI.StackPanel,
    titleText: string,
    levels: string[],
    onSelect: (level: string) => void
) {
    // Clear existing UI elements before adding new ones
    panel.clearControls();

    // Title
    const title = makeText(titleText, 26, "white", "40px");
    panel.addControl(title);

    // Container for level buttons
    const levelPanel = new GUI.StackPanel();
    levelPanel.spacing = 5;
    panel.addControl(levelPanel);

    // Create a button for each level
    levels.forEach((level) => {
        const button = makeButton(
            `${level}_btn`,
            level,
            "280px",
            "50px",
            "white",
            "#666",
            18);
        button.onPointerUpObservable.add(() => onSelect(level));
        levelPanel.addControl(button);
    });
}

/**
 * Creates the main game menu where the player chooses opponent type,
 * game difficulty, and (if applicable) AI intelligence.
 *
 * @param onStart - Callback called when the player finishes setup.
 * @param ui - Babylon.js AdvancedDynamicTexture used for displaying the menu.
 */

export function createGameMenu(
    //onStart: (config: GameConfig) => void,
    onStart: () => void,
    ctx: GameContext,
    mode: 'ai' | '1v1' | 'tournament'
): void {

    if (mode === 'tournament') {
        console.log("Tournament mode, skipping UI");
        //ctx.match.p2_username = //backend
        ctx.aiSettings = null;
        ctx.defaultSpeed.value = GAME_DIFFICULTY["Medium"].ballSpeed;
        ctx.speed.value = ctx.defaultSpeed.value;
        onStart();
        return;
    }

    const panel = makePanel();
    ctx.ui.addControl(panel);

    //const opponent = mode;// === 'ai';
    const isLoggedIn = !!session.user();

    let selectedDifficulty: keyof typeof GAME_DIFFICULTY | null = null;
    let selectedAILevel: keyof typeof AI_DIFFICULTY = "Medium";

    // STEP 1 — Choose game speed
    showLevelOptions(panel, "Choose Game Speed", ["Easy", "Medium", "Hard"], level => {
        selectedDifficulty = level as keyof typeof GAME_DIFFICULTY;

        if (mode === "ai") {
            showAIDifficultyOptions();
        } else if (mode === "1v1") {
            if (isLoggedIn) showPlayer2NameInput();
            else finish(null);
        }
    });

    // STEP 2 — AI mode
    function showAIDifficultyOptions() {
        showLevelOptions(panel, "Choose AI Intelligence", ["Easy", "Medium", "Hard"], level => {
            selectedAILevel = level as keyof typeof AI_DIFFICULTY;
            finish(null);
        });
    }

    // STEP 3 — nickname input (ONLY if logged in)
    function showPlayer2NameInput() {
        panel.clearControls();

        const title = makeText("Player 2 nickname (optional — required only for scoring)", 28, "white", "40px");
        panel.addControl(title);

        const input = new GUI.InputText();
        input.width = "300px";
        input.height = "50px";
        input.color = "white";
        input.background = "#333";
        input.placeholderText = "Enter nickname";
        panel.addControl(input);

        const startBtn = makeButton(
            "startBtn",
            "Start Game",
            "200px",
            "50px",
            "white",
            "#444",
            20
        );
        panel.addControl(startBtn);

        startBtn.onPointerUpObservable.add(() => {
            let nickname = input.text?.trim() || "";

            // === VALIDATIONS ===
            const myName = ctx.match.p1_username;

            if (nickname.toLowerCase() === myName.toLowerCase()) {
                return;
            }

            if (nickname.length === 0) {
                nickname = "Player 2"; // fallback to "Player 2"
            }

            finish(nickname);
        });
    }

    // FINAL STEP — launch game
    // function finish(player2Name: string | null) {
    //     if (!selectedDifficulty) return;

    //     const config: GameConfig = {
    //        // mode,
    //         //opponent,
    //         ballSpeed: GAME_DIFFICULTY[selectedDifficulty].ballSpeed,
    //         aiSettings: AI_DIFFICULTY[selectedAILevel],
    //        // player2Name: player2Name ?? null   
    //     };

    //     console.log("Game Config:", config);
    //     ctx.match.p2_username = player2Name || "Player 2";
    //     ctx.ui.removeControl(panel);
    //     onStart(config);
    //}
    async function finish(player2Name: string | null) {
        if (!selectedDifficulty) return;

        ctx.defaultSpeed.value = GAME_DIFFICULTY[selectedDifficulty].ballSpeed;
        ctx.speed.value = ctx.defaultSpeed.value;

        if (mode === "ai") {
            ctx.aiSettings = AI_DIFFICULTY[selectedAILevel];
        }
        else if (mode === "1v1") {
            ctx.aiSettings = null;
            try {
                let match;
                ctx.match.p2_username = (player2Name?.trim() || "Player 2");
                console.log(ctx.match.p2_username);
                if (ctx.match.p2_username === "Player 2") {
                    match = await api.createPvPMatch({
                        opponentAlias: ctx.match.p2_username
                    });
                }
                else {
                    match = await api.createPvPMatch({
                        opponentUsername: ctx.match.p2_username
                    });
                }
                ctx.match.matchId = match.id;
                //ctx.match.p1_username = match.player1.alias;
                ctx.match.p2_username = match.player2.alias;
            } catch (error) {
                console.error("Failed to create PvP match:", error);
                // Fallback to local 1v1 without backend
                ctx.match.p2_username = (player2Name?.trim() || "Player 2");
                ctx.match.matchId = 0;
            }

        }
        // else {
        //     ctx.aiSettings = null;
        //     // ctx.match.p2_username already set from backend
        // }

        // close menu
        ctx.ui.removeControl(panel);
        console.log("ctx:", ctx)
        // start game
        onStart();
    }
}

/**
 * Creates a pause menu overlay with a dark background and a "Finish Game" button.
 * Returns control methods to show/hide the menu.
 *
 * @param ui - The AdvancedDynamicTexture used to display the GUI.
 * @returns An object with `show()` and `hide()` methods to toggle visibility.
 */
export async function createPauseMenu(
    ctx: GameContext
): Promise<{ show: () => void; hide: () => void }> {
    // --- Background overlay (dark transparent layer) ---
    const background = makeBackground();
    background.isVisible = false; // Hidden by default
    background.zIndex = 1000;     // Render behind the panel
    ctx.ui.addControl(background);

    // --- Main pause panel ---
    const panel = makePanel();
    panel.isVisible = false; // Hidden by default
    panel.zIndex = 1001;     // Render above the background
    ctx.ui.addControl(panel);

    // --- "PAUSED" title ---
    const pauseText = makeText("PAUSED", 80, "white", "100px");
    pauseText.top = "-100px"; // Move slightly upward
    panel.addControl(pauseText);

    // --- Instruction text ---
    const moreText = makeText("Press ESC or SPACE to continue", 40, "white", "60px");
    moreText.top = "-50px"; // Slightly below the title
    panel.addControl(moreText);

    // --- "Finish Game" button ---
    const finishButton = makeButton(
        "finishBtn",
        "Finish Game",
        "30%",
        "60px",
        "white",
        "#444",
        22
    );

    finishButton.isVisible = true;
    finishButton.onPointerUpObservable.add(async () => {

        const p1 = ctx.score.p1;
        const p2 = ctx.score.p2;

        // 1. If a tie → ask user
        const user = session.user();
        if (user) {
            if (p1 === p2) {
                const proceed = confirm(
                    `Both players have the same score (${p1}:${p2}).\n` +
                    `This match result will NOT be submitted.\n\n` +
                    `Continue without submitting?`
                );

                if (!proceed) return;   // ❌ User canceled → stay in match

                // ✔️ User confirmed → skip submit and leave match
                ctx.ui.dispose();
                gameState.pauseMenu = null;

                const user = session.user();
                window.location.hash = user ? "#/dashboard" : "#/";
                return;
            }

            // 2. If NOT a tie → submit result 
            try {
                await api.submitMatchResult(ctx.match.matchId, p1, p2);
            } catch (err) {
                console.error("Failed to submit match result:", err);
                alert("Error submitting the match result.");
            }
        }

        // 3. Cleanup UI
        ctx.ui.dispose();
        gameState.pauseMenu = null;

        // 🔥 4. Redirect user
        if (user && ctx.mode != 'tournament') {
            window.location.hash = "#/dashboard";
        } else if (user && ctx.mode === 'tournament') {
            window.location.hash = "#/tournaments"
        } else {
            window.location.hash = "#/";
        }
    });

    panel.addControl(finishButton);

    // --- Public control interface (show/hide methods) ---
    return {
        /** Makes the pause menu visible */
        show: () => {
            background.isVisible = true;
            panel.isVisible = true;
        },
        /** Hides the pause menu */
        hide: () => {
            background.isVisible = false;
            panel.isVisible = false;
        },
    };
}
