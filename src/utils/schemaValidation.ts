/**
 * Schema validation for Player objects.
 */

import { Player } from '../types/player';

export function validateAndMap(body:any): { ok:true; value: Player } | { ok:false; errors:string[] } {
  const e:string[] = [];
  const b = body as Player;
  const reqNum = (v:any)=> typeof v==='number' && Number.isFinite(v);
  const reqStr = (v:any)=> typeof v==='string' && v.trim().length>0;

  if (!reqNum(b?.id)) e.push('id');
  if (!reqStr(b?.firstname)) e.push('firstname');
  if (!reqStr(b?.lastname)) e.push('lastname');
  if (!reqStr(b?.shortname)) e.push('shortname');
  if (!['M','F'].includes(b?.sex as any)) e.push('sex');

  if (!reqNum(b.rank) || b.rank < 1) e.push('rank');
  if (!reqNum(b.points) || b.points < 0) e.push('points');
  if (!reqNum(b.weight) || b.weight <= 0) e.push('weight');
  if (!reqNum(b.height) || b.height <= 0) e.push('height');
  if (!reqNum(b.age) || b.age <= 0) e.push('age');
  if (!Array.isArray(b.last) || b.last.some((x:any)=> !(x===0||x===1))) e.push('last');

  if (!reqStr(b.countrycode) || b.countrycode.length !== 3) e.push('countrycode');
  if (!reqStr(b.countrypicture)) e.push('countrypicture');
  if (!reqStr(b?.picture)) e.push('picture');

  if (e.length) return { ok:false, errors:e };

  return {
    ok:true,
    value: {
      id: b.id,
      firstname: b.firstname.trim(),
      lastname: b.lastname.trim(),
      shortname: b.shortname.trim(),
      sex: b.sex,
      rank: b.rank,
      points: b.points,
      weight: b.weight,
      height: b.height,
      age: b.age,
      last: b.last.map((x:number)=> x?1:0),
      countrycode: b.countrycode.toUpperCase().trim(),
      countrypicture: b.countrypicture.trim(),
      picture: b.picture.trim(),
    }
  };
}