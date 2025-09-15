/**
 * Routes for player-related endpoints
 */
import express, { Request, Response } from 'express';
import * as playerService from '../services/playerService';
import * as statisticsService from '../services/statisticsService';
import { Statistics } from '../types/statistics';
import { Player } from '../types/player';

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
      
      // If player not found, return 404
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


function validateAndMap(body:any): { ok:true; value: Player } | { ok:false; errors:string[] } {
  const e:string[] = [];
  const b = body as Player;
  const reqNum = (v:any)=> typeof v==='number' && Number.isFinite(v);
  const reqStr = (v:any)=> typeof v==='string' && v.trim().length>0;

  if (!reqNum(b?.id)) e.push('id');
  if (!reqStr(b?.firstname)) e.push('firstname');
  if (!reqStr(b?.lastname)) e.push('lastname');
  if (!reqStr(b?.shortname)) e.push('shortname');
  if (!['M','F'].includes(b?.sex as any)) e.push('sex');

  if (!reqNum(b.rank) || b.rank < 1) e.push('rank');
  if (!reqNum(b.points) || b.points < 0) e.push('points');
  if (!reqNum(b.weight) || b.weight <= 0) e.push('weight');
  if (!reqNum(b.height) || b.height <= 0) e.push('height');
  if (!reqNum(b.age) || b.age <= 0) e.push('age');
  if (!Array.isArray(b.last) || b.last.some((x:any)=> !(x===0||x===1))) e.push('last');

  if (!reqStr(b.countrycode) || b.countrycode.length !== 3) e.push('countrycode');
  if (!reqStr(b.countrypicture)) e.push('countrypicture');
  if (!reqStr(b?.picture)) e.push('picture');

  if (e.length) return { ok:false, errors:e };

  return {
    ok:true,
    value: {
      id: b.id,
      firstname: b.firstname.trim(),
      lastname: b.lastname.trim(),
      shortname: b.shortname.trim(),
      sex: b.sex,
      rank: b.rank,
      points: b.points,
      weight: b.weight,
      height: b.height,
      age: b.age,
      last: b.last.map((x:number)=> x?1:0),
      countrycode: b.countrycode.toUpperCase().trim(),
      countrypicture: b.countrypicture.trim(),
      picture: b.picture.trim(),
    }
  };
}

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
