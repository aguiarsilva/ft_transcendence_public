import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { createScene } from "./scene";
import { TournamentNextMatch, TournamentNextOrWinners } from "@/api/types";

export interface GameInstance {
  dispose: () => void;
}

let resizeHandler: (() => void) | null = null;

export async function startGame
  (canvas: HTMLCanvasElement,
    mode: 'ai' | '1v1' | 'tournament',
    nextOrWinners: TournamentNextOrWinners | null,
    onTournamentMatchEnd?: (matchId: number, scoreP1: number, scoreP2: number) => Promise<void>
  ): Promise<GameInstance> {
  // console.log("bootstrap mode: ", mode);
  // console.log("bootstrap nextMatch: ", nextMatch)
  const engine = new BABYLON.Engine(canvas, true);
  const scene = await createScene(canvas, engine, mode, nextOrWinners);
  const camera = scene.getCameraByName("camera") as BABYLON.ArcRotateCamera;
  //const radius = camera.radius;
  const tableServicePlane = BABYLON.MeshBuilder.CreatePlane(
    "tableServicePlane",
    { width: 10, height: 20 },
    scene
  );

  tableServicePlane.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
  tableServicePlane.position = new BABYLON.Vector3(0, 1, 0);

  tableServicePlane.isPickable = false;
  tableServicePlane.isVisible = false;

  function adjustCamera() {
    if (!camera || !tableServicePlane) return;

    const bounds = tableServicePlane.getBoundingInfo().boundingBox;
    const sizeX = bounds.maximum.x - bounds.minimum.x;
    const sizeZ = bounds.maximum.z - bounds.minimum.z;

    const maxSize = Math.max(sizeX, sizeZ);

    const aspect = canvas.clientWidth / canvas.clientHeight;

    camera.radius = maxSize * (aspect < 1.3 ? 3 / aspect : 2.2);
  }

  adjustCamera();
  engine.runRenderLoop(() => {
    scene.render();
  });

  resizeHandler = () => {
    engine.resize();
    adjustCamera();
  };
  window.addEventListener("resize", resizeHandler);

  return {
    dispose: () => {
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = null;
      }
      scene.dispose();
      engine.dispose();
    }
  };
}

// export function startGame
//   (canvas: HTMLCanvasElement,
//     mode: 'ai' | '1v1',
//   ): GameInstance {
//   const engine = new BABYLON.Engine(canvas, true);
//   const scene = createScene(canvas, engine, mode);

//   engine.runRenderLoop(() => {
//     scene.render();
//   });

//   resizeHandler = () => {
//     engine.resize();
//   };
//   window.addEventListener("resize", resizeHandler);

//   return {
//     dispose: () => {
//       if (resizeHandler) {
//         window.removeEventListener("resize", resizeHandler);
//         resizeHandler = null;
//       }
//       scene.dispose();
//       engine.dispose();
//     }
//   };
// }