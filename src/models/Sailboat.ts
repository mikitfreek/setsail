import THREE, { Object3D, Vector2, Vector3, Raycaster, Mesh } from "three"

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export class Sailboat
{
    public mesh: Object3D
    // public userData: any
    public direction: Vector3
    public rudderdeg: number
    public vel: number
    private step: number
    private rays: Vector3[]
    private caster: Raycaster


    constructor()
    {
        // obstacles = virtualScene.world.getObstacles()
        // 3D Model
        const gltfLoader = new GLTFLoader()
        this.mesh = new Object3D()
        const sailboat = './src/assets/models/Sailboat/model.gltf'

        gltfLoader.load(sailboat, (gltf) => {
            const obj = gltf.scene
            obj.scale.set(120, 120, 120)
            obj.position.y = -86
            obj.position.x = 48
            obj.position.z = 35
            obj.rotation.y = 2.4
            obj.rotation.x = -0.05 //sink
            this.mesh.add(obj)
        },
        (xhr) => {
            console.log( sailboat + ' ' + (xhr.loaded / xhr.total * 100) + '% loaded')
        },
        (error) => {
            console.log(error)
        })

        // Set the vector of the current motion
        this.direction = new Vector3(0, 0, 0)
        // Set the deg of the rubber
        this.rudderdeg = 0
        const rudder = new Vector3(0, 0, 1)
        this.vel = 1
        // Set the current animation step
        this.step = 0
        // Set the rays : one vector for every potential direction
        this.rays = [
            new Vector3(0, 0, 1),
            new Vector3(1, 0, 1),
            new Vector3(1, 0, 0),
            new Vector3(1, 0, -1),
            new Vector3(0, 0, -1),
            new Vector3(-1, 0, -1),
            new Vector3(-1, 0, 0),
            new Vector3(-1, 0, 1)
        ]
        // And the "RayCaster", able to test for intersections
        this.caster = new Raycaster()
    }
    // Test and avoid collisions
    // public collision() {
        
    //     let collisions, i,
    //         // Maximum distance from the origin before we consider collision
    //         distance = 24
    //         // Get the obstacles array from our world
    //         obstacles = virtualScene.world.getObstacles()
    //     // For each ray
    //     for (i = 0; i < this.rays.length; i += 1) {
    //         // We reset the raycaster to this direction
    //         this.caster.set(this.mesh.position, this.rays[i])
    //         // Test if we intersect with any obstacle mesh
    //         collisions = this.caster.intersectObjects(obstacles)
    //         // And disable that direction if we do
    //         if (collisions.length > 0 && collisions[0].distance <= distance) {
    //             // Yep, this.rays[i] gives us : 0 => up, 1 => up-left, 2 => left, ...
    //             if ((i === 0 || i === 1 || i === 7) && this.direction.z === 1) {
    //                 this.direction.setZ(0)
    //             } else if ((i === 3 || i === 4 || i === 5) && this.direction.z === -1) {
    //                 this.direction.setZ(0)
    //             }
    //             if ((i === 1 || i === 2 || i === 3) && this.direction.x === 1) {
    //                 this.direction.setX(0)
    //             } else if ((i === 5 || i === 6 || i === 7) && this.direction.x === -1) {
    //                 this.direction.setX(0)
    //             }
    //         }
    //     }
    // }
    // Update the direction of the current motion
    public setDirection(controls: any) {
        
        // Either left or right, and either up or down (no jump or dive (on the Y axis), so far ...)
        if(controls.up && this.vel < 1) this.vel += 0.1
        if(controls.down && this.vel > 0) this.vel -= 0.1
        if(controls.right && this.rudderdeg < 1) setInterval(() => this.rudderdeg += 0.00005, 25)
        if(controls.left && this.rudderdeg > -1) setInterval(() => this.rudderdeg -= 0.00005, 25)
        
        console.log("deg: " + this.rudderdeg)

        let x = 0,
            y = 0,
            z = controls.up ? 1 : 0
        //if(controls.left) this.direction.x//change direction vector3
        //else if(controls.right) //change direction vector3

        x = x*Math.cos(this.rudderdeg) - z*Math.sin(this.rudderdeg),
        z = x*Math.sin(this.rudderdeg) + z*Math.cos(this.rudderdeg)
        
        this.direction.set(x, y, z)

        //this.direction.subVectors( this.rudder, this.controls.target ).normalize()
        // update the transformation of the camera so it has an offset position to the current target
        //const camOffset = this.user.mesh.position.distanceTo(this.camera.position)
        //this.user.direction.subVectors( this.camera.position, this.controls.target )
        // this.user.direction.normalize().multiplyScalar( camOffset )
        // this.camera.position.copy( this.user.direction.add( this.controls.target ) )

        //x lewo
        //-x prawo
        //z przod
        //-z tył
        //this.direction.subVectors( this.camera.position, this.controls.target )
    }
    // Process the character motions
    public motion() {
        
        // Update the directions if we intersect with an obstacle
        // this.collision()
        // If we're not static
        if (this.direction.x !== 0 || this.direction.z !== 0) {
            // Rotate the character

            // this.rotate()

            // Move the character
            if (this.direction.x !== 0 || this.direction.z !== 0) this.move()
            return true
        }
    }
    // Rotate the character
    public rotate() {
        
        // Set the direction's angle, and the difference between it and our Object3D's current rotation
        let angle = Math.atan2(this.direction.x, this.direction.z),
            difference = angle - this.mesh.rotation.y
        // If we're doing more than a 180°
        //if (Math.abs(difference) > Math.PI) {
            // We proceed to a direct 360° rotation in the opposite way
            //if (difference > 0) {
            //    this.mesh.rotation.y += 2 * Math.PI
            //} else {
            //    this.mesh.rotation.y -= 2 * Math.PI
            //}
            // And we set a new smarter (because shorter) difference
            //difference = angle - this.mesh.rotation.y
            // In short : we make sure not to turn "left" to go "right"
        //}
        // Now if we haven't reached our target angle
        if (difference !== 0) {
            // We slightly get closer to it
            //this.mesh.rotation.y += Math.log(1 + difference) / 128
            this.mesh.rotation.y += difference / 128*1.5
        }
    }
    public move() {
        
        // We update our Object3D's position from our "dwwirecaaation"
        //let check = this.step
        //if(check<this.step)
        this.mesh.position.x += this.direction.x * ((this.direction.z === 0) ? Math.sqrt(this.vel) : this.vel / 1.5)//Math.sqrt(vel))
        this.mesh.position.z += this.direction.z * ((this.direction.x === 0) ? Math.sqrt(this.vel) : this.vel / 1.5)//Math.sqrt(vel))
        // Now let's use Sine and Cosine curves, using our "step" property ...
        this.step += 1 / 4

        this.mesh.position.x = 500
    }
}