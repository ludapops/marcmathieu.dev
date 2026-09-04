import * as THREE from "three";
import {
  balanceLayout,
  bellLayout,
  cupLayout,
  gateLayout,
  introLayout,
  MARBLE_RADIUS,
  sampleBalance,
  sampleBell,
  sampleCup,
  sampleGate,
  sampleIntro,
  chapterDirection,
  chapterSpan,
  HANDOFF_TOP,
  HANDOFF_BOTTOM,
  type MachineKind,
  type Point,
} from "./mechanics";

export type MachineMaterials = ReturnType<typeof createMachineMaterials>;
export function createMachineMaterials(styles: CSSStyleDeclaration) {
  const material = (token: string, metalness: number, roughness: number) =>
    new THREE.MeshStandardMaterial({
      color: styles.getPropertyValue(token).trim(),
      metalness,
      roughness,
    });
  return {
    wood: material("--machine-wood", 0.05, 0.6),
    edge: material("--machine-edge", 0.2, 0.4),
    brass: material("--machine-brass", 0.65, 0.26),
    steel: material("--machine-steel", 0.72, 0.24),
    ivory: material("--paper", 0.1, 0.35),
    green: material("--machine-green", 0.3, 0.22),
    orange: material("--machine-orange", 0.3, 0.24),
    violet: material("--machine-violet", 0.3, 0.24),
  };
}

