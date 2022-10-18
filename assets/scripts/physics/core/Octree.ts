import { RaycastAABB, RaycastBox } from "./Math";
import { ObjNode } from "./ObjNode";

export const OctreeMaxLevel = function (obj: ObjNode, oct: Octree, ratio: number = 1.0) {

    let maxLevel = oct.object_level >> 8;

    if (ratio <= 0) {
        obj.maxLevel = maxLevel;
        return maxLevel;
    }

    let a = obj.bound;
    let b = oct.bound;
    let avgB = (b[3] + b[4] + b[5]) / 3;
    let avgA = ((a[3] - a[0]) * 0.5 + (a[4] - a[1]) * 0.5 + (a[5] - a[2]) * 0.5) / 3;
    maxLevel = ~~(Math.log2(avgB / (avgA * ratio)));

    obj.maxLevel = maxLevel;

    return maxLevel;

}


export class Octree {

    idxs: number = 0;
    level: number = 0;
    bound: Array<number> = [];
    nodes: Array<Octree> = [];
    objects: Array<ObjNode> = [];
    object_level: number = (8 << 8) | 4;

    constructor(bound: Array<number> = [], object_level: number = ((8 << 8) | 4), level: number = 0) {
        this.idxs = 0;
        this.nodes = [];
        this.objects = [];
        this.bound = bound;
        this.level = level;
        this.object_level = object_level;
    }


    split() {

        let level = this.level;
        let object_level = this.object_level - 1;
        let nodes = this.nodes, bound = this.bound;
        let x = bound[0], y = bound[1], z = bound[2],
            w = bound[3] * 0.5, h = bound[4] * 0.5, d = bound[5] * 0.5;

        nodes[0] = new Octree([x + w, y - h, z - d, w, h, d], object_level, level + 1);
        nodes[1] = new Octree([x - w, y - h, z - d, w, h, d], object_level, level + 1);
        nodes[2] = new Octree([x - w, y + h, z - d, w, h, d], object_level, level + 1);
        nodes[3] = new Octree([x + w, y + h, z - d, w, h, d], object_level, level + 1);
        nodes[4] = new Octree([x + w, y - h, z + d, w, h, d], object_level, level + 1);
        nodes[5] = new Octree([x - w, y - h, z + d, w, h, d], object_level, level + 1);
        nodes[6] = new Octree([x - w, y + h, z + d, w, h, d], object_level, level + 1);
        nodes[7] = new Octree([x + w, y + h, z + d, w, h, d], object_level, level + 1);
    }

    getIndex(pRect: Array<number>) {

        let idxs = 0, bound = this.bound;
        let x = bound[0], y = bound[1], z = bound[2];
        let west = pRect[0] < x, east = pRect[3] >= x;
        let north = pRect[1] < y, south = pRect[4] >= y;
        let front = pRect[2] < z, back = pRect[5] >= z;

        if (north && east) { front && (idxs = 1); back && (idxs |= (1 << 16)); }
        if (west && north) { front && (idxs |= (1 << 4)); back && (idxs |= (1 << 20)); }
        if (west && south) { front && (idxs |= (1 << 8)); back && (idxs |= (1 << 24)); }
        if (east && south) { front && (idxs |= (1 << 12)); back && (idxs |= (1 << 28)); }

        return idxs;

    }

    remove(obj: ObjNode) {
        let octree = obj.targets;
        for (let i = octree.length - 1; i >= 0; i--) {
            let objNodes = octree[i].objects;
            let idx = objNodes.indexOf(obj);
            if (idx != -1) {
                let end = objNodes.length - 1;
                objNodes[idx] = objNodes[end];
                objNodes.length = end;
            }
        }

        //TODO combie tree?
    }

