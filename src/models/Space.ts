import THREE, { Object3D } from "three" //, Vector2, Vector3, Raycaster, Mesh

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export class Space
{
    public mesh: Object3D
    // private obj

    constructor() {
            
            // Set the different geometries composing the room
            // let ground = new THREE.PlaneGeometry(9000, 9000),
            //     height = 128,
            //     walls = [
            //         new THREE.PlaneGeometry(ground.height, height),
            //         new THREE.PlaneGeometry(ground.width, height),
            //         new THREE.PlaneGeometry(ground.height, height),
            //         new THREE.PlaneGeometry(ground.width, height)
            //     ],
            //     obstacles = [],
            //     material = new THREE.MeshToonMaterial(args),
            //     i
            // Set the "world" modelisation object
            this.mesh = new Object3D()
    
            // 3D Model
            const gltfLoader = new GLTFLoader()
            const coliseum = './src/assets/models/Coliseum/Coliseum.gltf'
            gltfLoader.load(coliseum, (gltf) => {
                const obj = gltf.scene
                obj.scale.set(12, 9, 12)
                obj.position.y = -695
                obj.position.x = -720
                obj.position.z = 300
                this.mesh.add(obj)
            },
                (xhr) => {
                    console.log( coliseum + ' ' + (xhr.loaded / xhr.total * 100) + '% loaded')
                },
                (error) => {
                    console.log(error)
                }
            )
    
            // Set and add the walls
            // this.walls = []
            // for (i = 0; i < walls.length; i += 1) {
            //     this.walls[i] = new THREE.Mesh(walls[i], material)
            //     this.walls[i].position.y = height / 2
            //     this.mesh.add(this.walls[i])
            // }
            // this.walls[0].rotation.y = -Math.PI / 2
            // this.walls[0].position.x = ground.width / 2
            // this.walls[1].rotation.y = Math.PI
            // this.walls[1].position.z = ground.height / 2
            // this.walls[2].rotation.y = Math.PI / 2
            // this.walls[2].position.x = -ground.width / 2
            // this.walls[3].position.z = -ground.height / 2
            // // Set and add the obstacles
            // this.obstacles = []
            // for (i = 0; i < obstacles.length; i += 1) {
            //     this.obstacles[i] = new THREE.Mesh(obstacles[i], material)
            //     this.mesh.add(this.obstacles[i])
            // }
        }
        // Set obstacles to interact with
        // public getObstacles() {
            
        //     return this.obstacles.concat(this.walls)
        // }
}