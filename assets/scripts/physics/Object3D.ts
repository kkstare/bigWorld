import { CCInteger, Color, Component, Enum, Mat4, Mesh, MeshRenderer, PhysicsSystem, primitives, Quat, utils, Vec3, _decorator } from 'cc';
import { ShapeType } from './core/Collision';
import { Debug } from './core/Debug';
import { Kdtree } from './core/Kdtree';
import { AABBTriangle, CapsuleTriangle, RaycastTriangle, SphereTriangle } from './core/Math';
import { ObjNode } from './core/ObjNode';

const { ccclass, property } = _decorator;

const BoundType = Enum(ShapeType);

const BoundShapeMesh = [
    utils.createMesh(primitives.box()),
    utils.createMesh(primitives.sphere(0.5, { segments: 12 })),
    utils.createMesh(primitives.capsule(0.5, 0.5, 2, { sides: 12, heightSegments: 12 }))
];

@ccclass('Object3D')
export class Object3D extends Component {
    @property({ type: Mesh, displayName: "Collider" })
    meshCollider: Mesh = null!; //use Low poly for mesh collider

    @property({ type: BoundType, displayName: "Bound" })
    fastBound = BoundType.Box; //for bound culling

    @property({ type: PhysicsSystem.PhysicsGroup })
    group = PhysicsSystem.PhysicsGroup.DEFAULT;

    @property
    useTriangle: boolean = true; //default is convex hull,

    @property({ group: "Kdtree", visible() { return (this as any).useTriangle; } })
    debug: boolean = false;

    @property({ type: CCInteger, group: "Kdtree", step: 1, min: 9, max: 25, visible() { return (this as any).useTriangle; } })
    maxLevels: number = 16;
    @property({ type: CCInteger, group: "Kdtree", step: 1, min: 1, max: 8, visible() { return (this as any).useTriangle; } })
    maxObjects: number = 1;


    //flag
    id: number = 0;
    flag: number = 0;
    mask: number = 0xFFFFFFFF; //collider mask
    isDirty: number = 0xFFFFFFFF;
    useBoundShape: boolean = false;


    //local
    bound: Array<number> = []; //model bound
    center: Vec3 = new Vec3(); //model center
    worldBounds: Array<Array<number>> = [];  //sub mesh world bound

    //cache
    kdtree: Kdtree = null!;
    indices: Array<any> = [];
    vertices: Array<any> = [];
    objNodes: Array<ObjNode> = [];


    //temp
    private _mat4: Mat4 = new Mat4();
    private _inv4: Mat4 = new Mat4();
    private _verts: Array<number> = [];
    private _normal: Vec3 = new Vec3();
    private _center: Vec3 = new Vec3(); //model world center
    private _worldBound: Array<number> = []; //model world Bound



    onLoad() {

        if (!this.meshCollider) {

            let render = this.node.getComponent(MeshRenderer);
            if (render?.mesh) {
                this.meshCollider = render.mesh;
            }
            else {
                this.useTriangle = false;
                this.useBoundShape = true;
                this.meshCollider = BoundShapeMesh[this.fastBound];
            }
        }
        this.preBuild();

        this.mask = PhysicsSystem.instance.collisionMatrix[this.group];
    }

    setScale(scale: Vec3) {
        this.isDirty |= (1 | 8);
        this.node.scale = scale;
    }
    getScale() { return this.node.scale; }

    setRotation(rot: Quat) {
        this.isDirty |= (2 | 8);
        this.node.rotation = rot;
    }
    getRotation() { return this.node.rotation; }

    setPosition(pos: Vec3) {
        this.isDirty |= (4 | 8);
        this.node.position = pos;
    }
    getPosition() { return this.node.position; }


    getWorldScale() { return this.node.scale; }
    getWorldPosition() { return this.node.worldPosition; }
    getWorldRotation() { return this.node.worldRotation; }
    getWorldMatrix() { return this.node.worldMatrix; }

    getWorldMatrixInvert() {
        if (this.isDirty & 0xf) {
            this.isDirty &= (~0xf);
            Mat4.invert(this._inv4, this.node.worldMatrix);
        }
        return this._inv4;
    }

    getWorldCenter() {
        return Vec3.transformMat4(this._center, this.center, this.getWorldMatrix());
    }

    getColliderShape() {
        return this.useBoundShape ? this.fastBound : -1;
    }



