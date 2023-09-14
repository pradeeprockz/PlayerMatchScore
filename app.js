const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(3000, () => {
            console.log("Server Running at http://localhost:3000/");
        });
    } catch (e) {
        console.log(`DB Server : ${e.message}`);
        process.exit(1);
    }
};



initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
    return {
        matchId: dbObject.match_id,
        match: dbObject.match,
        year: dbObject.year

    };
};
const convertMatchDbObjectToResponseObject = (dbObject) => {
    return {
        playerId: dbObject.player_id,
        playerName: dbObject.player_name,

    };
};
const convertMatchStatasticsDbObjectToResponseObject = (dbObject) => {
    return {
        playerId: dbObject.player_id,
        playerName: dbObject.player_name,
        totalScore: dbObject.total_score,
        totalFours: dbObject.total_fours,
        totalSixes: dbObject.total_sixes

    };
};

//1 Get Player Details
app.get("/players/", async (request, response) => {
    const getPlayerDetailsQuery = `SELECT * FROM player_details ORDER BY player_id;`;
    const playersArray = await db.all(getPlayerDetailsQuery);
    response.send(playersArray);
});

//2 Get player Details based on player_id
app.get("/players/:player_id", async (request, response) => {
    const { playerId } = request.params;
    const getPlayerArray = `SELECT * FROM player_details WHERE player_id = ${playerId}`;
    const player = await db.all(getPlayerArray);
    response.send(player);
});

//3 UPDATE playerDetails
app.put("/players/:player_id", async (request, response) => {
    const { playerId } = request.params;
    const playerDetails = request.body;
    const { playerName } = playerDetails;
    const updatePlayerQuery = `UPDATE player_details SET 
    player_name = '${playerName}' WHERE player_id = ${playerId};`;
    await db.run(updatePlayerQuery);
    response.send("Player Details Updated");

});

//4 Get match Details based on match_id
app.get("/matches/:match_id", async (request, response) => {
    const { matchId } = request.params;
    const getPlayerArray = `SELECT * FROM match_details WHERE match_id = ${matchId}`;
    const match = await db.all(getPlayerArray);
    response.send(match.map((matchDetailsByMatchId)=>
        convertDbObjectToResponseObject(matchDetailsByMatchId)
    ));
});

//5 Get list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
    const { playerId } = request.params;
    const getMatchQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId};`;
    const playersMatchArray = await db.all(getMatchQuery);
    response.send(playersMatchArray.map((eachPlayer) =>
        convertDbObjectToResponseObject(eachPlayer)
    ));
});

//6 Get list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
    const { matchId } = request.params;
    const getMatchPlayerQuery = `SELECT player_details.player_id AS playerId
      player_details.player_name AS playerName FROM player_match_score
      NATURAL JOIN player_detals WHERE match_id = ${matchId}`;
    const matchArray = await db.all(getMatchPlayerQuery);
    response.send(matchArray.map((eachMatchPlayer) =>
        convertMatchDbObjectToResponseObject(eachMatchPlayer)
    ));
});

//7 Get the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
    const getPlayerScored = `SELECT 
    player_details.player_id AS playerId,
    player_details.player_name As playerName,
    SUM(player_match_score.score) As TotalScore,
    SUM(fores) AS TotalFores,
    SUM(sixes) AS TotalSixes 
    FROM player_details INNER JOIN player_match_score ON 
    player_details.player_id = player_match_score.player_id
    WHERE player_detalis.player_id = ${playerId};`;
    const playerScoredArray = await db.all(getPlayerScored);
    response.send(playerScoredArray.map((playerStatisticsById)=>
    convertMatchStatasticsDbObjectToResponseObject(playerStatisticsById)
    ));
});

module.exports = app;