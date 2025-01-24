import * as fs from 'fs';
import { readFileSync } from 'node:fs';


function run(args: string[]): void {
    try {
        if (args.length < 3) {
            usage()
            return
        }

        let image: Image;
        const inputFile: string = args[0];
        const outputFile: string = args[1];
        const filter: string = args[2];

        let fileContent: String = readFileSync(inputFile, 'utf-8');
        let lines: String[] = fileContent.toString().split("/n");
        let pixels: String[] = lines[0].split(" ")
        const filteredLines = pixels.filter(line => line.trim() !== '')

        let widthArray = pixels[0].toString().split("\n")
        let width: number = Number(widthArray[1])

        let heightArray = pixels[1].split("\n")
        let height: number = Number(heightArray[0])

        image = new Image(width, height)

        const singlePixels = filteredLines.slice(2);

        const grouped = groupIntoChunks(singlePixels, 3);

        if (grouped.length !== width * height) {
            throw new Error("The grouped array length doesn't match the image dimensions.");
        }
        for (let row = 0; row < height; row++) {
            for (let column = 0; column < width; column++) {
                let color = grouped[row * width + column]
                let tempColor = new Color(Number(color[0]), Number(color[1]), Number(color[2]))
                image.set(column, row, tempColor)
            }
        }              

        if (filter === "grayscale" || filter === "greyscale") {
            if (args.length != 3) {
                usage()
                return
            }
            for (let x: number = 0; x < image.getWidth(); x++) {
                for (let y: number = 0; y < image.getHeight(); y++) {
                    let curColor: Color = image.get(x, y);
                    let grayLevel: number = Math.floor((curColor.red + curColor.green + curColor.blue) / 3);
                    grayLevel = Math.max(0, Math.min(grayLevel, 255));

                    curColor.red = grayLevel;
				    curColor.green = grayLevel;
				    curColor.blue = grayLevel;
                }
            }
        }
        else if (filter === "invert") {
            if (args.length != 3) {
                usage()
                return
            }
            for (let x: number = 0; x < image.getWidth(); x++) {
                for (let y: number = 0; y < image.getHeight(); y++) {
                    let curColor: Color = image.get(x, y)

                    curColor.red = 255 - curColor.red;
                    curColor.green = 255 - curColor.green;
                    curColor.blue = 255 - curColor.blue;
                }
            }
        }
        else if (filter === "emboss") {
            if (args.length != 3) {
                usage()
                return
            }
            console.log("emboss")
            for (let x: number = image.getWidth() - 1; x >= 0; x--) {
                for (let y: number = image.getHeight() - 1; y >= 0; y--) {
                    let curColor: Color = image.get(x, y)

                    let diff: number = 0;
                    if (x > 0 && y > 0) {
                        let upLeftColor: Color = image.get(x - 1, y - 1);
                        if (Math.abs(curColor.red - upLeftColor.red) > Math.abs(diff)) {
                            diff = curColor.red - upLeftColor.red;
                        }
                        if (Math.abs(curColor.green - upLeftColor.green) > Math.abs(diff)) {
                            diff = curColor.green - upLeftColor.green;
                        }
                        if (Math.abs(curColor.blue - upLeftColor.blue) > Math.abs(diff)) {
                            diff = curColor.blue - upLeftColor.blue;
                        }
                    }
                    let grayLevel: number = (128 + diff);
                    grayLevel = Math.max(0, Math.min(grayLevel, 255));
                    
                    curColor.red = grayLevel;
                    curColor.green = grayLevel;
                    curColor.blue = grayLevel;
                }
            }

        }
        else if (filter === "motionblur") {
            if (args.length != 4) {
                usage()
                return
            }
            let lengthString: string = args[3];
            let length: number = Number(lengthString);
            if (length < 1) {
                return;
            }
            for (let x: number = 0; x < image.getWidth(); x++) {
                for (let y: number = 0; y < image.getHeight(); y++) {
                    let curColor: Color = image.get(x, y)

                    let maxX: number = Math.min(image.getWidth() - 1, x + length - 1);
                    for (let i: number = x + 1; i <= maxX; ++i) {
                        let tmpColor: Color = image.get(i, y);
                        curColor.red += tmpColor.red;
                        curColor.green += tmpColor.green;
                        curColor.blue += tmpColor.blue;
                    }

                    let delta: number = (maxX - x + 1);
                    curColor.red = Math.floor(curColor.red/delta);
                    curColor.green = Math.floor(curColor.green/delta);
                    curColor.blue = Math.floor(curColor.blue/delta);
                }
            }
        }
        else {
            usage()
        }
        
        // Write the PPM header
        const header = `P3\n${image.width} ${image.height}\n255`;

        let almostImageString: String[] = []
        almostImageString.push(header)
        // Write the pixel data
        for (let y: number = 0; y < image.getHeight(); y++) {
            let row: String[] = []
            for (let x: number = 0; x < image.getWidth(); x++) {
                //get the whole string array finished then write it all at once.
                const color = image.get(x, y)
                let tempString: string = `${x === 0 ? "" : " "}${color.red} ${color.green} ${color.blue}`
                row.push(`${x === 0 ? "" : " "}${color.red} ${color.green} ${color.blue}`);
        }
        const joinedRow: String = row.join("")
        almostImageString.push(joinedRow)
    }
        //add a newline to the end of the string**************
        almostImageString.push("")
        //join on the newline characters. **********
        const finalImageString: string = almostImageString.join("\n");
        fs.writeFileSync(outputFile, finalImageString)
        
    }
    catch (error) {
        console.log(error)
    }
}

let usage = () => {
    console.log("USAGE: java ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}")
}
class Color {
    constructor(
        public red: number,
        public green: number,
        public blue: number
    ) {}
}

class Image {
    public pixels: Color[][]
    public width: number
    public height: number

    constructor(
        width: number,
        height: number,
        pixels = [width][height]
    ) {
        this.pixels = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => new Color(0, 0, 0))
        );
        this.width = width
        this.height = height
    }
    getWidth() {
        return this.width
    }
    getHeight() {
        return this.height
    }
    set(x: number, y: number, color: Color) {
        this.pixels[y][x] = color
    }
    get(x: number, y: number): Color {
        return this.pixels[y][x]
    }
}

function groupIntoChunks<T>(array: T[], chunkSize: number): T[][] {
    const result: T[][] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }

    return result;
}

run(process.argv.slice(2));