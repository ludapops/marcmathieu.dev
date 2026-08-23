"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import {
  type IntroProgressDetail,
  type IntroRevealDetail,
  introEvents,
} from "@/components/experience/intro-events";
import styles from "./Scene.module.css";

gsap.registerPlugin(ScrollTrigger);

const sceneStates = {
  ag1: {
    color: "#b7ef36",
    rotation: 0.25,
    scale: 1,
    x: -0.25,
    y: 0.05,
  },
  battlefield: {
    color: "#ff5e33",
    rotation: 1.25,
    scale: 1.16,
    x: 0.35,
    y: -0.08,
  },
  beautynexos: {
    color: "#c7a5ff",
    rotation: 2.2,
    scale: 0.94,
    x: 0,
    y: 0.16,
  },
} as const;

export function ProceduralScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
      } catch {
        canvas.hidden = true;
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0, 6.8);

      const sceneRoot = new THREE.Group();
      const pointerGroup = new THREE.Group();
      const sculpture = new THREE.Group();
      sceneRoot.add(pointerGroup);
      pointerGroup.add(sculpture);
      scene.add(sceneRoot);

      const accentMaterial = new THREE.MeshStandardMaterial({
        color: sceneStates.ag1.color,
        emissive: sceneStates.ag1.color,
        emissiveIntensity: 0.22,
        metalness: 0.55,
        roughness: 0.28,
      });
      const ribbonMaterial = new THREE.MeshBasicMaterial({
        color: sceneStates.ag1.color,
        transparent: true,
        opacity: 0.82,
      });
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: "#f2efe7",
        transparent: true,
        opacity: 0.58,
        wireframe: true,
      });
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: "#f2efe7",
        transparent: true,
        opacity: 0.38,
      });
      const particleMaterial = new THREE.PointsMaterial({
        color: sceneStates.ag1.color,
        size: 0.035,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.72,
      });

      const coreGeometry = new THREE.IcosahedronGeometry(0.82, 2);
      const core = new THREE.Mesh(coreGeometry, wireMaterial);
      sculpture.add(core);

      const innerGeometry = new THREE.IcosahedronGeometry(0.3, 1);
      const innerCore = new THREE.Mesh(innerGeometry, accentMaterial);
      sculpture.add(innerCore);

      const ringGeometry = new THREE.TorusGeometry(1.38, 0.012, 6, 160);
      const ringRotations = [
        new THREE.Euler(0.25, 0.12, 0.08),
        new THREE.Euler(1.08, 0.5, 0.46),
        new THREE.Euler(0.72, 1.18, 1.12),
      ];
      const rings = ringRotations.map((rotation) => {
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.copy(rotation);
        sculpture.add(ring);
        return ring;
      });

      const helixPoints = Array.from({ length: 96 }, (_, index) => {
        const progress = index / 95;
        const angle = progress * Math.PI * 5.2;
        const radius = 1.08 + Math.sin(progress * Math.PI * 4) * 0.18;
        return new THREE.Vector3(
          Math.cos(angle) * radius,
          (progress - 0.5) * 3.1,
          Math.sin(angle) * radius,
        );
      });
      const helixCurve = new THREE.CatmullRomCurve3(helixPoints);
      const ribbonGeometry = new THREE.TubeGeometry(
        helixCurve,
        220,
        0.025,
        6,
        false,
      );
      const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
      ribbon.rotation.z = Math.PI / 2;
      sculpture.add(ribbon);

      const nodeGeometry = new THREE.SphereGeometry(0.07, 16, 16);
      const nodes = new THREE.InstancedMesh(nodeGeometry, accentMaterial, 14);
      const nodeTransform = new THREE.Object3D();
      for (let index = 0; index < 14; index += 1) {
        const angle = (index / 14) * Math.PI * 2;
        const vertical = Math.sin(index * 1.7) * 0.72;
        const radius = 1.52 + (index % 3) * 0.1;
        nodeTransform.position.set(
          Math.cos(angle) * radius,
          vertical,
          Math.sin(angle) * radius,
        );
        const scale = index % 4 === 0 ? 1.7 : 0.78;
        nodeTransform.scale.setScalar(scale);
        nodeTransform.updateMatrix();
        nodes.setMatrixAt(index, nodeTransform.matrix);
      }
      nodes.instanceMatrix.needsUpdate = true;
      sculpture.add(nodes);

      const particleCount = 240;
      const particlePositions = new Float32Array(particleCount * 3);
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      for (let index = 0; index < particleCount; index += 1) {
        const y = 1 - (index / (particleCount - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const angle = goldenAngle * index;
        const shell = 1.85 + (index % 7) * 0.055;
        particlePositions[index * 3] = Math.cos(angle) * radius * shell;
        particlePositions[index * 3 + 1] = y * shell;
        particlePositions[index * 3 + 2] = Math.sin(angle) * radius * shell;
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(particlePositions, 3),
      );
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      sculpture.add(particles);

      scene.add(new THREE.AmbientLight("#ffffff", 2.2));
      const keyLight = new THREE.DirectionalLight("#ffffff", 3.5);
      keyLight.position.set(3, 5, 7);
      scene.add(keyLight);
      const rimLight = new THREE.PointLight(sceneStates.ag1.color, 18, 12);
      rimLight.position.set(-3, -1, 4);
      scene.add(rimLight);

      let motionPaused =
        window.localStorage.getItem("portfolio-motion-paused") === "true";
      let idleActive = false;
      let introActive = document.documentElement.dataset.introState !== "seen";
      let introRevealing = false;
      let introProgress = 0;
      let idleFrame = 0;
      let renderFrame = 0;
      let scrollProgress = 0;
      const tweens = new Set<gsap.core.Animation>();

      const render = () => {
        cancelAnimationFrame(renderFrame);
        renderFrame = requestAnimationFrame(() =>
          renderer.render(scene, camera),
        );
      };

      const stopIdle = () => {
        cancelAnimationFrame(idleFrame);
        idleFrame = 0;
      };

      const runIdle = (time: number) => {
        if ((!idleActive && !introActive) || motionPaused || document.hidden) {
          stopIdle();
          return;
        }

        const seconds = time / 1000;
        if (introActive) {
          if (!introRevealing) {
            const charge = gsap.parseEase("power3.inOut")(introProgress);
            sculpture.rotation.set(
              Math.sin(seconds * 0.42) * 0.08 * (1 - charge),
              seconds * (0.12 + charge * 0.55),
              Math.cos(seconds * 0.36) * 0.05 * (1 - charge),
            );
            rings.forEach((ring, index) => {
              const base = ringRotations[index];
              ring.rotation.x = THREE.MathUtils.lerp(
                base.x,
                Math.PI / 2,
                charge,
              );
              ring.rotation.y =
                THREE.MathUtils.lerp(base.y, 0, charge) +
                seconds * (0.08 + index * 0.025) * (1 + charge * 3);
              ring.rotation.z = THREE.MathUtils.lerp(base.z, 0, charge);
            });
            const particleScale = THREE.MathUtils.lerp(1, 0.52, charge);
            particles.scale.setScalar(particleScale);
            const pulse =
              1 +
              Math.sin(seconds * (2.2 + charge * 7)) * (0.08 + charge * 0.24);
            innerCore.scale.setScalar(pulse + charge * 0.34);
            core.scale.setScalar(1 + charge * 0.14);
            ribbon.rotation.y = -seconds * (0.1 + charge * 0.65);
            nodes.rotation.y = seconds * (0.16 + charge * 0.7);
            camera.position.z = THREE.MathUtils.lerp(6.8, 5.25, charge);
          }
          renderer.render(scene, camera);
          idleFrame = requestAnimationFrame(runIdle);
          return;
        }

        sculpture.rotation.x =
          Math.sin(seconds * 0.28) * 0.13 + scrollProgress * 0.38;
        sculpture.rotation.y = seconds * 0.09 + scrollProgress * Math.PI * 1.8;
        sculpture.rotation.z = Math.cos(seconds * 0.2) * 0.09;
        sculpture.position.y = Math.sin(seconds * 0.44) * 0.09;

        core.rotation.x = seconds * 0.24 + scrollProgress * 1.2;
        core.rotation.y = -seconds * 0.18;
        innerCore.rotation.x = -seconds * 0.4;
        innerCore.rotation.z = seconds * 0.32;
        const pulse = 1 + Math.sin(seconds * 1.8) * 0.08;
        innerCore.scale.setScalar(pulse);

        rings.forEach((ring, index) => {
          const base = ringRotations[index];
          ring.rotation.x =
            base.x + Math.sin(seconds * (0.18 + index * 0.04)) * 0.17;
          ring.rotation.y = base.y + seconds * (index % 2 === 0 ? 0.08 : -0.06);
          ring.rotation.z = base.z + scrollProgress * (0.7 + index * 0.24);
        });

        ribbon.rotation.y = -seconds * 0.11 - scrollProgress * 1.5;
        nodes.rotation.y = seconds * 0.14 + scrollProgress * 2.4;
        nodes.rotation.z = Math.sin(seconds * 0.31) * 0.14;
        particles.rotation.y = -seconds * 0.035;
        particles.rotation.x = scrollProgress * 0.55;

        renderer.render(scene, camera);
        idleFrame = requestAnimationFrame(runIdle);
      };

      const startIdle = () => {
        if (
          idleFrame ||
          (!idleActive && !introActive) ||
          motionPaused ||
          document.hidden
        )
          return;
        idleFrame = requestAnimationFrame(runIdle);
      };

      const resize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        render();
      };

      const animateTo = (name: keyof typeof sceneStates) => {
        if (motionPaused || introActive) return;
        const state = sceneStates[name];
        const color = new THREE.Color(state.color);
        const timeline = gsap.timeline({
          onComplete: () => tweens.delete(timeline),
          onUpdate: render,
        });
        timeline.to(
          sceneRoot.position,
          { x: state.x, y: state.y, duration: 1.25, ease: "power3.inOut" },
          0,
        );
        timeline.to(
          sceneRoot.rotation,
          {
            y: state.rotation,
            z: state.rotation * 0.12,
            duration: 1.45,
            ease: "power3.inOut",
          },
          0,
        );
        timeline.to(
          sculpture.scale,
          {
            x: state.scale,
            y: state.scale,
            z: state.scale,
            duration: 1.35,
            ease: "power3.inOut",
          },
          0,
        );
        [accentMaterial, ribbonMaterial, particleMaterial].forEach(
          (material) => {
            timeline.to(
              material.color,
              {
                b: color.b,
                duration: 1,
                ease: "power2.inOut",
                g: color.g,
                r: color.r,
              },
              0,
            );
          },
        );
        timeline.to(
          rimLight.color,
          {
            b: color.b,
            duration: 1,
            ease: "power2.inOut",
            g: color.g,
            r: color.r,
          },
          0,
        );
        tweens.add(timeline);
      };

      const stateTriggers = Array.from(
        document.querySelectorAll<HTMLElement>("[data-scene]"),
      )
        .map((element) => {
          const name = element.dataset.scene as keyof typeof sceneStates;
          if (!sceneStates[name]) return null;
          return ScrollTrigger.create({
            trigger: element,
            start: "top 70%",
            end: "bottom 30%",
            onEnter: () => animateTo(name),
            onEnterBack: () => animateTo(name),
          });
        })
        .filter(Boolean) as ScrollTrigger[];

      const idleTriggers = Array.from(
        document.querySelectorAll<HTMLElement>("[data-scene-transition]"),
      ).map((element) =>
        ScrollTrigger.create({
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => {
            idleActive = true;
            startIdle();
          },
          onEnterBack: () => {
            idleActive = true;
            startIdle();
          },
          onLeave: () => {
            idleActive = false;
            stopIdle();
          },
          onLeaveBack: () => {
            idleActive = false;
            stopIdle();
          },
          onUpdate: (self) => {
            scrollProgress = self.progress;
          },
        }),
      );

      const pointer = (event: PointerEvent) => {
        if (!idleActive || motionPaused || event.pointerType === "touch")
          return;
        const x = (event.clientX / window.innerWidth - 0.5) * 0.24;
        const y = (event.clientY / window.innerHeight - 0.5) * 0.18;
        const tween = gsap.to(pointerGroup.rotation, {
          x: -y,
          y: x,
          duration: 0.75,
          overwrite: "auto",
          ease: "power2.out",
          onComplete: () => tweens.delete(tween),
          onUpdate: render,
        });
        tweens.add(tween);
      };

      const motion = (event: Event) => {
        motionPaused = Boolean(
          (event as CustomEvent<{ paused: boolean }>).detail.paused,
        );
        tweens.forEach((tween) =>
          motionPaused ? tween.pause() : tween.resume(),
        );
        if (motionPaused) stopIdle();
        else startIdle();
      };

      const visibility = () => {
        tweens.forEach((tween) =>
          document.hidden || motionPaused ? tween.pause() : tween.resume(),
        );
        if (document.hidden || motionPaused) stopIdle();
        else startIdle();
      };

      const contextLost = (event: Event) => {
        event.preventDefault();
        canvas.hidden = true;
      };

      const introCharge = (event: Event) => {
        introProgress = Math.max(
          0,
          Math.min(
            1,
            (event as CustomEvent<IntroProgressDetail>).detail.progress,
          ),
        );
        if (introActive) startIdle();
      };

      const introReveal = (event: Event) => {
        if (!introActive) return;
        const { duration, reduced, skipped } = (
          event as CustomEvent<IntroRevealDetail>
        ).detail;
        introRevealing = true;
        stopIdle();

        const timeline = gsap.timeline({
          onComplete: () => {
            tweens.delete(timeline);
            introActive = false;
            introRevealing = false;
            introProgress = 0;
            camera.position.set(0, 0, 6.8);
            sceneRoot.position.set(0, 0, 0);
            sceneRoot.rotation.set(0, 0, 0);
            pointerGroup.rotation.set(0, 0, 0);
            sculpture.position.set(0, 0, 0);
            sculpture.rotation.set(0, 0, 0);
            sculpture.scale.setScalar(1);
            core.scale.setScalar(1);
            innerCore.scale.setScalar(1);
            particles.scale.setScalar(1);
            rings.forEach((ring, index) =>
              ring.rotation.copy(ringRotations[index]),
            );
            render();
            ScrollTrigger.refresh();
            startIdle();
          },
          onUpdate: render,
        });

        const finalScale = reduced || skipped ? 1.25 : 5.5;
        timeline.to(
          sculpture.scale,
          {
            x: finalScale,
            y: finalScale,
            z: finalScale,
            duration,
            ease: reduced || skipped ? "power2.out" : "power4.in",
          },
          0,
        );
        timeline.to(
          camera.position,
          {
            z: reduced || skipped ? 6.2 : 2.2,
            duration,
            ease: reduced || skipped ? "power2.out" : "power4.in",
          },
          0,
        );
        timeline.to(
          innerCore.scale,
          {
            x: 2.6,
            y: 2.6,
            z: 2.6,
            duration: Math.min(duration * 0.54, 0.7),
            ease: "power3.out",
            yoyo: true,
            repeat: 1,
          },
          0,
        );
        timeline.to(
          particles.scale,
          {
            x: 0.12,
            y: 0.12,
            z: 0.12,
            duration: duration * 0.65,
            ease: "power3.in",
          },
          0,
        );
        rings.forEach((ring, index) => {
          timeline.to(
            ring.rotation,
            {
              x: Math.PI / 2,
              y: Math.PI * (2.4 + index * 0.45),
              z: 0,
              duration: duration * 0.88,
              ease: "power3.in",
            },
            0,
          );
        });
        tweens.add(timeline);
      };

      resize();
      render();
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", pointer, { passive: true });
      window.addEventListener("portfolio:motion", motion);
      window.addEventListener(introEvents.progress, introCharge);
      window.addEventListener(introEvents.reveal, introReveal);
      document.addEventListener("visibilitychange", visibility);
      canvas.addEventListener("webglcontextlost", contextLost);
      if (introActive) startIdle();

      return () => {
        cancelAnimationFrame(idleFrame);
        cancelAnimationFrame(renderFrame);
        stateTriggers.forEach((trigger) => trigger.kill());
        idleTriggers.forEach((trigger) => trigger.kill());
        tweens.forEach((tween) => tween.kill());
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", pointer);
        window.removeEventListener("portfolio:motion", motion);
        window.removeEventListener(introEvents.progress, introCharge);
        window.removeEventListener(introEvents.reveal, introReveal);
        document.removeEventListener("visibilitychange", visibility);
        canvas.removeEventListener("webglcontextlost", contextLost);
        coreGeometry.dispose();
        innerGeometry.dispose();
        ringGeometry.dispose();
        ribbonGeometry.dispose();
        nodeGeometry.dispose();
        particleGeometry.dispose();
        accentMaterial.dispose();
        ribbonMaterial.dispose();
        wireMaterial.dispose();
        ringMaterial.dispose();
        particleMaterial.dispose();
        renderer.dispose();
      };
    },
    { scope: scopeRef },
  );

  return (
    <div className={styles.webgl} ref={scopeRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
