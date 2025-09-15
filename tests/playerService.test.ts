/**
 * Tests for the playerService module
 * Comprehensive test suite for the createPlayer function
 * Includes edge cases, unusual inputs, and error scenarios
 */
import { query } from '../src/config/db';
import { createPlayer } from '../src/services/playerService';
import { Player } from '../src/types/player';

// Mock the database query function
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
}));

describe('createPlayer', () => {
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

  // Create a set of players for edge case testing
  const extremeValuePlayer: Player = {
    id: Number.MAX_SAFE_INTEGER, // Extreme ID value
    firstname: "X".repeat(1000), // Very long firstname
    lastname: "Y".repeat(1000),  // Very long lastname
    shortname: "X.YYY",
    sex: "M",
    countrycode: "ZZZ",
    countrypicture: "https://example.com/".repeat(50) + "image.png", // Very long URL
    picture: "https://example.com/".repeat(50) + "player.png",
    rank: Number.MAX_SAFE_INTEGER, // Extreme rank
    points: Number.MAX_SAFE_INTEGER, // Extreme points
    weight: Number.MAX_SAFE_INTEGER, // Extreme weight
    height: Number.MAX_SAFE_INTEGER, // Extreme height
    age: 200, // Unrealistic age
    last: Array(1000).fill(1) // Very large array
  };

  const specialCharsPlayer: Player = {
    id: 101,
    firstname: "John-O'Connor; --DROP TABLE",  // SQL injection attempt + special chars
    lastname: "<script>alert('XSS')</script>", // XSS attempt
    shortname: "J.O'C",
    sex: "M",
    countrycode: "USA",
    countrypicture: "https://example.com/usa.png?param=value&param2=value2", // URL with query params
    picture: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA", // Data URL
    rank: 10,
    points: 1500,
    weight: 75000,
    height: 180,
    age: 30,
    last: [1, null as any, undefined as any, 0, "string" as any] // Invalid array contents
  };

  const unicodePlayer: Player = {
    id: 102,
    firstname: "Björn",  // Unicode characters
    lastname: "Émilie Çedille 你好", // Mixed script
    shortname: "B.ÉÇ你",
    sex: "M",
    countrycode: "🇸🇪", // Flag emoji (not a valid country code)
    countrypicture: "https://example.com/sweden.png",
    picture: "https://example.com/borg.png",
    rank: 5,
    points: 1800,
    weight: 78000,
    height: 182,
    age: 25,
    last: [1, 1, 1, 1, 1]
  };

  const boundaryValuesPlayer: Player = {
    id: 0, // Boundary value for ID (assuming positive integers)
    firstname: "",  // Empty string
    lastname: "",   // Empty string
    shortname: "A.A", // Minimal length
    sex: "F",
    countrycode: "AAA",
    countrypicture: "",  // Empty string
    picture: "",         // Empty string
    rank: 1,             // Minimum valid rank per constraint
    points: 0,           // Minimum valid points per constraint
    weight: 1,           // Minimum valid weight per constraint
    height: 1,           // Minimum valid height per constraint
    age: 1,              // Minimum valid age per constraint
    last: []             // Empty array
  };

  const minimalPlayer: Player = {
    id: 103,
    firstname: "A",   // Single character
    lastname: "B",    // Single character
    shortname: "A.B", // Minimal valid format
    sex: "M",
    countrycode: "ABC",
    countrypicture: "x",  // Single character
    picture: "y",         // Single character
    rank: 1000,
    points: 1,
    weight: 10,
    height: 10,
    age: 10,
    last: [0]             // Single element array
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should successfully create a player', async () => {
    // Mock successful query response
    (query as jest.Mock).mockResolvedValue({
      rows: [validPlayer]
    });

    // Call the function
    const result = await createPlayer(validPlayer);

    // Assertions
    expect(result).toEqual(validPlayer);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO players'),
      expect.arrayContaining([
        validPlayer.id,
        validPlayer.firstname,
        validPlayer.lastname,
        validPlayer.shortname,
        validPlayer.sex,
        validPlayer.rank,
        validPlayer.points,
        validPlayer.weight,
        validPlayer.height,
        validPlayer.age,
        JSON.stringify(validPlayer.last),
        validPlayer.countrycode,
        validPlayer.countrypicture,
        validPlayer.picture,
      ])
    );
  });

  test('should throw error with status 409 when shortname already exists', async () => {
    // Create error object similar to PostgreSQL unique violation
    const pgError: any = new Error('duplicate key value violates unique constraint "players_shortname_uk"');
    pgError.code = '23505';
    pgError.constraint = 'players_shortname_uk';

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Call the function and expect it to throw
    await expect(createPlayer(validPlayer)).rejects.toMatchObject({
      status: 409,
      publicMessage: 'Player already exists',
      code: '23505'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should throw error with status 409 when player with same ID already exists', async () => {
    // Create error object similar to PostgreSQL unique violation for primary key
    const pgError: any = new Error('duplicate key value violates unique constraint "players_pkey"');
    pgError.code = '23505';
    pgError.constraint = 'players_pkey';

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Call the function and expect it to throw
    await expect(createPlayer(validPlayer)).rejects.toMatchObject({
      status: 409,
      publicMessage: 'Player already exists',
      code: '23505'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should throw error with status 400 when check constraint is violated', async () => {
    // Create error object similar to PostgreSQL check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_rank_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Call the function and expect it to throw
    await expect(createPlayer({
      ...validPlayer,
      rank: -1 // Invalid rank (should be >= 1)
    })).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should throw error with status 400 when not null constraint is violated', async () => {
    // Create error object similar to PostgreSQL not null violation
    const pgError: any = new Error('null value in column "firstname" violates not-null constraint');
    pgError.code = '23502'; // not_null_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Call the function with invalid data (missing required field)
    const invalidPlayer = { ...validPlayer };
    delete (invalidPlayer as any).firstname;

    await expect(createPlayer(invalidPlayer as Player)).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23502'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should throw error with status 500 for unknown database errors', async () => {
    // Create generic database error
    const dbError: any = new Error('connection refused');
    dbError.code = 'ECONNREFUSED';

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(dbError);

    // Call the function and expect it to throw
    await expect(createPlayer(validPlayer)).rejects.toMatchObject({
      status: 500,
      publicMessage: 'Database error'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle serialization of last array correctly', async () => {
    // Mock successful query response
    (query as jest.Mock).mockResolvedValue({
      rows: [validPlayer]
    });

    // Call the function
    await createPlayer(validPlayer);

    // Verify the last array was properly serialized to JSON
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([JSON.stringify(validPlayer.last)])
    );
  });

  test('should throw original error if error object does not match known patterns', async () => {
    // Create a custom error that doesn't match our handled cases
    const customError = new Error('Unexpected error');

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(customError);

    // Call the function and expect it to throw the original error
    await expect(createPlayer(validPlayer)).rejects.toThrow('Unexpected error');

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should add status and publicMessage properties to known errors', async () => {
    // Create error object for unique violation
    const pgError: any = new Error('duplicate key value violates unique constraint');
    pgError.code = '23505'; // unique_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Call the function and expect it to add our custom properties
    try {
      await createPlayer(validPlayer);
      fail('Expected error was not thrown');
    } catch (err: any) {
      expect(err).toHaveProperty('status', 409);
      expect(err).toHaveProperty('publicMessage', 'Player already exists');
      expect(err).toHaveProperty('code', '23505');
    }

    expect(query).toHaveBeenCalledTimes(1);
  });

  // Additional edge case tests
  
  test('should handle player with extreme values', async () => {
    // Mock successful query response
    (query as jest.Mock).mockResolvedValue({
      rows: [extremeValuePlayer]
    });

    // Call the function
    const result = await createPlayer(extremeValuePlayer);

    // Assertions
    expect(result).toEqual(extremeValuePlayer);
    expect(query).toHaveBeenCalledTimes(1);
    
    // Verify the correct SQL parameter count
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        extremeValuePlayer.id,
        extremeValuePlayer.firstname,
        extremeValuePlayer.lastname,
        extremeValuePlayer.shortname
        // other fields omitted for brevity
      ])
    );
  });

  test('should handle player with special characters and potential SQL injection', async () => {
    // Mock successful query response
    (query as jest.Mock).mockResolvedValue({
      rows: [specialCharsPlayer]
    });

    // Call the function
    const result = await createPlayer(specialCharsPlayer);

    // Assertions
    expect(result).toEqual(specialCharsPlayer);
    expect(query).toHaveBeenCalledTimes(1);
    
    // Verify SQL injection strings are passed as parameters (safe)
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        specialCharsPlayer.firstname,
        specialCharsPlayer.lastname
      ])
    );
  });

  test('should handle player with Unicode characters', async () => {
    // Mock successful query response
    (query as jest.Mock).mockResolvedValue({
      rows: [unicodePlayer]
    });

    // Call the function
    const result = await createPlayer(unicodePlayer);

    // Assertions
    expect(result).toEqual(unicodePlayer);
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle player with boundary values', async () => {
    // Mock successful query response
    (query as jest.Mock).mockResolvedValue({
      rows: [boundaryValuesPlayer]
    });

    // Call the function
    const result = await createPlayer(boundaryValuesPlayer);

    // Assertions
    expect(result).toEqual(boundaryValuesPlayer);
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle player with minimal valid values', async () => {
    // Mock successful query response
    (query as jest.Mock).mockResolvedValue({
      rows: [minimalPlayer]
    });

    // Call the function
    const result = await createPlayer(minimalPlayer);

    // Assertions
    expect(result).toEqual(minimalPlayer);
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle invalid sex values', async () => {
    // Create error object for check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_sex_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Create a player with invalid sex value
    const invalidSexPlayer = { 
      ...validPlayer,
      sex: 'X' as any // Invalid sex value, should be 'M' or 'F'
    };

    // Call the function and expect it to throw
    await expect(createPlayer(invalidSexPlayer)).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle invalid country code (length)', async () => {
    // Create error object for check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_countrycode_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Create a player with invalid country code
    const invalidCountryCodePlayer = { 
      ...validPlayer,
      countrycode: 'US' // Too short, should be 3 chars
    };

    // Call the function and expect it to throw
    await expect(createPlayer(invalidCountryCodePlayer)).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle invalid country code (not uppercase)', async () => {
    // Create error object for check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_countrycode_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Create a player with invalid country code
    const invalidCountryCodePlayer = { 
      ...validPlayer,
      countrycode: 'usa' // Lowercase, should be uppercase
    };

    // Call the function and expect it to throw
    await expect(createPlayer(invalidCountryCodePlayer)).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle negative rank', async () => {
    // Create error object for check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_rank_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Create a player with invalid rank
    const invalidRankPlayer = { 
      ...validPlayer,
      rank: -5 // Negative, should be >= 1
    };

    // Call the function and expect it to throw
    await expect(createPlayer(invalidRankPlayer)).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle negative points', async () => {
    // Create error object for check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_points_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Create a player with invalid points
    const invalidPointsPlayer = { 
      ...validPlayer,
      points: -100 // Negative, should be >= 0
    };

    // Call the function and expect it to throw
    await expect(createPlayer(invalidPointsPlayer)).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle zero or negative weight', async () => {
    // Create error object for check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_weight_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Create a player with invalid weight
    const invalidWeightPlayer = { 
      ...validPlayer,
      weight: 0 // Zero, should be > 0
    };

    // Call the function and expect it to throw
    await expect(createPlayer(invalidWeightPlayer)).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle zero or negative height', async () => {
    // Create error object for check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_height_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Create a player with invalid height
    const invalidHeightPlayer = { 
      ...validPlayer,
      height: 0 // Zero, should be > 0
    };

    // Call the function and expect it to throw
    await expect(createPlayer(invalidHeightPlayer)).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle zero or negative age', async () => {
    // Create error object for check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_age_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Create a player with invalid age
    const invalidAgePlayer = { 
      ...validPlayer,
      age: 0 // Zero, should be > 0
    };

    // Call the function and expect it to throw
    await expect(createPlayer(invalidAgePlayer)).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle invalid last array type', async () => {
    // Create error object for check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_last_type_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Call the function and expect it to throw
    await expect(createPlayer({
      ...validPlayer,
      last: 123 as any // Not an array
    })).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle invalid values in last array', async () => {
    // Create error object for check constraint violation
    const pgError: any = new Error('new row for relation "players" violates check constraint "players_last_values_chk"');
    pgError.code = '23514'; // check_violation

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(pgError);

    // Call the function and expect it to throw
    await expect(createPlayer({
      ...validPlayer,
      last: [1, 0, 2, 0, 1] // Contains 2, which is invalid (should be 0 or 1)
    })).rejects.toMatchObject({
      status: 400,
      publicMessage: 'Invalid player data (constraint violation)',
      code: '23514'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle database deadlock error', async () => {
    // Create deadlock error (common in concurrent transactions)
    const deadlockError: any = new Error('deadlock detected');
    deadlockError.code = '40P01'; // deadlock_detected

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(deadlockError);

    // Call the function and expect it to throw with generic 500 error
    // (since it's not explicitly handled in the switch statement)
    await expect(createPlayer(validPlayer)).rejects.toMatchObject({
      status: 500,
      publicMessage: 'Database error'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle database connection timeout', async () => {
    // Create timeout error
    const timeoutError: any = new Error('canceling statement due to statement timeout');
    timeoutError.code = '57014'; // query_canceled

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(timeoutError);

    // Call the function and expect it to throw with generic 500 error
    await expect(createPlayer(validPlayer)).rejects.toMatchObject({
      status: 500,
      publicMessage: 'Database error'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle database out of memory error', async () => {
    // Create out of memory error
    const outOfMemoryError: any = new Error('out of memory');
    outOfMemoryError.code = '53200'; // out_of_memory

    // Mock query to throw the error
    (query as jest.Mock).mockRejectedValue(outOfMemoryError);

    // Call the function and expect it to throw with generic 500 error
    await expect(createPlayer(validPlayer)).rejects.toMatchObject({
      status: 500,
      publicMessage: 'Database error'
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle very large player object', async () => {
    // Create a player with very large values to test performance/memory
    const largePlayer: Player = {
      ...validPlayer,
      firstname: "X".repeat(100000), // Extremely large string
      lastname: "Y".repeat(100000),  // Extremely large string
      last: Array(10000).fill(1)    // Very large array
    };

    // Mock successful query response
    (query as jest.Mock).mockResolvedValue({
      rows: [largePlayer]
    });

    // Call the function
    const result = await createPlayer(largePlayer);

    // Assertions
    expect(result).toEqual(largePlayer);
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle when query returns unexpected empty result', async () => {
    // Mock query to return empty rows (no player created/returned)
    (query as jest.Mock).mockResolvedValue({
      rows: []
    });

    // Call the function and expect the result to be undefined
    const result = await createPlayer(validPlayer);
    expect(result).toBeUndefined();
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('should handle when query returns multiple rows (unexpected)', async () => {
    // Mock query to return multiple rows (shouldn't happen with INSERT...RETURNING)
    (query as jest.Mock).mockResolvedValue({
      rows: [validPlayer, {...validPlayer, id: 101}]
    });

    // Call the function
    const result = await createPlayer(validPlayer);

    // Should return only the first row
    expect(result).toEqual(validPlayer);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
