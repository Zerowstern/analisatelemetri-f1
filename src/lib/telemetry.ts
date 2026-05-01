// Realistic F1 telemetry mock data generator
// Sirkuit: Monza-style with 11 turns, ~5.793 km

export type Driver = {
  id: string;
  code: string;
  name: string;
  team: string;
  colorVar: string; // tailwind class color
  number: number;
};

export const DRIVERS: Driver[] = [
  { id: "VER", code: "VER", name: "M. Verstappen", team: "Red Bull",  colorVar: "driver-3", number: 1  },
  { id: "LEC", code: "LEC", name: "C. Leclerc",    team: "Ferrari",   colorVar: "driver-1", number: 16 },
  { id: "HAM", code: "HAM", name: "L. Hamilton",   team: "Mercedes",  colorVar: "driver-2", number: 44 },
  { id: "NOR", code: "NOR", name: "L. Norris",     team: "McLaren",   colorVar: "driver-4", number: 4  },
];

export const CIRCUIT = {
  name: "Autodromo Nazionale Monza",
  country: "Italy",
  length_km: 5.793,
  turns: 11,
  laps: 53,
};

export type Sector = { id: number; name: string; type: "straight" | "corner"; cornerNum?: number };
export const SECTORS: Sector[] = [
  { id: 1,  name: "S/F Straight",       type: "straight" },
  { id: 2,  name: "T1 Rettifilo",       type: "corner", cornerNum: 1 },
  { id: 3,  name: "T2 Curva Grande",    type: "corner", cornerNum: 2 },
  { id: 4,  name: "T4 Della Roggia",    type: "corner", cornerNum: 4 },
  { id: 5,  name: "T6 Lesmo 1",         type: "corner", cornerNum: 6 },
  { id: 6,  name: "T7 Lesmo 2",         type: "corner", cornerNum: 7 },
  { id: 7,  name: "T8 Serraglio",       type: "straight" },
  { id: 8,  name: "T9 Ascari",          type: "corner", cornerNum: 9 },
  { id: 9,  name: "Back Straight",      type: "straight" },
  { id: 10, name: "T11 Parabolica",     type: "corner", cornerNum: 11 },
  { id: 11, name: "Main Straight",      type: "straight" },
];

// Seeded RNG for deterministic data
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TelemetryPoint = {
  distance: number;   // meters from S/F line
  time: number;       // seconds elapsed in lap
  speed: number;      // km/h
  throttle: number;   // 0-100 %
  brake: number;      // 0-100 %
  gear: number;       // 1-8
  rpm: number;        // engine rpm
  steering: number;   // -100 .. 100 (left/right %)
  drs: 0 | 1;
};

export type DriverLap = {
  driver: Driver;
  lapTime: number;       // seconds
  sectorTimes: number[]; // per SECTORS
  topSpeed: number;      // km/h
  telemetry: TelemetryPoint[];
};

const TRACK_LENGTH = CIRCUIT.length_km * 1000;

// Define the corner profile along distance (km)
type CornerSpec = { center: number; width: number; minSpeed: number; steerDir: 1 | -1; sectorId: number };
const CORNERS: CornerSpec[] = [
  { center: 0.65,  width: 0.18, minSpeed: 85,  steerDir:  1, sectorId: 2  }, // T1 chicane
  { center: 1.20,  width: 0.30, minSpeed: 240, steerDir:  1, sectorId: 3  }, // Curva Grande (flat-out)
  { center: 1.85,  width: 0.20, minSpeed: 95,  steerDir: -1, sectorId: 4  }, // Della Roggia chicane
  { center: 2.55,  width: 0.18, minSpeed: 165, steerDir:  1, sectorId: 5  }, // Lesmo 1
  { center: 2.95,  width: 0.18, minSpeed: 175, steerDir:  1, sectorId: 6  }, // Lesmo 2
  { center: 4.10,  width: 0.30, minSpeed: 195, steerDir:  1, sectorId: 8  }, // Ascari complex
  { center: 5.30,  width: 0.45, minSpeed: 220, steerDir:  1, sectorId: 10 }, // Parabolica
];

function sectorIdAt(distance_km: number): number {
  // Map distance to a sector. Find nearest corner OR straight.
  for (const c of CORNERS) {
    if (Math.abs(distance_km - c.center) < c.width * 0.6) return c.sectorId;
  }
  if (distance_km < 0.45) return 1;
  if (distance_km < 1.0) return 1;       // approach to T1 still S/F
  if (distance_km < 1.7) return 3;
  if (distance_km < 2.4) return 4;
  if (distance_km < 3.5) return 6;
  if (distance_km < 4.0) return 7;       // Serraglio straight
  if (distance_km < 4.7) return 8;
  if (distance_km < 5.0) return 9;       // back straight
  if (distance_km < 5.6) return 10;
  return 11;
}

function gearFromSpeed(speed: number) {
  if (speed < 90)  return 2;
  if (speed < 130) return 3;
  if (speed < 170) return 4;
  if (speed < 210) return 5;
  if (speed < 250) return 6;
  if (speed < 290) return 7;
  return 8;
}

