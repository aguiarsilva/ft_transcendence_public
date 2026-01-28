/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   gameMode.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: anilchen <anilchen@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/21 13:20:06 by anilchen          #+#    #+#             */
/*   Updated: 2025/12/18 14:40:22 by anilchen         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

let forcedMode: 'ai' | '1v1' | 'tournament';
let forcedTournamentId: number | null = null;

export function setForcedMode(mode: 'ai' | '1v1' | 'tournament') {
  forcedMode = mode;
}

export function getForcedMode(): 'ai' | '1v1' | 'tournament' {
  return forcedMode;
}

export function setForcedTournamentId(id: number) {
  forcedTournamentId = id;
}

export function getForcedTournamentId(): number | null {
  return forcedTournamentId;
}