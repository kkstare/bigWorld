import { Color, director, geometry, Mat4, Vec3, VERSION } from 'cc';

export class Debug {

    static addBox(bound: Array<number>, world: Mat4, color:Color) {


        let renderer = null;
        if(VERSION.indexOf("3.5") == 0){
           renderer = director!.root!.pipeline.geometryRenderer;
        }
        if(VERSION.indexOf("3.6") == 0){
            renderer  = director.root!.scenes[0].cameras[0]["geometryRenderer"];
        }
        if (renderer && renderer.addBoundingBox) {

            let cx = bound[0]+bound[3], cy = bound[1]+bound[4], cz = bound[2]+bound[5];
            let lx = bound[3]-bound[0], ly = bound[4]-bound[1], lz = bound[5]-bound[2];
            let aabb = geometry.AABB.create(cx*0.5, cy*0.5, cz*0.5, lx*0.5, ly*0.5, lz*0.5);

            renderer.addBoundingBox(aabb, color, true, true, true, true, world);
        }
    }

    static addTriangle(tris: Array<number>, world: Mat4, color: Color) {

        let renderer = null;
        if(VERSION.indexOf("3.5") == 0){
           renderer = director!.root!.pipeline.geometryRenderer;
        }
        if(VERSION.indexOf("3.6") == 0){
            renderer  = director.root!.scenes[0].cameras[0]["geometryRenderer"];
        }
        if (renderer) {

            let v0: any = new Vec3(tris[0], tris[1], tris[2]).transformMat4(world);
            let v1: any = new Vec3(tris[3], tris[4], tris[5]).transformMat4(world);
            let v2: any = new Vec3(tris[6], tris[7], tris[8]).transformMat4(world);

            renderer.addTriangle(v0, v1, v2, color);
        }

    }


    static addLine(v0:Vec3,v1:Vec3, world: Mat4, color: Color) {

        let renderer = null;
        if(VERSION.indexOf("3.5") == 0){
           renderer = director!.root!.pipeline.geometryRenderer;
        }
        if(VERSION.indexOf("3.6") == 0){
            renderer  = director.root!.scenes[0].cameras[0]["geometryRenderer"];
        }
        if (renderer && renderer.addLine) {

            renderer.addLine(v0, v1, color);
        }

    }
}