export function buildMachine(
  kind: MachineKind,
  compact: boolean,
  m: MachineMaterials,
) {
  const group = new THREE.Group();
  const ownedMaterials: THREE.Material[] = [];
  const accent =
    kind === "counterweight-gate"
      ? m.orange
      : kind === "balance-transfer"
        ? m.violet
        : m.green;
  const mesh = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D = group,
  ) => {
    const object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    material: THREE.Material = m.wood,
    parent: THREE.Object3D = group,
    z = 0,
  ) => {
    const object = mesh(new THREE.BoxGeometry(w, h, d), material, parent);
    object.position.set(x, y, z);
    if (Math.min(w, h, d) < 0.06) object.castShadow = false;
    return object;
  };
  const ball = (material = accent) => {
    const object = mesh(
      new THREE.SphereGeometry(MARBLE_RADIUS, 28, 20),
      material,
    );
    const band = mesh(
      new THREE.TorusGeometry(MARBLE_RADIUS * 0.997, 0.012, 6, 32),
      m.ivory,
      object,
    );
    band.rotation.y = Math.PI / 2;
    return object;
  };
  const cylinder = (
    radius: number,
    height: number,
    x: number,
    y: number,
    material = m.brass,
    parent: THREE.Object3D = group,
  ) => {
    const object = mesh(
      new THREE.CylinderGeometry(radius, radius, height, 24),
      material,
      parent,
    );
    object.position.set(x, y, 0);
    if (radius < 0.11) object.castShadow = false;
    return object;
  };
  const rod = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    radius: number,
    material: THREE.Material,
    parent: THREE.Object3D = group,
  ) => {
    const object = mesh(
      new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 10),
      material,
      parent,
    );
    object.position.copy(a).add(b).multiplyScalar(0.5);
    object.castShadow = false;
    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    return object;
  };
  const line = (
    points: readonly Point[],
    radius = 0.025,
    material = m.steel,
    z = 0,
    parent: THREE.Object3D = group,
  ) => {
    const curve = new THREE.CurvePath<THREE.Vector3>();
    points
      .slice(1)
      .forEach((point, i) =>
        curve.add(
          new THREE.LineCurve3(
            new THREE.Vector3(points[i].x, points[i].y, z),
            new THREE.Vector3(point.x, point.y, z),
          ),
        ),
      );
    return mesh(
      new THREE.TubeGeometry(curve, 96, radius, 8, false),
      material,
      parent,
    );
  };
  const baseY = kind === "intro" ? -1.05 : -1.95;
  const span = kind === "intro" ? 4.7 : compact ? 1.85 : 3.0;
  box(span * 2, 0.18, 1.3, kind === "intro" ? 0.5 : 0, baseY, m.wood);
  box(span * 2, 0.055, 1.34, kind === "intro" ? 0.5 : 0, baseY - 0.11, m.edge);
  [-span + 0.24, span - 0.24].forEach((x) => {
    for (const z of [-0.42, 0.42])
      box(
        0.24,
        0.16,
        0.24,
        x + (kind === "intro" ? 0.5 : 0),
        baseY - 0.2,
        m.edge,
        group,
        z,
      );
  });
  const support = (x: number, y: number, z = -0.26) => {
    rod(
      new THREE.Vector3(x, baseY + 0.1, z),
      new THREE.Vector3(x, y, z),
      0.035,
      m.brass,
    );
    box(0.22, 0.055, 0.3, x, baseY + 0.12, m.brass, group, z);
  };
  const rail = (points: readonly Point[]) => {
    // Twin rails sit under the sphere at their actual circular contact height.
    const offset = Math.sqrt((MARBLE_RADIUS + 0.027) ** 2 - 0.1 ** 2);
    const contact = points.map((point) => ({
      x: point.x,
      y: point.y - offset,
    }));
    line(contact, 0.027, m.steel, -0.1);
    line(contact, 0.027, m.steel, 0.1);
    [contact[0], contact.at(-1)].forEach((point) => {
      if (point) support(point.x, point.y);
    });
  };
  const axle = (pivot: Point, parent = group) => {
    const hub = cylinder(0.105, 0.6, pivot.x, pivot.y, m.brass, parent);
    hub.rotation.x = Math.PI / 2;
    const cap = cylinder(0.058, 0.64, pivot.x, pivot.y, m.edge, parent);
    cap.rotation.x = Math.PI / 2;
    support(pivot.x, pivot.y);
  };
  const cup = (
    x: number,
    y: number,
    parent: THREE.Object3D,
    material = accent,
  ) => {
    const points = [
      new THREE.Vector2(0.02, 0.04),
      new THREE.Vector2(0.18, 0.04),
      new THREE.Vector2(0.25, 0.14),
      new THREE.Vector2(0.27, 0.3),
      new THREE.Vector2(0.23, 0.3),
      new THREE.Vector2(0.2, 0.16),
      new THREE.Vector2(0.13, 0.1),
      new THREE.Vector2(0.02, 0.1),
    ];
    const object = mesh(new THREE.LatheGeometry(points, 32), material, parent);
    object.position.set(x, y, 0);
    return object;
  };
  const position = (
    object: THREE.Object3D,
    point: Point & { rotation: number },
  ) => {
    object.position.set(point.x, point.y, 0);
    object.rotation.z = point.rotation;
  };
  const lead = ball(m.green);
  lead.name = "story-marble";
  if (kind !== "intro") {
    const edge = chapterSpan(compact);
    for (const [x, y] of [
      [-edge, HANDOFF_TOP],
      ...(kind === "bell" ? [] : [[edge, HANDOFF_BOTTOM]]),
    ]) {
      const collar = mesh(
        new THREE.CylinderGeometry(0.24, 0.2, 0.32, 24, 1, true),
        m.brass,
      );
      collar.position.set(x, y - 0.02, 0);
    }
  }
  let pose: (progress: number, wind?: number) => void;

  if (kind === "tipping-cup") {
    const layout = cupLayout(compact);
    rail(layout.incoming);
    rail(layout.outgoing);
    const tipping = new THREE.Group();
    tipping.position.set(layout.pivot.x, layout.pivot.y, 0);
    group.add(tipping);
    cup(0, 0.04, tipping);
    box(0.11, 0.52, 0.16, 0, -0.23, m.brass, tipping);
    cylinder(0.17, 0.18, 0, -0.5, m.edge, tipping);
    axle(layout.pivot);
    pose = (p) => {
      const state = sampleCup(p, compact);
      tipping.rotation.z = state.angle;
      position(lead, state.ball);
    };
  } else if (kind === "counterweight-gate") {
    const layout = gateLayout(compact);
    rail(layout.incoming);
    rail(layout.outgoing);
    const lever = new THREE.Group();
    group.add(lever);
    lever.position.set(layout.pivot.x, layout.pivot.y, 0);
    box(1.1, 0.09, 0.38, 0, 0, accent, lever);
    axle(layout.pivot);
    const gate = box(0.12, 0.62, 0.55, 0.2, 0.7, m.brass);
    const counterweight = cylinder(0.17, 0.35, 0.92, 1.1, m.edge);
    for (const x of [0.2, 0.92]) {
      support(x, 1.85, -0.36);
      const wheel = mesh(new THREE.TorusGeometry(0.13, 0.035, 8, 24), m.brass);
      wheel.position.set(x, 1.75, 0);
    }
    const leftCord = box(0.018, 1, 0.018, 0.2, 1, m.edge);
    const rightCord = box(0.018, 1, 0.018, 0.92, 1, m.edge);
    line(
      [
        { x: 0.2, y: 1.88 },
        { x: 0.92, y: 1.88 },
      ],
      0.009,
      m.edge,
    );
    pose = (p) => {
      const state = sampleGate(p, compact);
      position(lead, state.ball);
      lever.rotation.z = state.angle;
      gate.position.y = 0.7 + state.lift * 0.58;
      counterweight.position.y = 1.1 - state.lift * 0.58;
      for (const [cord, bottom] of [
        [leftCord, gate.position.y + 0.31],
        [rightCord, counterweight.position.y + 0.175],
      ] as const) {
        const length = 1.88 - bottom;
        cord.scale.y = length;
        cord.position.y = 1.88 - length / 2;
      }
    };
  } else if (kind === "balance-transfer") {
    const layout = balanceLayout(compact);
    rail(layout.incoming);
    rail(layout.outgoing);
    const beam = new THREE.Group();
    beam.position.set(0, 0.1, 0);
    group.add(beam);
    box(2.2, 0.1, 0.4, 0, 0, m.brass, beam);
    box(0.07, 0.24, 0.4, -1.03, 0.1, accent, beam);
    // The loaded counterweight tips the released chute; the same marble crosses it.
    cylinder(0.22, 0.35, 0.85, -0.34, m.edge, beam);
    box(0.045, 0.35, 0.08, 0.85, -0.17, m.brass, beam);
    const latch = box(0.08, 0.36, 0.25, -0.65, -0.05, accent);
    axle(layout.pivot);
    pose = (p) => {
      const state = sampleBalance(p, compact);
      beam.rotation.z = state.angle;
      latch.rotation.z = Math.min(1, Math.max(0, (p - 0.3) / 0.03)) * 0.6;
      position(lead, state.ball);
    };
  } else if (kind === "bell") {
    const layout = bellLayout(compact);
    rail(layout.rail);
    cup(0, -0.61, group, m.green);
    const striker = new THREE.Group();
    striker.position.set(0.15, 1.3, 0);
    group.add(striker);
    box(0.055, 0.98, 0.06, 0, -0.49, m.wood, striker);
    const head = cylinder(0.15, 0.3, 0, -0.96, m.brass, striker);
    head.rotation.z = Math.PI / 2;
    axle(layout.strikerPivot);
    const bell = new THREE.Group();
    bell.position.set(1.16, 1.3, 0);
    group.add(bell);
    const bellPoints = [
      new THREE.Vector2(0.08, 0),
      new THREE.Vector2(0.17, -0.1),
      new THREE.Vector2(0.22, -0.4),
      new THREE.Vector2(0.4, -0.68),
      new THREE.Vector2(0.42, -0.72),
      new THREE.Vector2(0.35, -0.73),
      new THREE.Vector2(0.15, -0.39),
      new THREE.Vector2(0.1, -0.12),
    ];
    mesh(new THREE.LatheGeometry(bellPoints, 40), m.brass, bell);
    support(1.16, 1.55, -0.4);
    rod(
      new THREE.Vector3(1.16, 1.55, -0.4),
      new THREE.Vector3(1.16, 1.55, 0),
      0.035,
      m.brass,
    );
    rod(
      new THREE.Vector3(1.16, 1.55, 0),
      new THREE.Vector3(1.16, 1.3, 0),
      0.03,
      m.brass,
    );
    const latch = new THREE.Group();
    group.add(latch);
    latch.position.set(0, 0.06, 0);
    box(0.08, 0.38, 0.25, 0, 0.19, accent, latch);
    rod(
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(-0.56, 0.43, 0),
      0.035,
      m.brass,
      latch,
    );
    axle({ x: 0, y: 0.06 });
    pose = (p) => {
      const state = sampleBell(p, compact);
      position(lead, state.ball);
      striker.rotation.z = state.angle;
      bell.rotation.z = state.bellAngle;
      latch.rotation.z = -state.strike * 0.7;
    };
  } else {
    rail(introLayout.rail);
    const springPoints = Array.from(
      { length: 100 },
      (_, i) =>
        new THREE.Vector3(
          (i / 99) * 0.65,
          Math.sin((i / 99) * Math.PI * 14) * 0.105,
          Math.cos((i / 99) * Math.PI * 14) * 0.105,
        ),
    );
    const spring = mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(springPoints),
        120,
        0.024,
        8,
        false,
      ),
      m.brass,
    );
    spring.position.set(-3.98, 1.15, 0);
    box(0.1, 0.46, 0.44, -3.98, 1.15, m.edge);
    support(-3.98, 1.15);
    const plunger = box(0.08, 0.36, 0.34, -3.36, 1.15, m.ivory);
    const trigger = new THREE.Group();
    group.add(trigger);
    trigger.position.set(-1.1, 0, 0);
    box(0.08, 0.78, 0.32, 0, 0.28, m.brass, trigger);
    axle(introLayout.leverPivot);
    const dominoes = Array.from({ length: introLayout.dominoCount }, (_, i) => {
      const domino = new THREE.Group();
      group.add(domino);
      domino.position.set(
        introLayout.dominoStart + i * introLayout.dominoGap,
        -0.35,
        0,
      );
      box(0.12, 0.7, 0.35, 0, 0.35, i % 2 ? m.ivory : m.green, domino);
      box(0.125, 0.018, 0.36, 0, 0.35, m.brass, domino);
      return domino;
    });
    box(2.25, 0.11, 0.62, 0.28, -0.42, m.wood);
    support(-0.55, -0.42);
    support(1.2, -0.42);
    const launcher = new THREE.Group();
    launcher.position.set(
      introLayout.launcherPivot.x,
      introLayout.launcherPivot.y,
      0,
    );
    group.add(launcher);
    box(0.85, 0.09, 0.28, -0.2, 0, m.brass, launcher);
    cup(
      introLayout.launcherCup.x,
      introLayout.launcherCup.y - MARBLE_RADIUS - 0.1,
      launcher,
      m.brass,
    );
    axle(introLayout.launcherPivot);
    const coilPoints = Array.from({ length: 100 }, (_, i) => {
      const t = i / 99;
      return new THREE.Vector3(
        Math.cos(t * Math.PI * 8) * 0.14,
        Math.sin(t * Math.PI * 8) * 0.14,
        0.15 + t * 0.2,
      );
    });
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(coilPoints),
        100,
        0.022,
        8,
        false,
      ),
      m.brass,
      launcher,
    );
    box(0.06, 0.28, 0.08, 0.1, -0.1, m.brass, launcher);
    const latch = new THREE.Group();
    latch.position.set(introLayout.releaseLeverX, -0.35, 0);
    group.add(latch);
    box(0.06, 0.42, 0.09, 0, 0.21, m.steel, latch);
    const releaseLink = rod(
      new THREE.Vector3(introLayout.releaseLeverX, -0.3, -0.3),
      new THREE.Vector3(introLayout.launcherPivot.x, -0.3, -0.3),
      0.025,
      m.steel,
    );
    const projectile = ball(m.brass);
    projectile.name = "intro-projectile";
    const key = new THREE.Group();
    group.add(key);
    key.position.set(introLayout.key.x, introLayout.key.y, 0);
    box(0.95, 0.22, 0.78, introLayout.key.x, introLayout.key.y, m.edge);
    support(introLayout.key.x, introLayout.key.y - 0.11);
    box(0.87, 0.12, 0.7, 0, 0.17, m.ivory, key);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: m.green.color,
      transparent: true,
      opacity: 0,
    });
    ownedMaterials.push(glowMaterial);
    box(
      0.9,
      0.035,
      0.73,
      introLayout.key.x,
      introLayout.key.y + 0.105,
      glowMaterial,
    );
    // Geometric return arrow stays sharp without a texture or a font request.
    box(0.3, 0.014, 0.045, 0, 0.24, m.edge, key);
    box(0.045, 0.014, 0.18, 0.13, 0.24, m.edge, key, -0.07);
    const arrow = box(0.12, 0.014, 0.045, -0.15, 0.24, m.edge, key, -0.025);
    arrow.rotation.y = -0.6;
    pose = (p, wind = 0) => {
      const state = sampleIntro(p);
      position(lead, state.ball);
      trigger.rotation.z = state.lever;
      dominoes.forEach((d, i) => (d.rotation.z = state.dominoes[i]));
      latch.rotation.z = -state.latch;
      releaseLink.position.y = -0.3 - Math.sin(state.latch) * 0.06;
      launcher.rotation.z = state.launcherAngle;
      position(projectile, { ...state.projectile, rotation: -p * 8 });
      key.position.y = introLayout.key.y - state.key * 0.1;
      glowMaterial.opacity = state.impact;
      const compression = p > 0 ? 1 - state.plunger : wind;
      spring.scale.x = 1 - compression * 0.55;
      plunger.position.x = -3.36 - compression * 0.35;
    };
  }
  group.scale.x = chapterDirection(kind);
  pose(0);
  const bounds = new THREE.Box3().setFromObject(group);
  if (kind === "intro") {
    for (let i = 0; i <= 80; i++) {
      const { projectile } = sampleIntro(i / 80);
      bounds.expandByPoint(
        new THREE.Vector3(
          projectile.x - MARBLE_RADIUS,
          projectile.y + MARBLE_RADIUS,
          0,
        ),
      );
      bounds.expandByPoint(
        new THREE.Vector3(
          projectile.x + MARBLE_RADIUS,
          projectile.y - MARBLE_RADIUS,
          0,
        ),
      );
    }
  }
  return {
    group,
    ball: lead,
    pose,
    bounds,
    dispose() {
      ownedMaterials.forEach((material) => material.dispose());
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
    },
  };
}
