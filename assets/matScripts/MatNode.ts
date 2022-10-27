import { Component, Node, Vec4, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MatNode')
export class MatNode extends Component {

    @property(Node)
    node1: Node

    @property(Node)
    node2: Node
    start() {
        console.log(this.node1.worldMatrix)
        console.log(this.node2.worldMatrix)

        console.log(this.node1.getWorldMatrix())
        console.log(this.node2.getWorldMatrix())


        let out: Vec4 = new Vec4

        // Vec3.transformMat4(out, this.node2.matrix, this.node1.getWorldMatrix())
        // this.node2.
    }

    update(deltaTime: number) {

    }
}

