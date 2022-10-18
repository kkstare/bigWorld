import { Vec3 } from "cc";
import { Object3D } from "../Object3D";
import { Octree } from "./Octree";


export class ObjNode {

    obj3D: Object3D;
    //subID:(16bit,16bit);
    //triangle:(meshID,trisID) -> kdtree; 
    //aabb:(objectID,subMeshID) -> octree;
    subID: number = 0;
    normal: Vec3 = new Vec3();
    center: Vec3 = new Vec3();
    bound: Array<number>;
    vertices?: Array<number>;


    flag: number = 0;
    isBox: boolean = true;
    rayDist: number = 0;
    maxLevel: number = 4;
    targets: Array<Octree> = [];
    get mask() { return this.obj3D.mask; };
    get group() { return this.obj3D.group; };


    private _normal: Vec3 = new Vec3();
    private _center: Vec3 = new Vec3();


    constructor(obj3D: Object3D, subID: number, bound: Array<number>, vertices?: Array<number>) {

        this.flag = 0;
        this.subID = subID;
        this.obj3D = obj3D;
        this.bound = bound;
        this.vertices = vertices;
        this.isBox = vertices ? false : true;

        if (this.isBox) { //aabb
            this.center.x = (bound[0] + bound[3]) / 2.0;
            this.center.y = (bound[1] + bound[4]) / 2.0;
            this.center.z = (bound[2] + bound[5]) / 2.0;
        }
        else if (vertices) { //triangle
            this.center.x = (vertices[0] + vertices[3] + vertices[6]) / 3.0;
            this.center.y = (vertices[1] + vertices[4] + vertices[7]) / 3.0;
            this.center.z = (vertices[2] + vertices[5] + vertices[8]) / 3.0;

            let ax = vertices[3] - vertices[0], ay = vertices[4] - vertices[1], az = vertices[5] - vertices[2];
            let bx = vertices[6] - vertices[0], by = vertices[7] - vertices[1], bz = vertices[8] - vertices[2];

            this.normal.x = ay * bz - az * by;
            this.normal.y = az * bx - ax * bz;
            this.normal.z = ax * by - ay * bx;
            this.normal.normalize();
        }

    }

    getWorldMatrix() {
        return this.obj3D.getWorldMatrix();
    }

    getColliderShape() {
        return this.obj3D.getColliderShape();
    }

    getWorldBound() {
        if (!this.isBox) {
            let bound = this.bound;
            let m = this.getWorldMatrix();
            return this.obj3D.calculateBound([], bound, m);
        }
        return this.obj3D.getWorldBound(this.subID & 0xFF);
    }


    getVertices() {
        return this.isBox ? this.obj3D.getVertices(this.subID && 0xFF) : this.vertices;
    }

    getWorldCenter() {
        return Vec3.transformMat4(this._center, this.center, this.getWorldMatrix());
    }

    getWorldNormal() {
        return Vec3.transformQuat(this._normal, this.normal, this.obj3D.getWorldRotation());
    }



    insert(tree: Octree) {
        this.targets.push(tree);
    }

    remove(tree: Octree) {
        let targets = this.targets;
        let idx = targets.indexOf(tree);
        if (idx != -1) {
            let end = targets.length - 1;
            targets[idx] = targets[end];
            targets.length = end;
        }
    }

    clear() {
        this.obj3D = null!;
        this.bound = null!;
        this.targets = null!;
        this.vertices = null!;
    }
}
