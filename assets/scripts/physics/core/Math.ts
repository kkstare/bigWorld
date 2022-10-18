

const max_min = function (v0: number, v1: number, v2: number, value: number) {
	let min = v0, max = v0;
	if (v1 > max) {
		max = v1;
	} else if (v1 < min) {
		min = v1;
	}

	if (v2 > max) {
		max = v2;
	} else if (v2 < min) {
		min = v2;
	}
	return (max < -value) || (min > value);
}

//Bound, Trangle
export const AABBTriangle = function (b: Array<number>, t: Array<number>) {

	const c = [
		(b[0] + b[3]) * 0.5,
		(b[1] + b[4]) * 0.5,
		(b[2] + b[5]) * 0.5,
	];

	const e = [
		(b[3] - b[0]) * 0.5,
		(b[4] - b[1]) * 0.5,
		(b[5] - b[2]) * 0.5,
	];

	const v =
		[
			t[0] - c[0], t[1] - c[1], t[2] - c[2],
			t[3] - c[0], t[4] - c[1], t[5] - c[2],
			t[6] - c[0], t[7] - c[1], t[8] - c[2]
		];

	const f =
		[
			v[3] - v[0], v[4] - v[1], v[5] - v[2],
			v[6] - v[3], v[7] - v[4], v[8] - v[5],
			v[0] - v[6], v[1] - v[7], v[2] - v[8]
		];


	if (max_min(v[0], v[3], v[6], e[0])) return false;
	if (max_min(v[1], v[4], v[7], e[1])) return false;
	if (max_min(v[2], v[5], v[8], e[2])) return false;

	let pn0 = -f[2] * f[4] + f[1] * f[5],
		pn1 = f[2] * f[3] - f[0] * f[5],
		pn2 = -f[1] * f[3] + f[0] * f[4];

	let pd = v[0] * pn0 + v[1] * pn1 + v[2] * pn2;
	let pr = e[0] * (pn0 >= 0 ? pn0 : -pn0) + e[1] * (pn1 >= 0 ? pn1 : -pn1) + e[2] * (pn2 >= 0 ? pn2 : -pn2);
	if (pd > pr || pd < -pr) return false;


	let a1 = 0, a2 = 0, ap0 = 0, ap1 = 0, ap2 = 0, ar = 0;
	for (let j = 2; j >= 0; j--) {
		let n = j, m = (j + 2) % 3;
		for (let i = 0; i < 3; i++) {
			a2 = f[i * 3 + m];
			a1 = -f[i * 3 + n];
			ap0 = v[m] * a1 + v[n] * a2;
			ap1 = v[3 + m] * a1 + v[3 + n] * a2;
			ap2 = v[6 + m] * a1 + v[6 + n] * a2;
			ar = e[m] * (a1 >= 0 ? a1 : -a1) + e[n] * (a2 >= 0 ? a2 : -a2);
			if (max_min(ap0, ap1, ap2, ar)) return false;
		}
	}
	return true;
}


const line_line = function (a: Array<number>, b: Array<number>) {

	//dot2(a*clamp(dot(a,b)/dot2(a),0.0,1.0)-b);

	let dotAB = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	let dotA2 = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];

	let clamp = dotAB * 1.0 / dotA2;

	if (clamp < 0.0) clamp = 0.0;
	if (clamp > 1.0) clamp = 1.0;

	let x = a[0] * clamp - b[0];
	let y = a[1] * clamp - b[1];
	let z = a[2] * clamp - b[2];

	return x * x + y * y + z * z;
}

const line_side = function (a: Array<number>, b: Array<number>, c: Array<number>) {
	//sign(dot(cross(a,b),c))

	let ax = a[0], ay = a[1], az = a[2];
	let bx = b[0], by = b[1], bz = b[2]
	let x = ay * bz - az * by;
	let y = az * bx - ax * bz;
	let z = ax * by - ay * bx;

	return (x * c[0] + y * c[1] + z * c[2]);
}

