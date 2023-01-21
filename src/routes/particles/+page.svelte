<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import Stats from 'three/examples/jsm/libs/stats.module.js';
	import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
	import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
	import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
	import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
	import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
	import { FocusShader } from 'three/examples/jsm/shaders/FocusShader.js';
	import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
	import male02 from './male02.obj?url';

	onMount(() => {
		let camera, scene, renderer, mesh;

		let parent: THREE.Object3D;

		const meshes: { mesh: THREE.Points }[] = [],
			clonemeshes = [];

		let composer, effectFocus;

		const clock = new THREE.Clock();

		let stats;

		init();
		animate();

		function init() {
			const container = document.querySelector('#container');

			camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 50000);
			camera.position.set(0, 700, 7000);

			scene = new THREE.Scene();
			scene.background = new THREE.Color(0x000104);
			scene.fog = new THREE.FogExp2(0x000104, 0.0000675);

			camera.lookAt(scene.position);

			const loader = new OBJLoader();

			loader.load(male02, function (object) {
				const positions = combineBuffer(object, 'position');

				createMesh(positions, scene, 4.05, 0, -350, 0, 0xffffff);
			});

			renderer = new THREE.WebGLRenderer();
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setSize(window.innerWidth, window.innerHeight);
			renderer.autoClear = false;
			container.appendChild(renderer.domElement);

			parent = new THREE.Object3D();
			scene.add(parent);

			const grid = new THREE.Points(
				new THREE.PlaneGeometry(15000, 15000, 64, 64),
				new THREE.PointsMaterial({ color: 0xff0000, size: 10 })
			);
			grid.position.y = -400;
			grid.rotation.x = -Math.PI / 2;
			parent.add(grid);

			// postprocessing

			const renderModel = new RenderPass(scene, camera);
			const effectBloom = new BloomPass(0.75);
			const effectFilm = new FilmPass(0.5, 0.5, 1448, false);

			effectFocus = new ShaderPass(FocusShader);

			effectFocus.uniforms['screenWidth'].value = window.innerWidth * window.devicePixelRatio;
			effectFocus.uniforms['screenHeight'].value = window.innerHeight * window.devicePixelRatio;

			composer = new EffectComposer(renderer);

			composer.addPass(renderModel);
			composer.addPass(effectBloom);
			composer.addPass(effectFilm);
			composer.addPass(effectFocus);

			//stats
			stats = new Stats();
			container.appendChild(stats.dom);

			window.addEventListener('resize', onWindowResize);
		}

		function onWindowResize() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();

			camera.lookAt(scene.position);

			renderer.setSize(window.innerWidth, window.innerHeight);
			composer.setSize(window.innerWidth, window.innerHeight);

			effectFocus.uniforms['screenWidth'].value = window.innerWidth * window.devicePixelRatio;
			effectFocus.uniforms['screenHeight'].value = window.innerHeight * window.devicePixelRatio;
		}

		function combineBuffer(model: THREE.Group, bufferName: string) {
			let positions: number[] = [];
			let count = 0;

			model.traverse(function (child) {
				if ('isMesh' in child && child.isMesh) {
					const mesh = child as THREE.Mesh;

					const buffer = mesh.geometry.attributes[bufferName];

					positions = positions.concat(...(buffer.array as Float32Array));

					count += buffer.array.length;
				}
			});

			const combined = new Float32Array(positions.length);
			combined.set(positions, 0);

			return new THREE.BufferAttribute(combined, 3);
		}

		function createMesh(positions, scene, scale, x, y, z, color) {
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', positions.clone());
			geometry.setAttribute('initialPosition', positions.clone());

			geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);

			let mesh: THREE.Points = new THREE.Points(
				geometry,
				new THREE.PointsMaterial({ size: 30, color })
			);
			mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
			mesh.position.copy(new THREE.Vector3(x, y, z));

			parent.add(mesh);

			meshes.push({
				mesh: mesh!,
				verticesDown: 0,
				verticesUp: 0,
				direction: 0,
				speed: 150,
				delay: 1,
				start: 3
			});
		}

		function animate() {
			requestAnimationFrame(animate);
			render();
			stats.update();
		}

		function render() {
			let delta = clock.getDelta();
			if (delta > 2) console.log(delta);
			delta = Math.min(0.2, delta);

			parent.rotation.y += -0.2 * delta;

			for (let j = 0; j < meshes.length; j++) {
				const data = meshes[j];
				const positions = data.mesh.geometry.attributes.position;
				const initialPositions = data.mesh.geometry.attributes.initialPosition;

				const count = positions.count;

				if (data.start > 0) {
					data.start -= delta;
				} else {
					if (data.direction === 0) {
						data.direction = -1;
					}
				}

				for (let i = 0; i < count; i++) {
					const px = positions.getX(i);
					const py = positions.getY(i);
					const pz = positions.getZ(i);

					// falling down
					if (data.direction < 0) {
						if (py > 0) {
							positions.setXYZ(
								i,
								px + 1.5 * (0.5 - Math.random()) * data.speed * delta,
								py + 2.0 * -Math.random() * data.speed * delta,
								pz + 1.5 * (0.5 - Math.random()) * data.speed * delta
							);
						} else {
							data.verticesDown += 1;
						}
					}

					// rising up
					if (data.direction > 0) {
						const ix = initialPositions.getX(i);
						const iy = initialPositions.getY(i);
						const iz = initialPositions.getZ(i);

						let mx = px === ix ? 0 : px < ix ? 1 : -1;
						let my = py === iy ? 0 : py < iy ? 1 : -1;
						let mz = pz === iz ? 0 : pz < iz ? 1 : -1;

						if ([mx, my, mz].some((i) => i !== 0)) {
							const nx = Math.abs(px - ix) > 1 ? px + mx * data.speed * delta : ix;
							const ny = Math.abs(py - iy) > 1 ? py + my * data.speed * delta : iy;
							const nz = Math.abs(pz - iz) > 1 ? pz + mz * data.speed * delta : iz;

							positions.setXYZ(i, nx, ny, nz);
						} else {
							data.verticesUp += 1;
						}
					}
				}

				// all vertices down
				if (data.verticesDown >= count) {
					if (data.delay <= 0) {
						data.direction = 1;
						data.verticesDown = 0;
						data.delay = 1;
					} else {
						data.delay -= 1;
					}
				} else {
					data.verticesDown = 0;
				}

				// all vertices up
				if (data.verticesUp >= count) {
					if (data.delay <= 0) {
						data.direction = -1;
						data.verticesUp = 0;
						data.delay = 1;
					} else {
						data.delay -= 1;
					}
				} else {
					data.verticesUp = 0;
				}

				positions.needsUpdate = true;
			}

			composer.render(0.01);
		}
	});
</script>

<div id="container" />
