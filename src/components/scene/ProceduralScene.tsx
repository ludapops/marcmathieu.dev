"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import {
  dispatchMachineComplete,
  dispatchMachineReady,
  dispatchMachineStage,
  dispatchMachineWebglFailure,
  introEvents,
  type MachineStage,
} from "@/components/experience/intro-events";
import {
  chapterActions,
  clamp,
  INTRO_DURATION,
  type MachineKind,
} from "./mechanics";
import { buildMachine, createMachineMaterials } from "./tabletop-machine";
import {
  fitPerspectiveDistance,
  getSceneViewport,
  getIntroViewport,
  sceneViewportPresets,
} from "./scene-viewport";
import styles from "./Scene.module.css";

gsap.registerPlugin(ScrollTrigger);

export function ProceduralScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const canvasElement = canvasRef.current;
      const shellElement =
        scopeRef.current?.closest<HTMLElement>("[data-scene-shell]");
      if (!canvasElement || !shellElement) return;
      const canvas = canvasElement;
      const shell = shellElement;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
      } catch {
        dispatchMachineWebglFailure();
        return;
      }
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      const materials = createMachineMaterials(
        getComputedStyle(document.documentElement),
      );
      scene.add(new THREE.HemisphereLight(0xf9f3e6, 0x393c43, 3));
      const key = new THREE.DirectionalLight(0xffebd0, 4);
      key.position.set(-3, 6, 7);
      key.castShadow = true;
      key.shadow.camera.left = -6;
      key.shadow.camera.right = 6;
      key.shadow.camera.top = 5;
      key.shadow.camera.bottom = -5;
      key.shadow.normalBias = 0.025;
      key.shadow.bias = -0.0001;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xcbd9ff, 2.5);
      fill.position.set(4, 3, -3);
      scene.add(fill);
      const chapters = Array.from(
        document.querySelectorAll<HTMLElement>("[data-machine-chapter]"),
      );
      let viewport = getSceneViewport(
        innerWidth,
        innerHeight,
        matchMedia("(pointer: coarse)").matches,
      );
      let compact = innerWidth < 600;
      let machines = makeMachines();
      function makeMachines() {
        const kinds: MachineKind[] = ["intro", ...chapterActions];
        return kinds.map((kind) => {
          const machine = buildMachine(kind, compact, materials);
          machine.group.visible = false;
          scene.add(machine.group);
          return machine;
        });
      }
      let introActive = document.documentElement.dataset.introState !== "seen";
      let running = false;
      let paused = localStorage.getItem("portfolio-motion-paused") === "true";
      let activeIndex = -1;
      let activeProgress = 0;
      let windProgress = 0;
      let lastStage: MachineStage | null = null;
      let sequence: gsap.core.Tween | null = null;
      const driver = { progress: 0 };
      let frame = 0;
      let readyFrame = 0;
      const target = new THREE.Vector3();
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      const ballPosition = new THREE.Vector3();
      const chapterBounds = new THREE.Box3();
      let introViewport = {
        left: 0,
        top: 0,
        width: innerWidth,
        height: innerHeight,
      };

      const stageAt = (p: number): MachineStage =>
        p < 2.45 / INTRO_DURATION
          ? "marble"
          : p < 5.11 / INTRO_DURATION
            ? "dominoes"
            : p < 6.8 / INTRO_DURATION
              ? "launch"
              : p < 0.99
                ? "key"
                : "complete";
      function renderNow() {
        if (document.hidden || renderer.getContext().isContextLost()) return;
        camera.lookAt(target);
        renderer.render(scene, camera);
        canvas.dataset.machineDrawCalls = String(renderer.info.render.calls);
      }
      function render() {
        if (!frame)
          frame = requestAnimationFrame(() => {
            frame = 0;
            renderNow();
          });
      }
      function frameMachine(index: number) {
        const machine = machines[index];
        if (!machine) return;
        const viewWidth = Math.round(
          window.visualViewport?.width ?? innerWidth,
        );
        const viewHeight = Math.round(
          window.visualViewport?.height ?? innerHeight,
        );
        let stageWidth: number;
        let stageHeight: number;
        if (index === 0) {
          stageWidth = introViewport.width;
          stageHeight = introViewport.height;
          renderer.setViewport(
            introViewport.left,
            viewHeight - introViewport.top - stageHeight,
            stageWidth,
            stageHeight,
          );
          machine.bounds.getSize(size);
          machine.bounds.getCenter(center);
          canvas.dataset.machineViewportLeft = introViewport.left.toFixed(2);
          canvas.dataset.machineViewportTop = introViewport.top.toFixed(2);
        } else {
          const rect = chapters[index - 1].getBoundingClientRect();
          const labelSpace = viewHeight < 500 ? 70 : compact ? 95 : 130;
          const topSpace = viewHeight < 500 ? 35 : 50;
          stageWidth = viewWidth;
          stageHeight = Math.max(120, rect.height - labelSpace - topSpace);
          renderer.setViewport(
            0,
            viewHeight - rect.top - topSpace - stageHeight,
            stageWidth,
            stageHeight,
          );
          // Every chapter uses the same fixed world frame. Scrolling only translates its viewport.
          chapterBounds.makeEmpty();
          machines
            .slice(1)
            .forEach((chapter) => chapterBounds.union(chapter.bounds));
          chapterBounds.getSize(size);
          chapterBounds.getCenter(center);
        }
        camera.aspect = stageWidth / stageHeight;
        camera.updateProjectionMatrix();
        canvas.dataset.machineViewportWidth = stageWidth.toFixed(2);
        canvas.dataset.machineViewportHeight = stageHeight.toFixed(2);
        let width = size.x + (compact ? 0.1 : 0.4);
        let height = size.y + 0.5;
        if (index === 0 && viewport === "phone") {
          // The phone follows overlapping working areas; contacts stay in view.
          const p = (driver.progress * INTRO_DURATION) / 7;
          center.x =
            p < 0.26
              ? -2.6
              : p < 0.58
                ? THREE.MathUtils.lerp(-2.6, 0.45, clamp((p - 0.26) / 0.22))
                : THREE.MathUtils.lerp(0.45, 2.25, clamp((p - 0.58) / 0.15));
          center.y = 0.3;
          width = p < 0.26 ? 3.7 : 4.1;
          height = 3.3;
        }
        const distance = fitPerspectiveDistance({
          width,
          height,
          depth: size.z,
          aspect: camera.aspect,
          verticalFov: camera.fov,
          padding: index === 0 ? 1.18 : compact ? 1.05 : 1.12,
        });
        canvas.dataset.machineCameraDistance = distance.toFixed(6);
        canvas.dataset.machinePixelsPerUnit = (
          stageHeight /
          (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance)
        ).toFixed(6);
        target.set(center.x, center.y + (index === 0 ? 0.2 : 0.15), 0);
        camera.position.set(
          center.x + 0.18,
          target.y + distance * 0.18,
          distance,
        );
        canvas.dataset.machineFrame =
          index === 0
            ? running
              ? stageAt(driver.progress)
              : "opening"
            : `chapter-${index}`;
      }
      function show(index: number) {
        machines.forEach((machine, i) => {
          machine.group.visible = i === index;
        });
        shell.style.visibility = "visible";
        canvas.style.opacity = "1";
      }
      function poseIntro() {
        machines[0].pose(driver.progress, windProgress);
        frameMachine(0);
        canvas.dataset.machineProgress = driver.progress.toFixed(4);
        canvas.dataset.machineMode = "intro";
        render();
      }
      function setChapter(index: number, progress: number) {
        if (introActive) return;
        activeIndex = index;
        activeProgress = progress;
        const rect = chapters[index]?.getBoundingClientRect();
        if (!rect) return;
        const top = Math.max(0, Math.min(innerHeight, rect.top));
        const bottom = Math.max(
          0,
          Math.min(innerHeight, innerHeight - rect.bottom),
        );
        shell.style.clipPath = `inset(${top}px 0px ${bottom}px 0px)`;
        canvas.dataset.machineClipTop = top.toFixed(2);
        canvas.dataset.machineClipBottom = bottom.toFixed(2);
        show(index + 1);
        const storyProgress = clamp((progress - 0.18) / 0.52);
        if (!paused) machines[index + 1].pose(storyProgress);
        const ball = machines[index + 1].ball;
        machines[index + 1].group.updateMatrixWorld(true);
        ball.getWorldPosition(ballPosition);
        canvas.dataset.machineBallX = ballPosition.x.toFixed(4);
        canvas.dataset.machineBallY = ballPosition.y.toFixed(4);
        frameMachine(index + 1);
        canvas.dataset.machineMode = "chapter";
        canvas.dataset.machineChapter = String(index + 1);
        canvas.dataset.machineAction = chapterActions[index];
        if (!paused) canvas.dataset.machineProgress = progress.toFixed(4);
        render();
      }
      function resize() {
        const width = Math.max(
          1,
          Math.round(window.visualViewport?.width ?? innerWidth),
        );
        const height = Math.max(
          1,
          Math.round(window.visualViewport?.height ?? innerHeight),
        );
        const identity = document
          .querySelector<HTMLElement>("[data-intro-identity]")
          ?.getBoundingClientRect();
        const controls = document
          .querySelector<HTMLElement>("[data-machine-control]")
          ?.getBoundingClientRect();
        introViewport = getIntroViewport({
          width,
          height,
          identityRight: identity?.right ?? width * 0.3,
          identityBottom: identity?.bottom ?? height * 0.25,
          controlsTop: controls?.top ?? height * 0.8,
        });
        const nextCompact = width < 600;
        if (nextCompact !== compact) {
          machines.forEach((machine) => {
            scene.remove(machine.group);
            machine.dispose();
          });
          compact = nextCompact;
          machines = makeMachines();
        }
        viewport = getSceneViewport(
          width,
          height,
          matchMedia("(pointer: coarse)").matches,
        );
        const preset = sceneViewportPresets[viewport];
        canvas.dataset.machineViewport = viewport;
        renderer.setPixelRatio(Math.min(devicePixelRatio, preset.pixelRatio));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        key.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
        if (introActive) {
          show(0);
          poseIntro();
        } else if (activeIndex >= 0) setChapter(activeIndex, activeProgress);
        else {
          canvas.style.opacity = "0";
          shell.style.visibility = "hidden";
        }
      }
      function finishIntro() {
        sequence?.kill();
        sequence = null;
        running = false;
        introActive = false;
        machines.forEach((machine) => {
          machine.group.visible = false;
        });
        canvas.dataset.machineMode = "idle";
        canvas.style.opacity = "0";
        shell.style.visibility = "hidden";
        shell.style.removeProperty("clip-path");
        ScrollTrigger.refresh();
        const visible = chapters.findIndex((element) => {
          const r = element.getBoundingClientRect();
          return r.top < innerHeight && r.bottom > 0;
        });
        if (visible >= 0) {
          const r = chapters[visible].getBoundingClientRect();
          setChapter(
            visible,
            clamp((innerHeight - r.top) / (innerHeight + r.height)),
          );
        }
      }
      function replay() {
        if (renderer.getContext().isContextLost()) {
          dispatchMachineWebglFailure();
          return;
        }
        sequence?.kill();
        sequence = null;
        driver.progress = 0;
        windProgress = 0;
        lastStage = null;
        running = false;
        introActive = true;
        activeIndex = -1;
        shell.style.removeProperty("clip-path");
        delete canvas.dataset.machineStage;
        delete canvas.dataset.machineAction;
        delete canvas.dataset.machineChapter;
        resize();
        renderNow();
        dispatchMachineReady();
      }
      function wind(event: Event) {
        if (running || !introActive || !(event instanceof CustomEvent)) return;
        const detail: unknown = event.detail;
        if (
          typeof detail !== "object" ||
          detail === null ||
          !("progress" in detail) ||
          typeof detail.progress !== "number"
        )
          return;
        windProgress = clamp(detail.progress);
        poseIntro();
      }
      function start(event: Event) {
        if (!introActive || !(event instanceof CustomEvent)) return;
        const detail: unknown = event.detail;
        if (
          typeof detail !== "object" ||
          detail === null ||
          !("skipped" in detail) ||
          !("reduced" in detail)
        )
          return;
        if (detail.skipped || detail.reduced) {
          finishIntro();
          return;
        }
        if (running) return;
        running = true;
        driver.progress = 0;
        lastStage = "marble";
        canvas.dataset.machineStage = "marble";
        poseIntro();
        dispatchMachineStage("marble");
        sequence = gsap.to(driver, {
          progress: 1,
          duration: INTRO_DURATION,
          ease: "none",
          onUpdate() {
            poseIntro();
            const stage = stageAt(driver.progress);
            if (stage !== lastStage && stage !== "complete") {
              lastStage = stage;
              canvas.dataset.machineStage = stage;
              dispatchMachineStage(stage);
            }
          },
          onComplete() {
            lastStage = "complete";
            canvas.dataset.machineStage = "complete";
            dispatchMachineStage("complete");
            dispatchMachineComplete();
          },
        });
        if (paused || document.hidden) sequence.pause();
      }
      function motion(event: Event) {
        if (!(event instanceof CustomEvent)) return;
        const detail: unknown = event.detail;
        if (
          typeof detail !== "object" ||
          detail === null ||
          !("paused" in detail)
        )
          return;
        paused = Boolean(detail.paused);
        if (paused || document.hidden) sequence?.pause();
        else sequence?.resume();
        if (!paused && activeIndex >= 0)
          setChapter(activeIndex, activeProgress);
      }
      function visibility() {
        if (paused || document.hidden) sequence?.pause();
        else {
          sequence?.resume();
          render();
        }
      }
      function contextLost(event: Event) {
        event.preventDefault();
        sequence?.kill();
        canvas.hidden = true;
        shell.removeAttribute("data-webgl");
        dispatchMachineWebglFailure();
      }
      const triggers = chapters.map((element, index) =>
        ScrollTrigger.create({
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          onEnter: (self) => setChapter(index, self.progress),
          onEnterBack: (self) => setChapter(index, self.progress),
          onUpdate: (self) => setChapter(index, self.progress),
          onLeave: () => {
            if (activeIndex === index) canvas.style.opacity = "0";
          },
          onLeaveBack: () => {
            if (activeIndex === index) canvas.style.opacity = "0";
          },
        }),
      );
      resize();
      renderNow();
      readyFrame = requestAnimationFrame(() => {
        shell.setAttribute("data-webgl", "ready");
        if (introActive) dispatchMachineReady();
      });
      const layoutObserver = new ResizeObserver(resize);
      const identity = document.querySelector("[data-intro-identity]");
      const controls = document.querySelector("[data-machine-control]");
      if (identity) layoutObserver.observe(identity);
      if (controls) layoutObserver.observe(controls);
      window.addEventListener("resize", resize);
      window.visualViewport?.addEventListener("resize", resize);
      window.addEventListener(introEvents.wind, wind);
      window.addEventListener(introEvents.start, start);
      window.addEventListener(introEvents.replay, replay);
      window.addEventListener(introEvents.introComplete, finishIntro);
      window.addEventListener("portfolio:motion", motion);
      document.addEventListener("visibilitychange", visibility);
      canvas.addEventListener("webglcontextlost", contextLost);
      return () => {
        cancelAnimationFrame(frame);
        cancelAnimationFrame(readyFrame);
        sequence?.kill();
        triggers.forEach((trigger) => trigger.kill());
        layoutObserver.disconnect();
        window.removeEventListener("resize", resize);
        window.visualViewport?.removeEventListener("resize", resize);
        window.removeEventListener(introEvents.wind, wind);
        window.removeEventListener(introEvents.start, start);
        window.removeEventListener(introEvents.replay, replay);
        window.removeEventListener(introEvents.introComplete, finishIntro);
        window.removeEventListener("portfolio:motion", motion);
        document.removeEventListener("visibilitychange", visibility);
        canvas.removeEventListener("webglcontextlost", contextLost);
        machines.forEach((machine) => machine.dispose());
        Object.values(materials).forEach((material) => material.dispose());
        shell.removeAttribute("data-webgl");
        shell.style.removeProperty("visibility");
        shell.style.removeProperty("clip-path");
        delete document.documentElement.dataset.machineReady;
        key.shadow.dispose();
        renderer.dispose();
      };
    },
    { scope: scopeRef },
  );
  return (
    <div className={styles.webgl} ref={scopeRef}>
      <canvas ref={canvasRef} data-machine-canvas />
    </div>
  );
}
