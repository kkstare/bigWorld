import { CCInteger, Color, Component, Mat4, Vec3, _decorator } from 'cc';
import { Collision } from './core/Collision';
import { Debug } from './core/Debug';
import { ObjNode } from './core/ObjNode';
import { Octree, OctreeMaxLevel } from './core/Octree';
import { Object3D } from './Object3D';

const { ccclass, property } = _decorator;

@ccclass('PhysicWorld')
export class PhysicWorld extends Component {


    @property({ group: "Octree" })
    debug: boolean = false;
    @property({ type: CCInteger, group: "Octree", step: 1, min: 1, max: 6 })
    maxLevels: number = 4;
    @property({ type: CCInteger, group: "Octree", step: 1, min: 1, max: 16 })
    maxObjects: number = 8;
    @property({ group: "Octree" })
    center: Vec3 = new Vec3();

    @property({ group: "Octree" })
    halfSize: Vec3 = new Vec3(50, 50, 50);


    octree!: Octree;
    flag: number = 0;
    result: Array<ObjNode> = [];
    objects: Array<Object3D> = [];
    collision: Collision = new Collision();

    start() {
        this.preBuild();
    }

    preBuild() {

        let c = this.center;
        let h = this.halfSize;
        Vec3.max(h, h, Vec3.ONE);
        let bound = [c.x, c.y, c.z, h.x, h.y, h.z];
        this.octree = new Octree(bound, (this.maxObjects << 8) | this.maxLevels);

        let objects = this.node.getComponentsInChildren(Object3D);
        for (let i = 0; i < objects.length; i++) {
            this.insert(objects[i]);
        }
    }

    insert(object: Object3D) {

        let bounds = object.updateBounds(true);
        if (bounds.length) {
            this.objects.push(object);
            let objNodes = object.objNodes;
            for (let j = bounds.length - 1; j >= 0; j--) {
                let objNode = new ObjNode(object, (object.id << 16) | j, bounds[j]);
                OctreeMaxLevel(objNode, this.octree, 1.0); //prebuild max level
                this.octree.insert(objNode);
                objNodes.push(objNode);
            }
        }

    }

    remove(object: Object3D) {
        let objects = this.objects;
        let idx = objects.indexOf(object);
        if (idx != -1) {

            //remove from octree
            let objNodes = object.objNodes;
            for (let i = 0; i < objNodes.length; i++) {
                this.octree.remove(objNodes[i]);
            }

            let end = objects.length - 1;
            objects[idx] = objects[end];
            objects.length = end;
        }
    }

    aabbQuery(worldBound: Array<number>, isTriangle: boolean = false, mask: number = 0xFFFFFFFF) {

        this.result.length = 0;
        this.octree.retrieve(worldBound, ++this.flag, this.result, mask);//, this.debug);

        if (isTriangle) {
            let objs = this.result;
            let length = objs.length;
            for (let i = 0; i < length; i++) {
                let objB = objs[i].obj3D;
                if (objB.useTriangle) {
                    // Octree.count = 0;
                    let result = objB.boundTriangles(worldBound);
                    this.result.splice(i, 1);
                    for (let j = result.length - 1; j >= 0; j--) {
                        this.result.push(result[j]);
                    }
                    result.length = 0;
                    length--;
                    i--;
                }
            }
        }


        return this.result;
    }


    objectQuery(objA: Object3D, isTriangle: boolean = false) {

        this.result.length = 0;
        let worldBound = objA.getWorldBound();
        this.octree.retrieve(worldBound, ++this.flag, this.result, objA.mask);

        // if (this.debug) {
        //     let result = this.result;
        //     for (let i = 0; i < result.length; i++) {
        //         Debug.addBox(result[i].getWorldBound(), Mat4.IDENTITY, Color.GREEN);
        //     }
        //     // Debug.addBox(objA.getWorldBound(),Mat4.IDENTITY,Color.GREEN);
        // }

        if (isTriangle) {

            let result = this.result;
            let length = result.length;
            for (let i = length - 1; i >= 0; i--) {
                let objB = result[i].obj3D;
                if (objB.useTriangle) {

                    let tris = objB.boundObject(objA);
                    for (let j = 0; j < tris.length; j++)
                        result[length++] = tris[j];
                    // tris.length = 0;

                    length--;
                    if (i < length) //remove objB
                        result[i] = result[length];
                }
            }

            result.length = length;

        }

        return this.result;
    }


    //ray:[0-2] -> origin
    //ray:[3-5] -> direction
    //ray:[6] -> max distance
    rayCast(ray: Array<number>, mask: number = 0xFFFFFFFF, isTriangle: boolean = false) {

        let min = ray[6];
        let result: Array<ObjNode> = [];
        let rayCast: { objs: ObjNode[], hit: number[] } = { objs: result, hit: null! };
        this.octree.rayCast(ray, ++this.flag, result, mask);
        result.sort((a: ObjNode, b: ObjNode) => a.rayDist - b.rayDist);

        //if (this.debug) {
        // for (let i = 0; i < result.length; i++) {
        //     Debug.addBox(result[i].getWorldBound(), Mat4.IDENTITY, Color.BLACK);
        // }
        //}

        if (isTriangle) {

            for (let i = 0, j = result.length; i < j; i++) {
                let obj = result[i];
                let obj3D = obj.obj3D;
                let dist = obj.rayDist;

                if (dist < 0 || dist < min) {
                    let hit = obj3D.rayCast(ray, obj.subID & 0xFFFF);
                    if (hit && min >= hit[6]) {
                        min = hit[6];
                        result[0] = obj;
                        rayCast.hit = hit;
                        //rayCast.objs[0] = obj;
                    }
                }
            }

            if (this.debug && rayCast.hit) {
                let hit = rayCast.hit;
                let obj = rayCast.objs[0];
                let v0 = new Vec3(ray[0], ray[1], ray[2]);
                let v1 = new Vec3(hit[0], hit[1], hit[2]);
                Debug.addLine(v0, v1, Mat4.IDENTITY, Color.GREEN);
                // Debug.addBox(obj.getWorldBound(), Mat4.IDENTITY, Color.BLACK);
            }
        }

        return rayCast;
    }

    clear() {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].clear();
        }
        this.objects.length = 0;

        this.octree.clear();
        this.octree = null!;
    }

}

