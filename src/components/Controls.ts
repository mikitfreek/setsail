export class Controls
{
    private controls: any

    constructor() {
        this.controls = {
            left: false,
            up: false,
            right: false,
            down: false
        };
    }

    public keyDown(e: any, user: any) {
        let prevent = true;
        // Update the state of the attached control to "true"
        switch (e.key) { //keyCode) { //e code
            case 'w':
                this.controls.up = true;
                break;
            case 's':
                this.controls.down = true;
                break;
            case 'a':
                this.controls.left = true;
                break;
            case 'd':
                this.controls.right = true;
                break;
            default:
                prevent = false;
        }
        // Avoid the browser to react unexpectedly
        if (prevent) {
            e.preventDefault();
        } else {
            return;
        }
        // Update the character's direction
        user.setDirection(this.controls);
    }

    public keyUp(e: any, user: any) {
        let prevent = true;
        // Update the state of the attached control to "false"
        switch (e.key) {
            case 'w':
                this.controls.up = false;
                break;
            case 's':
                this.controls.down = false;
                break;
            case 'a':
                this.controls.left = false;
                break;
            case 'd':
                this.controls.right = false;
                break;
            default:
                prevent = false;
        }
        // Avoid the browser to react unexpectedly
        if (prevent) {
            e.preventDefault();
        } else {
            return;
        }
        // Update the character's direction
        user.setDirection(this.controls);
    }
}