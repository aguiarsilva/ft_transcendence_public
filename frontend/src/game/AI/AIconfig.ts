/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   AIconfig.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/02 15:08:07 by anilchen          #+#    #+#             */
/*   Updated: 2025/11/05 17:27:55 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export type AIConfig = {
    baseSpeed: number; // base movement speed of AI paddle (modified by ball speed)
    reactionThreshold: number; // how far the ball must be from paddle before it reacts
    offsetRange: number;  // max random error added to target Z (to simulate imperfection)
    holdFramesMin: number; // minimum frames AI keeps the same fake target
    holdFramesMax: number; // maximum frames AI keeps the same fake target
    maxStep: number; // maximum movement per frame for AI paddle
    smoothingFactor: number; // smoothing factor for movement (0-1)
    focusZone: number;  // Width of the focus zone (± from predictedZ)
    panicHysteresis: number;  // Frames to stay in panic after trigger
};