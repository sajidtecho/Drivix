import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VehicleBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    // Orthographic Camera for clean isometric viewpoint
    const aspect = window.innerWidth / window.innerHeight;
    const d = 16;
    const camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      1,
      1000
    );
    
    // Position camera to look down at 45 degree angle (isometric perspective)
    camera.position.set(22, 22, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 2. Add Ambient Grid (Futuristic Blueprint Look)
    // Custom Grid Helper with golden lines and dark lines
    const gridHelper = new THREE.GridHelper(80, 40, 0xffce00, 0x1f2026);
    gridHelper.position.y = -0.01;
    gridHelper.material.opacity = 0.18;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Add a secondary larger subtle grid for visual depth
    const gridHelper2 = new THREE.GridHelper(160, 20, 0xffce00, 0x14151a);
    gridHelper2.position.y = -0.02;
    gridHelper2.material.opacity = 0.08;
    gridHelper2.material.transparent = true;
    scene.add(gridHelper2);

    // 3. Add Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffce00, 0.85);
    directionalLight1.position.set(20, 40, 20);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x00a8ff, 0.35); // Cool blue fill light
    directionalLight2.position.set(-20, 20, -20);
    scene.add(directionalLight2);

    // 4. Create Vehicles and Lanes
    const vehicles = [];
    const lanePositions = [
      // Parallel to Z axis (X is constant)
      { axis: 'z', constCoord: -8, dir: 1, color: 0xffce00 },  // Gold Car
      { axis: 'z', constCoord: -5, dir: -1, color: 0xffae0e }, // Orange-Gold Car
      { axis: 'z', constCoord: -2, dir: 1, color: 0x3a3f50 },  // Dark Grey SUV
      { axis: 'z', constCoord: 4, dir: -1, color: 0xffce00 },  // Gold Taxi
      { axis: 'z', constCoord: 7, dir: 1, color: 0xffffff },   // White Car
      
      // Parallel to X axis (Z is constant)
      { axis: 'x', constCoord: -8, dir: 1, color: 0xffae0e },
      { axis: 'x', constCoord: -5, dir: -1, color: 0x3a3f50 },
      { axis: 'x', constCoord: 2, dir: 1, color: 0xffffff },
      { axis: 'x', constCoord: 5, dir: -1, color: 0xffce00 },
      { axis: 'x', constCoord: 8, dir: 1, color: 0xffffff }
    ];

    // Helper to programmatically construct low-poly vehicle models
    const createVehicleMesh = (color, sizeType = 'car') => {
      const group = new THREE.Group();

      // Materials
      const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.2,
        metalness: 0.8
      });
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x111115,
        roughness: 0.1,
        metalness: 0.9
      });
      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.8
      });
      const lightMat = new THREE.MeshBasicMaterial({
        color: 0xffffff
      });
      const tailLightMat = new THREE.MeshBasicMaterial({
        color: 0xff3b30
      });

      let w = 1.0, h = 0.4, d = 0.5; // Default Car Size
      let cabW = 0.6, cabH = 0.3, cabD = 0.45;
      let cabOffX = 0.0;

      if (sizeType === 'truck') {
        w = 1.8; h = 0.6; d = 0.6;
        cabW = 0.5; cabH = 0.5; cabD = 0.55;
        cabOffX = 0.5; // Cab is offset to the front
      } else if (sizeType === 'bus') {
        w = 2.2; h = 0.7; d = 0.6;
        cabW = 2.0; cabH = 0.1; cabD = 0.55;
        cabOffX = 0.0;
      }

      // 1. Car Body
      const bodyGeom = new THREE.BoxGeometry(w, h, d);
      const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.position.y = h / 2 + 0.1; // Elevate body above wheels/ground
      group.add(bodyMesh);

      // 2. Cabin
      const cabGeom = new THREE.BoxGeometry(cabW, cabH, cabD);
      const cabMesh = new THREE.Mesh(cabGeom, sizeType === 'bus' ? bodyMat : glassMat);
      cabMesh.position.set(cabOffX, bodyMesh.position.y + h / 2 + cabH / 2, 0);
      group.add(cabMesh);

      if (sizeType === 'bus') {
        // Add window strips along the bus sides
        const winGeom = new THREE.BoxGeometry(1.8, 0.2, d + 0.02);
        const winMesh = new THREE.Mesh(winGeom, glassMat);
        winMesh.position.set(0, cabMesh.position.y, 0);
        group.add(winMesh);
      }

      // 3. Wheels
      const wheelGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.12, 8);
      wheelGeom.rotateX(Math.PI / 2); // Rotate cylinders to align with sides

      const wheelOffsets = sizeType === 'truck' || sizeType === 'bus' 
        ? [w * 0.35, -w * 0.35] 
        : [w * 0.3, -w * 0.3];

      wheelOffsets.forEach((xOff) => {
        // Left Wheel
        const wl = new THREE.Mesh(wheelGeom, wheelMat);
        wl.position.set(xOff, 0.15, d / 2 + 0.02);
        group.add(wl);
        // Right Wheel
        const wr = new THREE.Mesh(wheelGeom, wheelMat);
        wr.position.set(xOff, 0.15, -d / 2 - 0.02);
        group.add(wr);
      });

      // 4. Headlights (Front is in +X direction)
      const headlightGeom = new THREE.BoxGeometry(0.05, 0.08, 0.1);
      const hlL = new THREE.Mesh(headlightGeom, lightMat);
      hlL.position.set(w / 2 + 0.01, bodyMesh.position.y, d * 0.3);
      group.add(hlL);

      const hlR = new THREE.Mesh(headlightGeom, lightMat);
      hlR.position.set(w / 2 + 0.01, bodyMesh.position.y, -d * 0.3);
      group.add(hlR);

      // 5. Taillights (Rear is in -X direction)
      const tlGeom = new THREE.BoxGeometry(0.05, 0.06, 0.12);
      const tlL = new THREE.Mesh(tlGeom, tailLightMat);
      tlL.position.set(-w / 2 - 0.01, bodyMesh.position.y, d * 0.3);
      group.add(tlL);

      const tlR = new THREE.Mesh(tlGeom, tailLightMat);
      tlR.position.set(-w / 2 - 0.01, bodyMesh.position.y, -d * 0.3);
      group.add(tlR);

      return group;
    };

    // Instantiate vehicles and place them in lanes
    const sizeTypes = ['car', 'car', 'car', 'truck', 'bus', 'car'];

    lanePositions.forEach((lane, index) => {
      const sizeType = sizeTypes[index % sizeTypes.length];
      const mesh = createVehicleMesh(lane.color, sizeType);
      
      // Orient the vehicle along the direction of traffic
      if (lane.axis === 'z') {
        mesh.rotation.y = lane.dir === 1 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        mesh.rotation.y = lane.dir === 1 ? 0 : Math.PI;
      }

      // Initial layout: distribute vehicles randomly along the road bounds
      const startLimit = -40;
      const endLimit = 40;
      const initialOffset = startLimit + Math.random() * (endLimit - startLimit);
      
      if (lane.axis === 'z') {
        mesh.position.set(lane.constCoord, 0, initialOffset);
      } else {
        mesh.position.set(initialOffset, 0, lane.constCoord);
      }

      scene.add(mesh);

      vehicles.push({
        mesh,
        axis: lane.axis,
        constCoord: lane.constCoord,
        dir: lane.dir,
        speed: 0.06 + Math.random() * 0.06, // Random organic speed variations
        sizeType
      });
    });

    // 5. Animation Tick Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Translate all vehicles along their lanes
      const limit = 40;
      vehicles.forEach((v) => {
        if (v.axis === 'z') {
          v.mesh.position.z += v.speed * v.dir;
          // Wrap around lane boundaries
          if (v.dir === 1 && v.mesh.position.z > limit) {
            v.mesh.position.z = -limit;
          } else if (v.dir === -1 && v.mesh.position.z < -limit) {
            v.mesh.position.z = limit;
          }
        } else {
          v.mesh.position.x += v.speed * v.dir;
          // Wrap around lane boundaries
          if (v.dir === 1 && v.mesh.position.x > limit) {
            v.mesh.position.x = -limit;
          } else if (v.dir === -1 && v.mesh.position.x < -limit) {
            v.mesh.position.x = limit;
          }
        }
      });

      // Subtle scene yaw drift to make the traffic feel alive and floating
      scene.rotation.y = Math.sin(Date.now() * 0.00015) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    // 6. Handle Resizes
    const handleResize = () => {
      const aspect = window.innerWidth / window.innerHeight;
      
      camera.left = -d * aspect;
      camera.right = d * aspect;
      camera.top = d;
      camera.bottom = -d;
      camera.updateProjectionMatrix();
      
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Traverse and dispose Three.js meshes, geometry and materials to free WebGL context resources
      scene.traverse((object) => {
        if (!object.isMesh) return;
        
        if (object.geometry) object.geometry.dispose();
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="vehicle-3d-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.55,
        overflow: 'hidden'
      }}
    />
  );
};

export default VehicleBackground;