export const SphereTriangle = function (p: Array<number>, r: number, t: Array<number>) {

	//vec3 pa = p - a;  
	let pa = [p[0] - t[0], p[1] - t[1], p[2] - t[2]];
	//vec3 pb = p - b;	
	let pb = [p[0] - t[3], p[1] - t[4], p[2] - t[5]];
	//vec3 pc = p - c;	
	let pc = [p[0] - t[6], p[1] - t[7], p[2] - t[8]];

	//vec3 ba = b - a;  
	let ba = [t[3] - t[0], t[4] - t[1], t[5] - t[2]];
	//vec3 ac = a - c; 	
	let ac = [t[0] - t[6], t[1] - t[7], t[2] - t[8]];
	//vec3 cb = c - b;  
	let cb = [t[6] - t[3], t[7] - t[4], t[8] - t[5]];

	//vec3 nor = cross( ba, ac ); 
	let nor = [ba[1] * ac[2] - ba[2] * ac[1], ba[2] * ac[0] - ba[0] * ac[2], ba[0] * ac[1] - ba[1] * ac[0]];

	//separate by triangle plane
	let dotAB = nor[0] * pa[0] + nor[1] * pa[1] + nor[2] * pa[2];
	let dotA2 = nor[0] * nor[0] + nor[1] * nor[1] + nor[2] * nor[2];
	if ((dotAB * dotAB / dotA2) > r * r)
		return false;

	let signs = true;
	if (signs) signs = (line_side(ba, nor, pa) >= 0);
	if (signs) signs = (line_side(cb, nor, pb) >= 0);
	if (signs) signs = (line_side(ac, nor, pc) >= 0);

	if (!signs) {
		if (line_line(ba, pa) <= r * r) return true;
		if (line_line(cb, pb) <= r * r) return true;
		if (line_line(ac, pc) <= r * r) return true;
		return false;
	}

	return true;
};

const C0 = [0, 0, 0], C1 = [0, 0, 0], C2 = [0, 0, 0], C3 = [0, 0, 0];

const closest_point_on_line = function (a: Array<number>, b: Array<number>, p: Array<number>, c: Array<number>) {

	// let ab = b - a;
	// let t = dot(p - a, ab) / dot(ab, ab);
	// return (a + (t.max(0.0).min(1.0)) * ab);

	let ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
	let dab2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2];
	let pab = (p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2];

	let t = pab / dab2;
	if (t < 0.0) t = 0.0;
	if (t > 1.0) t = 1.0;

	c[0] = a[0] + ab[0] * t;
	c[1] = a[1] + ab[1] * t;
	c[2] = a[2] + ab[2] * t;

	return c;
}


const point_inside_triangle = function (p0: Array<number>, p1: Array<number>, p2: Array<number>, n: Array<number>, p: Array<number>) {

	//let c0 = (p - p0).cross(p1 - p0);
	let ax = p[0] - p0[0], ay = p[1] - p0[1], az = p[2] - p0[2];
	let bx = p1[0] - p0[0], by = p1[1] - p0[1], bz = p1[2] - p0[2];
	let x = ay * bz - az * by;
	let y = az * bx - ax * bz;
	let z = ax * by - ay * bx;
	if (x * n[0] + y * n[1] + z * n[2] > 0) return false;

	//let c1 = (p - p1).cross(p2 - p1);
	ax = p[0] - p1[0], ay = p[1] - p1[1], az = p[2] - p1[2];
	bx = p2[0] - p1[0], by = p2[1] - p1[1], bz = p2[2] - p1[2];
	x = ay * bz - az * by;
	y = az * bx - ax * bz;
	z = ax * by - ay * bx;
	if (x * n[0] + y * n[1] + z * n[2] > 0) return false;

	//let c2 = (p - p2).cross(p0 - p2);
	ax = p[0] - p2[0], ay = p[1] - p2[1], az = p[2] - p2[2];
	bx = p0[0] - p2[0], by = p0[1] - p2[1], bz = p0[2] - p2[2];
	x = ay * bz - az * by;
	y = az * bx - ax * bz;
	z = ax * by - ay * bx;
	if (x * n[0] + y * n[1] + z * n[2] > 0) return false;

	//let inside = dot(c0, *n) <= 0.0 && dot(c1, *n) <= 0.0 && dot(c2, *n) <= 0.0;

	return true;

}

