'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Minecraft-style block types
enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  SAND = 6,
  WATER = 7,
  COAL_ORE = 8,
}

const BLOCK_COLORS = {
  [BlockType.AIR]: 0x87ceeb, // Transparent
  [BlockType.GRASS]: 0x7cfc00,
  [BlockType.DIRT]: 0x8b4513,
  [BlockType.STONE]: 0x696969,
  [BlockType.WOOD]: 0xdaa520,
  [BlockType.LEAVES]: 0x228b22,
  [BlockType.SAND]: 0xf4a460,
  [BlockType.WATER]: 0x4682b4,
  [BlockType.COAL_ORE]: 0x2f4f4f,
};

// Improved noise functions for better terrain
function noise2D(x: number, z: number): number {
  return (
    Math.sin(x * 0.01) *
      Math.cos(z * 0.01) *
      Math.sin(x * 0.001) *
      Math.cos(z * 0.001) *
      32 +
    16
  );
}

function noise3D(x: number, y: number, z: number): number {
  return Math.sin(x * 0.01) * Math.cos(y * 0.01) * Math.sin(z * 0.01);
}

class Chunk {
  static readonly SIZE = 16;
  blocks: Uint8Array;
  mesh: THREE.Mesh | null = null;
  position: THREE.Vector3;

  constructor(x: number, y: number, z: number) {
    this.position = new THREE.Vector3(x, y, z);
    this.blocks = new Uint8Array(Chunk.SIZE * Chunk.SIZE * Chunk.SIZE);
    this.generateTerrain();
  }

  generateTerrain() {
    for (let x = 0; x < Chunk.SIZE; x++) {
      for (let z = 0; z < Chunk.SIZE; z++) {
        const worldX = this.position.x * Chunk.SIZE + x;
        const worldZ = this.position.z * Chunk.SIZE + z;
        const height = Math.floor(noise2D(worldX, worldZ));

        for (let y = 0; y < Chunk.SIZE; y++) {
          const worldY = this.position.y * Chunk.SIZE + y;

          let blockType = BlockType.AIR;

          if (worldY < height - 5) {
            if (Math.random() < 0.02) {
              blockType = BlockType.COAL_ORE;
            } else {
              blockType = BlockType.STONE;
            }
          } else if (worldY < height - 1) {
            blockType = BlockType.DIRT;
          } else if (worldY === height) {
            if (height < 10) {
              blockType = BlockType.SAND;
            } else if (height > 40 && Math.random() < 0.3) {
              blockType = BlockType.STONE;
            } else {
              blockType = BlockType.GRASS;
            }
          } else if (worldY === height + 1 && Math.random() < 0.1) {
            blockType = Math.random() < 0.5 ? BlockType.WOOD : BlockType.LEAVES;
          }

          // Add some trees
          if (blockType === BlockType.GRASS && Math.random() < 0.01) {
            for (let treeY = 0; treeY < 5; treeY++) {
              if (y + treeY < Chunk.SIZE) {
                this.setBlock(
                  x,
                  y + treeY,
                  z,
                  treeY < 3 ? BlockType.WOOD : BlockType.LEAVES
                );
              }
            }
          }

          // Cave generation
          if (worldY < height - 10 && noise3D(worldX, worldY, worldZ) > 0.6) {
            blockType = BlockType.AIR;
          }

          this.setBlock(x, y, z, blockType);
        }
      }
    }
  }

  setBlock(x: number, y: number, z: number, type: BlockType) {
    if (
      x < 0 ||
      x >= Chunk.SIZE ||
      y < 0 ||
      y >= Chunk.SIZE ||
      z < 0 ||
      z >= Chunk.SIZE
    )
      return;
    this.blocks[x + y * Chunk.SIZE + z * Chunk.SIZE * Chunk.SIZE] = type;
  }

  getBlock(x: number, y: number, z: number): BlockType {
    if (
      x < 0 ||
      x >= Chunk.SIZE ||
      y < 0 ||
      y >= Chunk.SIZE ||
      z < 0 ||
      z >= Chunk.SIZE
    )
      return BlockType.AIR;
    return this.blocks[
      x + y * Chunk.SIZE + z * Chunk.SIZE * Chunk.SIZE
    ] as BlockType;
  }

  shouldRenderFace(x: number, y: number, z: number, dir: number[]): boolean {
    if (!dir || dir.length < 3) return false;
    const neighborBlock = this.getBlock(x + dir[0]!, y + dir[1]!, z + dir[2]!);
    return neighborBlock === BlockType.AIR;
  }

