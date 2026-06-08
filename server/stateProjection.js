// Strips full server state down to a per-client safe projection.
// A player's hand is NEVER included for any other player.

const RELATIVE_POSITIONS = ['bottom', 'left', 'top', 'right'] // clockwise from self

export function projectStateFor(room, playerId) {
  const me = room.players.find((p) => p.playerId === playerId)
  const mySeat = me?.seat

  const players = room.players.map((p) => {
    let position = null
    if (mySeat != null && p.seat != null) {
      position = RELATIVE_POSITIONS[(p.seat - mySeat + 4) % 4]
    }
    return {
      playerId: p.playerId,
      displayName: p.displayName,
      teamId: p.teamId,
      position,
      cardCount: p.hand ? p.hand.length : 0,
      isConnected: p.isConnected,
      isReady: p.isReady,
    }
  })

  return {
    roomCode: room.roomCode,
    phase: room.phase,
    gameSuit: room.gameSuit,
    gameCallerId: room.gameCallerId,
    currentLeaderId: room.currentLeaderId,
    currentTurn: room.currentTurn,
    currentTrick: room.currentTrick,
    myPlayerId: playerId,
    myHand: me ? me.hand : [],
    players,
    teams: { A: { tricks: room.teams.A.tricks }, B: { tricks: room.teams.B.tricks } },
    winner: room.winner,
  }
}
