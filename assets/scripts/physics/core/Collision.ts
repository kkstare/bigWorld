import { Vec3 } from "cc";

export enum ShapeType {
    Box = 0,
    Sphere = 1,
    Capsule = 2,
    //Cylinder = 3,
};

const ShapeSupport: Array<Function> = [];

ShapeSupport[ShapeType.Box] = function (dir: [number, number, number]) {

    dir[0] = (dir[0] > 0) ? 0.5 : -0.5;
    dir[1] = (dir[1] > 0) ? 0.5 : -0.5;
    dir[2] = (dir[2] > 0) ? 0.5 : -0.5;

    return dir;
}

ShapeSupport[ShapeType.Sphere] = function (dir: [number, number, number]) {

    let x = dir[0], y = dir[1], z = dir[2];
    let len = x * x + y * y + z * z;
    len = (len > 0 ? 1.0 / Math.sqrt(len) : 0) * 0.5;
    dir[0] = x * len, dir[1] = y * len, dir[2] = z * len;

    return dir;
}

ShapeSupport[ShapeType.Capsule] = function (dir: [number, number, number]) {

    let x = dir[0], y = dir[1], z = dir[2];
    let len = x * x + y * y + z * z;
    len = (len > 0 ? 1.0 / Math.sqrt(len) : 0) * 0.5;
    dir[0] = x * len, dir[1] = y * len, dir[2] = z * len;
    dir[1] += (y > 0 ? 0.5 : -0.5);

    return dir;

}

// ShapeSupport[ShapeType.Cylinder] = function (dir: [number,number,number]) {

//     let x = dir[0], y = dir[1], z = dir[2];
//     let len = x * x + z * z;
//     len = (len > 0 ? 1.0 / Math.sqrt(len) : 0) * 0.5;
//     dir[0] = x * len, dir[2] = z * len;
//     dir[1] = y > 0 ? 1.0 : -1.0;

//     return dir;

// }


export class Collision {

    MAX_GJK_TIMES = 16;
    MAX_EPA_TIMES = 16;
    MAX_EPSILON = 0.00001;

    slength: number = 0;
    simplex: Array<Vec3> = [];

    flength: number = 0;
    simplexFaces = [
        { a: 0, b: 1, c: 2, nx: 0, ny: 0, nz: 0, dist: 0 },
        { a: 0, b: 1, c: 3, nx: 0, ny: 0, nz: 0, dist: 0 },
        { a: 0, b: 2, c: 3, nx: 0, ny: 0, nz: 0, dist: 0 },
        { a: 1, b: 2, c: 3, nx: 0, ny: 0, nz: 0, dist: 0 }];

    a0: Vec3 = new Vec3();
    b0: Vec3 = new Vec3();
    ab: Vec3 = new Vec3();
    ac: Vec3 = new Vec3();
    ad: Vec3 = new Vec3();
    bc: Vec3 = new Vec3();
    ba: Vec3 = new Vec3();
    bd: Vec3 = new Vec3();
    dir: Vec3 = new Vec3();


    closest: any = null;
    //closest = { index: 0, dist: Number.MAX_VALUE, norm: new Vec3(), a: 0, b: 0, c: 0 };


    constructor(gjk = 16, epa = 16, epsilon = 0.00001) {
        this.MAX_GJK_TIMES = gjk;
        this.MAX_EPA_TIMES = epa;
        this.MAX_EPSILON = epsilon;

        this.slength = 0;
        let max = (gjk > epa ? gjk : epa) + 8;
        for (let i = 0; i < max; i++) {
            this.simplex[i] = new Vec3();
        }
    }

    EPA(aWorldVerts: number[], bWorldVerts: number[], simplex: number[]) {


        this.flength = 4;
        let epsilon = this.MAX_EPSILON;
        let simplexFaces = this.simplexFaces;
        simplexFaces[0].a = 0, simplexFaces[0].b = 1, simplexFaces[0].c = 2;
        simplexFaces[1].a = 0, simplexFaces[1].b = 1, simplexFaces[1].c = 3;
        simplexFaces[2].a = 0, simplexFaces[2].b = 2, simplexFaces[2].c = 3;
        simplexFaces[3].a = 1, simplexFaces[3].b = 2, simplexFaces[3].c = 3;

        let res: any = null;
        let dir = this.dir;
        this.closest = null;
        this.getClosestFace(simplex, simplexFaces);


        for (let i = 0; i < this.MAX_EPA_TIMES; i++) {

            //let face: any = this.closest;
            let face = this.closest;
            dir.x = face.nx, dir.y = face.ny, dir.z = face.nz;
            // let point = this.support(aWorldVerts, bWorldVerts, face.norm);
            let point = this.support(aWorldVerts, bWorldVerts, dir);
            //let dist = point.dot(face.norm);
            let dist = point.dot(dir);

            if (dist - face.dist < epsilon) {
                // res = { dir: face.norm.negative(), dist: dist + epsilon };
                res = { dist: dist + epsilon, dir: dir.negative() };
                return res;
            }

            //simplex.push(point);
            this.expand(simplex, simplexFaces, point);
        }

        let face = this.closest;
        dir.x = face.nx, dir.y = face.ny, dir.z = face.nz;
        let point = this.support(aWorldVerts, bWorldVerts, dir);
        res = { dist: point.dot(dir) + epsilon, dir: dir.negative() };

        return res;
    }



