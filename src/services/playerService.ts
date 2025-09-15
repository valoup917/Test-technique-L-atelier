/**
 * Service for player-related operations
 */
import { query } from '../config/db';
import { Player } from '../types/player';

/**
 * Get a player by ID
 * @param {number} id - Player ID
 * @returns {Promise<Player|null>} - Player object or null if not found
 */
const getPlayerById = async (id: number): Promise<Player | null> => {
  try {
    const queryText = `
      SELECT 
        id, 
        firstname, 
        lastname, 
        shortname, 
        sex, 
        rank, 
        points, 
        weight, 
        height, 
        age, 
        last, 
        countrycode, 
        countrypicture, 
        picture
      FROM 
        players 
      WHERE 
        id = $1
    `;
    
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as Player;
  } catch (error) {
    console.error(`Error fetching player with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get all players sorted by rank (ASC) and points (DESC) if same rank
 * @returns {Promise<Player[]>} - Array of player objects
 */
const getAllPlayers = async (): Promise<Player[]> => {
  try {
    const queryText = `
      SELECT 
        id, 
        firstname, 
        lastname, 
        shortname, 
        sex, 
        rank, 
        points, 
        weight, 
        height, 
        age, 
        last, 
        countrycode, 
        countrypicture, 
        picture
      FROM 
        players 
      ORDER BY 
        rank ASC, 
        points DESC
    `;
    // Players with the same rank should be ordered by points in descending order.
    // Chose to do it in SQL for rapidity and to showcase my ability to not only use wrappers

    const result = await query(queryText);
    return result.rows as Player[];
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

/**
 * Create a new player
 * @param {Player} playerData - Player data without ID
 * @returns {Promise<Player>} - Created player object with assigned ID
 */
const createPlayer = async (p : Player): Promise<Player> => {
  const sql = `
    INSERT INTO players (
      id, firstname, lastname, shortname, sex,
      rank, points, weight, height, age,
      last, countrycode, countrypicture, picture
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14)
    RETURNING id, firstname, lastname, shortname, sex, rank, points, weight, height, age, last, countrycode, countrypicture, picture
  `;
  const vals = [
    p.id, p.firstname, p.lastname, p.shortname, p.sex,
    p.rank, p.points, p.weight, p.height, p.age,
    JSON.stringify(p.last), p.countrycode, p.countrypicture, p.picture,
  ];

  try {
    const { rows } = await query(sql, vals);
    return rows[0] as Player;
  } catch (err: any) {
    switch (err?.code) {
      case '23505': // unique_violation
        err.status = 409;
        err.publicMessage = 'Player already exists: ' + (err?.detail || '');
        break;
      case '23514': // check_violation (contrainte CHECK)
      case '23502': // not_null_violation
        err.status = 400;
        err.publicMessage = 'Invalid player data (constraint violation)';
        break;
      default:
        err.status = 500;
        err.publicMessage = 'Database error ' + (err?.message || 'unknown');
    }
    throw err;
  }
}

export {
  getAllPlayers,
  getPlayerById,
  createPlayer,
};
