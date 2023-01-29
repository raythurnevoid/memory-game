/**
 * Equivalent of CSS rotate3d() function.
 * @see https://w3c.github.io/csswg-drafts/css-transforms-2/#Rotate3dDefined
 *
 * @param x
 * @param y
 * @param z
 * @param angle
 * @returns a 4x4 matrix
 */
export function rotate3d(x: number, y: number, z: number, angle: number): Matrix4 {
	// normalize x y z
	const length = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
	x /= length;
	y /= length;
	z /= length;

	// sc = sin(α/2) · cos(α/2)
	const sc = Math.sin(angle / 2) * Math.cos(angle / 2);
	// sq = sin(α/2)
	const sq = Math.sin(angle / 2);

	// 3d rotation matrix cells
	const c11 = 1 - 2 * (Math.pow(y, 2) + Math.pow(z, 2)) * sq;
	const c12 = 2 * (x * y * sq - z * sc);
	const c13 = 2 * (x * z * sq + y * sc);
	const c14 = 0;
	const c21 = 2 * (x * y * sq + z * sc);
	const c22 = 1 - 2 * (Math.pow(x, 2) + Math.pow(z, 2)) * sq;
	const c23 = 2 * (y * z * sq - x * sc);
	const c24 = 0;
	const c31 = 2 * (x * z * sq - y * sc);
	const c32 = 2 * (y * z * sq + x * sc);
	const c33 = 1 - 2 * (Math.pow(x, 2) + Math.pow(y, 2)) * sq;
	const c34 = 0;
	const c41 = 0;
	const c42 = 0;
	const c43 = 0;
	const c44 = 1;

	// 3d rotation matrix
	const matrix: Matrix4 = [
		[c11, c12, c13, c14],
		[c21, c22, c23, c24],
		[c31, c32, c33, c34],
		[c41, c42, c43, c44]
	];

	return matrix;
}

type Matrix4Row = [number, number, number, number];
type Matrix4 = [Matrix4Row, Matrix4Row, Matrix4Row, Matrix4Row];
