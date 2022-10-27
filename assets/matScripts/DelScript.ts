import { Component, Node, _decorator } from 'cc';
import { PlaneMgr } from './PlaneMgr';
const { ccclass, property } = _decorator;



@ccclass('DelScript')
export class DelScript extends Component {
    @property(Node)
    btns!: Node;

    @property(PlaneMgr)
    PlaneMgr!: PlaneMgr;

    bindMap: Record<string, Function> = {
        "btn1": () => {
            console.log("点击删除")
            this.PlaneMgr.randDel()
        },
        "btn2": () => {
            console.log("点击修改")
            this.PlaneMgr.randUp()

        }
    }



    onLoad() {
        this.btns.children.forEach((btn) => {
            console.log(btn.name)
            btn.on(Node.EventType.TOUCH_END, () => {
                console.log("click")
            })

            btn.on(Node.EventType.TOUCH_END, this.bindMap[btn.name], this)
        })

    }


}

