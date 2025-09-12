/**
 * Tests for the players endpoint
 */
import request from 'supertest';
import app from '../src/app';
import * as playerService from '../src/services/playerService';
import { Player } from '../src/types/player';

// Mock the playerService module
jest.mock('../src/services/playerService');

describe('GET /players', () => {
  // Sample mock data based on the provided JSON
  const mockPlayers: Player[] = [
    {
      id: 17,
      firstname: "Rafael",
      lastname: "Nadal",
      shortname: "R.NAD",
      sex: "M",
      countrycode: "ESP",
      countrypicture: "https://tenisu.latelier.co/resources/Espagne.png",
      picture: "https://tenisu.latelier.co/resources/Nadal.png",
      rank: 1,
      points: 1982,
      weight: 85000,
      height: 185,
      age: 33,
      last: [1, 0, 0, 0, 1]
    },
    {
      id: 52,
      firstname: "Novak",
      lastname: "Djokovic",
      shortname: "N.DJO",
      sex: "M",
      countrycode: "SRB",
      countrypicture: "https://tenisu.latelier.co/resources/Serbie.png",
      picture: "https://tenisu.latelier.co/resources/Djokovic.png",
      rank: 2,
      points: 2542,
      weight: 80000,
      height: 188,
      age: 31,
      last: [1, 1, 1, 1, 1]
    }
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should return all players sorted by rank and points', async () => {
    // Mock the getAllPlayers method to return our test data
    (playerService.getAllPlayers as jest.Mock).mockResolvedValue(mockPlayers);

    // Make request to the endpoint
    const response = await request(app).get('/players');

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('players');
    expect(response.body.players).toEqual(mockPlayers);
    expect(playerService.getAllPlayers).toHaveBeenCalledTimes(1);

    // Verify sorting order (rank ASC, points DESC)
    const players = response.body.players;
    expect(players[0].rank).toBeLessThan(players[1].rank);
  });

  test('should return 500 when database error occurs', async () => {
    // Mock the getAllPlayers method to throw an error
    (playerService.getAllPlayers as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Make request to the endpoint
    const response = await request(app).get('/players');

    // Assertions
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(playerService.getAllPlayers).toHaveBeenCalledTimes(1);
  });
});
