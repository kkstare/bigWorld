import { Component, Material, MeshRenderer, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BatchSetMat')
export class BatchSetMat extends Component {
    @property(Material)
    mat!: Material;

    @property
    get set() { return false }
    set set(v: boolean) {
        this.node.getComponentsInChildren(MeshRenderer).forEach(v => {
            v.sharedMaterials = [this.mat]
        })
    }
}

