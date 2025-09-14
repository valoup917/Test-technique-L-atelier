/**
 * Type definitions for Player model
 */

export interface Player {
  id: number;
  firstname: string;
  lastname: string;
  shortname: string;
  sex: string;
  rank: number;
  points: number;
  weight: number;
  height: number;
  age: number;
  last: number[];
  countrycode: string;
  countrypicture: string;
  picture: string;
}

export interface PlayerStatisticsData {
  weight: number;
  height: number;
  last: number[];
  countrycode: string;
  points: number;
}