    GJK(a: any, b: any, epa = true) {
        //let simplex = [];
        this.slength = 0;
        let colliding: any = null;
        let simplex = this.simplex;

        let sA = ShapeSupport[a.getColliderShape()];
        let sB = ShapeSupport[b.getColliderShape()];
        let dir = Vec3.subtract(this.dir, a.getWorldCenter(), b.getWorldCenter());
        let objectA = { center: a.center, m: a.getWorldMatrix(), verts: a.getVertices(), support: sA };
        let objectB = { center: b.center, m: b.getWorldMatrix(), verts: b.getVertices(), support: sB };


        this.support(objectA, objectB, dir);
        dir.negative();

        for (let i = 0; i < this.MAX_GJK_TIMES; i++) {
            let p = this.support(objectA, objectB, dir);
            if (p.dot(dir) <= 0) {
                colliding = false;
                break;
            }

            if (this.getChangeDir(simplex, dir)) {
                if (epa) return this.EPA(objectA as any, objectB as any, simplex as any);
                colliding = true;
                break;
            }
        }

        return colliding;
    }



    expand(simplex: any, simplexFaces: any, extendPoint: any) {


        let edges: Set<number> = new Set();
        let closest_dist = Number.MAX_VALUE;
        let ex = extendPoint.x, ey = extendPoint.y, ez = extendPoint.z;

        let flength = this.flength; //flength = simplexFaces.length;
        for (let i = flength - 1; i >= 0; i--) { // for (let i = 0; i < simplexFaces.length; i++) {
            let face = simplexFaces[i], dist = face.dist;
            let nx = face.nx, ny = face.ny, nz = face.nz;

            if (ex * nx + ey * ny + ez * nz - dist > 0) {

                let edgeAB = (face.a << 16) | face.b;
                let edgeAC = (face.a << 16) | face.c;
                let edgeBC = (face.b << 16) | face.c;

                if (edges.has(edgeAB))
                    edges.delete(edgeAB);
                else
                    edges.add(edgeAB);

                if (edges.has(edgeAC))
                    edges.delete(edgeAC);
                else
                    edges.add(edgeAC);

                if (edges.has(edgeBC))
                    edges.delete(edgeBC);
                else
                    edges.add(edgeBC);

                //remove simplexFaces
                simplexFaces[i] = simplexFaces[--flength];
                simplexFaces[flength] = face;

                continue;
            }

            if (dist < closest_dist) {
                this.closest = face;
                closest_dist = dist;
            }

        }


        let start = flength;
        let c = this.slength - 1;
        edges.forEach((edge) => {
            // simplexFaces.push({ a: edge >> 16, b: edge & 0xFFFF, c: this.slength - 1, nx: 0, ny: 0, nz: 0 });
            if (flength >= simplexFaces.length) {
                simplexFaces.push({ a: edge >> 16, b: edge & 0xFFFF, c: c, nx: 0, ny: 0, nz: 0 });
            } else {
                let sf = simplexFaces[flength];
                sf.a = edge >> 16, sf.b = edge & 0xFFFF, sf.c = c;
            }
            flength++;
        });
        edges.clear();
        this.flength = flength;
        this.getClosestFace(simplex, simplexFaces, start, closest_dist);

    }


    getClosestFace(simplex: any, simplexFaces: any, start = 0, closest_dist = Number.MAX_VALUE) {
        // let closest = this.closest;
        let flength = this.flength;//simplexFaces.length;
        for (let i = start; i < flength; i++) {
            let face = simplexFaces[i];

            let a = simplex[face.a];
            let b = simplex[face.b];
            let c = simplex[face.c];

            let ax = a.x, ay = a.y, az = a.z;
            let abx = b.x - ax, aby = b.y - ay, abz = b.z - az;
            let acx = c.x - ax, acy = c.y - ay, acz = c.z - az;

            let nx = aby * acz - abz * acy,
                ny = abz * acx - abx * acz,
                nz = abx * acy - aby * acx;

            let len = nx * nx + ny * ny + nz * nz;
            if (len > 0) {
                len = 1.0 / Math.sqrt(len);
                nx = nx * len;
                ny = ny * len;
                nz = nz * len;
            }

            if (ax * nx + ay * ny + az * nz <= 0) {
                nx = -nx, ny = -ny, nz = -nz;
            }

            let dist = ax * nx + ay * ny + az * nz;
            face.nx = nx, face.ny = ny, face.nz = nz;
            face.dist = dist;

            if (dist < closest_dist) {
                this.closest = face;
                closest_dist = dist;
            }

        }

        // return closest;
    }

