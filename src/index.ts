import * as _drawing from './drawing';
import { V2, Color, TAU, lerp, ilerp, clamp01, randomFloat } from './space';

import { Context } from './context';

const CTX = new Context();

class Agents {
    // Synchronized such that each index is for one agent
    pos: V2.t[]
    vel: V2.t[]
    facing: V2.t[]
    maxSpeed: number[]
    tempGridCellId: number[]
    interestMap: Uint8Array
    dangerMap: Uint8Array

    // One overall, not for each agent
    unitDirections: V2.t[]

    constructor(dims: V2.t) {
        const count = 500;

        this.pos = new Array(count);
        this.vel = new Array(count);
        this.facing = new Array(count);
        this.maxSpeed = new Array(count);
        this.tempGridCellId = new Array(count);

        const interestMapResolution = 8;
        this.interestMap = new Uint8Array(count * interestMapResolution);
        this.dangerMap = new Uint8Array(count * interestMapResolution);
        this.unitDirections = new Array(interestMapResolution);
        for (let i = 0; i < interestMapResolution; i++) {
            const angle = i/interestMapResolution * TAU;
            this.unitDirections[i] = V2.fromValues(Math.cos(angle), Math.sin(angle));
        }

        for (let i = 0; i < count; i++) {
            this.pos[i] = V2.fromValues(randomFloat(0,dims[0]), randomFloat(0,dims[1]));
            this.vel[i] = V2.fromValues(0,0);
            const dir = randomFloat(0, TAU);
            this.facing[i] = V2.fromValues(Math.cos(dir),Math.sin(dir));
            this.maxSpeed[i] = randomFloat(100, 500);
            this.tempGridCellId[i] = -1;
        }
    }

    get count() {
        return this.pos.length;
    }
}

class OccupancyGrid {
    width: number = 10
    height: number = 10
    maxAgentsPerCell: number = 10

    grid: Array<Array<number>>

    constructor() {
        this.grid = new Array(this.width * this.height);
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] = [];
        }
    }

    getCellIdx(cellX: number, cellY: number): number {
        const cellIdx = cellX + cellY * this.width;
        return cellIdx;
    }

    getCell(cellX: number, cellY: number): number[] | null {
        const cellIdx = this.getCellIdx(cellX, cellY);
        const val = this.grid[cellIdx];
        if (val) {
            return val;
        } else {
            return null;
        }
    }

    addAgent(cellX: number, cellY: number, agentId: number): number {
        const cellIdx = this.getCellIdx(cellX, cellY);
        const agents = this.grid[cellIdx];
        if (agents.length < this.maxAgentsPerCell) {
            agents.push(agentId);
        }
        return cellIdx;
    }

    clear(): void {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i].length = 0;
        }
    }
}


const agentState = new Agents(V2.fromValues(1000,1000));
const occupancyGrid = new OccupancyGrid();

let xxx = false;

