/**
 * Schema validation for Player objects.
 */

import { Player } from '../types/player';

export function validateAndMap(body: any): { ok: true; value: Player } | { ok: false; errors: string[] } {
  const e: string[] = [];
  const b = body as Partial<Player>;

  const isFiniteNum = (v: any) => typeof v === 'number' && Number.isFinite(v);
  const isPosInt = (v: any) => Number.isInteger(v) && v >= 0;
  const reqStr = (v: any) => typeof v === 'string' && v.trim().length > 0;

  const LIMITS = {
    rank: { min: 1, max: 10000 },
    points: { min: 0, max: 10_000_000 },
    weight: { min: 30_000, max: 200_000 },
    height: { min: 100, max: 250 },
    age: { min: 10, max: 60 }
  } as const;

  const vnum = (name: keyof typeof LIMITS | 'id', v: any, { integer = true, min = 0, max = Number.MAX_SAFE_INTEGER }: { integer?: boolean; min?: number; max?: number; }) => {
    if (!isFiniteNum(v)) { e.push(`${name} must be a finite number`); return; }
    if (integer && !Number.isInteger(v)) e.push(`${name} must be an integer`);
    if (v < min || v > max) e.push(`${name} must be between ${min} and ${max} grams`);
  };

  // id (requis ici)
  vnum('id', b.id, { integer: true, min: 1, max: Number.MAX_SAFE_INTEGER });

  // strings
  if (!reqStr(b?.firstname)) e.push('firstname is required');
  if (!reqStr(b?.lastname)) e.push('lastname is required');
  if (!reqStr(b?.shortname)) e.push('shortname is required');
  if (!['M', 'F'].includes(b?.sex as any)) e.push("sex must be 'M' or 'F'");
  if (!reqStr(b?.countrycode)) e.push('countrycode is required');
  if (reqStr(b?.countrycode) && (b!.countrycode as string).trim().length !== 3) e.push('countrycode must be 3 letters (ISO-3166 alpha-3)');
  if (!reqStr(b?.countrypicture)) e.push('countrypicture is required');
  if (!reqStr(b?.picture)) e.push('picture is required');

  // numbers (bornes)
  if (b?.rank != null)   vnum('rank',   b.rank,   { integer: true, min: LIMITS.rank.min,   max: LIMITS.rank.max });
  if (b?.points != null) vnum('points', b.points, { integer: true, min: LIMITS.points.min, max: LIMITS.points.max });
  if (b?.weight != null) vnum('weight', b.weight, { integer: true, min: LIMITS.weight.min, max: LIMITS.weight.max });
  if (b?.height != null) vnum('height', b.height, { integer: true, min: LIMITS.height.min, max: LIMITS.height.max });
  if (b?.age != null)    vnum('age',    b.age,    { integer: true, min: LIMITS.age.min,    max: LIMITS.age.max });

  // last : tableau de 0/1
  if (!Array.isArray(b?.last)) {
    e.push('last must be an array of 0/1');
  } else {
    if (b!.last.some(x => !(x === 0 || x === 1))) e.push('last must contain only 0 or 1');
  }

  if (e.length) return { ok: false, errors: e };

  return {
    ok: true,
    value: {
      id: b.id as number,
      firstname: (b.firstname as string).trim(),
      lastname: (b.lastname as string).trim(),
      shortname: (b.shortname as string).trim(),
      sex: b.sex as 'M' | 'F',
      rank: b.rank as number,
      points: b.points as number,
      weight: b.weight as number,
      height: b.height as number,
      age: b.age as number,
      last: (b.last as number[]).map(x => (x ? 1 : 0)),
      countrycode: (b.countrycode as string).toUpperCase().trim(),
      countrypicture: (b.countrypicture as string).trim(),
      picture: (b.picture as string).trim(),
    }
  };
}