const closest_point_on_triangle = function (t: Array<number>, n: Array<number>, p: Array<number>) {

	let p0 = [t[0], t[1], t[2]];
	let p1 = [t[3], t[4], t[5]];
	let p2 = [t[6], t[7], t[8]];

	let reference_point = p;//point.clone();

	if (point_inside_triangle(p0, p1, p2, n, p)) {
		return reference_point;
	}
	else {

		let point1 = closest_point_on_line(p0, p1, p, C1);
		let x = p[0] - point1[0], y = p[1] - point1[1], z = p[2] - point1[2];
		let sq_dist = x * x + y * y + z * z;
		let best_dist = sq_dist;
		reference_point = point1;

		let point2 = closest_point_on_line(p1, p2, p, C2);
		x = p[0] - point2[0], y = p[1] - point2[1], z = p[2] - point2[2];
		sq_dist = x * x + y * y + z * z;
		if (sq_dist < best_dist) {
			reference_point = point2;
			best_dist = sq_dist;
		}

		let point3 = closest_point_on_line(p2, p0, p, C3);
		x = p[0] - point3[0], y = p[1] - point3[1], z = p[2] - point3[2];
		sq_dist = x * x + y * y + z * z;
		if (sq_dist < best_dist) {
			reference_point = point2;
			best_dist = sq_dist;
		}
	}

	return reference_point;
}


export const CapsuleTriangle = function (tip: Array<number>, base: Array<number>, r: number, t: Array<number>) {

	let ax = t[3] - t[0], ay = t[4] - t[1], az = t[5] - t[2];
	let bx = t[6] - t[0], by = t[7] - t[1], bz = t[8] - t[2];
	let x = ay * bz - az * by;
	let y = az * bx - ax * bz;
	let z = ax * by - ay * bx;
	let length = x * x + y * y + z * z;
	length = length > 0 ? 1.0 / Math.sqrt(length) : 0;
	let n = [x * length, y * length, z * length]; //triangle normal


	x = tip[0] - base[0];
	y = tip[1] - base[1];
	z = tip[2] - base[2];
	length = x * x + y * y + z * z;
	length = length > 0 ? 1.0 / Math.sqrt(length) : 0;
	let cn = [x * length, y * length, z * length]; //capsule_normal


	//let line_end_offset = capsule_normal * r;
	//let a = base + line_end_offset;
	//let b = tip - line_end_offset;

	let a = [base[0] + cn[0] * r, base[1] + cn[1] * r, base[2] + cn[2] * r];
	let b = [tip[0] - cn[0] * r, tip[1] - cn[1] * r, tip[2] - cn[2] * r];
	let rp = [t[0], t[1], t[2]]; //reference_point

	//separate by triangle plane
	let n2 = n[0] * n[0] + n[1] * n[1] + n[2] * n[2];
	ax = a[0] - t[0], ay = a[1] - t[1], az = a[2] - t[2];
	bx = b[0] - t[0], by = b[1] - t[1], bz = b[2] - t[2];
	let da = ax * n[0] + ay * n[1] + az * n[2], db = bx * n[0] + by * n[1] + bz * n[2];
	if ((da * da / n2) > r * r
		&& (db * db / n2) > r * r) {
		if (da * db > 0) {
			return false;
		}
	}


	//if dot(capsule_normal, n) != 0.0 {
	let dot = cn[0] * n[0] + cn[1] * n[1] + cn[2] * n[2];
	if (dot != 0.0) {

		//let tt = dot(n, (p0 - base) / dot(n, capsule_normal).abs());

		let tt = (n[0] * (t[0] - base[0]) + n[1] * (t[1] - base[1]) + n[2] * (t[2] - base[2])) / (dot > 0 ? dot : -dot);

		//let line_plane_intersection = base + capsule_normal * tt;

		let lpi = [base[0] + cn[0] * tt, base[1] + cn[1] * tt, base[2] + cn[2] * tt];

		rp = closest_point_on_triangle(t, n, lpi);
	}

	let center = closest_point_on_line(a, b, rp, C0);

	return SphereTriangle(center, r, t);
}


