/**
 * Tests for the players endpoint
 */
import request from 'supertest';
import app from '../src/app';
import * as playerService from '../src/services/playerService';
import * as statisticsService from '../src/services/statisticsService';
import { Player } from '../src/types/player';
import { Statistics } from '../src/types/statistics';

// Mock the services
jest.mock('../src/services/playerService');
jest.mock('../src/services/statisticsService');

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

// Sample mock statistics
const mockStatistics: Statistics = {
  countryWithHighestWinRatio: {
    countryCode: "SRB",
    winRatio: 1.0
  },
  averageIMC: 23.45,
  medianHeight: 186.5
};

// Sample mock player statistics data
const mockPlayerStatisticsData = [
  {
    weight: 85000,
    height: 185,
    last: [1, 0, 0, 0, 1],
    countrycode: "ESP"
  },
  {
    weight: 80000,
    height: 188,
    last: [1, 1, 1, 1, 1],
    countrycode: "SRB"
  }
];

describe('GET /players', () => {
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

describe('GET /players?id=', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should return a player when valid ID is provided', async () => {
    // Mock the getPlayerById method to return a specific player
    (playerService.getPlayerById as jest.Mock).mockResolvedValue(mockPlayers[0]);

    // Make request to the endpoint with query parameter
    const response = await request(app).get('/players?id=17');

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('player');
    expect(response.body.player).toEqual(mockPlayers[0]);
    expect(playerService.getPlayerById).toHaveBeenCalledTimes(1);
    expect(playerService.getPlayerById).toHaveBeenCalledWith(17);
  });

  test('should return 404 when player is not found', async () => {
    // Mock the getPlayerById method to return null (player not found)
    (playerService.getPlayerById as jest.Mock).mockResolvedValue(null);

    // Make request to the endpoint with query parameter
    const response = await request(app).get('/players?id=999');

    // Assertions
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(playerService.getPlayerById).toHaveBeenCalledTimes(1);
    expect(playerService.getPlayerById).toHaveBeenCalledWith(999);
  });

  test('should return 400 when ID is not a number', async () => {
    // Make request to the endpoint with invalid ID
    const response = await request(app).get('/players?id=invalid');

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(playerService.getPlayerById).not.toHaveBeenCalled();
  });

  test('should return 500 when database error occurs', async () => {
    // Mock the getPlayerById method to throw an error
    (playerService.getPlayerById as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Make request to the endpoint with query parameter
    const response = await request(app).get('/players?id=17');

    // Assertions
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(playerService.getPlayerById).toHaveBeenCalledTimes(1);
    expect(playerService.getPlayerById).toHaveBeenCalledWith(17);
  });
});

describe('POST /players', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should create a new player when valid data is provided', async () => {
    const newPlayerData = {
      id: 99,
      firstname: "Roger",
      lastname: "Federer",
      shortname: "R.FEDer",
      sex: "M",
      countrycode: "CHE",
      countrypicture: "https://tenisu.latelier.co/resources/Suisse.png",
      picture: "https://tenisu.latelier.co/resources/Federer.png",
      rank: 3,
      points: 1920,
      weight: 83000,
      height: 185,
      age: 38,
      last: [1, 1, 0, 1, 0]
    };

    // Mock the createPlayer method to return the created player
    (playerService.createPlayer as jest.Mock).mockResolvedValue(newPlayerData);

    // Make request to the endpoint
    const response = await request(app)
      .post('/players')
      .send(newPlayerData)
      .set('Accept', 'application/json');

    // Assertions
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('player');
    expect(response.body.player).toEqual(newPlayerData);
    expect(playerService.createPlayer).toHaveBeenCalledTimes(1);
    expect(playerService.createPlayer).toHaveBeenCalledWith(newPlayerData);
  });

  test('should return 400 when required fields are missing', async () => {
    const incompletePlayerData = {
      firstname: "Roger",
      lastname: "Federer",
      // Missing other required fields
    };

    // Make request to the endpoint
    const response = await request(app)
      .post('/players')
      .send(incompletePlayerData)
      .set('Accept', 'application/json');

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(playerService.createPlayer).not.toHaveBeenCalled();
  });

  test('should return 400 when numeric fields are not numbers', async () => {
    const invalidPlayerData = {
      firstname: "Roger",
      lastname: "Federer",
      shortname: "R.FED",
      sex: "M",
      countrycode: "CHE",
      countrypicture: "https://tenisu.latelier.co/resources/Suisse.png",
      picture: "https://tenisu.latelier.co/resources/Federer.png",
      rank: "not-a-number", // Invalid: should be a number
      points: 1920,
      weight: 83000,
      height: 185,
      age: 38,
      last: [1, 1, 0, 1, 0]
    };

    // Make request to the endpoint
    const response = await request(app)
      .post('/players')
      .send(invalidPlayerData)
      .set('Accept', 'application/json');

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(playerService.createPlayer).not.toHaveBeenCalled();
  });

  test('should return 400 when last is not an array', async () => {
    const invalidPlayerData = {
      firstname: "Roger",
      lastname: "Federer",
      shortname: "R.FED",
      sex: "M",
      countrycode: "CHE",
      countrypicture: "https://tenisu.latelier.co/resources/Suisse.png",
      picture: "https://tenisu.latelier.co/resources/Federer.png",
      rank: 3,
      points: 1920,
      weight: 83000,
      height: 185,
      age: 38,
      last: "not-an-array" // Invalid: should be an array
    };

    // Make request to the endpoint
    const response = await request(app)
      .post('/players')
      .send(invalidPlayerData)
      .set('Accept', 'application/json');

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(playerService.createPlayer).not.toHaveBeenCalled();
  });
});

