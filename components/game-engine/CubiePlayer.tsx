'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface CubiePlayerProps {
  position: THREE.Vector3;
  rotation: number;
  isMoving: boolean;
  direction: 'idle' | 'walking' | 'running';
  scene: THREE.Scene;
}

export const CubiePlayer: React.FC<CubiePlayerProps> = ({
  position,
  rotation,
  isMoving,
  direction,
  scene,
}) => {
  const meshRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<{ [key: string]: THREE.AnimationAction }>({});
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  useEffect(() => {
    if (!scene) return;

    // Create a group for the player character
    const playerGroup = new THREE.Group();
    meshRef.current = playerGroup;
    scene.add(playerGroup);

    const loader = new GLTFLoader();

    // Load Cubie Detective model
    loader.load(
      '/components/game-engine/skin/Cubie_Detective_1_texture.glb',
      gltf => {
        const model = gltf.scene;
        // Set model size
        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        // Add model to group
        playerGroup.add(model);
        // Create animation mixer if animations exist
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(model);
          // Register animations
          gltf.animations.forEach((clip, index) => {
            const action = mixerRef.current!.clipAction(clip);
            actionsRef.current[`animation_${index}`] = action;
            // Set first animation as idle
            if (index === 0) {
              action.play();
              currentActionRef.current = action;
            }
          });
        } else {
          createProceduralAnimation(model);
        }
      },
      progress => {
        // Progress loading
      },
      () => {
        // Create simple cube model as fallback
        createFallbackCube(playerGroup);
      }
    );

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
      if (playerGroup && scene) {
        scene.remove(playerGroup);
      }
    };
  }, [scene]);

  // Simple procedural animation for cubic characters
  const createProceduralAnimation = (model: THREE.Object3D) => {
    let animationTime = 0;
    const animate = () => {
      if (!meshRef.current) return;
      animationTime += 0.016; // ~60fps
      if (isMoving) {
        // Walking animation - slight bobbing
        model.position.y = Math.sin(animationTime * 8) * 0.1;
        model.rotation.z = Math.sin(animationTime * 4) * 0.05;
        // Find body parts for animation
        model.traverse(child => {
          if (
            child.name.toLowerCase().includes('hand') ||
            child.name.toLowerCase().includes('arm') ||
            child.name.toLowerCase().includes('hand')
          ) {
            child.rotation.x = Math.sin(animationTime * 6) * 0.5;
          }
          if (
            child.name.toLowerCase().includes('leg') ||
            child.name.toLowerCase().includes('foot') ||
            child.name.toLowerCase().includes('leg')
          ) {
            child.rotation.x = Math.sin(animationTime * 6 + Math.PI) * 0.6;
          }
        });
      } else {
        // Idle animation - gentle breathing
        model.position.y = Math.sin(animationTime * 2) * 0.05;
      }
      requestAnimationFrame(animate);
    };
    animate();
  };

  // Create simple cube as fallback
  const createFallbackCube = (parent: THREE.Group) => {
    // Main body
    const geometry = new THREE.BoxGeometry(1, 1.8, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
    const cube = new THREE.Mesh(geometry, material);
    // Head
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbb3 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.3;
    cube.add(head);
    // Detective hat
    const hatGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8);
    const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 0.5;
    head.add(hat);
    // Glasses
    const glassGeometry = new THREE.RingGeometry(0.1, 0.15, 8);
    const glassMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const leftGlass = new THREE.Mesh(glassGeometry, glassMaterial);
    const rightGlass = new THREE.Mesh(glassGeometry, glassMaterial);
    leftGlass.position.set(-0.2, 0.1, 0.41);
    rightGlass.position.set(0.2, 0.1, 0.41);
    head.add(leftGlass);
    head.add(rightGlass);
    parent.add(cube);
    createProceduralAnimation(cube);
  };

  // Update position and rotation
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position);
      meshRef.current.rotation.y = rotation;
    }
  }, [position, rotation]);

  // Update animation based on movement
  useEffect(() => {
    if (!mixerRef.current || !actionsRef.current) return;
    const actions = actionsRef.current;
    // Simple logic for switching animations
    if (direction === 'walking' && isMoving) {
      const walkAction = actions['animation_1'] || actions['animation_0'];
      if (walkAction && walkAction !== currentActionRef.current) {
        currentActionRef.current?.fadeOut(0.2);
        walkAction.reset().fadeIn(0.2).play();
        currentActionRef.current = walkAction;
      }
    } else if (direction === 'running' && isMoving) {
      const runAction = actions['animation_2'] || actions['animation_1'];
      if (runAction && runAction !== currentActionRef.current) {
        currentActionRef.current?.fadeOut(0.2);
        runAction.reset().fadeIn(0.2).play();
        currentActionRef.current = runAction;
      }
    } else {
      const idleAction = actions['animation_0'];
      if (idleAction && idleAction !== currentActionRef.current) {
        currentActionRef.current?.fadeOut(0.2);
        idleAction.reset().fadeIn(0.2).play();
        currentActionRef.current = idleAction;
      }
    }
  }, [direction, isMoving]);

  // Update animation mixer
  useEffect(() => {
    const animate = () => {
      if (mixerRef.current) {
        const delta = clockRef.current.getDelta();
        mixerRef.current.update(delta);
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return null; // Component doesn't render JSX, works with Three.js directly
};

export default CubiePlayer;
