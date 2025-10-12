import { Point } from "./coordinates";

export function multiply(p1: Point, p2: Point): Point {
  return {
    x: p1.x * p2.x - p1.y * p2.y,
    y: p1.x * p2.y + p1.y * p2.x,
  };
}

export function add(p1: Point, p2: Point): Point {
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y,
  };
}
