import { RaycastAABB } from "./Math";
import { ObjNode } from "./ObjNode";

export class Kdtree {

    l: number = 0;
    r: number = 0;
    left: Kdtree = null!;
    right: Kdtree = null!;
    isLeaf: boolean = false;
    objects: Array<ObjNode> = [];

    axis: number = 0;
    bound: Array<number> = null!;
    bounds: Array<Array<number>> = [];
    object_level: number = (1 << 8) | 16;

    // static nCount = 0;
    // static tCount = 0;
    // static lCount = 0;
    constructor(objects: Array<ObjNode>, l: number, r: number, b: Array<number>, axis: number, object_level: number = (1 << 8) | 16) {
        this.l = l;
        this.r = r;
        this.bound = b;
        this.objects = objects;
        this.object_level = object_level;
        if (r - l + 1 <= (object_level >> 8) || !(object_level & 0xFF)) {
            this.isLeaf = true;
            return;
        }

        this.axis = axis % 3;
        this.split(l, r);
    }

    split(l: number, r: number) {

        let axis = this.axis;
        let bounds = this.bounds;
        let level = this.object_level;
        let side = this.getSide(l, r, axis);
        let object = this.findMid(l, r, side);
        let middle = this.partion(l, r, object.bound[side], side);

        this.right = new Kdtree(this.objects, middle, r, bounds[0], axis + 1, level - 1); //up
        this.left = new Kdtree(this.objects, l, middle - 1, bounds[1], axis + 1, level - 1); //down
    }

    getSide(l: number, r: number, axis: number) {
        let a = this.objects;
        let side0 = 0, side3 = 0;
        let min = this.bound[axis];
        let max = this.bound[axis + 3];
        for (let i = l; i <= r; i++) {
            let b = a[i].bound,
                b0 = b[axis] - min,
                b3 = b[axis + 3] - max;

            side0 += (b0 * b0);
            side3 += (b3 * b3);
        }

        return side0 >= side3 ? axis : axis + 3;
    }

    partion(l: number, r: number, max: number, side: number) {

        let i = l, j = r;
        let a = this.objects;

        for (; i <= j; i++) {
            let obj = a[i];
            if (obj.bound[side] >= max) {
                a[i] = a[j];
                a[j] = obj;
                j--, i--;
            }
        }

        let middle = i;
        if (i >= r) {
            middle = r;
        } else if (i == l) {
            middle = i + 1;
        }

        let m = Number.NEGATIVE_INFINITY;
        let M = Number.POSITIVE_INFINITY;
        let rb = this.bounds[0] = [M, M, M, m, m, m];
        let lb = this.bounds[1] = [M, M, M, m, m, m];


        for (i = l; i <= r; i++) {
            let b = a[i].bound;
            if (i < middle) {
                if (lb[0] > b[0]) lb[0] = b[0];
                if (lb[1] > b[1]) lb[1] = b[1];
                if (lb[2] > b[2]) lb[2] = b[2];

                if (lb[3] < b[3]) lb[3] = b[3];
                if (lb[4] < b[4]) lb[4] = b[4];
                if (lb[5] < b[5]) lb[5] = b[5];
            } else {
                if (rb[0] > b[0]) rb[0] = b[0];
                if (rb[1] > b[1]) rb[1] = b[1];
                if (rb[2] > b[2]) rb[2] = b[2];

                if (rb[3] < b[3]) rb[3] = b[3];
                if (rb[4] < b[4]) rb[4] = b[4];
                if (rb[5] < b[5]) rb[5] = b[5];
            }
        }


        return middle;
    }

    insertSort(l: number, r: number, side: number) {
        let a = this.objects;
        // let axis = this.axis + 3;
        for (let i = l + 1; i <= r; i++) {
            let t = a[i], j = i;
            let max = t.bound[side];

            while (j > l && a[j - 1].bound[side] > max) {
                a[j] = a[j - 1];
                j--;
            }

            if (j != i)
                a[j] = t;
        }

    }


    findMid(l: number, r: number, side: number): ObjNode {
        let a = this.objects;
        if (l == r) return a[l];
        let i = 0, n = 0;
        for (i = l; i < r - 5; i += 5) {
            this.insertSort(i, i + 4, side);
            n = i - l;
            // swap(a[l + n / 5], a[i + 2]);  
            let n5 = ~~(n / 5);
            let t = a[l + n5];
            a[l + n5] = a[i + 2];
            a[i + 2] = t;
        }

        let num = r - i + 1;
        if (num > 0) {
            this.insertSort(i, i + num - 1, side);
            n = i - l;
            // swap(a[l + n / 5], a[i + num / 2]);
            let n5 = ~~(n / 5), n2 = ~~(num / 2);
            let t = a[l + n5];
            a[l + n5] = a[i + n2];
            a[i + n2] = t;

        }
        //n /= 5;  
        n = ~~(n / 5);
        if (n == l) return a[l];
        return this.findMid(l, l + n, side);
    }


    retrieve(bound: Array<number>, result: Array<ObjNode>) {

        let inc = 0;
        let A = bound;
        let objects = this.objects;
        let queue: Array<Kdtree> = [this];
        while (inc >= 0) {

            let obj = queue[inc--];
            let axis = obj.axis;
            let B = obj.bounds;

            if (obj.isLeaf) {
                let l = obj.l, r = obj.r;
                //Kdtree.tCount += (r - l + 1);
                for (let i = l; i <= r; i++) {
                    let objB = objects[i], B = objB.bound;
                    if (!(B[0] > A[3] || A[0] > B[3]
                        || B[1] > A[4] || A[1] > B[4]
                        || B[2] > A[5] || A[2] > B[5])) {
                        result.push(objB);
                    }
                }

                continue;
            }

            //Kdtree.nCount++;

            if (!(A[axis + 3] < B[1][axis] || A[axis] > B[1][axis + 3])) {
                queue[++inc] = (obj.left);
            }

            if (!(A[axis + 3] < B[0][axis] || A[axis] > B[0][axis + 3])) {
                queue[++inc] = (obj.right);
            }
        }
    }

    rayCast(ray: Array<number>, result: Array<ObjNode>) {


        let max = ray[6];
        let o = [ray[0], ray[1], ray[2]];
        let n = [ray[3], ray[4], ray[5]];

        let inc = 0;
        let rayAABB = RaycastAABB;
        let objects = this.objects;
        let queue: Array<Kdtree> = [this];
        while (inc >= 0) {

            let obj = queue[inc--];
            let B = obj.bound;

            if (obj.isLeaf) {
                let l = obj.l, r = obj.r;
                for (let i = l; i <= r; i++) {
                    let objB = objects[i], B = objB.bound;
                    let dist = rayAABB(o, n, B, max);
                    if (dist != null) {
                        objB.rayDist = dist;
                        result.push(objB);
                    }
                }

                continue;
            }

            //Kdtree.nCount++;

            if (!(o[0] < B[0] || o[0] > B[3] ||
                o[1] < B[1] || o[1] > B[4] ||
                o[2] < B[2] || o[2] > B[5])) {
                queue[++inc] = (obj.right);
                queue[++inc] = (obj.left);
                continue;
            }

            let dist = rayAABB(o, n, B, max);
            if (dist != null && dist >= 0) {
                queue[++inc] = (obj.right);
                queue[++inc] = (obj.left);
            }

        }

    }

    clear() {

        this.bound = null!;
        this.bounds = null!;
        this.objects = null!;

        if (this.left) this.left.clear();
        if (this.right) this.right.clear();

        this.left = null!;
        this.right = null!;
    }
}
