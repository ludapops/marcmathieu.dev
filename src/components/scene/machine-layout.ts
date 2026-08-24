export type MachinePoint = Readonly<{ x: number; y: number }>;

export const introMachineLayout = {
  floorY: -1,
  rail: [
    { x: -2.48, y: 0.7 },
    { x: -2.1, y: 0.8 },
    { x: -1.72, y: 0.6 },
    { x: -1.34, y: 0.28 },
    { x: -0.96, y: -0.02 },
    { x: -0.64, y: -0.28 },
  ] satisfies MachinePoint[],
  marble: { radius: 0.2, start: { x: -2.48, y: 0.9 } },
  dominoes: {
    count: 7,
    startX: -0.38,
    gap: 0.24,
    y: -0.62,
    width: 0.13,
    height: 0.72,
  },
  seesaw: {
    x: 1.58,
    y: -0.48,
    width: 1.02,
    height: 0.1,
  },
  orangeBall: { radius: 0.19, x: 1.88, y: -0.25 },
  enterKey: { x: 3.3, y: -0.78, width: 1.02, height: 0.26 },
} as const;

export const introCameraStages = {
  marble: { x: -1.9, y: 0, z: 7.5 },
  dominoes: { x: 0.1, y: -0.08, z: 6.9 },
  seesaw: { x: 1.5, y: 0, z: 6.5 },
  key: { x: 2.72, y: -0.14, z: 6.05 },
  complete: { x: 3.05, y: -0.22, z: 5.35 },
} as const;