function renderLoop(elapsed: number) {
    const D2D = CTX.D2D;
    const W2D = CTX.W2D;
    const UI = CTX.UI;
    CTX.onFrameStart(elapsed * 0.001);
    const dims = CTX.rendererGL.dims;
    const dt = CTX.dt;
    D2D.clearScreen();

    // UI.checkboxBare('XXX', 500, 500, false, 20);
    D2D.setStrokeColor(0xFFFFFFFF);
    // D2D.strokeRoundedRect(500, 500, 15, 15, 3);
    // D2D.strokeCenterRect(500, 500, 100, 100);
    // D2D.strokeRect(500, 500, 100, 100);

    
    W2D.setStrokeColor(0xFFFFFFFF);
    {
        const mousePos = CTX.UI.getMousePosLocal(CTX.D2D.worldToLocal);
        const target = V2.fromValues(mousePos[0], dims[1] - mousePos[1]);
        W2D.strokeCrosshair(target[0], target[1]);

        W2D.setStrokeThickness(1);
        W2D.setStrokeColor(0xFFFF00FF);
        const count = agentState.count;
        const pos = agentState.pos;
        const tempGridCellId = agentState.tempGridCellId;

        const cellW = dims[0]/(occupancyGrid.width-1);
        const cellH = dims[1]/(occupancyGrid.height-1);
        // Populate grid cells with agents:
        for (let i = 0; i < count; i++) {
            const px = pos[i][0];
            const py = pos[i][1];
            const cellX = Math.floor(px/dims[0] * (occupancyGrid.width-1) + 0.5);
            const cellY = Math.floor(py/dims[1] * (occupancyGrid.height-1) + 0.5);
            if (cellX < 0 || cellY < 0 ||  cellX >= occupancyGrid.width || cellY >= occupancyGrid.height) continue;
            tempGridCellId[i] = occupancyGrid.addAgent(cellX, cellY, i);
            // Draw cell where agent is:
            // W2D.strokeCenterRect(cellX * cellW, cellY * cellH, cellW, cellH);
        }

        // {// Draw Grid
        //     W2D.setStrokeColor(0xFF0000FF);
        //     for (let x = 0; x < occupancyGrid.width; x++) {
        //         for (let y = 0; y < occupancyGrid.height; y++) {
        //             // W2D.strokeCenterRect(x * cellW, y * cellH, cellW, cellH);
        //         }            
        //     }
        // }

        // { // Draw cell mouse is in
        //     W2D.setStrokeColor(0x00FF00FF);
        //     W2D.setFillColor(0x00FF00FF);
        //     const px = target[0];
        //     const py = target[1];
        //     const cellX = Math.floor(px/dims[0] * (occupancyGrid.width-1) + 0.5);
        //     const cellY = Math.floor(py/dims[1] * (occupancyGrid.height-1) + 0.5);
        //     W2D.strokeCenterRect(cellX * cellW, cellY * cellH, cellW, cellH);
        //     W2D.fillText(px+30, py, `${cellX} - ${cellY}`)
        // }


        const radius = 50;
        const sqrRadius = radius * radius;
        
        for (let i = 0; i < count; i++) {
            const currPos = pos[i];
            // { // Draw close agents (naive)
            //     W2D.setStrokeColor(0xFF0000FF);
            //     for (let j = 0; j < count; j++) {
            //         const cmpPos = pos[j];
            //         if (V2.sqrDist(currPos, cmpPos) < sqrRadius) {
            //             W2D.strokeLine(currPos[0], currPos[1], cmpPos[0], cmpPos[1]);
            //         }
            //     }
            // }

            // { // Draw close agents (grid)
            //     W2D.setStrokeColor(0x00FF00FF);
            //     const px = pos[i][0];
            //     const py = pos[i][1];
            //     const cellX = Math.floor(px/dims[0] * (occupancyGrid.width-1) + 0.5);
            //     const cellY = Math.floor(py/dims[1] * (occupancyGrid.height-1) + 0.5);
            //     for (let x = cellX-1; x <= cellX + 1; x++) {
            //         for (let y = cellY-1; y <= cellY + 1; y++) {
            //             const agentIDs = occupancyGrid.getCell(x, y);
            //             if (agentIDs === null) { continue; }
            //             for (let agentIdx = 0; agentIdx < agentIDs.length; agentIdx++) {
            //                 const agentId = agentIDs[agentIdx];
            //                 if (agentId === i) { continue; }
            //                 const cmpPos = pos[agentId];
            //                 if (V2.sqrDist(currPos, cmpPos) < sqrRadius) {
            //                     W2D.strokeLine(currPos[0], currPos[1], cmpPos[0], cmpPos[1]);
            //                 }
            //             }
            //         }   
            //     }
            // }
        }

        simulateAgents(CTX, agentState, target);
        drawAgents(CTX, agentState);

    }
    occupancyGrid.clear();
    CTX.render();
    CTX.onFrameEnd();
    CTX.D2DGPU.resetBuffer();
    window.requestAnimationFrame(renderLoop);
}
window.requestAnimationFrame(renderLoop);

