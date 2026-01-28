/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   UI_utils.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/24 15:15:18 by anilchen          #+#    #+#             */
/*   Updated: 2025/12/09 16:08:14 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as GUI from "babylonjs-gui";

/**
 * Creates a semi-transparent black background covering the entire screen.
 * Used as an overlay behind menus or panels.
 */
export function makeBackground(): GUI.Rectangle {
  const background = new GUI.Rectangle();
  background.width = "100%"; // Full screen width
  background.height = "100%";  // Full screen height
  background.background = "black"; // Solid black color
  background.alpha = 0.6;  // Semi-transparent (0 = invisible, 1 = opaque)
  background.thickness = 0; // No border
  return background;
}

/**
 * Creates a vertical stack panel centered on the screen.
 * Used to arrange UI elements like buttons or text blocks.
 */
export function makePanel(): GUI.StackPanel {
  const panel = new GUI.StackPanel();
  panel.width = "50%";  // Half of the screen width
  panel.height = "25%"; // 25% of the screen height
  panel.isVertical = true; // Stack items vertically
  panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER; // Center horizontally
  panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;  // Center vertically
  panel.spacing = 10; // Space between elements
  return panel;
}


/**
 * Creates a text block with customizable size, color, and height.
 * @param text - Text content to display.
 * @param fontSize - Font size in pixels.
 * @param color - Text color (CSS format).
 * @param height - Height of the text block (e.g., "30px" or "10%").
 */
export function makeText(
  text: string,
  fontSize: number,
  color: string,
  height: string
): GUI.TextBlock {
  const txt = new GUI.TextBlock();
  txt.text = text;
  txt.color = color;
  txt.fontSize = fontSize;
  txt.height = height;
  return txt;
}

/**
 * Creates a simple styled button.
 * @param name - Internal button name (used as ID).
 * @param text - Button label text.
 * @param width - Button width (e.g., "150px" or "40%").
 * @param height - Button height.
 * @param color - Border and text color.
 * @param bg - Background color.
 * @param fontSize - Font size in pixels.
 */
export function makeButton(
  name: string,
  text: string,
  width: string,
  height: string,
  color: string,
  bg: string,
  fontSize: number
): GUI.Button {
  const button = GUI.Button.CreateSimpleButton(name, text);
  button.width = width;
  button.height = height;
  button.color = color; // Text and border color
  button.background = bg;  // Fill color
  button.fontSize = fontSize;
  button.fontFamily = 'italic'; // Font style 
  button.cornerRadius = 20; // Rounded corners
  return button;
}
