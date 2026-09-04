import * as THREE from "three";
import { buildMachine, type MachineMaterials } from "./tabletop-machine";
import {
  chapterActions,
  clamp,
  MARBLE_RADIUS,
  sampleChapterBall,
} from "./mechanics";
import { routeLayout, sampleRoute, type RouteSegment } from "./connected-route";

type Celebration =
  | { kind: "armed" }
  | { kind: "playing"; elapsed: number; replay: boolean }
  | { kind: "settled" };
export function createConnectedMachine(
  renderer: THREE.WebGLRenderer,
  canvas: HTMLCanvasElement,
  shell: HTMLElement,
  elements: HTMLElement[],
  materials: MachineMaterials,
) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xf9f3e6, 0x393c43, 3));
  const light = new THREE.DirectionalLight(0xffebd0, 4);
  light.position.set(-3, 6, 7);
  scene.add(light);
  const camera = new THREE.OrthographicCamera(
    0,
    innerWidth,
    0,
    -innerHeight,
    0.1,
    4000,
  );
  camera.position.z = 2000;
  let compact = innerWidth < 600;
  let machines = chapterActions.map((kind) =>
    buildMachine(kind, compact, materials),
  );
  machines.forEach((m) => scene.add(m.group));
  const marble = new THREE.Mesh(
    new THREE.SphereGeometry(MARBLE_RADIUS, 24, 16),
    materials.green,
  );
  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(MARBLE_RADIUS, 0.012, 6, 28),
    materials.ivory,
  );
  stripe.rotation.y = Math.PI / 2;
  marble.add(stripe);
  scene.add(marble);
  marble.name = "connected-story-marble";
  const connectorGroup = new THREE.Group();
  scene.add(connectorGroup);
  let connectors: {
    segment: RouteSegment;
    curve: THREE.CurvePath<THREE.Vector3>;
    group: THREE.Group;
  }[] = [];
  let layout: ReturnType<typeof routeLayout>;
  let rectangles: { top: number; height: number }[] = [];
  let enabled = false;
  let paused = false;
  let savedScroll = window.scrollY;
  let celebration: Celebration = { kind: "armed" };
  let animationFrame = 0;
  let lastTime = 0;
  let stableHeight = innerHeight;
  let lastWidth = innerWidth;
  let rotationOffsets: number[] = [];
  const replay = document.querySelector<HTMLButtonElement>(
    "[data-finale-replay]",
  );
  const status = document.querySelector<HTMLElement>("[data-finale-status]");
  const confettiGeometry = new THREE.PlaneGeometry(1, 1);
  const confettiMaterial = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    roughness: 0.65,
  });
  const confetti = new THREE.InstancedMesh(
    confettiGeometry,
    confettiMaterial,
    160,
  );
  confetti.frustumCulled = false;
  scene.add(confetti);
  const transform = new THREE.Object3D();
  const colors = [
    materials.green.color,
    materials.ivory.color,
    materials.brass.color,
  ];
  for (let i = 0; i < 160; i++)
    confetti.setColorAt(i, colors[i % colors.length]);
  const seeded = (i: number, salt: number) => {
    const n = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  function clearConnectors() {
    connectorGroup.clear();
    connectors.forEach((c) =>
      c.group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      }),
    );
    connectors = [];
  }
  function measure() {
    const width = innerWidth;
    if (width !== lastWidth) {
      stableHeight = innerHeight;
      lastWidth = width;
    }
    const nextCompact = width < 600;
    if (compact !== nextCompact) {
      machines.forEach((m) => {
        scene.remove(m.group);
        m.dispose();
      });
      compact = nextCompact;
      machines = chapterActions.map((kind) =>
        buildMachine(kind, compact, materials),
      );
      machines.forEach((m) => scene.add(m.group));
    }
    rectangles = elements.map((e) => {
      const r = e.getBoundingClientRect();
      return { top: r.top + scrollY, height: r.height };
    });
    layout = routeLayout(width, stableHeight, rectangles, compact);
    machines.forEach((m, i) => {
      m.group.position.set(width / 2, -layout.centers[i], 0);
      m.group.scale.set(
        layout.scale * (i % 2 ? -1 : 1),
        layout.scale,
        layout.scale,
      );
    });
    clearConnectors();
    layout.segments.forEach((segment) => {
      if (segment.kind !== "connector") return;
      const [start, outerStart, outerEnd, end] = segment.points;
      const curve = new THREE.CurvePath<THREE.Vector3>();
      const vector = (p: { x: number; y: number }) =>
        new THREE.Vector3(p.x, -p.y, 0);
      curve.add(
        new THREE.QuadraticBezierCurve3(
          vector(start),
          new THREE.Vector3(outerStart.x, -start.y, 0),
          vector(outerStart),
        ),
      );
      curve.add(new THREE.LineCurve3(vector(outerStart), vector(outerEnd)));
      curve.add(
        new THREE.QuadraticBezierCurve3(
          vector(outerEnd),
          new THREE.Vector3(outerEnd.x, -end.y, 0),
          vector(end),
        ),
      );
      const group = new THREE.Group();
      connectorGroup.add(group);
      for (const offset of [-1, 1]) {
        const rail = new THREE.Mesh(
          new THREE.TubeGeometry(
            curve,
            80,
            Math.max(0.8, layout.scale * 0.022),
            6,
            false,
          ),
          materials.steel,
        );
        rail.position.x = offset * Math.min(7, layout.scale * 0.19);
        group.add(rail);
      }
      connectors.push({ segment, curve, group });
    });
    let rotation = 0;
    rotationOffsets = layout.segments.map((segment) => {
      if (segment.kind === "connector") {
        const start = rotation;
        const connector = connectors.find((c) => c.segment === segment);
        rotation -=
          (connector?.curve.getLength() ?? 0) / (layout.scale * MARBLE_RADIUS);
        return start;
      }
      const first = sampleChapterBall(
        chapterActions[segment.chapter],
        0,
        compact,
      ).rotation;
      const offset = rotation - first;
      rotation =
        offset +
        sampleChapterBall(chapterActions[segment.chapter], 1, compact).rotation;
      return offset;
    });
    draw();
  }
  function finaleVisible() {
    const r = elements[3].getBoundingClientRect();
    return r.top < innerHeight - 54 && r.bottom > 54;
  }
  function animate(time: number) {
    animationFrame = 0;
    if (
      enabled &&
      !paused &&
      !document.hidden &&
      finaleVisible() &&
      celebration.kind === "playing"
    ) {
      if (lastTime)
        celebration.elapsed += Math.min(0.05, (time - lastTime) / 1000);
      if (celebration.elapsed >= (celebration.replay ? 4 : 3.5))
        celebration = { kind: "settled" };
      lastTime = time;
      draw();
      schedule();
    } else lastTime = 0;
  }
  function schedule() {
    if (
      enabled &&
      !paused &&
      !document.hidden &&
      finaleVisible() &&
      celebration.kind === "playing" &&
      !animationFrame
    )
      animationFrame = requestAnimationFrame(animate);
    else if (paused || document.hidden || !finaleVisible() || !enabled)
      lastTime = 0;
  }
  function draw() {
    if (!layout || !enabled) return;
    if (document.hidden) {
      lastTime = 0;
      return;
    }
    if (!paused) savedScroll = scrollY;
    const sample = sampleRoute(layout, savedScroll, compact);
    const { segment, progress } = sample;
    const active = segment.chapter;
    const visibleTop = scrollY + 54;
    const visibleBottom = scrollY + innerHeight;
    camera.left = 0;
    camera.right = innerWidth;
    camera.top = -scrollY;
    camera.bottom = -scrollY - innerHeight;
    camera.updateProjectionMatrix();
    let finaleProgress = 0;
    machines.forEach((machine, i) => {
      const r = rectangles[i];
      machine.group.visible =
        r.top < visibleBottom && r.top + r.height > visibleTop;
      const mechanism = layout.segments.find(
        (s) => s.kind === "mechanism" && s.chapter === i,
      );
      const p = mechanism
        ? clamp(
            (savedScroll - mechanism.start) / (mechanism.end - mechanism.start),
          )
        : 0;
      if (i === 3) {
        finaleProgress = p;
        if (
          celebration.kind === "armed" &&
          p >= 0.65 &&
          finaleVisible() &&
          !paused
        )
          celebration = { kind: "playing", elapsed: 0, replay: false };
        const pose =
          celebration.kind === "settled"
            ? 1
            : celebration.kind === "playing"
              ? celebration.replay
                ? clamp(celebration.elapsed)
                : 0.65 + 0.35 * clamp(celebration.elapsed / 0.5)
              : Math.min(p, 0.65);
        machine.pose(pose);
      } else machine.pose(p);
    });
    connectors.forEach((c) => {
      if (c.segment.kind === "connector")
        c.group.visible =
          c.segment.points[0].y < visibleBottom &&
          c.segment.points[3].y > visibleTop;
    });
    const point = new THREE.Vector3(sample.point.x, -sample.point.y, 0);
    let rotation =
      sample.rotation + rotationOffsets[layout.segments.indexOf(segment)];
    if (segment.kind === "connector") {
      const connector = connectors.find((c) => c.segment === segment);
      if (connector) {
        point.copy(connector.curve.getPointAt(progress));
        rotation =
          rotationOffsets[layout.segments.indexOf(segment)] -
          (connector.curve.getLength() * progress) /
            (layout.scale * MARBLE_RADIUS);
      }
    } else if (
      active === 3 &&
      progress >= 0.65 &&
      celebration.kind !== "armed"
    ) {
      point.copy(machines[3].ball.position);
      machines[3].group.localToWorld(point);
    }
    marble.position.copy(point);
    marble.rotation.z = rotation;
    marble.scale.setScalar(layout.scale);
    marble.visible =
      savedScroll >= layout.segments[0].start &&
      savedScroll <=
        layout.segments[layout.segments.length - 1].end + stableHeight * 0.4;
    const finale = rectangles[3];
    const confettiTime =
      celebration.kind === "settled"
        ? 3
        : celebration.kind === "playing"
          ? Math.max(0, celebration.elapsed - (celebration.replay ? 1 : 0.5))
          : 0;
    confetti.visible = machines[3].group.visible && confettiTime > 0;
    confetti.count = compact ? 72 : innerWidth < 1024 ? 112 : 160;
    for (let i = 0; i < confetti.count && confetti.visible; i++) {
      const t = clamp((confettiTime - seeded(i, 1) * 0.65) / 2.2);
      const spread = (compact ? 1.8 : 3.2) * layout.scale;
      const x =
        innerWidth / 2 +
        (seeded(i, 2) - 0.5) * spread +
        Math.sin(t * 9 + i) * 0.12 * layout.scale * Math.sin(Math.PI * t);
      const y = layout.centers[3] - (1.12 - 2.82 * t * t) * layout.scale;
      transform.position.set(
        x,
        -Math.min(y, finale.top + finale.height - 80),
        15 + seeded(i, 3) * 20,
      );
      transform.rotation.set(
        t === 1 ? 0 : t * 12 + i,
        t === 1 ? 0 : t * 9,
        i + t * 8,
      );
      transform.scale.set(layout.scale * 0.075, layout.scale * 0.13, 1);
      transform.updateMatrix();
      confetti.setMatrixAt(i, transform.matrix);
    }
    confetti.instanceMatrix.needsUpdate = true;
    const visible =
      machines.some((m) => m.group.visible) ||
      connectors.some((c) => c.group.visible);
    shell.style.visibility = visible ? "visible" : "hidden";
    shell.style.removeProperty("clip-path");
    canvas.style.opacity = visible ? "1" : "0";
    if (visible) {
      renderer.setViewport(0, 0, innerWidth, innerHeight);
      renderer.setScissor(0, 0, innerWidth, innerHeight - 54);
      renderer.setScissorTest(true);
      renderer.render(scene, camera);
      renderer.setScissorTest(false);
    }
    canvas.dataset.machineMode = !visible
      ? "idle"
      : segment.kind === "connector"
        ? "connector"
        : "chapter";
    canvas.dataset.machineChapter = String(active + 1);
    canvas.dataset.machineAction = chapterActions[active];
    canvas.dataset.machineProgress = (
      (savedScroll + stableHeight - rectangles[active].top) /
      (stableHeight + rectangles[active].height)
    ).toFixed(4);
    canvas.dataset.machinePixelsPerUnit = layout.scale.toFixed(6);
    canvas.dataset.machineBallX = (
      (point.x - innerWidth / 2) /
      layout.scale
    ).toFixed(4);
    canvas.dataset.machineBallY = (
      (point.y + layout.centers[active]) /
      layout.scale
    ).toFixed(4);
    canvas.dataset.machineBallDocumentY = (-point.y).toFixed(4);
    canvas.dataset.machineMarbles = "1";
    canvas.dataset.machineDrawCalls = String(renderer.info.render.calls);
    canvas.dataset.finaleState = celebration.kind;
    canvas.dataset.finaleTime = confettiTime.toFixed(3);
    canvas.dataset.finaleProgress = finaleProgress.toFixed(3);
    if (replay) replay.disabled = celebration.kind !== "settled";
    const announcement =
      celebration.kind === "settled"
        ? "Celebration complete."
        : celebration.kind === "playing"
          ? "The confetti is falling."
          : "Scroll to release the confetti.";
    if (status && status.textContent !== announcement)
      status.textContent = announcement;
    schedule();
  }
  function replayFinale() {
    if (celebration.kind === "settled") {
      celebration = { kind: "playing", elapsed: 0, replay: true };
      lastTime = 0;
      draw();
    }
  }
  replay?.addEventListener("click", replayFinale);
  return {
    measure,
    update: draw,
    setEnabled(value: boolean) {
      enabled = value && !renderer.getContext().isContextLost();
      document.documentElement.dataset.connectedMachine = enabled
        ? "ready"
        : "idle";
      if (enabled) measure();
      else {
        lastTime = 0;
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    },
    setPaused(value: boolean) {
      paused = value;
      lastTime = 0;
      draw();
    },
    dispose() {
      delete document.documentElement.dataset.connectedMachine;
      enabled = false;
      cancelAnimationFrame(animationFrame);
      replay?.removeEventListener("click", replayFinale);
      clearConnectors();
      machines.forEach((m) => m.dispose());
      marble.geometry.dispose();
      stripe.geometry.dispose();
      confettiGeometry.dispose();
      confettiMaterial.dispose();
    },
  };
}
