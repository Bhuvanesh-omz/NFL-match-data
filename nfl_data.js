import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const API_KEY = "3915485270a61c67ede52bd3a3eeb064";
const API_HOST = "v1.american-football.api-sports.io";

const apiClient = axios.create({
    baseURL: `https://${API_HOST}`,
    headers: {
        "x-rapidapi-host": API_HOST,
        "x-rapidapi-key": API_KEY,
    },
});

async function fetchData(endpoint, params = {}) {
    try {
        const response = await apiClient.get(endpoint, { params });
        return response.data;
    } catch (e) {
        const detail = e?.response?.data || e?.message || e;
        throw new Error(
            `API request failed for ${endpoint} with params ${JSON.stringify(
                params
            )}: ${JSON.stringify(detail)}`
        );
    }
}

async function getGameData() {
    const gameData = await fetchData("/games", { date: "2025-09-15" });
    const item = gameData.response?.[1];
    if (!item) throw new Error(`No game found for date.`);

    const gameInfo = {
        id: item.game.id,
        league: item.league.name,
        league_id: item.league.id,
        date: item.game.date,
        season: item.league.season,
        away: {
            ...item.teams.away,
            points: item.scores.away,
        },
        home: {
            ...item.teams.home,
            points: item.scores.home,
        },
    };

    const extractTeamStats = async (teamCode) => {
        const statsData = await fetchData("/games/statistics/teams", {
            id: gameInfo.id,
            team: teamCode,
        });
        const item = statsData.response?.[0];
        if (!item) return {};
        return { statistics: item.statistics };
    };

    const stats = {
        away: await extractTeamStats(gameInfo.away.id),
        home: await extractTeamStats(gameInfo.home.id),
    };

    const extractPlayers = async (teamCode) => {
        const playerData = await fetchData("/games/statistics/players", {
            id: gameInfo.id,
            team: teamCode,
        });
        const item = playerData.response?.[0];
        if (!item) return {};
        return { player_stats: item.groups };
    };

    const players = {
        away: await extractPlayers(gameInfo.away.id),
        home: await extractPlayers(gameInfo.home.id),
    };

    const extractStandings = async (teamCode) => {
        const standingsData = await fetchData("/standings", {
            league: gameInfo.league_id,
            season: "2025",
            team: teamCode,
        });
        const item = standingsData.response?.[0];
        if (!item) return {};
        return {
            won: item.won,
            lost: item.lost,
            ties: item.ties,
            position: item.position,
            points: item.points,
        };
    };

    const standings = {
        away: await extractStandings(gameInfo.away.id),
        home: await extractStandings(gameInfo.home.id),
    };

    const finalData = {
        gameInfo,
        stats,
        players,
        standings,
    };

    try {
        const record = await prisma.nflGameData.create({
            data: {
                gameId: gameInfo.id,
                data: finalData,
            },
        });
    } catch (err) {
        console.error("Error inserting into Postgres:", err);
    }
}

setInterval(getGameData, 30_000);