    getChangeDir(simplex: any, dir: any) {
        switch (this.slength) {
            case 2:
                {
                    let ab = Vec3.subtract(this.ab, simplex[1], simplex[0]);
                    let a0 = Vec3.negate(this.a0, simplex[0]);
                    let b0 = Vec3.cross(this.b0, ab, a0);
                    Vec3.cross(dir, b0, ab);
                }
                return false;
            case 3:
                {
                    let ab = Vec3.subtract(this.ab, simplex[1], simplex[0]);
                    let ac = Vec3.subtract(this.ac, simplex[2], simplex[0]);
                    Vec3.cross(dir, ab, ac);

                    let a0 = Vec3.negate(this.b0, simplex[0]);
                    if (a0.dot(dir) < 0)
                        dir.negative();
                }
                return false;
            case 4:
                let ab = Vec3.subtract(this.ab, simplex[1], simplex[0]);
                let ac = Vec3.subtract(this.ac, simplex[2], simplex[0]);
                Vec3.cross(dir, ab, ac).normalize();

                let ad = Vec3.subtract(this.ad, simplex[3], simplex[0]);
                if (ad.dot(dir) > 0) {
                    dir.negative();
                }

                let a0 = Vec3.negate(this.b0, simplex[0]);
                if (a0.dot(dir) > 0) {
                    //remove d
                    //simplex.splice(3, 1);
                    this.slength = 3;
                    return false;
                }

                //face abd
                Vec3.cross(dir, ab, ad).normalize();

                if (ac.dot(dir) > 0) {
                    dir.negative();
                }

                if (a0.dot(dir) > 0) {
                    //remove c
                    //simplex.splice(2, 1);
                    let t = simplex[2];
                    simplex[2] = simplex[3];
                    simplex[3] = t;
                    this.slength = 3;
                    return false;
                }

                //face acd
                Vec3.cross(dir, ac, ad).normalize();
                if (ab.dot(dir) > 0) {
                    dir.negative();
                }

                if (a0.dot(dir) > 0) {
                    //remove b
                    //simplex.splice(1, 1);
                    let t = simplex[1];
                    simplex[1] = simplex[2];
                    simplex[2] = simplex[3];
                    simplex[3] = t;
                    this.slength = 3;
                    return false;
                }

                //face bcd
                let bc = Vec3.subtract(this.bc, simplex[2], simplex[1]);
                let bd = Vec3.subtract(this.bd, simplex[3], simplex[1]);
                Vec3.cross(dir, bc, bd).normalize();

                let ba = Vec3.subtract(this.ba, simplex[0], simplex[1]);
                if (ba.dot(dir) > 0) {
                    dir.negative();
                }

                let b0 = Vec3.negate(this.b0, simplex[1]);
                if (b0.dot(dir) > 0) {
                    //simplex.splice(0, 1);
                    let t = simplex[0];
                    simplex[0] = simplex[1];
                    simplex[1] = simplex[2];
                    simplex[2] = simplex[3];
                    simplex[3] = t;
                    this.slength = 3;
                    return false;
                }

                return true;
        }
    }

    support(objectA: any, objectB: any, dir: any) {

        let a = this.getPointInDirection(objectA, dir);
        dir.negative();
        let b = this.getPointInDirection(objectB, dir);
        dir.negative();

        //new Vec3(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        let simplex = this.simplex[this.slength++];
        simplex.x = a[0] - b[0];
        simplex.y = a[1] - b[1];
        simplex.z = a[2] - b[2];
        return simplex;
    }

    getPointInDirection(object: any, dir: any) {

        let m = object.m;
        let verts = object.verts;
        let center = object.center;
        let support = object.support;

        let dx = dir.x, dy = dir.y, dz = dir.z;
        let x = dx * m.m00 + dy * m.m01 + dz * m.m02;
        let y = dx * m.m04 + dy * m.m05 + dz * m.m06;
        let z = dx * m.m08 + dy * m.m09 + dz * m.m10;
        //let dist = center.x * x + center.y * y + center.z * z;

        if (support != null) {
            let point = support([x, y, z]);
            dx = point[0], dy = point[1], dz = point[2];
        } else {
            let index = 0;
            let length = verts.length / 3;
            let maxDot = -Number.MAX_VALUE;
            let dist = center.x * x + center.y * y + center.z * z;
            for (let i = 0; i < length; i++) {
                let dot = verts[i * 3] * x + verts[i * 3 + 1] * y + verts[i * 3 + 2] * z;
                if (dot - dist > maxDot) {
                    maxDot = dot - dist;
                    index = i;
                }
            }

            dx = verts[index * 3];
            dy = verts[index * 3 + 1];
            dz = verts[index * 3 + 2];
        }

        x = (m.m00 * dx + m.m04 * dy + m.m08 * dz + m.m12);
        y = (m.m01 * dx + m.m05 * dy + m.m09 * dz + m.m13);
        z = (m.m02 * dx + m.m06 * dy + m.m10 * dz + m.m14);

        return [x, y, z];
    }

}