    preBuild() {


        //build local bound and center
        let struct = this.meshCollider.struct;
        let min = struct.minPosition!, max = struct.maxPosition!;
        this.bound = [min.x, min.y, min.z, max.x, max.y, max.z];
        this.center.set((min.x + max.x) * 0.5, (min.y + max.y) * 0.5, (min.z + max.z) * 0.5);

        let objects: Array<ObjNode> = [];
        let meshs = this.meshCollider.renderingSubMeshes;
        for (let i = 0; i < meshs.length; i++) {

            let geoInfo = meshs[i].geometricInfo;
            let vertices = geoInfo.positions;
            let indices = geoInfo.indices;
            this.vertices.push(vertices);
            this.indices.push(indices);
            this.worldBounds.push([]);

            if (this.useTriangle) {
                //build triangles Kdtree
                if (indices && indices.length > 0) {
                    let length = indices.length / 3;
                    for (let j = 0; j < length; j++) {
                        let a = indices[j * 3];
                        let b = indices[j * 3 + 1];
                        let c = indices[j * 3 + 2];

                        let tris = [
                            vertices[a * 3], vertices[a * 3 + 1], vertices[a * 3 + 2],
                            vertices[b * 3], vertices[b * 3 + 1], vertices[b * 3 + 2],
                            vertices[c * 3], vertices[c * 3 + 1], vertices[c * 3 + 2],
                        ];

                        let x = Math.min(tris[0], tris[3], tris[6]);
                        let y = Math.min(tris[1], tris[4], tris[7]);
                        let z = Math.min(tris[2], tris[5], tris[8]);

                        let X = Math.max(tris[0], tris[3], tris[6]);
                        let Y = Math.max(tris[1], tris[4], tris[7]);
                        let Z = Math.max(tris[2], tris[5], tris[8]);

                        objects.push(new ObjNode(this, (i << 16) | j, [x, y, z, X, Y, Z], tris));
                    }
                }
            }
        }

        if (this.useTriangle) {
            // Kdtree.lCount = 0;
            this.kdtree = new Kdtree(objects, 0, objects.length - 1, this.bound, 0, (this.maxObjects << 8) | this.maxLevels);
            //  console.log("avg levels:"+(Kdtree.lCount*1.0/objects.length));
        }


        this.updateBounds(true);   //preBuild update  worldBounds

    }

    getVertices(idx: number = 0) {
        return this.vertices[idx];
    }

    getWorldBound(idx: number = -1) {
        this.updateBounds();
        if (idx >= 0) {
            //sub mesh world bound
            return this.worldBounds[idx];
        }
        //model world bound
        return this._worldBound;
    }


    calculateBound(out: Array<number>, b: Array<number>, m: Mat4) {
        let x = (b[3] + b[0]) * 0.5;
        let y = (b[4] + b[1]) * 0.5;
        let z = (b[5] + b[2]) * 0.5;

        let hx = (b[3] - b[0]) * 0.5;
        let hy = (b[4] - b[1]) * 0.5;
        let hz = (b[5] - b[2]) * 0.5;

        let cx = (m.m00 * x + m.m04 * y + m.m08 * z + m.m12);
        let cy = (m.m01 * x + m.m05 * y + m.m09 * z + m.m13);
        let cz = (m.m02 * x + m.m06 * y + m.m10 * z + m.m14);

        let m0 = hx * m.m00, m1 = hx * m.m01, m2 = hx * m.m02,
            m3 = hy * m.m04, m4 = hy * m.m05, m5 = hy * m.m06,
            m6 = hz * m.m08, m7 = hz * m.m09, m8 = hz * m.m10;
        hx = (m0 >= 0 ? m0 : -m0) + (m3 >= 0 ? m3 : -m3) + (m6 >= 0 ? m6 : -m6);
        hy = (m1 >= 0 ? m1 : -m1) + (m4 >= 0 ? m4 : -m4) + (m7 >= 0 ? m7 : -m7);
        hz = (m2 >= 0 ? m2 : -m2) + (m5 >= 0 ? m5 : -m5) + (m8 >= 0 ? m8 : -m8);

        out[0] = cx - hx, out[1] = cy - hy, out[2] = cz - hz;
        out[3] = cx + hx, out[4] = cy + hy, out[5] = cz + hz;

        return out;
    }

    updateBounds(force: boolean = false) {

        if ((this.isDirty & 0x8 || force) && this.worldBounds.length) {

            let m = this.getWorldMatrix();
            let subMeshs = this.meshCollider.renderingSubMeshes;
            //sub mesh wrold bound
            for (let i = 0; i < subMeshs.length; i++) {
                let geoInfo = subMeshs[i].geometricInfo;
                let min = geoInfo.boundingBox.min;
                let max = geoInfo.boundingBox.max;
                let bound = this.worldBounds[i];

                bound[0] = min.x;
                bound[1] = min.y;
                bound[2] = min.z;

                bound[3] = max.x;
                bound[4] = max.y;
                bound[5] = max.z;

                this.calculateBound(bound, bound, m);
            }

            //model world bound
            //this.calculateBound(this._worldBound,this.bound,m);
            if (subMeshs.length <= 1) {
                this._worldBound = this.worldBounds[0];
            } else {
                this.calculateBound(this._worldBound, this.bound, m);
            }
            this.isDirty &= (~0x8);
        }

        return this.worldBounds;
    }