  generateMesh(): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];

    const directions = [
      [0, 1, 0],
      [0, -1, 0], // top, bottom
      [1, 0, 0],
      [-1, 0, 0], // right, left
      [0, 0, 1],
      [0, 0, -1], // front, back
    ];

    const faceVertices = [
      // Top
      [-0.5, 0.5, -0.5],
      [0.5, 0.5, -0.5],
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5],
      // Bottom
      [-0.5, -0.5, 0.5],
      [0.5, -0.5, 0.5],
      [0.5, -0.5, -0.5],
      [-0.5, -0.5, -0.5],
      // Right
      [0.5, -0.5, -0.5],
      [0.5, 0.5, -0.5],
      [0.5, 0.5, 0.5],
      [0.5, -0.5, 0.5],
      // Left
      [-0.5, -0.5, 0.5],
      [-0.5, 0.5, 0.5],
      [-0.5, 0.5, -0.5],
      [-0.5, -0.5, -0.5],
      // Front
      [-0.5, -0.5, 0.5],
      [0.5, -0.5, 0.5],
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5],
      // Back
      [0.5, -0.5, -0.5],
      [-0.5, -0.5, -0.5],
      [-0.5, 0.5, -0.5],
      [0.5, 0.5, -0.5],
    ];

    for (let x = 0; x < Chunk.SIZE; x++) {
      for (let y = 0; y < Chunk.SIZE; y++) {
        for (let z = 0; z < Chunk.SIZE; z++) {
          const blockType = this.getBlock(x, y, z);
          if (blockType === BlockType.AIR) continue;

          const worldX = this.position.x * Chunk.SIZE + x;
          const worldY = this.position.y * Chunk.SIZE + y;
          const worldZ = this.position.z * Chunk.SIZE + z;

          const color = new THREE.Color(BLOCK_COLORS[blockType]);

          for (let face = 0; face < 6; face++) {
            const direction = directions[face];
            if (direction && this.shouldRenderFace(x, y, z, direction)) {
              const faceStart = face * 4;

              // Add two triangles for each face
              for (let tri = 0; tri < 2; tri++) {
                const vertIndices = tri === 0 ? [0, 1, 2] : [0, 2, 3];

                for (let i = 0; i < 3; i++) {
                  const vertIndex = faceStart + vertIndices[i]!;
                  const vert = faceVertices[vertIndex];

                  if (vert && direction) {
                    positions.push(
                      worldX + vert[0]!,
                      worldY + vert[1]!,
                      worldZ + vert[2]!
                    );
                    normals.push(direction[0]!, direction[1]!, direction[2]!);
                    colors.push(color.r, color.g, color.b);
                  }
                }
              }
            }
          }
        }
      }
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3)
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    return this.mesh;
  }
}

class VoxelWorld {
  chunks: Map<string, Chunk> = new Map();
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  getChunkKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  getChunk(x: number, y: number, z: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(x, y, z));
  }

  loadChunk(x: number, y: number, z: number): Chunk {
    const key = this.getChunkKey(x, y, z);
    let chunk = this.chunks.get(key);

    if (!chunk) {
      chunk = new Chunk(x, y, z);
      this.chunks.set(key, chunk);

      const mesh = chunk.generateMesh();
      this.scene.add(mesh);
    }

    return chunk;
  }

  unloadChunk(x: number, y: number, z: number) {
    const key = this.getChunkKey(x, y, z);
    const chunk = this.chunks.get(key);

    if (chunk && chunk.mesh) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      if (Array.isArray(chunk.mesh.material)) {
        chunk.mesh.material.forEach(mat => mat.dispose());
      } else {
        chunk.mesh.material.dispose();
      }
      this.chunks.delete(key);
    }
  }

  updateAroundPosition(position: THREE.Vector3) {
    const chunkX = Math.floor(position.x / Chunk.SIZE);
    const chunkY = Math.floor(position.y / Chunk.SIZE);
    const chunkZ = Math.floor(position.z / Chunk.SIZE);

    const renderDistance = 4;
    const loadedChunks = new Set<string>();

    // Load chunks around player
    for (let dx = -renderDistance; dx <= renderDistance; dx++) {
      for (let dy = -1; dy <= 2; dy++) {
        for (let dz = -renderDistance; dz <= renderDistance; dz++) {
          const cx = chunkX + dx;
          const cy = chunkY + dy;
          const cz = chunkZ + dz;

          this.loadChunk(cx, cy, cz);
          loadedChunks.add(this.getChunkKey(cx, cy, cz));
        }
      }
    }

    // Unload distant chunks
    for (const [key, chunk] of this.chunks) {
      if (!loadedChunks.has(key)) {
        const coords = key.split(',').map(Number);
        if (coords.length >= 3) {
          this.unloadChunk(coords[0]!, coords[1]!, coords[2]!);
        }
      }
    }
  }

  getBlockAt(x: number, y: number, z: number): BlockType {
    const chunkX = Math.floor(x / Chunk.SIZE);
    const chunkY = Math.floor(y / Chunk.SIZE);
    const chunkZ = Math.floor(z / Chunk.SIZE);

    const chunk = this.getChunk(chunkX, chunkY, chunkZ);
    if (!chunk) return BlockType.AIR;

    const localX = x - chunkX * Chunk.SIZE;
    const localY = y - chunkY * Chunk.SIZE;
    const localZ = z - chunkZ * Chunk.SIZE;

    return chunk.getBlock(localX, localY, localZ);
  }
}