    insert(obj: ObjNode) {

        let level = this.level,
            nodes = this.nodes,
            objects = this.objects,
            object_level = this.object_level;

        if (nodes.length) {
            if (obj.maxLevel != level) {
                let j = 0, idxs = this.getIndex(obj.bound);
                this.idxs |= idxs;
                while (idxs) {
                    if (idxs & 0xF) nodes[j].insert(obj);
                    idxs = idxs >> 4;
                    j++;
                }

            } else {
                objects.push(obj);
                obj.insert(this);
            }

            return;
        }

        objects.push(obj);
        obj.insert(this);

        if (objects.length > (object_level >> 8) && (object_level & 0xFF)) {
            this.split();
            let inc = 0, length = objects.length;
            for (let i = 0; i < length; i++) {
                let obj = objects[i];
                if (obj.maxLevel != level) {
                    obj.remove(this);
                    let j = 0, idxs = this.getIndex(obj.bound);
                    this.idxs |= idxs;
                    while (idxs) {
                        if (idxs & 0xF) nodes[j].insert(obj);
                        idxs = idxs >> 4;
                        j++;
                    }
                } else {
                    objects[inc++] = objects[i];
                }
            }

            objects.length = inc;
        }
    }


    retrieve(bound: Array<number>, flag: number, result: Array<ObjNode>, mask: number = 0xFFFFFFFF) {

        let A = bound,
            idxs = this.idxs,
            objects = this.objects,
            length = objects.length;

        for (let i = 0; i < length; i++) {
            let obj = objects[i], B = obj.bound;
            if (obj.flag < flag) {
                obj.flag = flag;
                if (mask & obj.group) {
                    if (!(B[0] > A[3] || A[0] > B[3]
                        || B[1] > A[4] || A[1] > B[4]
                        || B[2] > A[5] || A[2] > B[5])) {
                        result.push(obj);
                    }
                }
            }
        }

        //if (this.nodes.length) {
        if (idxs) {
            let nodes = this.nodes, j = 0;
            idxs = this.getIndex(bound) & idxs;
            while (idxs) {
                if (idxs & 0xF) {
                    nodes[j].retrieve(bound, flag, result, mask);
                }
                idxs = idxs >> 4;
                j++;
            }
        }
    }


    rayCast(ray: Array<number>, flag: number, result: Array<ObjNode>, mask: number = 0xFFFFFFFF) {


        let max = ray[6];
        let o = [ray[0], ray[1], ray[2]];
        let n = [ray[3], ray[4], ray[5]];

        let inc = 0;
        let rayBox = RaycastBox;
        let rayAABB = RaycastAABB;
        let queue: Array<Octree> = [this];
        while (inc >= 0) {

            let octree = queue[inc--];

            let idxs = octree.idxs;
            let nodes = octree.nodes;
            let objects = octree.objects;

            for (let i = 0, j = objects.length; i < j; i++) {
                let obj = objects[i], b = obj.bound;

                if (obj.flag < flag) {
                    obj.flag = flag;
                    if (mask & obj.group) {

                        let dist = rayAABB(o, n, b, max);
                        if (dist != null) {
                            obj.rayDist = dist;
                            result.push(obj)
                        }

                    }
                }
            }


            for (let i = 0; idxs != 0; idxs = idxs >> 4, i++) {
                if (idxs & 0xF) {
                    let obj = nodes[i], b = obj.bound;
                    //(origin-center)^2 > halfSize
                    let x = o[0] - b[0], y = o[1] - b[1], z = o[2] - b[2];
                    if (!(x * x > b[3] * b[3] || y * y > b[4] * b[4] || z * z > b[5] * b[5])) {
                        queue[++inc] = obj;
                        continue;
                    }

                    let dist = rayBox(o, n, b, max);
                    if (dist != null && dist >= 0)
                        queue[++inc] = obj;
                }
            }
        }

    }

    clear() {

        this.bound = null!;
        this.objects = null!;

        for (let i = 0; i < 8; i++) {
            let node = this.nodes[i];
            if (node) {
                node.clear();
                this.nodes[i] = null!;
            }
        }

        this.nodes = null!;
    }

}
