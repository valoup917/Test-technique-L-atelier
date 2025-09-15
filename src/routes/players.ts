/**
 * Routes for player-related endpoints
 */
import express, { Request, Response } from 'express';
import * as playerService from '../services/playerService';
import * as statisticsService from '../services/statisticsService';
import { Statistics } from '../types/statistics';
import { Player } from '../types/player';
import { validateAndMap } from '../utils/schemaValidation';

const router = express.Router();

/**
 * GET /players
 * Returns all players sorted by rank (ASC) and points (DESC) if same rank
 * Or returns a specific player if id query parameter is provided
 * 
 * Query Parameters:
 * - id: Optional player ID to retrieve a specific player
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const idParam = req.query.id as string | undefined;
    
    if (idParam !== undefined) {
      const id = parseInt(idParam as string, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Player ID must be a number'
        });
      }
      
      const player = await playerService.getPlayerById(id);
      
      if (!player) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Player with ID ${id} not found`
        });
      }
      
      return res.status(200).json({ player });
    }
    
    // If no id parameter, return all players
    const players = await playerService.getAllPlayers();
    return res.status(200).json({ players });
  } catch (error) {
    console.error('Error in GET /players route:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve player data'
    });
  }
});

/**
 * GET /players/statistics
 * Returns statistics about players:
 * - Country with the highest win ratio
 * - Average IMC of all players
 * - Median height of all players
 */
router.get('/statistics', async (_req: Request, res: Response) => {
  try {
    const statistics: Statistics = await statisticsService.getStatistics();
    return res.status(200).json({ statistics });
  } catch (error) {
    console.error('Error in GET /players/statistics route:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve player statistics'
    });
  }
});

/**
 * POST /players
 * Creates a new player
 * 
 * Request Body: Player object without ID
 * Returns: Created player object with assigned ID
 */
router.post('/', async (req, res) => {
  const validation = validateAndMap(req.body);
  if (!validation.ok) return res.status(400).json({ error: 'Bad Request', details: validation.errors });

  try {
    const created: Player = await playerService.createPlayer(validation.value);
    return res
      .status(201)
      .set('Location', `/players/${created.id}`)
      .json({ player: created });
  } catch (err: any) {
    const status = err?.status || 500;
    const message = err?.publicMessage || 'Internal Server Error';

    return res.status(status).json({ error: message });
  }
});

export default router;
