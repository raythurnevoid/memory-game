import { tweened as svelteTweened, type Tweened } from 'svelte/motion';

export default async function tweenTo<T>(
	startValue: T,
	targetValue: T,
	onChange: (value: T) => void,
	options: {
		delay?: number;
		duration?: number | ((from: T, to: T) => number);
		easing?: (t: number) => number;
		interpolate?: (a: T, b: T) => (t: number) => T;
	}
) {
	const pTween = svelteTweened(startValue, options);

	const unsubscribe = pTween.subscribe((p) => {
		onChange(p);
	});

	await pTween.set(targetValue).then(unsubscribe);
}
