import { clamp, Color, Mat4, MeshRenderer, Node, toRadian, Vec3, _decorator } from 'cc';
import { Debug } from './core/Debug';
import { Object3D } from './Object3D';
import { PhysicWorld } from './PhysicWorld';

const { ccclass, property } = _decorator;

@ccclass('MovableNode')
export class MovableNode extends Object3D {

    @property
    boundDebug: boolean = false;

    @property(PhysicWorld)
    world?: PhysicWorld;

    //player only use convex 
    @property({ visible: false, override: true })
    useTriangle: boolean = false;

    @property({ min: 0 })
    maxSpeed: number = 10;
    @property({ min: 0, max: 90 })
    slopeLimit: number = 75;
    @property({ min: 0 })
    stepOffset: number = 0.0;
    @property
    gravity: Vec3 = new Vec3(0, -9.8, 0);

    protected vertical: number = 0;
    protected velocity: Vec3 = new Vec3();
    protected isMove: boolean = false;
    protected surfaceNormal = new Vec3(0, 1, 0);

    start() {
        if (this.boundDebug) {
            let node = new Node("DebugCollider");
            let render = node.addComponent(MeshRenderer);
            render.mesh = this.meshCollider;
            this.node.addChild(node);
        }
    }

    // reset() {
    //     this.changeAnimation("idle");
    //     this.node.position = new Vec3(0, 60, 0);
    //     this.node.rotation = Quat.IDENTITY;
    //     this.surfaceNormal.set(0, 1, 0);
    //     this.velocity.set(Vec3.ZERO);
    //     this.vertical = 0;
    // }

    /** 通常 JoyStick 只会影响 2 个分量 */
    move(x?: number, y?: number, z?: number) {
        if (x !== undefined) {
            this.velocity.x = x;
        }
        if (y !== undefined) {
            this.velocity.y = y;
        }
        if (z !== undefined) {
            this.velocity.z = z;
        }
        this.isMove = true;
    }

    stop() {
        this.isMove = false;
        this.velocity.set(Vec3.ZERO);
    }

    update(dt: number) {
        this.step(dt)
    }

    protected step(dt: number) {
        if (!this.world) {
            return;
        }

        dt = clamp(dt, 0.0, 0.016 * 2);
        let pos = this.getPosition();
        let v = this.velocity, g = this.gravity;
        let x = pos.x + (v.x * dt) + g.x * dt * dt / 2;
        let y = pos.y + (v.y * dt) + this.vertical * dt + g.y * dt * dt / 2;
        let z = pos.z + (v.z * dt) + g.z * dt * dt / 2;
        this.vertical += g.y * dt;
        this.setPosition(pos.set(x, y, z));

        let moveUp = new Vec3();
        let avgDir = new Vec3();
        let isCollision = false;
        this.surfaceNormal.set(0, 1, 0);
        let upLimit = Math.cos(toRadian(this.slopeLimit));
        let collisions = this.world.objectQuery(this, true);

        for (let i = 0; i < collisions.length; i++) {
            let obj = collisions[i];
            if (this.boundCulling(obj)) continue;
            let result = this.world.collision.GJK(this, obj);
            if (result && typeof result === 'object') {
                moveUp.set(0, 1, 0);
                let dir = result.dir;
                let dist = result.dist;
                let upWalkable = moveUp.dot(dir);
                let faceWalkable = obj.isBox ? true : moveUp.dot(obj.getWorldNormal()) >= upLimit;

                if (upWalkable >= upLimit && faceWalkable) {
                    moveUp.multiplyScalar(dist / Math.cos(upWalkable));
                    this.setPosition(pos.add(moveUp));
                    this.surfaceNormal.set(dir);
                    avgDir.set(dir);
                }
                else {
                    let boundB = obj.getWorldBound();
                    let boundA = this.getWorldBound();
                    moveUp.set(dir).multiplyScalar(dist);
                    if (this.isMove) {
                        let verticalH = boundB[4] - boundA[1];
                        if (verticalH < this.stepOffset && faceWalkable) {
                            moveUp.y = Math.max(moveUp.y, this.stepOffset * 0.1);
                            dir.add(Vec3.UNIT_Y).normalize();
                            this.surfaceNormal.set(dir);
                            avgDir.set(dir);
                        }
                        else {
                            moveUp.y = 0;
                        }
                    }
                    this.setPosition(pos.add(moveUp));
                }

                isCollision = true;

                if (obj.obj3D.debug)
                    Debug.addBox(obj.getWorldBound(), Mat4.IDENTITY, obj.isBox ? Color.RED : Color.CYAN);
            }
        }

        if (!isCollision) {
            this.velocity.y = 0;
        }
        else {
            avgDir.normalize();
            let down = avgDir.dot(Vec3.UNIT_Y);
            if (down > 0) {
                this.vertical *= (1.0 - down);
            }
        }
    }

}