function simulateAgents(ctx: Context, agentState: Agents, target: V2.t) {
    const dims = ctx.rendererCanvas.dims;
    const dt = ctx.dt;
    const W2D = ctx.W2D;
    const count = agentState.count;
    const pos = agentState.pos;
    const vel = agentState.vel;
    const facing = agentState.facing;
    const maxSpeed = agentState.maxSpeed;
    for (let i = 0; i< count; i++) {
        // Move agent based on velocity
        pos[i] = V2.add(pos[i], V2.scale(vel[i], dt));
        const len = V2.length(vel[i]);
        if (len > 0) {
            // Normalize; update facing direction to point in velocity direction
            facing[i] = V2.scale(vel[i], 1/len);
        }
    
        // Calculating the interest map (how good is it to move in a given direction)
        const agentToTargetNorm = V2.sub(target,pos[i]);
        V2.normalize(agentToTargetNorm);
        const resolution = agentState.unitDirections.length;
        // W2D.setStrokeColor(0x00FF00FF);
        for (let j = 0; j < resolution; j++) {
            const dir = agentState.unitDirections[j];
            const goodness = clamp01(V2.dot(agentToTargetNorm, dir));
            agentState.interestMap[resolution*i + j] = (goodness * 255)|0;
            const visScale = goodness * 100;
            // W2D.strokeLine(pos[i][0], pos[i][1], pos[i][0] + dir[0] * visScale, pos[i][1] + dir[1] * visScale);
        }
        
        // Calculate the danger map (how bad it is to move in a given direction)
        // W2D.setStrokeColor(0xFF0000FF);
        for (let j = 0; j < resolution; j++) {
            const dir = agentState.unitDirections[j];
            let badness = 0;
            const threshold = 150;
            // Naive method:
            // for (let k = 0; k < count; k++) {
            //     if (i === k) { continue; }
            //     const obstaclePos = pos[k];
            //     let agentToObstacleNorm = V2.sub(obstaclePos, pos[i]);
            //     const dist = V2.length(agentToObstacleNorm);
            //     agentToObstacleNorm = V2.scale(agentToObstacleNorm, 1/dist);
            //     const dP = V2.dot(dir, agentToObstacleNorm);
            //     badness += dP * Math.max(0, (threshold - dist)/threshold);
            // }

            const px = pos[i][0];
            const py = pos[i][1];
            const cellX = Math.floor(px/dims[0] * (occupancyGrid.width-1) + 0.5);
            const cellY = Math.floor(py/dims[1] * (occupancyGrid.height-1) + 0.5);
            const currPos = pos[i];
            for (let x = cellX-1; x <= cellX + 1; x++) {
                for (let y = cellY-1; y <= cellY + 1; y++) {
                    const agentIDs = occupancyGrid.getCell(x, y);
                    if (agentIDs === null) { continue; }
                    for (let agentIdx = 0; agentIdx < agentIDs.length; agentIdx++) {
                        const agentId = agentIDs[agentIdx];
                        if (agentId === i) { continue; }
                        const obstaclePos = pos[agentId];
                        // if (V2.sqrDist(currPos, obstaclePos) < threshold) {
                        //     W2D.strokeLine(currPos[0], currPos[1], obstaclePos[0], obstaclePos[1]);
                        // }
                        let agentToObstacleNorm = V2.sub(obstaclePos, pos[i]);
                        const dist = V2.length(agentToObstacleNorm);
                        agentToObstacleNorm = V2.scale(agentToObstacleNorm, 1/dist);
                        const dP = V2.dot(dir, agentToObstacleNorm);
                        badness += dP * Math.max(0, (threshold - dist)/threshold);
                    }
                }   
            }

            badness = clamp01(badness);
            agentState.dangerMap[resolution*i + j] = (badness * 255)|0;
            const visScale = badness * 100;
            // W2D.strokeLine(pos[i][0], pos[i][1], pos[i][0] + dir[0] * visScale, pos[i][1] + dir[1] * visScale);
        }

        // W2D.setStrokeColor(0x0000FFFF);
        let x = 0;
        let y = 0;
        for (let j = 0; j < resolution; j++) {
            const dir = agentState.unitDirections[j];
            const goodness = agentState.interestMap[resolution*i + j];
            const badness = agentState.dangerMap[resolution*i + j];
            const actual = Math.max(0, goodness - badness)/255;
            x += dir[0] * actual;
            y += dir[1] * actual;
        }
        const goalNorm = V2.fromValues(x, y); V2.normalize(goalNorm);
        const visScale = 100;
        // W2D.strokeLine(pos[i][0], pos[i][1], pos[i][0] + goalNorm[0] * visScale, pos[i][1] + goalNorm[1] * visScale);

        // const distToTarget = V2.length(agentToTarget);
        const speed = maxSpeed[i];//lerp(0, maxSpeed[i], clamp01(ilerp(50, 200, distToTarget)));
        const desiredVel = V2.scale(goalNorm, speed);
        const steering = V2.sub(desiredVel, vel[i]); // this is still a velocity
        // // Force m/s/s
        vel[i] = V2.add(vel[i], V2.scale(steering, dt));


        // const agentToTarget = V2.sub(target,pos[i]);
        // const distToTarget = V2.length(agentToTarget);
        // const speed = lerp(0, maxSpeed[i], clamp01(ilerp(50, 200, distToTarget)));
        // const desiredVel = V2.scale(V2.normalized(agentToTarget), speed);
        // const steering = V2.sub(desiredVel, vel[i]); // this is still a velocity
        // // Force m/s/s
        // vel[i] = V2.add(vel[i], V2.scale(steering, dt));
    }
}

function drawAgents(ctx: Context, agentState: Agents): void {
    const W2D = ctx.W2D;
    W2D.setStrokeColor(0xFFFFFFFF);
    W2D.setStrokeThickness(1);
    const count = agentState.count;
    for (let i = 0; i < count; i++) {
        const pos = agentState.pos[i];
        const facing = agentState.facing[i];
        const length = 50;
        const eyeSize = 5;
        const eyeOffset = 5;
        const pupilSize = 2;
        const perp = V2.perp(facing);
        const eyeAngle = ctx.elapsed;
        const pupilOffset = V2.scale(V2.fromValues(Math.cos(eyeAngle), Math.sin(eyeAngle)), 3);
    
        W2D.strokeLine(pos[0], pos[1], pos[0] + -facing[0]*length, pos[1] + -facing[1]*length);
        W2D.setFillColor(0xFFFFFFFF);
        W2D.fillCircle(pos[0] + perp[0] * eyeOffset, pos[1] + perp[1] * eyeOffset, eyeSize);
        W2D.fillCircle(pos[0] - perp[0] * eyeOffset, pos[1] - perp[1] * eyeOffset, eyeSize);
        W2D.setFillColor(0x000000FF);
        W2D.fillCircle(pos[0] + perp[0] * eyeOffset + pupilOffset[0], 
                       pos[1] + perp[1] * eyeOffset + pupilOffset[1], pupilSize);
        W2D.fillCircle(pos[0] - perp[0] * eyeOffset + pupilOffset[0], 
                       pos[1] - perp[1] * eyeOffset + pupilOffset[1], pupilSize);
    }
}