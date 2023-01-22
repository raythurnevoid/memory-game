<script lang="ts">
	import { onMount } from 'svelte';
	import {
		DoubleSide,
		Material,
		Matrix4,
		Mesh,
		MeshBasicMaterial,
		PlaneGeometry,
		Scene
	} from 'three';
	import * as THREE from 'three';
	import { rotate3d } from '../rotate3d';

	let config: Partial<Configs> = {};

	const defaultColors = ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'];
	const defaults: Configs = {
		angle: 90,
		spread: 45,
		startVelocity: 45,
		elementCount: 50,
		width: 30,
		height: 30,
		perspective: '',
		colors: defaultColors,
		duration: 3000,
		stagger: 0,
		dragFriction: 0.1,
		random: Math.random
	};

	const {
		elementCount,
		colors,
		width,
		height,
		perspective,
		angle,
		spread,
		startVelocity,
		dragFriction,
		duration,
		stagger,
		random
	} = Object.assign({}, defaults, config);

	onMount(async () => {
		const renderer = new THREE.WebGLRenderer();
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.autoClear = false; // To allow render overlay on top of sprited sphere

		const camera = new THREE.OrthographicCamera(
			-window.innerWidth / 2,
			window.innerWidth / 2,
			window.innerHeight / 2,
			-window.innerHeight / 2,
			-1000,
			1000
		);
		const scene = new THREE.Scene();

		// create confetti
		const elements = createElements(scene, elementCount, colors, width, height);
		const fettis: Fetti[] = elements.map((element) => ({
			element,
			physics: randomPhysics(angle, spread, startVelocity, random)
		}));

		const container = document.querySelector('#container')!;
		container.appendChild(renderer.domElement);
		window.addEventListener('resize', onWindowResize, false);

		let frameId: number;
		const render = () => {
			// $controls$.instance?.update();
			renderer.clearDepth();
			renderer.render(scene, camera);
			frameId = requestAnimationFrame(render);
		};
		render();

		animate(scene, fettis, dragFriction, duration, stagger);

		function onWindowResize() {
			var width = window.innerWidth;
			var height = window.innerHeight;

			camera.left = -width / 2;
			camera.right = width / 2;
			camera.top = height / 2;
			camera.bottom = -height / 2;
			camera.updateProjectionMatrix();

			renderer.setSize(window.innerWidth, window.innerHeight);
		}
	});

	function init() {}

	function randomPhysics(
		angle: Configs['angle'],
		spread: Configs['spread'],
		startVelocity: Configs['startVelocity'],
		random: () => number
	): Physics {
		const radAngle = angle * (Math.PI / 180);
		const radSpread = spread * (Math.PI / 180);
		return {
			x: 0,
			y: 0,
			z: 0,
			wobble: random() * 10,
			wobbleSpeed: 0.1 + random() * 0.1,
			velocity: startVelocity * 0.5 + random() * startVelocity,
			angle2D: -radAngle + (0.5 * radSpread - random() * radSpread),
			angle3D: -(Math.PI / 4) + random() * (Math.PI / 2),
			tiltAngle: random() * Math.PI,
			tiltAngleSpeed: 0.1 + random() * 0.3
		};
	}

	function createElements(
		root: Scene,
		elementCount: Configs['elementCount'],
		colors: Configs['colors'],
		width: Configs['width'],
		height: Configs['height']
	) {
		return Array.from({ length: elementCount }).map((_, index) => {
			const element = new PlaneGeometry(width, height, 32);
			const color = colors[index % colors.length];
			const material = new MeshBasicMaterial({
				color: color,
				side: DoubleSide,
				transparent: true
			});
			material.opacity = 0;
			const mesh = new Mesh(element, material);
			root.add(mesh);

			return mesh;
		});
	}

	function updateFetti(fetti: Fetti, progress: number, dragFriction: Configs['dragFriction']) {
		fetti.physics.x += Math.cos(fetti.physics.angle2D) * fetti.physics.velocity;
		fetti.physics.y -= Math.sin(fetti.physics.angle2D) * fetti.physics.velocity;
		fetti.physics.z += Math.sin(fetti.physics.angle3D) * fetti.physics.velocity;
		fetti.physics.wobble += fetti.physics.wobbleSpeed;
		fetti.physics.velocity -= fetti.physics.velocity * dragFriction;
		fetti.physics.y -= 3;
		fetti.physics.tiltAngle += fetti.physics.tiltAngleSpeed;

		const { x, y, z, tiltAngle, wobble } = fetti.physics;
		const wobbleX = x + 10 * Math.cos(wobble);
		const wobbleY = y + 10 * Math.sin(wobble);

		fetti.element.position.set(wobbleX, wobbleY, 1);
		const matrix4 = new Matrix4();
		matrix4.fromArray(rotate3d(1, 1, 1, tiltAngle).flatMap((row) => row));
		fetti.element.rotation.setFromRotationMatrix(matrix4);
		fetti.element.material.opacity = 1 - progress;
	}

	function animate(
		root: Scene,
		fettis: Fetti[],
		dragFriction: Configs['dragFriction'],
		duration: Configs['duration'],
		stagger: Configs['stagger']
	) {
		let startTime: number;

		return new Promise((resolve) => {
			function update(time: number) {
				if (!startTime) startTime = time;
				const elapsed = time - startTime;
				const progress = startTime === time ? 0 : (time - startTime) / duration;
				fettis.slice(0, Math.ceil(elapsed / stagger)).forEach((fetti) => {
					updateFetti(fetti, progress, dragFriction);
				});

				if (time - startTime < duration) {
					requestAnimationFrame(update);
				} else {
					fettis.forEach((fetti) => {
						return root.remove(fetti.element);
					});
					resolve(undefined);
				}
			}

			requestAnimationFrame(update);
		});
	}

	interface Configs {
		angle: number;
		spread: number;
		startVelocity: number;
		elementCount: number;
		width: number;
		height: number;
		perspective: string;
		colors: string[];
		duration: number;
		stagger: number;
		dragFriction: number;
		random: () => number;
	}

	interface Physics {
		x: number;
		y: number;
		z: number;
		wobble: number;
		wobbleSpeed: number;
		velocity: number;
		angle2D: number;
		angle3D: number;
		tiltAngle: number;
		tiltAngleSpeed: number;
	}

	interface Fetti {
		element: Mesh<PlaneGeometry, Material>;
		physics: Physics;
	}
</script>

<div id="container" />