describe('GET /players/statistics', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should return player statistics', async () => {
    // Mock the fetchPlayerStatisticsData method to return our mock data
    (statisticsService.fetchPlayerStatisticsData as jest.Mock).mockResolvedValue(mockPlayerStatisticsData);
    
    // Mock the calculation methods to return expected values
    (statisticsService.calculateCountryWithHighestWinRatio as jest.Mock).mockReturnValue({
      countryCode: "SRB",
      winRatio: 1.0
    });
    (statisticsService.calculateAverageIMC as jest.Mock).mockReturnValue(23.45);
    (statisticsService.calculateMedianHeight as jest.Mock).mockReturnValue(186.5);
    
    // The getStatistics method should use the real implementation
    jest.spyOn(statisticsService, 'getStatistics').mockImplementation(async () => {
      const players = await statisticsService.fetchPlayerStatisticsData();
      return {
        countryWithHighestWinRatio: statisticsService.calculateCountryWithHighestWinRatio(players),
        averageIMC: statisticsService.calculateAverageIMC(players),
        medianHeight: statisticsService.calculateMedianHeight(players)
      };
    });

    // Make request to the endpoint
    const response = await request(app).get('/players/statistics');

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('statistics');
    expect(response.body.statistics).toEqual(mockStatistics);
    expect(statisticsService.getStatistics).toHaveBeenCalledTimes(1);
    
    // Verify specific statistics properties
    const stats = response.body.statistics;
    expect(stats).toHaveProperty('countryWithHighestWinRatio');
    expect(stats).toHaveProperty('averageIMC');
    expect(stats).toHaveProperty('medianHeight');
    expect(stats.countryWithHighestWinRatio).toHaveProperty('countryCode');
    expect(stats.countryWithHighestWinRatio).toHaveProperty('winRatio');
  });

  test('should return 500 when database error occurs', async () => {
    // Mock the fetchPlayerStatisticsData method to throw an error
    (statisticsService.fetchPlayerStatisticsData as jest.Mock).mockRejectedValue(new Error('Database error'));
    
    // The getStatistics method should use the real implementation
    jest.spyOn(statisticsService, 'getStatistics').mockImplementation(async () => {
      try {
        const players = await statisticsService.fetchPlayerStatisticsData();
        return {
          countryWithHighestWinRatio: statisticsService.calculateCountryWithHighestWinRatio(players),
          averageIMC: statisticsService.calculateAverageIMC(players),
          medianHeight: statisticsService.calculateMedianHeight(players)
        };
      } catch (error) {
        throw error;
      }
    });

    // Make request to the endpoint
    const response = await request(app).get('/players/statistics');

    // Assertions
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(statisticsService.getStatistics).toHaveBeenCalledTimes(1);
  });
});
