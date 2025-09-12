# Tennis Players API

A minimal Node.js Express API with TypeScript for retrieving tennis players data from a PostgreSQL database.

## Project Structure

```
/
├── src/
│   ├── config/
│   │   └── db.ts           # Database configuration
│   ├── routes/
│   │   └── players.ts      # Player routes
│   ├── services/
│   │   └── playerService.ts # Player service
│   ├── types/
│   │   └── player.ts       # Type definitions
│   ├── app.ts              # Express application setup
│   └── server.ts           # Server entry point
├── tests/
│   └── players.test.ts     # Tests for players endpoint
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Features

- RESTful API endpoint for retrieving players data
- Players sorted by rank (ASC) and points (DESC)
- Error handling
- Jest tests
- TypeScript for type safety

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

## Database Setup

The application expects a PostgreSQL database with a `players` table containing the following columns:

- id
- firstname
- lastname
- shortname
- sex
- rank
- points
- weight
- height
- age
- last (JSONB)
- countrycode
- countrypicture
- picture

You can create the table with the following SQL:

```sql
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  shortname VARCHAR(10),
  sex CHAR(1),
  rank INTEGER,
  points INTEGER,
  weight INTEGER,
  height INTEGER,
  age INTEGER,
  last JSONB,
  countrycode VARCHAR(3),
  countrypicture VARCHAR(255),
  picture VARCHAR(255)
);
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Update the database configuration in `src/config/db.ts` with your PostgreSQL credentials.

## Running the Application

Development mode:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Production mode:

```bash
npm start
```

## Testing

Run the tests:

```bash
npm test
```

## API Endpoints

### GET /players

Returns a list of all players sorted by rank (ASC) and points (DESC) when no query parameters are provided, or returns a specific player when the `id` query parameter is specified.

**Query Parameters:**

- `id` (optional) - Player ID to retrieve a specific player

**Response (without id parameter):**

```json
{
  "players": [
    {
      "id": 17,
      "firstname": "Rafael",
      "lastname": "Nadal",
      "shortname": "R.NAD",
      "sex": "M",
      "rank": 1,
      "points": 1982,
      "weight": 85000,
      "height": 185,
      "age": 33,
      "last": [1, 0, 0, 0, 1],
      "countrycode": "ESP",
      "countrypicture": "https://tenisu.latelier.co/resources/Espagne.png",
      "picture": "https://tenisu.latelier.co/resources/Nadal.png"
    },
    // More players...
  ]
}
```

**Response (with id parameter):**

```json
{
  "player": {
    "id": 17,
    "firstname": "Rafael",
    "lastname": "Nadal",
    "shortname": "R.NAD",
    "sex": "M",
    "rank": 1,
    "points": 1982,
    "weight": 85000,
    "height": 185,
    "age": 33,
    "last": [1, 0, 0, 0, 1],
    "countrycode": "ESP",
    "countrypicture": "https://tenisu.latelier.co/resources/Espagne.png",
    "picture": "https://tenisu.latelier.co/resources/Nadal.png"
  }
}
```

**Examples:**
- `GET /players` - Returns all players
- `GET /players?id=17` - Returns the player with ID 17

**Error Responses:**

- `400 Bad Request` - If the ID is not a valid number
- `404 Not Found` - If no player with the specified ID exists
- `500 Internal Server Error` - If a server error occurs