    boundCulling(object: ObjNode) {

        if (object.isBox) return false; //TODO?

        // triangle culling
        let verts = this._verts;
        let localBound = this.bound;
        let v = object.getVertices();
        let m = Mat4.multiply(this._mat4, this.getWorldMatrixInvert(), object.getWorldMatrix());
        for (let i = 0, j = v.length / 3; i < j; i++) {
            let x = v[i * 3], y = v[i * 3 + 1], z = v[i * 3 + 2];
            verts[i * 3] = (m.m00 * x + m.m04 * y + m.m08 * z + m.m12);
            verts[i * 3 + 1] = (m.m01 * x + m.m05 * y + m.m09 * z + m.m13);
            verts[i * 3 + 2] = (m.m02 * x + m.m06 * y + m.m10 * z + m.m14);
        }

        switch (this.fastBound) {
            case BoundType.Box:
                return !AABBTriangle(localBound, verts);
            case BoundType.Sphere:
                return !SphereTriangle([0, 0, 0], 0.5, verts);
            case BoundType.Capsule:
                return !CapsuleTriangle([0, 1, 0], [0, -1, 0], 0.5, verts);
        }

        return false;
    }

    boundTriangles(bound: Array<number>, world: Mat4 | null = null) {
        let result: Array<ObjNode> = [];
        let localBound: Array<number> = [];

        if (this.useTriangle) {

            let m = this.getWorldMatrixInvert();
            if (world) {
                m = Mat4.multiply(this._mat4, m, world);
            }

            this.calculateBound(localBound, bound, m);
            this.kdtree.retrieve(localBound, result);

            if (this.debug) {
                for (let i = 0; i < result.length; i++) {
                    let obj = result[i];
                    Debug.addTriangle(obj.getVertices(), obj.getWorldMatrix(), Color.BLUE);
                }
                // Debug.addBox(localBound, this.getWorldMatrix(), Color.BLUE);
            }
        }

        return result;
    }

    boundObject(obj3d: Object3D) {

        // Kdtree.tCount = 0;
        // Kdtree.nCount = 0;

        let localBound = obj3d.bound;
        let fastBound = obj3d.fastBound;
        let world = obj3d.getWorldMatrix();
        let result = this.boundTriangles(localBound, world);

        if (result.length) {
            // triangles culling
            let inc = 0, verts = this._verts, length = result.length;
            let m = Mat4.multiply(this._mat4, obj3d.getWorldMatrixInvert(), this.getWorldMatrix());
            let mm = [m.m00, m.m04, m.m08, m.m12, m.m01, m.m05, m.m09, m.m13, m.m02, m.m06, m.m10, m.m14];
            for (let j = 0; j < length; j++) {
                let obj = result[j], v = obj.getVertices();
                for (let k = 0; k < 3; k++) {
                    let x = v[k * 3], y = v[k * 3 + 1], z = v[k * 3 + 2];
                    verts[k * 3] = (mm[0] * x + mm[1] * y + mm[2] * z + mm[3]);
                    verts[k * 3 + 1] = (mm[4] * x + mm[5] * y + mm[6] * z + mm[7]);
                    verts[k * 3 + 2] = (mm[8] * x + mm[9] * y + mm[10] * z + mm[11]);
                }

                let isCollision = false;
                switch (fastBound) {
                    case BoundType.Box:
                        isCollision = AABBTriangle(localBound, verts);
                        break;
                    case BoundType.Sphere:
                        isCollision = SphereTriangle([0, 0, 0], 0.5, verts);
                        break;
                    case BoundType.Capsule:
                        isCollision = CapsuleTriangle([0, 1, 0], [0, -1, 0], 0.5, verts);
                        break;
                }

                if (isCollision) {
                    if (inc < j) {
                        result[inc] = result[j];
                    }
                    inc++;

                    if (this.debug) {
                        Debug.addTriangle(obj.getVertices(), obj.getWorldMatrix(), Color.RED);
                    }
                }
            }

            result.length = inc;

            //    console.log(obj3d.node.name + ":");
            //    console.log("total:" + (Kdtree.tCount + Kdtree.nCount));
            //    console.log("tree Nodes:" + Kdtree.nCount);
            //    console.log("triangles:" + Kdtree.tCount);
            //    console.log("results:" + inc);
            //    console.log("----------------------------------------------");
        }

        // result.length = 0;
        return result;
    }


