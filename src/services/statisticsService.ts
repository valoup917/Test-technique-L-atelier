/**
 * Service for statistics-related operations
 */
import { query } from '../config/db';
import { Statistics } from '../types/statistics';
import { PlayerStatisticsData } from '../types/player';

/**
 * Calculate the country with the highest win ratio
 * @param {PlayerStatisticsData[]} players - Array of player statistics data
 * @returns {{ countryCode: string, winRatio: number }} - Country code and win ratio
 */
const calculateCountryWithHighestWinRatio = (players: PlayerStatisticsData[]): { countryCode: string, winRatio: number, games: number } | null => {
  // O(n + L)
  if (!players.length) return null;

  const countryWinRatios = new Map<string, { wins: number; games: number; points: number }>();


  for (const player of players) {
    const tmp = countryWinRatios.get(player.countrycode) ?? { wins: 0, games: 0, points: 0 };

    let wins = 0;

    for (let i = 0; i < player.last.length; i++)  {
      wins += (player.last[i] === 1 ? 1 : 0);
    }

    tmp.wins += wins;
    tmp.games += player.last.length;
    tmp.points += player.points ?? 0;
    countryWinRatios.set(player.countrycode, tmp);
  }

  let bestCode: string | null = null;
  let best: { wins: number; games: number; points: number } | null = null;

  for (const [currentCode, current] of countryWinRatios) {
    const currRatio = current.games ? current.wins / current.games : -1;

    if (best === null) { best = current; bestCode = currentCode; continue; }

    const bestRatio = best.games ? best.wins / best.games : -1;

    const better =
      currRatio > bestRatio ||
      (currRatio === bestRatio && current.games > best.games) ||
      // if same ratio, prefer the one with more games played
      (currRatio === bestRatio && current.games === best.games && current.points > best.points) ||
      // if same ratio and same games, prefer the one with more points
      (currRatio === bestRatio && current.games === best.games && current.points === best.points && currentCode < (bestCode as string));
      // if same ratio, same games and same points, prefer the one with the lexicographically smaller country code

    if (better) {
      bestCode = currentCode;
      best = current;
    }
  }

  return {
    countryCode: bestCode as string,
    winRatio: best!.games ? best!.wins / best!.games : 0,
    games: best!.games
  };
};

/**
 * Calculate the average IMC (Indice de Masse Corporelle) of all players
 * IMC = weight(kg) / (height(m) * height(m))
 * @param {PlayerStatisticsData[]} players - Array of player statistics data
 * @returns {number} - Average IMC
 */
const calculateAverageIMC = (players: PlayerStatisticsData[]): number | null => {
  // O(n)
  if (!players.length) return null;

  let sum = 0;
  let count = 0;

  for (const p of players) {
    const h = p.height / 100; // m
    const w = p.weight / 1000; // kg
    if (h > 0 && w > 0 && Number.isFinite(h) && Number.isFinite(w)) {
      const imc = w / (h * h);
      if (Number.isFinite(imc)) { sum += imc; count++; }
    }
  }

  return count ? sum / count : null;
};

/**
 * Calculate the median height of all players
 * @param {PlayerStatisticsData[]} players - Array of player statistics data
 * @returns {number} - Median height
 */
const calculateMedianHeight = (players: PlayerStatisticsData[]): number | null => {
  // O(n log n) due to sorting
  if (!players.length) return null;

  const heights = players.map(p => Number(p.height)).filter(Number.isFinite);
  if (!heights.length) return null;
  
  const mid = Math.floor(heights.length / 2);

  const medianHeight = heights.length % 2 ? heights[mid] : (heights[mid - 1] + heights[mid]) / 2;

  return medianHeight;
};

/**
 * Fetch only the player data needed for statistics calculations
 * @returns {Promise<PlayerStatisticsData[]>} - Array of player statistics data
 */
const fetchPlayerStatisticsData = async (): Promise<PlayerStatisticsData[]> => {
  try {
    // Optimized query that only selects the columns needed for statistics
    const queryText = `
      SELECT 
        weight, 
        height, 
        last::jsonb AS last, 
        countrycode,
        points
      FROM 
        players
    `;
    

    // I have choosed security over performance here
    // as this query is not called that often and the dataset is small
    type Row = {
      weight: number;
      height: number;
      last: number[] | null;
      countrycode: string;
      points: number | null;
    };

    const { rows } = await query(queryText);

    return rows.map((r: Row) => ({
      weight: Number(r.weight),
      height: Number(r.height),
      last: Array.isArray(r.last) ? r.last.map(x => (x ? 1 : 0)) : [],
      countrycode: r.countrycode,
      points: Number(r.points ?? 0),
  })) as PlayerStatisticsData[];
  
  } catch (error) {
    console.error('Error fetching player statistics data:', error);
    throw error;
  }
};

/**
 * Get statistics about players
 * @returns {Promise<Statistics>} - Statistics object
 */
const getStatistics = async (): Promise<Statistics> => {
  try {
    // choosed to do the computation in node instead of sql cause:
    // small data set
    // easier for unit testing
    // keep the business logic in the service layer
    const players = await fetchPlayerStatisticsData();
    
    const countryWithHighestWinRatio = calculateCountryWithHighestWinRatio(players);
    const averageIMC = calculateAverageIMC(players);
    const medianHeight = calculateMedianHeight(players);
    
    return {
      countryWithHighestWinRatio,
      averageIMC,
      medianHeight
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    throw error;
  }
};

export {
  getStatistics,
  calculateCountryWithHighestWinRatio,
  calculateAverageIMC,
  calculateMedianHeight,
  fetchPlayerStatisticsData
};
