/**
 * Unit tests for the statistics service
 * Focus on edge cases and incoherent DB values
 */
import {
  calculateAverageIMC,
  calculateCountryWithHighestWinRatio,
  calculateMedianHeight,
  getStatistics,
  fetchPlayerStatisticsData
} from '../src/services/statisticsService';
import { PlayerStatisticsData } from '../src/types/player';
import { Statistics } from '../src/types/statistics';
import { query } from '../src/config/db';

// Mock the database query function
jest.mock('../src/config/db', () => ({
  query: jest.fn()
}));

describe('Statistics Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAverageIMC', () => {
    test('should return null when no players are provided', () => {
      const result = calculateAverageIMC([]);
      expect(result).toBeNull();
    });

    test('should ignore players with weight = 0', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 0, height: 180, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'USA', points: 100 }
      ];
      const result = calculateAverageIMC(players);
      // Only the second player should be considered
      expect(result).toBeCloseTo(80000 / 1000 / ((180 / 100) * (180 / 100)), 2);
    });

    test('should ignore players with height <= 0', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: -1, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 0, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'USA', points: 100 }
      ];
      const result = calculateAverageIMC(players);
      // Only the third player should be considered
      expect(result).toBeCloseTo(80000 / 1000 / ((180 / 100) * (180 / 100)), 2);
    });

    test('should handle NaN and Infinity values', () => {
      const players: PlayerStatisticsData[] = [
        { weight: NaN, height: 180, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: NaN, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: Infinity, height: 180, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: Infinity, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'USA', points: 100 }
      ];
      const result = calculateAverageIMC(players);
      
      // Calculate the expected IMC for the fifth player
      const weightInKg = 80000 / 1000; // 80 kg
      const heightInM = 180 / 100; // 1.8 m
      const expectedIMC = weightInKg / (heightInM * heightInM); // 24.69
      
      // Only the fifth player should be considered
      expect(result).toBeCloseTo(expectedIMC, 2);
    });

    test('should return null if no valid players are found', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 0, height: 180, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 0, last: [1, 0], countrycode: 'USA', points: 100 }
      ];
      const result = calculateAverageIMC(players);
      expect(result).toBeNull();
    });
  });

  describe('calculateCountryWithHighestWinRatio', () => {
    test('should return null when no players are provided', () => {
      const result = calculateCountryWithHighestWinRatio([]);
      expect(result).toBeNull();
    });

    test('should handle players with null last array', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: 180, last: [], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'FRA', points: 100 }
      ];
      const result = calculateCountryWithHighestWinRatio(players);
      expect(result).not.toBeNull();
      expect(result?.countryCode).toBe('FRA');
      expect(result?.winRatio).toBe(0.5); // 1 win out of 2 games
    });

    test('should handle players with empty last array', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: 180, last: [], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [], countrycode: 'FRA', points: 100 }
      ];
      const result = calculateCountryWithHighestWinRatio(players);
      expect(result).not.toBeNull();
      // With no games played, countries are compared by points, then by country code
      expect(result?.countryCode).toBe('FRA'); // FRA comes before USA lexicographically
      expect(result?.winRatio).toBe(0);
      expect(result?.games).toBe(0);
    });

    test('should handle null points', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'USA', points: 0 },
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'FRA', points: 100 }
      ];
      const result = calculateCountryWithHighestWinRatio(players);
      expect(result).not.toBeNull();
      // Both countries have the same win ratio (0.5), but FRA has more points
      expect(result?.countryCode).toBe('FRA');
    });

    test('should prefer country with more games when win ratio is equal', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [1, 1, 0, 0], countrycode: 'FRA', points: 100 }
      ];
      const result = calculateCountryWithHighestWinRatio(players);
      expect(result).not.toBeNull();
      // Both countries have the same win ratio (0.5), but FRA has more games
      expect(result?.countryCode).toBe('FRA');
      expect(result?.games).toBe(4);
    });

    test('should prefer country with more points when win ratio and games are equal', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'FRA', points: 200 }
      ];
      const result = calculateCountryWithHighestWinRatio(players);
      expect(result).not.toBeNull();
      // Both countries have the same win ratio (0.5) and games (2), but FRA has more points
      expect(result?.countryCode).toBe('FRA');
    });

    test('should prefer country with lexicographically smaller code when all else is equal', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'FRA', points: 100 }
      ];
      const result = calculateCountryWithHighestWinRatio(players);
      expect(result).not.toBeNull();
      // Both countries have the same win ratio (0.5), games (2), and points (100), but FRA comes before USA lexicographically
      expect(result?.countryCode).toBe('FRA');
    });
  });

  describe('calculateMedianHeight', () => {
    test('should return null when no players are provided', () => {
      const result = calculateMedianHeight([]);
      expect(result).toBeNull();
    });

    test('should handle non-numeric height values', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: NaN, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'FRA', points: 100 }
      ];
      const result = calculateMedianHeight(players);
      expect(result).toBe(180);
    });

    test('should return null if all height values are invalid', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: NaN, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: Infinity, last: [1, 0], countrycode: 'FRA', points: 100 }
      ];
      const result = calculateMedianHeight(players);
      expect(result).toBeNull();
    });

    test('should calculate median correctly for odd number of players', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: 170, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'FRA', points: 100 },
        { weight: 80000, height: 190, last: [1, 0], countrycode: 'ESP', points: 100 }
      ];
      const result = calculateMedianHeight(players);
      expect(result).toBe(180);
    });

    test('should calculate median correctly for even number of players', () => {
      const players: PlayerStatisticsData[] = [
        { weight: 80000, height: 170, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'FRA', points: 100 },
        { weight: 80000, height: 190, last: [1, 0], countrycode: 'ESP', points: 100 },
        { weight: 80000, height: 200, last: [1, 0], countrycode: 'GER', points: 100 }
      ];
      const result = calculateMedianHeight(players);
      expect(result).toBe(185); // (180 + 190) / 2
    });
  });

  describe('fetchPlayerStatisticsData', () => {
    test('should handle database errors', async () => {
      (query as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      await expect(fetchPlayerStatisticsData()).rejects.toThrow('Database error');
    });

    test('should transform database rows correctly', async () => {
      const mockRows = [
        { weight: '80000', height: '180', last: [1, 0], countrycode: 'USA', points: '100' },
        { weight: '70000', height: '170', last: null, countrycode: 'FRA', points: null }
      ];
      
      (query as jest.Mock).mockResolvedValue({ rows: mockRows });
      
      const result = await fetchPlayerStatisticsData();
      
      expect(result).toEqual([
        { weight: 80000, height: 180, last: [1, 0], countrycode: 'USA', points: 100 },
        { weight: 70000, height: 170, last: [], countrycode: 'FRA', points: 0 }
      ]);
    });
  });

  describe('getStatistics', () => {
    test('should return statistics object with null values when no players are found', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await getStatistics();
      
      expect(result).toEqual({
        countryWithHighestWinRatio: null,
        averageIMC: null,
        medianHeight: null
      });
    });

    test('should handle database errors', async () => {
      (query as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      await expect(getStatistics()).rejects.toThrow('Database error');
    });

    test('should calculate statistics correctly', async () => {
      const mockRows = [
        { weight: '80000', height: '180', last: [1, 0], countrycode: 'USA', points: '100' },
        { weight: '70000', height: '170', last: [1, 1], countrycode: 'FRA', points: '200' }
      ];
      
      (query as jest.Mock).mockResolvedValue({ rows: mockRows });
      
      const result = await getStatistics();
      
      expect(result.countryWithHighestWinRatio).not.toBeNull();
      expect(result.countryWithHighestWinRatio?.countryCode).toBe('FRA');
      expect(result.countryWithHighestWinRatio?.winRatio).toBe(1);
      expect(result.averageIMC).not.toBeNull();
      expect(result.medianHeight).toBe(175); // (170 + 180) / 2
    });
  });
});