// Generate one driver's lap. driverBias tweaks behavior so each driver feels different.
function generateLap(driver: Driver, seed: number, bias: {
  topSpeedBoost: number;     // +/- km/h
  brakingLatenessM: number;  // brake later by N meters
  apexSpeedBoost: number;    // +/- km/h at apex
  throttleEarliness: number; // 0..1 how early back to throttle
  steerSharpness: number;    // 0.8..1.2
}): DriverLap {
  const rand = mulberry32(seed);
  const points: TelemetryPoint[] = [];
  const STEP = 10; // meters
  const baseTopSpeed = 340 + bias.topSpeedBoost;

  let t = 0;
  let prevSpeed = 280;

  for (let d = 0; d <= TRACK_LENGTH; d += STEP) {
    const dKm = d / 1000;

    // find nearest corner
    let nearest: CornerSpec | null = null;
    let nearestDist = Infinity;
    for (const c of CORNERS) {
      const dist = Math.abs(dKm - c.center);
      if (dist < nearestDist) { nearestDist = dist; nearest = c; }
    }

    let speed: number;
    let throttle: number;
    let brake: number;
    let steering: number;

    if (nearest && nearestDist < nearest.width) {
      // Inside corner zone
      const phase = (dKm - nearest.center) / nearest.width; // -1 .. +1
      const apexSpeed = nearest.minSpeed + bias.apexSpeedBoost * (nearest.minSpeed > 200 ? 0.4 : 1);

      if (phase < -0.25) {
        // braking zone (entry)
        const lateAdj = bias.brakingLatenessM / (nearest.width * 1000);
        const adjPhase = phase + lateAdj * 0.5;
        const brakeIntensity = Math.max(0, Math.min(1, (-adjPhase - 0.05) / 0.6));
        brake = brakeIntensity * 95 + rand() * 4;
        throttle = brake > 30 ? 0 : Math.max(0, 20 - brake);
        speed = Math.max(apexSpeed, prevSpeed - brakeIntensity * 22);
        steering = nearest.steerDir * brakeIntensity * 30;
      } else if (phase < 0.1) {
        // apex
        brake = 0;
        throttle = 25 + rand() * 10;
        speed = apexSpeed + rand() * 3;
        steering = nearest.steerDir * 90 * bias.steerSharpness;
      } else {
        // exit / back to throttle
        const exitPhase = (phase - 0.1) / 0.9;
        const throttleRamp = Math.min(1, exitPhase / (1 - bias.throttleEarliness * 0.6));
        throttle = throttleRamp * 100;
        brake = 0;
        speed = apexSpeed + (baseTopSpeed - apexSpeed) * Math.pow(throttleRamp, 0.7) * 0.55;
        steering = nearest.steerDir * (1 - exitPhase) * 60;
      }
    } else {
      // Straight
      throttle = 100;
      brake = 0;
      steering = (rand() - 0.5) * 6;
      // Accelerate toward top speed
      const accel = prevSpeed < baseTopSpeed ? Math.min(4, (baseTopSpeed - prevSpeed) * 0.08) : 0;
      speed = Math.min(baseTopSpeed + rand() * 1.5, prevSpeed + accel);
    }

    speed = Math.max(60, speed);
    const drs: 0 | 1 = (throttle > 95 && speed > 270 && (dKm > 4.95 && dKm < 5.55 || dKm > 0.0 && dKm < 0.55)) ? 1 : 0;
    if (drs) speed = Math.min(speed + 8, baseTopSpeed + 10);

    const gear = gearFromSpeed(speed);
    const rpm = 8500 + (speed / 340) * 4500 + rand() * 300;

    // Time delta = distance / avg speed
    const avgMs = ((prevSpeed + speed) / 2) / 3.6;
    if (d > 0) t += STEP / avgMs;

    points.push({
      distance: d,
      time: +t.toFixed(3),
      speed: +speed.toFixed(1),
      throttle: +throttle.toFixed(1),
      brake: +brake.toFixed(1),
      gear,
      rpm: Math.round(rpm),
      steering: +steering.toFixed(1),
      drs,
    });

    prevSpeed = speed;
  }

  // Sector times: bucket points by sectorIdAt
  const sectorAccum: Record<number, number> = {};
  for (let i = 1; i < points.length; i++) {
    const sId = sectorIdAt(points[i].distance / 1000);
    const dt = points[i].time - points[i - 1].time;
    sectorAccum[sId] = (sectorAccum[sId] ?? 0) + dt;
  }
  const sectorTimes = SECTORS.map(s => +(sectorAccum[s.id] ?? 0).toFixed(3));
  const lapTime = +points[points.length - 1].time.toFixed(3);
  const topSpeed = Math.max(...points.map(p => p.speed));

  return { driver, lapTime, sectorTimes, topSpeed: +topSpeed.toFixed(1), telemetry: points };
}

export function generateSession(): DriverLap[] {
  return [
    generateLap(DRIVERS[0], 11, { topSpeedBoost: 4,  brakingLatenessM:  6, apexSpeedBoost:  3, throttleEarliness: 0.85, steerSharpness: 1.0 }),
    generateLap(DRIVERS[1], 22, { topSpeedBoost: 1,  brakingLatenessM: 10, apexSpeedBoost:  5, throttleEarliness: 0.70, steerSharpness: 1.1 }),
    generateLap(DRIVERS[2], 33, { topSpeedBoost: 2,  brakingLatenessM:  2, apexSpeedBoost:  1, throttleEarliness: 0.78, steerSharpness: 0.95 }),
    generateLap(DRIVERS[3], 44, { topSpeedBoost: 0,  brakingLatenessM:  4, apexSpeedBoost:  2, throttleEarliness: 0.80, steerSharpness: 1.0 }),
  ];
}

export function fmtLap(s: number) {
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${m}:${rest.toFixed(3).padStart(6, "0")}`;
}
export function fmtDelta(s: number) {
  const sign = s >= 0 ? "+" : "−";
  return `${sign}${Math.abs(s).toFixed(3)}`;
}