// origin: Array<number>,
// normal: Array<number>,
// aabb: Array<number>, //minPos,maxPos
// max: number = Number.POSITIVE_INFINITY,
export const RaycastAABB = function (
	o: Array<number>,
	n: Array<number>,
	b: Array<number>,
	max: number = Number.POSITIVE_INFINITY,
): number | null {

	let lo = Number.NEGATIVE_INFINITY; //-Infinity;
	let hi = Number.POSITIVE_INFINITY; //+Infinity

	for (let i = 0; i < 3; i++) {
		let dimLo = (b[i] - o[i]) / n[i]
		let dimHi = (b[i + 3] - o[i]) / n[i]

		if (dimLo > dimHi) {
			let tmp = dimLo;
			dimLo = dimHi;
			dimHi = tmp;
		}

		if (dimHi < lo || dimLo > hi) {
			return null;
		}

		if (dimLo > lo) lo = dimLo
		if (dimHi < hi) hi = dimHi
	}

	if (lo > hi) return null;
	if (lo > max) return null;
	if (lo == Number.POSITIVE_INFINITY) return null;

	return lo;

}


// origin: Array<number>,
// normal: Array<number>,
// box: Array<number>, //center,halfSize
// max: number = Number.POSITIVE_INFINITY,
export const RaycastBox = function (
	o: Array<number>,
	n: Array<number>,
	b: Array<number>,
	max: number = Number.POSITIVE_INFINITY,
): number | null {

	let lo = Number.NEGATIVE_INFINITY; //-Infinity;
	let hi = Number.POSITIVE_INFINITY; //+Infinity

	for (let i = 0; i < 3; i++) {
		let c = b[i] - o[i];
		let dimLo = (c - b[i + 3]) / n[i];
		let dimHi = (c + b[i + 3]) / n[i];

		if (dimLo > dimHi) {
			let tmp = dimLo;
			dimLo = dimHi;
			dimHi = tmp;
		}

		if (dimHi < lo || dimLo > hi) {
			return null;
		}

		if (dimLo > lo) lo = dimLo
		if (dimHi < hi) hi = dimHi
	}

	if (lo > hi) return null;
	if (lo > max) return null;
	if (lo == Number.POSITIVE_INFINITY) return null;

	return lo;
}


// origin: Array<number>,
// normal: Array<number>,
// trangle: Array<number>,
// max: number = Number.POSITIVE_INFINITY,
export const RaycastTriangle = function (
	o: Array<number>,
	n: Array<number>,
	t: Array<number>,
	max: number = Number.POSITIVE_INFINITY) {

	// sub(edge1, t[1], t[0]);
	// sub(edge2, t[2], t[0]);
	let nx = n[0], ny = n[1], nz = n[2];
	let e1x = t[3] - t[0], e1y = t[4] - t[1], e1z = t[5] - t[2];
	let e2x = t[6] - t[0], e2y = t[7] - t[1], e2z = t[8] - t[2];

	//cross(pvec, n, edge2);
	//var det = dot(edge1, pvec);
	//if (det < EPSILON) return -1;
	let px = ny * e2z - nz * e2y;
	let py = nz * e2x - nx * e2z;
	let pz = nx * e2y - ny * e2x;
	let det = e1x * px + e1y * py + e1z * pz;
	if (det < Number.EPSILON) return -1;

	// sub(tvec, o, t[0]);
	// var u = dot(tvec, pvec);
	// if (u < 0 || u > det) return -1;
	let tx = o[0] - t[0], ty = o[1] - t[1], tz = o[2] - t[2];
	let u = tx * px + ty * py + tz * pz;
	if (u < 0 || u > det) return -1;

	// cross(qvec, tvec, edge1);
	// var v = dot(n, qvec);
	// if (v < 0 || u + v > det) return -1;
	px = ty * e1z - tz * e1y;
	py = tz * e1x - tx * e1z;
	pz = tx * e1y - ty * e1x;
	let v = nx * px + ny * py + nz * pz;
	if (v < 0 || u + v > det) return -1;

	// var l = dot(edge2, qvec) / det;
	let dist = (e2x * px + e2y * py + e2z * pz) / det;

	return dist > max ? -1 : dist;
}