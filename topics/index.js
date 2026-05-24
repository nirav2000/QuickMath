import { squareRootsTopic } from './square-roots.js';
import { percentagesTopic } from './percentages.js';

export const topics = [squareRootsTopic, percentagesTopic];
export const topicsById = Object.fromEntries(topics.map((t) => [t.id, t]));
