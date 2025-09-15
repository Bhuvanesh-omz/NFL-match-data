async function getGameData(gameId) {
    const gameData = await fetchData("/games", { id: gameId });
    const item = gameData.response?.[0];
    if (!item) throw new Error(`No game found for ID: ${gameId}`);

    const gameInfo = {
        id: item.id,
        league: item.league,
        season: item.season,
        period: item.periods,
        visitor: {
            ...item.teams.visitors,
            linescore: item.scores.visitors.linescore,
            points: item.scores.visitors.points,
        },
        home: {
            ...item.teams.home,
            linescore: item.scores.home.linescore,
            points: item.scores.home.points,
        },
    };

    const statsData = await fetchData("/games/statistics", { id: gameInfo.id });
    const extractTeamStats = (teamCode) => {
        const teamStats = statsData.response.find((t) => t.team.code === teamCode);
        if (!teamStats) return {};
        const statsArray = Array.isArray(teamStats.statistics)
            ? teamStats.statistics[0]
            : teamStats.statistics;
        return {
            code: teamStats.team.code,
            assist: statsArray.assists,
            steal: statsArray.steals,
            block: statsArray.blocks,
        };
    };
    const stats = {
        visitor: extractTeamStats(gameInfo.visitor.code),
        home: extractTeamStats(gameInfo.home.code),
    };

    const playerData = await fetchData("/players/statistics", {
        game: gameInfo.id,
        season: gameInfo.season,
    });
    const extractPlayers = (teamCode) =>
        playerData.response
            .filter((t) => t.team.code === teamCode)
            .map((item) => ({
                id: item.player.id,
                name: `${item.player.firstname} ${item.player.lastname}`,
                position: item.pos || "unknown",
                points: item.points,
                assists: item.assists,
                rebounds: item.totReb,
            }));
    const players = {
        visitor: extractPlayers(gameInfo.visitor.code),
        home: extractPlayers(gameInfo.home.code),
    };

    const standingsData = await fetchData("/standings", {
        league: gameInfo.league,
        season: gameInfo.season,
    });
    const extractStandings = (teamCode) =>
        standingsData.response
            .filter((t) => t.team.code === teamCode)
            .map((item) => ({
                win: item.win,
                loss: item.loss,
            }));
    const standings = {
        visitor: extractStandings(gameInfo.visitor.code),
        home: extractStandings(gameInfo.home.code),
    };

    return { gameInfo, stats, players, standings };
}
