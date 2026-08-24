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
  type MachineStage,
  type MachineStartDetail,
  type MachineWindDetail,
  introEvents,
} from "@/components/experience/intro-events";
import { introCameraStages, introMachineLayout } from "./machine-layout";
import styles from "./Scene.module.css";

gsap.registerPlugin(ScrollTrigger);

const palette = {
  ink: "#171916",
  ivory: "#f2efe7",
  lime: "#b7ef36",
  orange: "#ff5e33",
  lavender: "#c7a5ff",
  steel: "#676a63",
} as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
};

export function ProceduralScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const sceneShell =
        scopeRef.current?.closest<HTMLElement>("[data-scene-shell]");

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
      } catch {
        canvas.hidden = true;
        dispatchMachineWebglFailure();
        return;
      }
      scopeRef.current
        ?.closest<HTMLElement>("[data-scene-shell]")
        ?.setAttribute("data-webgl", "ready");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      const introMachine = new THREE.Group();
      const chapterMachine = new THREE.Group();
      scene.add(introMachine, chapterMachine);

      const materials = {
        ink: new THREE.MeshStandardMaterial({
          color: palette.ink,
          metalness: 0.6,
          roughness: 0.32,
        }),
        ivory: new THREE.MeshStandardMaterial({
          color: palette.ivory,
          metalness: 0.12,
          roughness: 0.55,
        }),
        lime: new THREE.MeshStandardMaterial({
          color: palette.lime,
          emissive: palette.lime,
          emissiveIntensity: 0.2,
          metalness: 0.25,
          roughness: 0.28,
        }),
        orange: new THREE.MeshStandardMaterial({
          color: palette.orange,
          emissive: palette.orange,
          emissiveIntensity: 0.12,
          metalness: 0.2,
          roughness: 0.35,
        }),
        lavender: new THREE.MeshStandardMaterial({
          color: palette.lavender,
          emissive: palette.lavender,
          emissiveIntensity: 0.12,
          metalness: 0.2,
          roughness: 0.36,
        }),
        steel: new THREE.MeshStandardMaterial({
          color: palette.steel,
          metalness: 0.8,
          roughness: 0.24,
        }),
      };

      const box = (
        width: number,
        height: number,
        depth: number,
        material: THREE.Material,
      ) =>
        new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);

      const sphere = (radius: number, material: THREE.Material) =>
        new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 18), material);

      const cylinder = (
        radius: number,
        height: number,
        material: THREE.Material,
        segments = 24,
      ) =>
        new THREE.Mesh(
          new THREE.CylinderGeometry(radius, radius, height, segments),
          material,
        );

      const tube = (
        points: THREE.Vector3[],
        radius: number,
        material: THREE.Material,
      ) => {
        const curve = new THREE.CatmullRomCurve3(points);
        return {
          curve,
          mesh: new THREE.Mesh(
            new THREE.TubeGeometry(curve, 100, radius, 8, false),
            material,
          ),
        };
      };

      const platform = box(8.8, 0.16, 3.2, materials.ink);
      platform.position.y = -1.05;
      introMachine.add(platform);

      for (let index = 0; index < 11; index += 1) {
        const mark = box(
          0.015,
          0.02,
          index % 5 === 0 ? 0.5 : 0.26,
          materials.ivory,
        );
        mark.position.set(-4 + index * 0.8, -0.95, 1.58);
        introMachine.add(mark);
      }

      const launcher = new THREE.Group();
      launcher.position.set(-3.62, 0.9, 0);
      const springPoints = Array.from({ length: 70 }, (_, index) => {
        const progress = index / 69;
        const angle = progress * Math.PI * 12;
        return new THREE.Vector3(
          progress * 0.78,
          Math.sin(angle) * 0.11,
          Math.cos(angle) * 0.11,
        );
      });
      const spring = tube(springPoints, 0.035, materials.lime).mesh;
      const plunger = box(0.12, 0.56, 0.48, materials.ivory);
      plunger.position.x = 0.88;
      const springScaleForPlunger = (plungerX: number) =>
        Math.max(0.2, (plungerX - 0.095) / 0.78);
      launcher.add(spring, plunger);
      introMachine.add(launcher);

      const lever = new THREE.Group();
      const leverArm = box(0.12, 1.05, 0.12, materials.ivory);
      leverArm.position.y = 0.48;
      const leverKnob = sphere(0.18, materials.orange);
      leverKnob.position.y = 1.02;
      lever.add(leverArm, leverKnob);
      lever.position.set(-3.75, -0.76, 0);
      introMachine.add(lever);

      const introRail = tube(
        introMachineLayout.rail.map(
          (point) => new THREE.Vector3(point.x, point.y, 0),
        ),
        0.045,
        materials.steel,
      );
      const railTwin = introRail.mesh.clone();
      introRail.mesh.position.z = -0.2;
      railTwin.position.z = 0.2;
      introMachine.add(introRail.mesh, railTwin);

      const limeBall = sphere(0.2, materials.lime);
      limeBall.position.set(
        introMachineLayout.marble.start.x,
        introMachineLayout.marble.start.y,
        0,
      );
      introMachine.add(limeBall);

      const dominoes = Array.from(
        { length: introMachineLayout.dominoes.count },
        (_, index) => {
          const pivot = new THREE.Group();
          const domino = box(
            introMachineLayout.dominoes.width,
            introMachineLayout.dominoes.height,
            0.42,
            materials.ivory,
          );
          domino.position.y = introMachineLayout.dominoes.height / 2;
          pivot.add(domino);
          pivot.position.set(
            introMachineLayout.dominoes.startX +
              index * introMachineLayout.dominoes.gap,
            introMachineLayout.floorY + 0.02,
            0,
          );
          introMachine.add(pivot);
          return pivot;
        },
      );

      const seesaw = new THREE.Group();
      const seesawBoard = box(
        introMachineLayout.seesaw.width,
        introMachineLayout.seesaw.height,
        0.48,
        materials.orange,
      );
      const seesawPivot = cylinder(0.2, 0.52, materials.steel, 16);
      seesawPivot.rotation.x = Math.PI / 2;
      seesawPivot.position.y = -0.18;
      seesaw.add(seesawBoard, seesawPivot);
      seesaw.position.set(
        introMachineLayout.seesaw.x,
        introMachineLayout.seesaw.y,
        0,
      );
      introMachine.add(seesaw);

      const orangeBall = sphere(0.19, materials.orange);
      orangeBall.position.set(
        introMachineLayout.orangeBall.x,
        introMachineLayout.orangeBall.y,
        0,
      );
      introMachine.add(orangeBall);

      const enterKey = new THREE.Group();
      const keyBase = box(
        introMachineLayout.enterKey.width,
        introMachineLayout.enterKey.height,
        0.82,
        materials.lavender,
      );
      const keyTop = box(0.88, 0.12, 0.66, materials.ivory);
      keyTop.position.y = 0.18;
      enterKey.add(keyBase, keyTop);
      enterKey.position.set(
        introMachineLayout.enterKey.x,
        introMachineLayout.enterKey.y,
        0,
      );
      introMachine.add(enterKey);

      const chapterCenters = [-5.2, 0, 5.2] as const;
      const chapterBalls: THREE.Mesh[] = [];
      const chapterCurves: THREE.CatmullRomCurve3[] = [];
      const chapterWheels: THREE.Group[] = [];
      const chapterDominoes: THREE.Mesh[][] = [];
      const chapterArms: THREE.Group[] = [];

      const connector = tube(
        [
          new THREE.Vector3(-7.8, -0.45, 0),
          new THREE.Vector3(-4.5, 0.62, 0),
          new THREE.Vector3(-1.8, -0.18, 0),
          new THREE.Vector3(1.7, 0.52, 0),
          new THREE.Vector3(4.2, -0.2, 0),
          new THREE.Vector3(7.8, 0.58, 0),
        ],
        0.035,
        materials.steel,
      ).mesh;
      const connectorTwin = connector.clone();
      connector.position.z = -0.24;
      connectorTwin.position.z = 0.24;
      chapterMachine.add(connector, connectorTwin);

      chapterCenters.forEach((center, moduleIndex) => {
        const group = new THREE.Group();
        group.position.x = center;
        const base = box(4.25, 0.14, 2.7, materials.ink);
        base.position.y = -1.02;
        group.add(base);

        const accentMaterial = [
          materials.lime,
          materials.orange,
          materials.lavender,
        ][moduleIndex];
        const wheel = new THREE.Group();
        const rim = new THREE.Mesh(
          new THREE.TorusGeometry(0.72, 0.055, 10, 48),
          accentMaterial,
        );
        const spokeA = box(1.34, 0.055, 0.055, materials.ivory);
        const spokeB = spokeA.clone();
        spokeB.rotation.z = Math.PI / 2;
        wheel.add(rim, spokeA, spokeB);
        wheel.position.set(-1.25, 0.18, -0.18);
        group.add(wheel);

        const curveData = tube(
          [
            new THREE.Vector3(-1.85, 0.78, 0.15),
            new THREE.Vector3(-0.8, 0.98, -0.05),
            new THREE.Vector3(0.15, 0.32, 0.12),
            new THREE.Vector3(1.6, -0.12, 0),
          ],
          0.04,
          materials.steel,
        );
        const curveTwin = curveData.mesh.clone();
        curveData.mesh.position.z = -0.18;
        curveTwin.position.z = 0.18;
        group.add(curveData.mesh, curveTwin);

        const ball = sphere(0.17, accentMaterial);
        ball.position.copy(curveData.curve.getPoint(0));
        group.add(ball);

        const moduleDominoes = Array.from({ length: 6 }, (_, dominoIndex) => {
          const domino = box(0.12, 0.64, 0.36, materials.ivory);
          domino.position.set(0.18 + dominoIndex * 0.27, -0.64, 0.2);
          group.add(domino);
          return domino;
        });

        const arm = new THREE.Group();
        const plank = box(1.05, 0.09, 0.42, accentMaterial);
        const pin = cylinder(0.15, 0.46, materials.steel, 16);
        pin.rotation.x = Math.PI / 2;
        pin.position.y = -0.18;
        arm.add(plank, pin);
        arm.position.set(1.35, -0.28, 0);
        group.add(arm);

        if (moduleIndex === 2) {
          const stampPost = box(0.14, 1.15, 0.14, materials.ivory);
          stampPost.position.set(1.68, 0.08, 0);
          const stampHead = box(0.74, 0.2, 0.55, materials.lavender);
          stampHead.position.set(1.68, 0.62, 0);
          group.add(stampPost, stampHead);
          arm.userData.stamp = stampHead;
        }

        chapterMachine.add(group);
        chapterBalls.push(ball);
        chapterCurves.push(curveData.curve);
        chapterWheels.push(wheel);
        chapterDominoes.push(moduleDominoes);
        chapterArms.push(arm);
      });

      scene.add(new THREE.AmbientLight("#ffffff", 1.65));
      const keyLight = new THREE.DirectionalLight("#ffffff", 4.2);
      keyLight.position.set(3, 6, 8);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      scene.add(keyLight);
      const limeLight = new THREE.PointLight(palette.lime, 11, 13);
      limeLight.position.set(-3, 1.5, 4);
      scene.add(limeLight);
      const warmLight = new THREE.PointLight(palette.orange, 8, 12);
      warmLight.position.set(4, 0, 3);
      scene.add(warmLight);

      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = true;
        object.receiveShadow = true;
      });

      let introActive = document.documentElement.dataset.introState !== "seen";
      let machineRunning = false;
      let motionPaused =
        window.localStorage.getItem("portfolio-motion-paused") === "true";
      let activeChapter = -1;
      let activeProgress = 0;
      let renderFrame = 0;
      const animations = new Set<gsap.core.Animation>();
      const cameraTarget = new THREE.Vector3(0, 0, 0);

      chapterMachine.visible = !introActive;
      introMachine.visible = introActive;
      canvas.dataset.machineMode = introActive ? "intro" : "idle";
      canvas.style.opacity = introActive ? "1" : "0";

      const baseCameraZ = () => (window.innerWidth < 700 ? 13.4 : 10.4);
      const renderNow = () => {
        camera.lookAt(cameraTarget);
        renderer.render(scene, camera);
      };
      const render = () => {
        cancelAnimationFrame(renderFrame);
        renderFrame = requestAnimationFrame(renderNow);
      };

      const resize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.z = baseCameraZ();
        camera.position.x = 0;
        camera.position.y = 0;
        cameraTarget.set(0, 0, 0);
        camera.updateProjectionMatrix();
        if (width < 700) {
          introMachine.scale.setScalar(0.8);
          introMachine.position.set(0.45, -0.4, 0);
        } else {
          introMachine.scale.setScalar(1);
          introMachine.position.set(0.15, -0.2, 0);
        }
        render();
      };

      const setWind = (progress: number) => {
        const eased = smooth(progress);
        lever.rotation.z = eased * Math.PI * 1.65;
        plunger.position.x = 0.88 - eased * 0.32;
        spring.scale.x = springScaleForPlunger(plunger.position.x);
        launcher.position.y =
          0.9 + Math.sin(progress * Math.PI * 18) * eased * 0.012;
        introRail.mesh.position.y =
          Math.sin(progress * Math.PI * 16) * eased * 0.012;
        railTwin.position.y = introRail.mesh.position.y;
        limeBall.scale.setScalar(1 + eased * 0.08);
        limeLight.intensity = 11 + eased * 15;
        render();
      };
      const animateCamera = (stage: MachineStage) => {
        const target = introCameraStages[stage];
        const mobileDepth = window.innerWidth < 700 ? 3.2 : 0;
        const positionTween = gsap.to(camera.position, {
          x: target.x,
          y: target.y,
          z: target.z + mobileDepth,
          duration: stage === "complete" ? 0.32 : 0.58,
          ease: stage === "complete" ? "power4.in" : "power3.inOut",
          overwrite: "auto",
          onUpdate: renderNow,
          onComplete: () => animations.delete(positionTween),
        });
        const targetTween = gsap.to(cameraTarget, {
          x: target.x,
          y: target.y - 0.08,
          duration: 0.52,
          ease: "power3.inOut",
          overwrite: "auto",
          onUpdate: renderNow,
          onComplete: () => animations.delete(targetTween),
        });
        animations.add(positionTween);
        animations.add(targetTween);
      };

      const impact = (object: THREE.Object3D, amount = 1.16) => {
        const tween = gsap.fromTo(
          object.scale,
          { x: amount, y: 1 / amount, z: amount },
          {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.28,
            ease: "back.out(2.5)",
            onUpdate: renderNow,
            onComplete: () => animations.delete(tween),
          },
        );
        animations.add(tween);
      };

      const machineStage = (stage: MachineStage) => {
        canvas.dataset.machineStage = stage;
        dispatchMachineStage(stage);
        animateCamera(stage);

        if (stage === "marble") {
          impact(limeBall, 1.22);
        } else if (stage === "dominoes") {
          impact(dominoes[0]);
        } else if (stage === "seesaw") {
          impact(seesaw, 1.1);
        } else if (stage === "key") {
          impact(enterKey, 1.2);
        } else if (stage === "complete") {
          dispatchMachineComplete();
        }
      };

      const finishIntro = () => {
        introActive = false;
        machineRunning = false;
        introMachine.visible = false;
        chapterMachine.visible = true;
        canvas.dataset.machineMode = "idle";
        canvas.style.opacity = "0";
        if (sceneShell) sceneShell.style.visibility = "hidden";
        camera.position.set(0, 0, baseCameraZ());
        cameraTarget.set(0, 0, 0);
        renderNow();
        requestAnimationFrame(() => ScrollTrigger.refresh());
      };

      const setChapter = (index: number, progress: number) => {
        if (introActive || motionPaused) return;
        if (
          index < 0 ||
          index >= chapterCenters.length ||
          !chapterCurves[index] ||
          !chapterBalls[index]
        )
          return;
        activeChapter = index;
        activeProgress = progress;
        canvas.dataset.machineMode = "chapter";
        canvas.dataset.machineChapter = `${index + 1}`;
        canvas.dataset.machineProgress = progress.toFixed(4);
        introMachine.visible = false;
        chapterMachine.visible = true;
        if (sceneShell) sceneShell.style.visibility = "visible";
        canvas.style.opacity = "1";

        const center = chapterCenters[index];
        camera.position.x =
          center + THREE.MathUtils.lerp(-0.72, 0.72, progress);
        camera.position.y = Math.sin(progress * Math.PI) * 0.18;
        camera.position.z = window.innerWidth < 700 ? 12.2 : 8.6;
        cameraTarget.set(center, -0.05, 0);

        const ballPoint = chapterCurves[index].getPoint(smooth(progress));
        chapterBalls[index].position.copy(ballPoint);
        chapterBalls[index].rotation.z = progress * Math.PI * 5;
        chapterWheels[index].rotation.z = -progress * Math.PI * 3.2;
        chapterDominoes[index].forEach((domino, dominoIndex) => {
          const local = smooth((progress - 0.36 - dominoIndex * 0.065) / 0.24);
          domino.rotation.z = -local * Math.PI * 0.46;
        });
        chapterArms[index].rotation.z =
          -smooth((progress - 0.75) / 0.2) * Math.PI * 0.16;
        const stamp = chapterArms[index].userData.stamp as
          THREE.Mesh | undefined;
        if (stamp) {
          stamp.position.y = 0.62 - smooth((progress - 0.72) / 0.2) * 0.72;
        }
        render();
      };

      const windEvent = (event: Event) => {
        if (!introActive || machineRunning) return;
        const progress = (event as CustomEvent<MachineWindDetail>).detail
          .progress;
        setWind(clamp01(progress));
      };

      const startMachine = (event: Event) => {
        if (!introActive || machineRunning) return;
        const detail = (event as CustomEvent<MachineStartDetail>).detail;
        machineRunning = true;

        if (detail.skipped || detail.reduced) {
          const tween = gsap.to(canvas, {
            opacity: 0,
            duration: 0.34,
            ease: "power2.out",
            onComplete: () => {
              animations.delete(tween);
              introActive = false;
              introMachine.visible = false;
              chapterMachine.visible = true;
            },
          });
          animations.add(tween);
          return;
        }

        const railState = { progress: 0 };
        const throwState = { progress: 0 };
        const launcherState = { progress: 0 };
        const sequence = gsap.timeline({
          defaults: { overwrite: "auto" },
          onUpdate: renderNow,
          onComplete: () => animations.delete(sequence),
        });
        animations.add(sequence);

        sequence
          .call(() => machineStage("marble"), [], 0.15)
          .to(
            lever.rotation,
            {
              z: Math.PI * 2.15,
              duration: 0.24,
              ease: "back.out(2)",
            },
            0,
          )
          .to(
            launcherState,
            {
              progress: 1,
              duration: 0.17,
              ease: "power3.inOut",
              onUpdate: () => {
                plunger.position.x = THREE.MathUtils.lerp(
                  0.56,
                  0.88,
                  launcherState.progress,
                );
                spring.scale.x = springScaleForPlunger(plunger.position.x);
              },
            },
            0,
          )
          .to(
            railState,
            {
              progress: 1,
              duration: 0.62,
              ease: "power2.in",
              onUpdate: () => {
                const point = introRail.curve.getPoint(railState.progress);
                limeBall.position.copy(point);
                limeBall.position.y += introMachineLayout.marble.radius;
                limeBall.rotation.z = -railState.progress * Math.PI * 5;
              },
            },
            0.17,
          )
          .call(() => machineStage("dominoes"), [], 0.78);

        dominoes.forEach((domino, index) => {
          sequence.to(
            domino.rotation,
            {
              z: -Math.PI * 0.47,
              duration: 0.19,
              ease: "power2.in",
            },
            0.78 + index * 0.09,
          );
        });

        sequence
          .call(() => machineStage("seesaw"), [], 1.48)
          .to(
            seesaw.rotation,
            { z: 0.42, duration: 0.26, ease: "power3.inOut" },
            1.48,
          )
          .to(
            throwState,
            {
              progress: 1,
              duration: 0.74,
              ease: "none",
              onUpdate: () => {
                const progress = throwState.progress;
                orangeBall.position.x = THREE.MathUtils.lerp(
                  introMachineLayout.orangeBall.x,
                  introMachineLayout.enterKey.x,
                  progress,
                );
                orangeBall.position.y =
                  THREE.MathUtils.lerp(
                    introMachineLayout.orangeBall.y,
                    introMachineLayout.enterKey.y + 0.38,
                    progress,
                  ) +
                  Math.sin(progress * Math.PI) * 1.35;
                orangeBall.rotation.z = -progress * Math.PI * 6;
              },
            },
            1.54,
          )
          .call(() => machineStage("key"), [], 2.28)
          .to(
            enterKey.position,
            {
              y: introMachineLayout.enterKey.y - 0.14,
              duration: 0.18,
              ease: "power3.in",
            },
            2.28,
          )
          .to(
            enterKey.scale,
            {
              x: 1.14,
              z: 1.14,
              duration: 0.2,
              repeat: 1,
              yoyo: true,
              ease: "power2.out",
            },
            2.28,
          )
          .call(() => machineStage("complete"), [], 2.53);
      };

      const triggers = Array.from(
        document.querySelectorAll<HTMLElement>("[data-machine-chapter]"),
      ).map((element, index) =>
        ScrollTrigger.create({
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => setChapter(index, 0),
          onEnterBack: () => setChapter(index, 1),
          onLeave: () => {
            if (activeChapter === index) canvas.style.opacity = "0";
          },
          onLeaveBack: () => {
            if (activeChapter === index) canvas.style.opacity = "0";
          },
          onUpdate: (self) => setChapter(index, self.progress),
        }),
      );

      const motion = (event: Event) => {
        motionPaused = Boolean(
          (event as CustomEvent<{ paused: boolean }>).detail.paused,
        );
        if (motionPaused) {
          cancelAnimationFrame(renderFrame);
          renderFrame = 0;
        }
        animations.forEach((animation) =>
          motionPaused ? animation.pause() : animation.resume(),
        );
        if (!motionPaused && activeChapter >= 0) {
          setChapter(activeChapter, activeProgress);
        }
      };

      const visibility = () => {
        animations.forEach((animation) =>
          document.hidden ? animation.pause() : animation.resume(),
        );
      };

      const contextLost = (event: Event) => {
        event.preventDefault();
        canvas.hidden = true;
        scopeRef.current
          ?.closest<HTMLElement>("[data-scene-shell]")
          ?.removeAttribute("data-webgl");
        dispatchMachineWebglFailure();
      };

      resize();
      if (introActive) dispatchMachineReady();
      window.addEventListener("resize", resize);
      window.addEventListener(introEvents.wind, windEvent);
      window.addEventListener(introEvents.start, startMachine);
      window.addEventListener(introEvents.introComplete, finishIntro);
      window.addEventListener("portfolio:motion", motion);
      document.addEventListener("visibilitychange", visibility);
      canvas.addEventListener("webglcontextlost", contextLost);

      return () => {
        cancelAnimationFrame(renderFrame);
        triggers.forEach((trigger) => trigger.kill());
        animations.forEach((animation) => animation.kill());
        window.removeEventListener("resize", resize);
        window.removeEventListener(introEvents.wind, windEvent);
        window.removeEventListener(introEvents.start, startMachine);
        window.removeEventListener(introEvents.introComplete, finishIntro);
        window.removeEventListener("portfolio:motion", motion);
        document.removeEventListener("visibilitychange", visibility);
        canvas.removeEventListener("webglcontextlost", contextLost);
        scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
        });
        Object.values(materials).forEach((material) => material.dispose());
        scopeRef.current
          ?.closest<HTMLElement>("[data-scene-shell]")
          ?.removeAttribute("data-webgl");
        delete document.documentElement.dataset.machineReady;
        sceneShell?.style.removeProperty("visibility");
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
