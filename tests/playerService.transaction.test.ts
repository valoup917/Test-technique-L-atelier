/**
 * Tests for the playerService module - Transaction handling tests
 */
import { query, pool } from '../src/config/db';
import { createPlayer } from '../src/services/playerService';
import { Player } from '../src/types/player';

// Mock the database functions
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  }
}));

describe('createPlayer - Transaction Tests', () => {
  // Sample valid player data
  const validPlayer: Player = {
    id: 100,
    firstname: "Roger",
    lastname: "Federer",
    shortname: "R.FED",
    sex: "M",
    countrycode: "CHE",
    countrypicture: "https://example.com/che.png",
    picture: "https://example.com/federer.png",
    rank: 3,
    points: 1920,
    weight: 83000,
    height: 185,
    age: 38,
    last: [1, 1, 0, 1, 0]
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should handle transaction abortion', async () => {
    // Simulate a transaction abortion scenario
    
    // Mock the connection client to simulate a transaction
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    
    // Mock transaction operations
    mockClient.query.mockImplementation((sql: string, params?: any[]) => {
      if (sql.includes('BEGIN')) {
        return Promise.resolve();
      } else if (sql.includes('ROLLBACK')) {
        return Promise.resolve();
      } else if (sql.includes('COMMIT')) {
        // Simulate commit failure
        return Promise.reject(new Error('Failed to commit transaction'));
      } else {
        // For the INSERT query
        return Promise.resolve({ rows: [validPlayer] });
      }
    });
    
    // Mock pool.connect to return our mock client
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    
    // Modify the query implementation to use client.query for testing transaction handling
    (query as jest.Mock).mockImplementation(async (sql: string, params?: any[]) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query(sql, params);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    // Expect the function to throw due to commit failure
    await expect(createPlayer(validPlayer)).rejects.toThrow('Failed to commit transaction');

    // Verify the transaction operations were called
    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO players'), expect.any(Array));
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  test('should handle client connection failure', async () => {
    // Simulate a connection failure
    const connectionError = new Error('Connection refused');
    
    // Mock pool.connect to fail
    (pool.connect as jest.Mock).mockRejectedValue(connectionError);

    // Mock query to use pool.connect and fail
    (query as jest.Mock).mockImplementation(async () => {
      await pool.connect();
      return Promise.resolve({ rows: [validPlayer] }); // This won't be reached
    });

    // Expect the function to throw
    await expect(createPlayer(validPlayer)).rejects.toThrow('Connection refused');

    // Verify connect was called but no transaction methods were called
    expect(pool.connect).toHaveBeenCalledTimes(1);
  });

  test('should handle pool exhaustion', async () => {
    // Simulate pool exhaustion error
    const poolError = new Error('Connection pool exhausted');
    
    // Mock pool.connect to simulate pool exhaustion
    (pool.connect as jest.Mock).mockRejectedValue(poolError);

    // Mock query to use pool.connect
    (query as jest.Mock).mockImplementation(async () => {
      await pool.connect();
      return Promise.resolve({ rows: [validPlayer] }); // This won't be reached
    });

    // Expect the function to throw
    await expect(createPlayer(validPlayer)).rejects.toThrow('Connection pool exhausted');

    // Verify connect was called but no transaction methods were called
    expect(pool.connect).toHaveBeenCalledTimes(1);
  });

  test('should handle transaction lock wait timeout', async () => {
    // Create lock timeout error
    const lockTimeoutError: any = new Error('lock wait timeout exceeded');
    lockTimeoutError.code = '40P01'; // Could be different depending on the database

    // Mock the query function to throw the lock timeout error
    (query as jest.Mock).mockRejectedValue(lockTimeoutError);

    // Call the function and expect it to throw
    await expect(createPlayer(validPlayer)).rejects.toThrow('lock wait timeout exceeded');

    expect(query).toHaveBeenCalledTimes(1);
  });
});
