# Tennis Players API

A minimal Node.js Express API with TypeScript for retrieving and managing tennis players data from a PostgreSQL database.

## Project Structure

```
/
├── src/
│   ├── config/
│   │   └── db.ts               # Database configuration
│   ├── routes/
│   │   └── players.ts          # Player routes
│   ├── services/
│   │   ├── playerService.ts    # Player service
│   │   └── statisticsService.ts # Statistics service
│   ├── swagger/                # Swagger documentation files
│   │   ├── definitions/        # Schema definitions
│   │   ├── paths/              # API path definitions
│   │   └── responses/          # Response definitions
│   ├── types/
│   │   ├── player.ts           # Player type definitions
│   │   └── statistics.ts       # Statistics type definitions
│   ├── app.ts                  # Express application setup
│   ├── swagger.ts              # Swagger configuration
│   └── server.ts               # Server entry point
├── tests/
│   ├── players.test.ts              # Tests for players endpoint
│   ├── playerService.test.ts        # Tests for player service (edge cases)
│   ├── playerService.transaction.test.ts # Tests for transaction handling
│   ├── playerService.security.test.ts    # Security-focused tests
│   └── statisticsService.test.ts    # Tests for statistics service
├── script/
│   ├── db_inserter.py          # Database setup script
│   └── requirements.txt        # Python dependencies for db_inserter
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
- Interactive API documentation with Swagger

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

## Database

The database is already set up and ready to use with the application.

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

Run all tests:

```bash
npm test
```

Run specific test files:

```bash
npm test tests/playerService.test.ts
```

Run multiple specific test files:

```bash
npm test tests/playerService.test.ts tests/playerService.security.test.ts
```

Run tests with a specific name pattern:

```bash
npm test -- --testNamePattern="should handle SQL injection"
```

Run tests with a specific file pattern:

```bash
npm test -- --testPathPattern=playerService
```

### Test Coverage

The tests cover various scenarios including:

- API endpoint functionality
- Player creation and retrieval
- Unique constraint handling (especially for shortname)
- Input validation and error handling
- Security protections against SQL injection
- Database transaction handling
- Edge cases and extreme values

## Docker Deployment

This project includes a Dockerfile for containerizing the application. Environment variables are managed using Doppler.

### Building the Docker Image

```bash
docker build -t tennis-players-api .
```

### Running with Doppler

[Doppler](https://www.doppler.com/) is used for managing environment variables. Make sure you have Doppler CLI installed and configured with your project.

```bash
# Run the container with environment variables injected by Doppler
doppler run -- docker run -p 3000:3000 tennis-players-api
```

### Required Environment Variables

The following environment variables should be configured in your Doppler project:

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - PostgreSQL database name
- `PORT` - Port for the API server (default: 3000)

## AWS Cloud Deployment

For the technical test, the application has been deployed on AWS using a containerized approach with high availability.

### Deployment Architecture

1. **Docker Image**: The application Docker image is pushed to Amazon ECR (Elastic Container Registry)

2. **Containerized Deployment**: 
   - Two ECS (Elastic Container Service) containers are deployed from the ECR image
   - This provides redundancy and high availability for the application

3. **Load Balancing**:
   - An AWS Application Load Balancer is placed in front of the containers
   - Containers are linked to the load balancer via a target group
   - This ensures even distribution of incoming traffic and failover capability

### Accessing the Cloud Deployment

The application is accessible via the load balancer URL:
```
http://test-latelier-lb-615418084.eu-west-3.elb.amazonaws.com
```

**Note**: Due to the AWS account being used for testing purposes, the Swagger UI documentation might take a bit longer to load on the first access. This is because the containers might be in a cold start state or the AWS resources might be operating at a lower performance tier for cost efficiency during testing. Subsequent requests should perform better.

## API Testing Tools

### Postman Collection

A Postman collection has been created for easy testing of the API endpoints. The collection includes pre-configured requests for all available endpoints.

**Access the Postman Collection:**
[Tennis Players API Postman Collection](https://galactic-crescent-687578.postman.co/workspace/My-Workspace~c7ce1027-dfb3-4a11-8d57-23502ac9946a/collection/19529255-beb9f848-c6ea-462b-bf19-b78a52b9850a?action=share&creator=19529255)

With this collection, you can:
- Test all API endpoints with pre-configured requests
- View example responses
- Modify request parameters easily
- Run the entire collection as a test suite

### Swagger Documentation

This project includes an interactive API documentation using Swagger UI that allows you to explore and test the API endpoints.

#### Accessing Swagger Documentation

When the application is running, you can access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

Or for the cloud deployment:

```
http://test-latelier-lb-615418084.eu-west-3.elb.amazonaws.com/api-docs
```

#### Features of the Swagger Documentation

- Interactive exploration of API endpoints
- Detailed schema information for request and response models
- Try out functionality to test API calls directly from the browser
- Downloadable OpenAPI specification in JSON format at `/swagger.json`

#### Swagger Structure

The Swagger documentation is organized in a modular way using YAML files:

- **Definitions**: Located in `src/swagger/definitions/` - These define the data models (Player, Statistics)
- **Paths**: Located in `src/swagger/paths/` - These define the API endpoints and operations
- **Responses**: Located in `src/swagger/responses/` - These define common API responses

This modular approach makes it easy to maintain and extend the API documentation as the project grows.

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

### POST /players

Creates a new player in the database.

**Request Body:**

```json
{
  "firstname": "Roger",
  "lastname": "Federer",
  "shortname": "R.FED",  // Must be unique
  "sex": "M",
  "countrycode": "CHE",
  "countrypicture": "https://tenisu.latelier.co/resources/Suisse.png",
  "picture": "https://tenisu.latelier.co/resources/Federer.png",
  "rank": 3,
  "points": 1920,
  "weight": 83000,
  "height": 185,
  "age": 38,
  "last": [1, 1, 0, 1, 0]
}
```

**Response:**

```json
{
  "player": {
    "id": 99,
    "firstname": "Roger",
    "lastname": "Federer",
    "shortname": "R.FED",
    "sex": "M",
    "countrycode": "CHE",
    "countrypicture": "https://tenisu.latelier.co/resources/Suisse.png",
    "picture": "https://tenisu.latelier.co/resources/Federer.png",
    "rank": 3,
    "points": 1920,
    "weight": 83000,
    "height": 185,
    "age": 38,
    "last": [1, 1, 0, 1, 0]
  }
}
```

**Error Responses:**

- `400 Bad Request` - If required fields are missing or invalid
- `409 Conflict` - If a player with the same shortname already exists
- `500 Internal Server Error` - If a server error occurs

### GET /players with ID Parameter

**Error Responses:**

- `400 Bad Request` - If the ID is not a valid number
- `404 Not Found` - If no player with the specified ID exists
- `500 Internal Server Error` - If a server error occurs

### GET /players/statistics

Returns statistics about the players:

- Country with the highest win ratio
- Average IMC (Body Mass Index) of all players
- Median height of all players

**Response:**

```json
{
  "statistics": {
    "countryWithHighestWinRatio": {
      "countryCode": "SRB",
      "winRatio": 1.0
    },
    "averageIMC": 23.45,
    "medianHeight": 186.5
  }
}
```

**Error Responses:**

- `500 Internal Server Error` - If a server error occurs

## Database Setup (Optional)

The database is already set up and ready to use with the application. However, if you need to reset or recreate the database, you can use the provided Python script.

### Recreating the Database

The script `script/db_inserter.py` can be used to initialize the database with sample data:

1. Set up a Python virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install required Python dependencies:
```bash
pip install -r script/requirements.txt
```

3. Run the database setup script:
```bash
python3 script/db_inserter.py
```

Make sure the appropriate environment variables are set before running the script:
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - PostgreSQL database name
