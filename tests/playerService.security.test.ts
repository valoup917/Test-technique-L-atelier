/**
 * Security-focused tests for the playerService module
 * These tests verify that the createPlayer function is resilient against SQL injection and other security issues
 */
import { query } from '../src/config/db';
import { createPlayer } from '../src/services/playerService';
import { Player } from '../src/types/player';

// Mock the database query function
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
}));

describe('createPlayer - Security Tests', () => {
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
    
    // Default mock for successful query
    (query as jest.Mock).mockResolvedValue({
      rows: [validPlayer]
    });
  });

  test('should safely handle SQL injection in firstname', async () => {
    // Create a player with SQL injection attempt in firstname
    const sqlInjectionPlayer = {
      ...validPlayer,
      firstname: "Robert'); DROP TABLE players; --"
    };

    // Call the function
    await createPlayer(sqlInjectionPlayer);

    // Verify that the SQL injection string was passed as a parameter, not interpolated
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([sqlInjectionPlayer.firstname])
    );

    // Verify the query doesn't contain the raw SQL injection string
    const queryCall = (query as jest.Mock).mock.calls[0];
    const sqlQuery = queryCall[0];
    expect(sqlQuery).not.toContain("Robert'); DROP TABLE players; --");
  });

  test('should safely handle SQL injection in lastname', async () => {
    // Create a player with SQL injection attempt in lastname
    const sqlInjectionPlayer = {
      ...validPlayer,
      lastname: "Smith; DELETE FROM players; SELECT * FROM players; --"
    };

    // Call the function
    await createPlayer(sqlInjectionPlayer);

    // Verify that the SQL injection string was passed as a parameter, not interpolated
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([sqlInjectionPlayer.lastname])
    );
  });

  test('should safely handle SQL injection in shortname', async () => {
    // Create a player with SQL injection attempt in shortname
    const sqlInjectionPlayer = {
      ...validPlayer,
      shortname: "R.FED'; TRUNCATE TABLE players; --"
    };

    // Call the function
    await createPlayer(sqlInjectionPlayer);

    // Verify that the SQL injection string was passed as a parameter, not interpolated
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([sqlInjectionPlayer.shortname])
    );
  });

  test('should safely handle UNION-based SQL injection', async () => {
    // Create a player with UNION-based SQL injection attempt
    const sqlInjectionPlayer = {
      ...validPlayer,
      firstname: "Roger' UNION SELECT username, password FROM users; --"
    };

    // Call the function
    await createPlayer(sqlInjectionPlayer);

    // Verify that the SQL injection string was passed as a parameter, not interpolated
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([sqlInjectionPlayer.firstname])
    );
  });

  test('should safely handle batch SQL injection', async () => {
    // Create a player with batch SQL injection attempt
    const sqlInjectionPlayer = {
      ...validPlayer,
      firstname: "Roger",
      lastname: "Federer; INSERT INTO players (id, firstname) VALUES (999, 'Hacker');"
    };

    // Call the function
    await createPlayer(sqlInjectionPlayer);

    // Verify that the SQL injection string was passed as a parameter, not interpolated
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([sqlInjectionPlayer.lastname])
    );
  });

  test('should safely handle timing-based blind SQL injection', async () => {
    // Create a player with timing-based blind SQL injection attempt
    const sqlInjectionPlayer = {
      ...validPlayer,
      firstname: "Roger' AND (SELECT pg_sleep(5)) --"
    };

    // Call the function
    await createPlayer(sqlInjectionPlayer);

    // Verify that the SQL injection string was passed as a parameter, not interpolated
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([sqlInjectionPlayer.firstname])
    );
  });

  test('should safely handle Boolean-based blind SQL injection', async () => {
    // Create a player with Boolean-based blind SQL injection attempt
    const sqlInjectionPlayer = {
      ...validPlayer,
      firstname: "Roger' AND (SELECT 1 FROM players WHERE firstname='Admin' LIMIT 1) --"
    };

    // Call the function
    await createPlayer(sqlInjectionPlayer);

    // Verify that the SQL injection string was passed as a parameter, not interpolated
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([sqlInjectionPlayer.firstname])
    );
  });

  test('should safely handle error-based SQL injection', async () => {
    // Create a player with error-based SQL injection attempt
    const sqlInjectionPlayer = {
      ...validPlayer,
      firstname: "Roger' AND CAST((SELECT version()) AS integer) --"
    };

    // Call the function
    await createPlayer(sqlInjectionPlayer);

    // Verify that the SQL injection string was passed as a parameter, not interpolated
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([sqlInjectionPlayer.firstname])
    );
  });

  test('should safely handle XSS attempts in player data', async () => {
    // Create a player with XSS attempt
    const xssAttemptPlayer = {
      ...validPlayer,
      firstname: "<script>alert('XSS')</script>",
      lastname: "<img src=\"javascript:alert('XSS');\">",
      picture: "javascript:alert('XSS')"
    };

    // Call the function
    await createPlayer(xssAttemptPlayer);

    // Verify the data was properly passed as parameters without modification
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        xssAttemptPlayer.firstname,
        xssAttemptPlayer.lastname,
        xssAttemptPlayer.picture
      ])
    );
  });

  test('should safely handle object injection attempts', async () => {
    // Create a player with an attempted object injection
    const objectInjectionPlayer = {
      ...validPlayer,
      firstname: JSON.stringify({ $ne: null }),  // MongoDB NoSQL injection style
      lastname: "Federer"
    };

    // Call the function
    await createPlayer(objectInjectionPlayer);

    // Verify the data was properly passed as a string parameter
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([objectInjectionPlayer.firstname])
    );
  });

  test('should safely handle null byte injection attempts', async () => {
    // Create a player with null byte injection attempt
    const nullByteInjectionPlayer = {
      ...validPlayer,
      firstname: "Roger\0malicious",  // Null byte injection attempt
      lastname: "Federer"
    };

    // Call the function
    await createPlayer(nullByteInjectionPlayer);

    // Verify the data was passed correctly as a parameter
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([nullByteInjectionPlayer.firstname])
    );
  });

  test('should safely handle escape character injection attempts', async () => {
    // Create a player with escape character injection attempt
    const escapeInjectionPlayer = {
      ...validPlayer,
      firstname: "Roger\\",  // Backslash to escape quotes
      lastname: "Federer\""  // Quote character
    };

    // Call the function
    await createPlayer(escapeInjectionPlayer);

    // Verify the data was passed correctly as parameters
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        escapeInjectionPlayer.firstname,
        escapeInjectionPlayer.lastname
      ])
    );
  });

  test('should safely handle extremely large input (buffer overflow attempt)', async () => {
    // Create a player with extremely large input to attempt buffer overflow
    const largeInputPlayer = {
      ...validPlayer,
      firstname: "A".repeat(1000000),  // Very large input
      lastname: "B".repeat(1000000)
    };

    // Call the function
    await createPlayer(largeInputPlayer);

    // Verify the large data was passed correctly as parameters
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        largeInputPlayer.firstname,
        largeInputPlayer.lastname
      ])
    );
  });
});
