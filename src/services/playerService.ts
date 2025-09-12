/**
 * Service for player-related operations
 */
import { query } from '../config/db';
import { Player } from '../types/player';

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

export {
  getAllPlayers,
};