interface VoxelEngineProps {
  onExit?: () => void;
}

export default function VoxelEngine({ onExit }: VoxelEngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 50, z: 0 });
  const [isInstructions, setIsInstructions] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const player = new THREE.Object3D();
    player.position.set(0, 50, 0);
    player.add(camera);
    scene.add(player);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87ceeb);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Create voxel world
    const world = new VoxelWorld(scene);

    // Pre-load surrounding chunks before positioning the player
    world.updateAroundPosition(player.position);

    // Helper to find terrain height at given x,z
    function findGroundLevel(x: number, z: number): number {
      // Make sure chunk containing (x,z) is generated
      world.updateAroundPosition(new THREE.Vector3(x, 0, z));

      for (let y = 60; y >= 0; y--) {
        if (world.getBlockAt(x, y, z) !== BlockType.AIR) {
          return y + 1; // stand above the first solid block
        }
      }
      return 50; // fallback
    }

    const groundY = findGroundLevel(0, 0);
    player.position.set(0, groundY, 0);
    // Player movement
    const movement = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      run: false,
    };

    const velocity = new THREE.Vector3(0, 0, 0);
    const GRAVITY = 25; // blocks per second squared
    const JUMP_FORCE = 10; // blocks per second
    const MOVE_SPEED = 5; // blocks per second
    const RUN_MULTIPLIER = 2;

    function checkCollision(position: THREE.Vector3): boolean {
      const blockX = Math.floor(position.x);
      const blockY = Math.floor(position.y);
      const blockZ = Math.floor(position.z);

      // Check collision at player's position (feet and head)
      const feetBlock = world.getBlockAt(blockX, blockY, blockZ);
      const headBlock = world.getBlockAt(blockX, blockY + 1, blockZ);

      return feetBlock !== BlockType.AIR || headBlock !== BlockType.AIR;
    }

    function isOnGround(position: THREE.Vector3): boolean {
      // Check if there's a solid block right below the player (half block below feet)
      const blockX = Math.floor(position.x);
      const blockY = Math.floor(position.y - 0.5);
      const blockZ = Math.floor(position.z);

      const block = world.getBlockAt(blockX, blockY, blockZ);
      return block !== BlockType.AIR;
    }

    function updatePlayer() {
      const deltaTime = 1 / 60; // Assuming 60fps
      const speed =
        MOVE_SPEED * (movement.run ? RUN_MULTIPLIER : 1) * deltaTime;

      // Movement direction based on camera rotation
      const direction = new THREE.Vector3();

      if (movement.forward) direction.z -= 1;
      if (movement.backward) direction.z += 1;
      if (movement.left) direction.x -= 1;
      if (movement.right) direction.x += 1;

      if (direction.length() > 0) {
        direction.normalize();

        // Apply camera Y rotation to movement direction
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
        direction.multiplyScalar(speed);

        // Try horizontal movement
        const newPosition = player.position.clone();
        newPosition.x += direction.x;
        newPosition.z += direction.z;

        // Check collision for horizontal movement
        if (!checkCollision(newPosition)) {
          player.position.x = newPosition.x;
          player.position.z = newPosition.z;
        }
      }

      // Check if player is on ground
      const onGround = isOnGround(player.position);

      // Jumping
      if (movement.jump && onGround) {
        velocity.y = JUMP_FORCE;
        movement.jump = false; // one-shot jump
      }

      // Apply gravity if not on ground
      if (!onGround) {
        velocity.y -= GRAVITY * deltaTime;
      } else {
        // On ground - stop falling
        if (velocity.y < 0) {
          velocity.y = 0;
          // Snap to ground level
          const groundY = Math.floor(player.position.y) + 1;
          if (player.position.y < groundY) {
            player.position.y = groundY;
          }
        }
      }

      // Apply vertical movement
      if (Math.abs(velocity.y) > 0.01) {
        const newY = player.position.y + velocity.y * deltaTime;
        const testPos = player.position.clone();
        testPos.y = newY;

        if (!checkCollision(testPos)) {
          player.position.y = newY;
        } else {
          // Hit something - stop vertical movement
          if (velocity.y < 0) {
            // Hit ground - snap to surface
            player.position.y = Math.floor(player.position.y) + 1;
          }
          velocity.y = 0;
        }
      }

      // Update world around player
      world.updateAroundPosition(player.position);

      // Update UI
      setPlayerPos({
        x: Math.floor(player.position.x),
        y: Math.floor(player.position.y),
        z: Math.floor(player.position.z),
      });
    }

    // Controls
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
          movement.forward = true;
          break;
        case 'KeyS':
          movement.backward = true;
          break;
        case 'KeyA':
          movement.left = true;
          break;
        case 'KeyD':
          movement.right = true;
          break;
        case 'Space':
          event.preventDefault();
          movement.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          movement.run = true;
          break;
        case 'Escape':
          if (onExit) onExit();
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
          movement.forward = false;
          break;
        case 'KeyS':
          movement.backward = false;
          break;
        case 'KeyA':
          movement.left = false;
          break;
        case 'KeyD':
          movement.right = false;
          break;
        case 'Space':
          movement.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          movement.run = false;
          break;
      }
    };

    // Pointer lock for mouse look
    const onClick = () => {
      renderer.domElement.requestPointerLock();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === renderer.domElement) {
        const sensitivity = 0.002;
        player.rotation.y -= event.movementX * sensitivity;
        camera.rotation.x -= event.movementY * sensitivity;
        camera.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, camera.rotation.x)
        );
      }
    };

    // Event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);

    // Window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Load NPC Cubie Detective standing near player
    const loader = new GLTFLoader();
    loader.load(
      '/images/Cubie_Detective_1_texture.glb',
      gltf => {
        const npc = gltf.scene;
        npc.scale.set(1, 1, 1);
        npc.position.set(2, 50, 0);
        scene.add(npc);
      },
      undefined,
      () => {
        // Create simple fallback cube detective
        const geometry = new THREE.BoxGeometry(1, 1.8, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x4169e1 });
        const fallbackNPC = new THREE.Mesh(geometry, material);
        fallbackNPC.position.set(2, 50, 0);

        // Add hat
        const hatGeometry = new THREE.ConeGeometry(0.5, 0.5, 8);
        const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 1.2;
        fallbackNPC.add(hat);

        scene.add(fallbackNPC);
      }
    );

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      updatePlayer();
      renderer.render(scene, camera);
    }

    animate();

    // Cleanup
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onClick);

      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();
    };
  }, [onExit]);

  return (
    <div className='relative w-full h-screen'>
      <div ref={mountRef} className='w-full h-full' />

      {/* Position display */}
      <div className='absolute top-4 left-4 bg-black/70 text-green-400 p-3 rounded font-mono text-sm'>
        <div>
          🕵️ Cubie Detective: X: {playerPos.x}, Y: {playerPos.y}, Z:{' '}
          {playerPos.z}
        </div>
        <div className='mt-2 text-cyan-400'>
          🎮 WASD: Move | Space: Jump | Shift: Run | ESC: Exit
        </div>
        <div className='mt-1 text-yellow-400 text-xs'>
          🎯 Your Cubie Detective explores the CrazyCube world!
        </div>
      </div>

      {/* Instructions overlay */}
      {isInstructions && (
        <div className='absolute inset-0 bg-black/80 flex items-center justify-center'>
          <div className='text-center text-white p-8 bg-slate-800/90 rounded-xl max-w-md'>
            <h2 className='text-2xl font-bold mb-4 text-cyan-400'>
              🌌 CrazyCube World
            </h2>
            <div className='space-y-3 text-left mb-6'>
              <div>
                🎮 <strong>WASD</strong> - Move
              </div>
              <div>
                🚀 <strong>Space</strong> - Jump
              </div>
              <div>
                🏃 <strong>Shift</strong> - Run
              </div>
              <div>
                📱 <strong>Mouse</strong> - Look
              </div>
              <div>
                🚪 <strong>ESC</strong> - Exit
              </div>
            </div>

            <button
              onClick={() => {
                // Hide instructions first
                setIsInstructions(false);
                // Wait a bit for canvas to be ready, then click it
                setTimeout(() => {
                  const canvas = mountRef.current?.querySelector('canvas');
                  if (canvas) {
                    canvas.click();
                  }
                }, 100);
              }}
              className='bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg'
            >
              🚀 Enter the World
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