    rayCast(ray: Array<number>, id: number) {

        let normal = this._normal;
        let isHit: boolean = false;
        let hitData: Array<number> = [];
        let m = this.getWorldMatrixInvert();

        //rotate*direction -> current direction
        let n = [ray[3] * m.m00 + ray[4] * m.m04 + ray[5] * m.m08,
        ray[3] * m.m01 + ray[4] * m.m05 + ray[5] * m.m09,
        ray[3] * m.m02 + ray[4] * m.m06 + ray[5] * m.m10];

        let scale = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
        let min = ray[6] * scale; //current distance
        let invSqrt = scale > 0 ? 1.0 / scale : 0;
        n[0] *= invSqrt, n[1] *= invSqrt, n[2] *= invSqrt;


        //matrix*origin -> current origin
        let o = [ray[0] * m.m00 + ray[1] * m.m04 + ray[2] * m.m08 + m.m12,
        ray[0] * m.m01 + ray[1] * m.m05 + ray[2] * m.m09 + m.m13,
        ray[0] * m.m02 + ray[1] * m.m06 + ray[2] * m.m10 + m.m14];


        if (this.useTriangle) {

            let result: Array<ObjNode> = [];
            this.kdtree.rayCast([o[0], o[1], o[2], n[0], n[1], n[2], min], result);
            result.sort((a: ObjNode, b: ObjNode) => a.rayDist - b.rayDist);

            for (let i = 0, length = result.length; i < length; i++) {
                let obj = result[i], rayDist = obj.rayDist;
                if (rayDist < 0 || min > rayDist) {
                    let dist = RaycastTriangle(o, n, obj.getVertices(), min);
                    if (dist >= 0 && min > dist) {
                        normal.set(obj.normal);
                        isHit = true;
                        min = dist;
                    }
                }
            }

        } else {

            let indices = this.indices[id];
            let vertices = this.vertices[id];

            let idx = 0;
            let verts = this._verts
            let length = indices.length / 3;
            for (let i = 0; i < length; i++) {
                let a = indices[i * 3], b = indices[i * 3 + 1], c = indices[i * 3 + 2];
                verts[0] = vertices[a * 3], verts[1] = vertices[a * 3 + 1], verts[2] = vertices[a * 3 + 2];
                verts[3] = vertices[b * 3], verts[4] = vertices[b * 3 + 1], verts[5] = vertices[b * 3 + 2];
                verts[6] = vertices[c * 3], verts[7] = vertices[c * 3 + 1], verts[8] = vertices[c * 3 + 2];

                let dist = RaycastTriangle(o, n, verts, min);
                if (dist >= 0 && min > dist) {
                    isHit = true;
                    min = dist;
                    idx = i;
                }
            }

            if (isHit) {
                //calculate triangle normal
                let a = indices[idx * 3], b = indices[idx * 3 + 1], c = indices[idx * 3 + 2];
                verts[0] = vertices[a * 3], verts[1] = vertices[a * 3 + 1], verts[2] = vertices[a * 3 + 2];
                verts[3] = vertices[b * 3], verts[4] = vertices[b * 3 + 1], verts[5] = vertices[b * 3 + 2];
                verts[6] = vertices[c * 3], verts[7] = vertices[c * 3 + 1], verts[8] = vertices[c * 3 + 2];

                let ax = verts[3] - verts[0], ay = verts[4] - verts[1], az = verts[5] - verts[2];
                let bx = verts[6] - verts[0], by = verts[7] - verts[1], bz = verts[8] - verts[2];

                //cross
                normal.x = ay * bz - az * by;
                normal.y = az * bx - ax * bz;
                normal.z = ax * by - ay * bx;
                //normal.normalize();
            }
        }


        if (isHit) {

            //wordMatrix*normal
            let m = this.getWorldMatrix();
            let x = normal.x, y = normal.y, z = normal.z;
            normal.x = x * m.m00 + y * m.m04 + z * m.m08;
            normal.y = x * m.m01 + y * m.m05 + z * m.m09;
            normal.z = x * m.m02 + y * m.m06 + z * m.m10;
            normal.normalize();

            let dist = min / scale;
            hitData[0] = ray[0] + ray[3] * dist;
            hitData[1] = ray[1] + ray[4] * dist;
            hitData[2] = ray[2] + ray[5] * dist;
            hitData[3] = normal.x;
            hitData[4] = normal.y;
            hitData[5] = normal.z;
            hitData[6] = dist;

            return hitData;
        }

        return null;
    }


    public getGroup(): number { return this.group; }
    public setGroup(v: number): void { this.group = v; }
    public addGroup(v: number): void { this.group |= v; }
    public removeGroup(v: number): void { this.group &= ~v; }

    public getMask(): number { return this.mask; }
    public setMask(v: number): void { this.mask = v; }
    public addMask(v: number): void { this.mask |= v; }
    public removeMask(v: number): void { this.mask &= ~v; }

    clear() {

        if (this.kdtree) {
            this.kdtree.clear();
            this.kdtree = null!;
        }

        this.bound = null!;
        this.indices = null!;
        this.vertices = null!;
        this.objNodes = null!;
        this.worldBounds = null!;
    }

}

