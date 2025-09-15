/**
 * Server entry point
 */
import app from './app';
import { pool } from './config/db';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end().then(() => {
      console.log('Database connection pool closed');
      process.exit(0);
    });
  });
});

export default server;
