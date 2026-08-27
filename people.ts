import { useForecastStore } from '../store';
import type { Person } from '../types';

export function peopleFor(ids: string[]): Person[] {
  const people = useForecastStore.getState().people;
  return ids.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => !!p);
}

export function assigneeSummary(ids: string[]): string {
  const people = peopleFor(ids);
  if (people.length === 0) return 'Unassigned';
  if (people.length === 1) return people[0].name;
  return `${people[0].name} +${people.length - 1}`;
}
