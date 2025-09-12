/**
 * Routes for player-related endpoints
 */
import express, { Request, Response } from 'express';
import * as playerService from '../services/playerService';

const router = express.Router();

/**
 * GET /players
 * Returns all players sorted by rank (ASC) and points (DESC) if same rank
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const players = await playerService.getAllPlayers();
    res.status(200).json({ players });
  } catch (error) {
    console.error('Error in GET /players route:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve players data'
    });
  }
});

export default router;
