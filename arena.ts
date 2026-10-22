// Supplied world. Learner Functions are authored separately and are never replaced here.
//% color=#2479a5 icon="\uf085" block="Robot Arena" weight=90
namespace arenaLab {
    export enum OrderMode {
        //% block="hold"
        Hold = 1,
        //% block="engage"
        Engage = 2,
        //% block="withdraw"
        Withdraw = 3,
        //% block="protect"
        Protect = 4
    }
    let planHandler: (robot: number) => void = null
    let requestActor = -1
    let requestOpen = false
    let requestUsed = false
    let requestMode = 1
    let requestDiagnostic = ""
    let requestDuplicates = 0
    let sensorShield = 0
    let sensorDistance = 9999
    let sensorGuard = false
    let requestSerial = 0
    let behaviorProof = [false, false, false, false, false, false]
    // ROBOT_TRACE_HOOK

    //% blockId=arena_on_plan block="when robot needs a plan $robot" draggableParameters=reporter
    //% weight=100
    export function onPlan(handler: (robot: number) => void): void {
        planHandler = handler
        behaviorProof = [false, false, false, false, false, false]
    }
    //% blockId=arena_issue_order block="give $robot order $mode" weight=90
    export function issueOrder(robot: number, mode: OrderMode): void {
        if (!requestOpen) return
        if (requestUsed) {
            requestDuplicates++
            return
        }
        requestUsed = true
        if (robot != requestActor) requestDiagnostic = "ACTOR_MISMATCH"
        else if (mode < 1 || mode > 4 || mode != Math.floor(mode)) requestDiagnostic = "BAD_MODE"
        else {
            requestMode = mode
            requestDiagnostic = "ACCEPTED"
        }
    }
    //% blockId=arena_shield_points block="shield points of $robot" weight=80
    export function shieldPoints(robot: number): number {
        return requestOpen && robot == requestActor ? sensorShield : 0
    }
    //% blockId=arena_enemy_distance block="enemy distance from $robot" weight=70
    export function enemyDistance(robot: number): number {
        return requestOpen && robot == requestActor ? sensorDistance : 9999
    }
    //% blockId=arena_is_guard block="is $robot a Guard" weight=60
    export function isGuard(robot: number): boolean {
        return requestOpen && robot == requestActor && sensorGuard
    }
    function request(id: number, shield: number, distance: number, guard: boolean): number {
        requestSerial++
        requestActor = id
        sensorShield = shield
        sensorDistance = distance
        sensorGuard = guard
        requestUsed = false
        requestMode = 1
        requestDuplicates = 0
        requestDiagnostic = planHandler ? "MISSING_ORDER" : "UNREGISTERED"
        requestOpen = true
        if (planHandler) planHandler(id)
        requestOpen = false
        requestActor = -1
        return requestDiagnostic == "ACCEPTED" ? requestMode : 1
    }

    class Bot {
        id: number
        side: number
        kind: number
        x: number
        y: number
        nx: number
        ny: number
        hp: number
        shield: number
        maxHp: number
        maxShield: number
        speed: number
        aimTicks: number
        regenDelay: number
        regenRate: number
        lastHit: number
        mode: number
        target: number
        ally: number
        aim: number
        nextShot: number
        closing: boolean
        moving: boolean
        diagnostic: string
        duplicates: number
        status: string
        retreatStart: number
        retreatLock: number
        shot: number
        hit: number
        path: number[]
        pathX: number
        pathY: number
        constructor(id: number, side: number, kind: number, x: number, y: number, module: number) {
            this.id = id; this.side = side; this.kind = kind; this.x = x; this.y = y
            this.nx = x; this.ny = y
            this.maxHp = baseHp[kind]
            this.maxShield = baseShield[kind]
            this.speed = baseSpeed[kind]
            this.aimTicks = baseAimTicks[kind]
            this.regenDelay = 3000; this.regenRate = 6
            if (module >= 0) {
                let rank = moduleRanks[module]
                if (rank > 0) {
                    if (module == 0) { this.maxHp += rank == 1 ? 22 : 36; this.speed -= rank == 1 ? 3 : 5 }
                    if (module == 1) { this.speed += rank == 1 ? 6 : 10; this.maxShield -= rank == 1 ? 8 : 14 }
                    if (module == 2) { this.aimTicks -= rank == 1 ? 2 : 3; this.speed -= rank == 1 ? 3 : 5 }
                    if (module == 3) { this.maxShield += rank == 1 ? 16 : 28; this.regenDelay = rank == 1 ? 2500 : 2000; this.regenRate = rank == 1 ? 6 : 8 }
                }
            }
            this.hp = this.maxHp; this.shield = this.maxShield; this.lastHit = -1
            this.mode = 1; this.target = -1; this.ally = -1; this.aim = 0; this.nextShot = 0
            this.closing = true; this.moving = false; this.diagnostic = ""; this.duplicates = 0
            this.status = "READY"; this.retreatStart = -1; this.retreatLock = 0
            this.shot = 0; this.hit = 0; this.path = []; this.pathX = -999; this.pathY = -999
        }
    }
    const classNames = ["Scout", "Rifle", "Guard", "Lancer"]
    const baseHp = [60, 90, 125, 58]
    const baseShield = [18, 25, 45, 16]
    const baseSpeed = [42, 30, 22, 25]
    const baseAimTicks = [4, 9, 12, 18]
    const orderNames = ["", "HOLD", "ENGAGE", "WITHDRAW", "PROTECT"]
    const moduleNames = ["Plating", "Thrusters", "Optics", "Shield Cell"]
    const maxRanges = [34, 60, 42, 102]
    const preferred = [24, 44, 30, 81]
    const cooldowns = [11, 15, 22, 28]
    const damage = [9, 14, 10, 32]
    const battleNames = ["First Deployment", "Partner Under Fire", "Two Fronts", "Too Close to the Marksman", "Return to the Field", "Final Formation"]
    const battleEnemies = [[0], [1], [2, 0], [3, 0], [2, 0], [1, 3]]
    const friendlySpawns = [[[24, 64]], [[24, 44], [24, 84]], [[28, 44], [28, 88]], [[22, 40], [22, 92]], [[22, 36], [22, 98]], [[24, 36], [24, 96]]]
    const enemySpawns = [[[126, 64]], [[123, 64]], [[127, 48], [127, 86]], [[90, 40], [136, 92]], [[138, 36], [138, 98]], [[136, 36], [84, 96]]]
    let bots: Bot[] = []
    let walls: number[][] = []
    let tick = 0
    let started = false
    let isReferenceDemo = false
    let screenId = "BOOT"
    let cursor = 0
    let battle = 0
    let lesson = 1
    let policyTarget = 1
    let inspected = 0
    let bay = 0
    let garageBack = "HUB"
    let countdown = 0
    let scrimmage = false
    let outcome = ""
    let resultPaid = false
    let resultGrant = 0
    let resultFirst = false
    let notice = ""
    let noticeTicks = 0
    let log: string[] = []
    let reviewRow = 0
    let trialRows: string[] = []
    let trialModes: number[] = []
    let trialExpected: number[] = []
    let trialDescriptors: number[][] = []
    let trialVerdict = "NOT RUN"
    let trialTargetLabel = "No target selected"
    let trialIndex = 0
    let trialAnimation = 0
    let trialOrigin = "TRAIN_PREVIEW"
    let saveSequence = 0
    let highestCleared = 0
    let wallet = 45
    let moduleRanks = [0, 0, 0, 0]
    let bayClasses = [1, 0]
    let bayModules = [-1, -1]
    let wins = [0, 0, 0, 0, 0, 0]
    let losses = [0, 0, 0, 0, 0, 0]
    let draws = [0, 0, 0, 0, 0, 0]
    let lastOutcomes = [0, 0, 0, 0, 0, 0]
    let resetEpoch = 0
    let saveWarning = ""
    let saveDirty = false
    function distance(x: number, y: number, xx: number, yy: number): number {
        return Math.sqrt((x - xx) * (x - xx) + (y - yy) * (y - yy))
    }
    function alive(b: Bot): boolean { return b && b.hp > 0 }
    function byId(id: number): Bot {
        for (let b of bots) if (b.id == id) return b
        return null
    }
    function nearest(b: Bot): Bot {
        let found: Bot = null
        let best = 99999
        for (let e of bots) if (alive(e) && e.side != b.side) {
            let d = distance(b.x, b.y, e.x, e.y)
            if (d < best - 0.000001) { best = d; found = e }
        }
        return found
    }
    function weakestAlly(b: Bot): Bot {
        let found: Bot = null
        let fraction = 2
        for (let a of bots) if (alive(a) && a.side == b.side && a.id != b.id) {
            let f = (a.hp + a.shield) / (a.maxHp + a.maxShield)
            if (f < fraction - 0.000001) { fraction = f; found = a }
        }
        return found
    }
    function attackTarget(b: Bot): Bot {
        let found: Bot = null
        let best = -99999
        for (let e of bots) if (alive(e) && e.side != b.side) {
            let t = byId(e.target)
            let score = 30 * (1 - e.hp / e.maxHp) - 0.2 * distance(b.x, b.y, e.x, e.y) + (e.id == b.target ? 15 : 0)
            if ((e.mode == 2 || e.mode == 4) && alive(t) && t.side == b.side && !e.moving) score += 12
            if (score > best + 0.000000001) { best = score; found = e }
        }
        return found
    }
    function protectThreat(a: Bot, side: number): Bot {
        let found: Bot = null
        let best = 36.0000001
        for (let e of bots) if (alive(e) && e.side != side) {
            let d = distance(a.x, a.y, e.x, e.y)
            if (d < best - 0.000000001) { best = d; found = e }
        }
        return found
    }
    function enemyPolicy(b: Bot): number {
        let e = nearest(b)
        if (!e) return 1
        let d = distance(b.x, b.y, e.x, e.y)
        let duration = b.kind == 0 ? 16 : b.kind == 1 ? 20 : 15
        let release = b.kind == 0 ? 34 : b.kind == 1 ? 40 : 44
        if (b.kind != 2 && b.retreatStart >= 0) {
            if (tick - b.retreatStart < duration && d < release) return 3
            b.retreatStart = -1
            b.retreatLock = tick + (b.kind == 0 ? 24 : b.kind == 1 ? 30 : 20)
            return 2
        }
        if (b.kind == 2) {
            let a = weakestAlly(b)
            return a && (a.hp + a.shield) / (a.maxHp + a.maxShield) <= 0.65 && protectThreat(a, b.side) ? 4 : 2
        }
        let trigger = b.kind == 0 ? b.shield / b.maxShield <= 0.25 && d <= 20 : b.kind == 1 ? b.hp / b.maxHp <= 0.3 && d <= 24 && !!weakestAlly(b) : d <= 36
        if (tick >= b.retreatLock && trigger) { b.retreatStart = tick; return 3 }
        return 2
    }
    function appendLog(s: string): void {
        log.push(s)
        if (log.length > 70) log.shift()
    }
    function plans(): void {
        // Capture all proposals and bindings before committing any, preserving one shared boundary.
        let modes: number[] = []; let targets: number[] = []; let allies: number[] = []
        let diags: string[] = []; let duplicates: number[] = []
        for (let b of bots) {
            let m = 1
            let diag = "ENEMY POLICY"
            let dup = 0
            if (alive(b)) {
                if (b.side == 0) {
                    let e = nearest(b)
                    m = request(b.id, b.shield, e ? distance(b.x, b.y, e.x, e.y) : 9999, b.kind == 2)
                    diag = requestDiagnostic; dup = requestDuplicates
                } else m = enemyPolicy(b)
            }
            let target: Bot = null
            let ally: Bot = null
            if (m == 2) target = attackTarget(b)
            if (m == 3) target = nearest(b)
            if (m == 4) { ally = weakestAlly(b); if (ally) target = protectThreat(ally, b.side) }
            modes.push(m); targets.push(target ? target.id : -1); allies.push(ally ? ally.id : -1)
            diags.push(diag); duplicates.push(dup)
        }
        for (let i = 0; i < bots.length; i++) {
            let b = bots[i]
            if (!alive(b)) continue
            if (!((b.mode == 2 || b.mode == 4) && (modes[i] == 2 || modes[i] == 4) && b.target == targets[i] && b.ally == allies[i])) b.aim = 0
            if (b.target != targets[i]) b.closing = true
            b.mode = modes[i]; b.target = targets[i]; b.ally = allies[i]; b.diagnostic = diags[i]; b.duplicates = duplicates[i]
            b.path = []
            if (b.side == 0) appendLog("t" + tick + " #" + b.id + " " + b.diagnostic + (b.duplicates ? "+DUPLICATE" : "") + " " + orderNames[b.mode])
        }
    }
    // Segment clipping. Movement uses the open interior of expanded blockers;
    // LOS uses the closed original rectangle, so a tangent shot is blocked.
    function crosses(x: number, y: number, xx: number, yy: number, r: number[], pad: number, closed: boolean): boolean {
        let low = 0
        let high = 1
        for (let axis = 0; axis < 2; axis++) {
            let a = axis == 0 ? x : y
            let delta = axis == 0 ? xx - x : yy - y
            let min = r[axis] - pad + (closed ? 0 : 0.00001)
            let max = r[axis + 2] + pad - (closed ? 0 : 0.00001)
            if (Math.abs(delta) < 0.000001) {
                if (a < min || a > max) return false
            } else {
                let one = (min - a) / delta
                let two = (max - a) / delta
                low = Math.max(low, Math.min(one, two))
                high = Math.min(high, Math.max(one, two))
                if (low > high) return false
            }
        }
        return high >= 0 && low <= 1
    }
    function clear(x: number, y: number, xx: number, yy: number, movement: boolean): boolean {
        if (movement && (xx < 8 || xx > 152 || yy < 20 || yy > 112)) return false
        for (let r of walls) if (crosses(x, y, xx, yy, r, movement ? 5 : 0, !movement)) return false
        return true
    }
    function gridX(cell: number): number { return 8 + (cell % 19) * 8 }
    function gridY(cell: number): number { return 20 + Math.idiv(cell, 19) * 8 }
    function gridNear(x: number, y: number): number {
        let cell = -1
        let best = 999999
        for (let n = 0; n < 228; n++) if (clear(gridX(n), gridY(n), gridX(n), gridY(n), true)) {
            let d = distance(x, y, gridX(n), gridY(n))
            if (d < best - 0.000001) { best = d; cell = n }
        }
        return cell
    }
    function findPath(b: Bot, x: number, y: number): void {
        b.path = []; b.pathX = x; b.pathY = y
        let start = gridNear(b.x, b.y)
        let goal = gridNear(x, y)
        if (start < 0 || goal < 0) return
        let parent: number[] = []
        for (let i = 0; i < 228; i++) parent.push(-2)
        let queue = [start]
        parent[start] = -1
        let head = 0
        while (head < queue.length && parent[goal] == -2) {
            let p = queue[head++]
            let neighbors = [p - 19, p - 1, p + 1, p + 19]
            for (let n of neighbors) {
                if (n < 0 || n >= 228 || parent[n] != -2) continue
                if (Math.abs((p % 19) - (n % 19)) > 1) continue
                if (!clear(gridX(p), gridY(p), gridX(n), gridY(n), true)) continue
                parent[n] = p; queue.push(n)
            }
        }
        if (parent[goal] == -2) return
        let reverse: number[] = []
        let c = goal
        while (c >= 0) { reverse.push(c); c = parent[c] }
        for (let i = reverse.length - 1; i >= 0; i--) b.path.push(reverse[i])
        while (b.path.length > 1 && clear(b.x, b.y, gridX(b.path[1]), gridY(b.path[1]), true)) b.path.shift()
    }
    function approach(b: Bot, x: number, y: number, stop: number): void {
        let d = distance(b.x, b.y, x, y)
        if (d <= stop) return
        let gx = x
        let gy = y
        if (!clear(b.x, b.y, x, y, true)) {
            if (!b.path.length || distance(x, y, b.pathX, b.pathY) >= 8 || !clear(b.x, b.y, gridX(b.path[0]), gridY(b.path[0]), true)) findPath(b, x, y)
            while (b.path.length && distance(b.x, b.y, gridX(b.path[0]), gridY(b.path[0])) < 0.5) b.path.shift()
            if (!b.path.length) { b.status = "PATH BLOCKED"; return }
            gx = gridX(b.path[0]); gy = gridY(b.path[0]); stop = 0
        }
        d = distance(b.x, b.y, gx, gy)
        if (d < 0.000001) return
        let step = Math.min(b.speed * 0.05, Math.max(0, d - stop))
        b.nx = b.x + (gx - b.x) / d * step
        b.ny = b.y + (gy - b.y) / d * step
    }
    function withdraw(b: Bot, e: Bot): void {
        let dx = b.x - e.x; let dy = b.y - e.y
        let len = Math.sqrt(dx * dx + dy * dy)
        if (len < 0.00001) { dx = b.id % 2 == 0 ? 1 : -1; dy = 0; len = 1 }
        dx /= len; dy /= len
        // Ordered headings: out, +45, -45, +90, -90, +135, -135, opposite.
        let cs = [1, 0.70710678, 0.70710678, 0, 0, -0.70710678, -0.70710678, -1]
        let sn = [0, 0.70710678, -0.70710678, 1, -1, 0.70710678, -0.70710678, 0]
        let best = -9999
        let step = b.speed * 0.05
        for (let h = 0; h < 8; h++) {
            let x = b.x + (dx * cs[h] - dy * sn[h]) * step
            let y = b.y + (dx * sn[h] + dy * cs[h]) * step
            if (!clear(b.x, b.y, x, y, true)) continue
            let score = distance(x, y, e.x, e.y) - len - 0.05 * distance(x, y, 80, 66)
            if (score > best + 0.000001) { best = score; b.nx = x; b.ny = y }
        }
        if (best == -9999) b.status = "TRAPPED"
    }
    function movement(b: Bot): void {
        b.nx = b.x; b.ny = b.y; b.status = orderNames[b.mode]
        if (!alive(b)) { b.status = "DISABLED"; return }
        let e = byId(b.target)
        if (b.mode == 1) return
        if (b.mode == 3) {
            if (alive(e)) withdraw(b, e)
            else b.status = "NO THREAT"
            return
        }
        if (b.mode == 2) {
            if (!alive(e)) { b.status = "NO TARGET"; return }
            let d = distance(b.x, b.y, e.x, e.y)
            if (b.closing && d <= preferred[b.kind] + 2) b.closing = false
            if (!b.closing && (d > preferred[b.kind] + 6 || d > maxRanges[b.kind] || !clear(b.x, b.y, e.x, e.y, false))) b.closing = true
            if (b.closing) approach(b, e.x, e.y, preferred[b.kind] + 2)
            // Cover may block a shot even within the preferred gap: approach the
            // target via the grid until LOS is restored, then use normal gap.
            if (!clear(b.x, b.y, e.x, e.y, false)) approach(b, e.x, e.y, 0)
            return
        }
        let ally = byId(b.ally)
        if (!alive(ally)) { b.status = "NO ALLY"; return }
        if (alive(e)) {
            if (distance(b.x, b.y, ally.x, ally.y) <= 22 && distance(b.x, b.y, e.x, e.y) <= maxRanges[b.kind] && clear(b.x, b.y, e.x, e.y, false)) return
            let d = distance(ally.x, ally.y, e.x, e.y)
            approach(b, ally.x + (d > 0 ? (e.x - ally.x) / d * 12 : 0), ally.y + (d > 0 ? (e.y - ally.y) / d * 12 : 0), 6)
        } else approach(b, ally.x, ally.y, 18)
    }
    function constrain(b: Bot, x: number, y: number): void {
        x = Math.constrain(x, 8, 152); y = Math.constrain(y, 20, 112)
        if (clear(b.x, b.y, x, y, true)) { b.nx = x; b.ny = y }
        else if (clear(b.x, b.y, x, b.y, true)) { b.nx = x; b.ny = b.y }
        else if (clear(b.x, b.y, b.x, y, true)) { b.nx = b.x; b.ny = y }
        else { b.nx = b.x; b.ny = b.y }
    }
    function physicsStep(): void {
        if (tick % 5 == 0) plans()
        for (let b of bots) { movement(b); constrain(b, b.nx, b.ny) }
        for (let pass = 0; pass < 2; pass++) for (let i = 0; i < bots.length; i++) for (let j = i + 1; j < bots.length; j++) {
            let a = bots[i]; let b = bots[j]
            if (!alive(a) || !alive(b)) continue
            let dx = b.nx - a.nx; let dy = b.ny - a.ny
            let d = Math.sqrt(dx * dx + dy * dy)
            if (d >= 10) continue
            if (d < 0.000001) { dx = 1; dy = 0; d = 0.000001 }
            let ux = d < 0.00001 ? 1 : dx / d
            let uy = d < 0.00001 ? 0 : dy / d
            let push = (10 - d) / 2
            constrain(a, a.nx - ux * push, a.ny - uy * push)
            constrain(b, b.nx + ux * push, b.ny + uy * push)
        }
        for (let b of bots) {
            b.moving = distance(b.x, b.y, b.nx, b.ny) > 0.001
            b.x = b.nx; b.y = b.ny
            if (b.shot > 0) b.shot--
            if (b.hit > 0) b.hit--
        }
        let hits: number[] = []
        for (let b of bots) hits.push(0)
        for (let b of bots) {
            if (!alive(b)) continue
            let e = byId(b.target)
            let reason = ""
            if (b.mode != 2 && b.mode != 4) reason = orderNames[b.mode]
            else if (!alive(e)) reason = b.mode == 4 ? (alive(byId(b.ally)) ? "NO THREAT" : "NO ALLY") : "NO TARGET"
            else if (b.mode == 4 && !alive(byId(b.ally))) reason = "NO ALLY"
            else if (b.moving) reason = "MOVING"
            else if (b.mode == 4 && distance(b.x, b.y, byId(b.ally).x, byId(b.ally).y) > 22) reason = "OUTSIDE COVER"
            else {
                let d = distance(b.x, b.y, e.x, e.y)
                if (b.kind == 3 && d < 32) reason = "TOO CLOSE"
                else if (d > maxRanges[b.kind]) reason = "OUT OF RANGE"
                else if (!clear(b.x, b.y, e.x, e.y, false)) reason = "BLOCKED LOS"
            }
            if (reason != "") { b.aim = 0; b.status = reason; continue }
            b.aim = Math.min(b.aimTicks, b.aim + 1)
            b.status = b.aim < b.aimTicks ? "AIMING" : "COOLDOWN"
            if (b.aim == b.aimTicks && tick >= b.nextShot) {
                b.nextShot = tick + cooldowns[b.kind]; b.shot = 2; b.status = "FIRING"
                for (let i = 0; i < bots.length; i++) if (bots[i].id == b.target) hits[i] += damage[b.kind]
                appendLog("t" + tick + " #" + b.id + " fires #" + b.target + " -" + damage[b.kind])
            }
        }
        let end = (tick + 1) * 50
        for (let i = 0; i < bots.length; i++) {
            let b = bots[i]
            if (!alive(b)) continue
            if (hits[i] > 0) {
                let absorbed = Math.min(b.shield, hits[i]); b.shield -= absorbed
                b.hp = Math.max(0, b.hp - (hits[i] - absorbed)); b.lastHit = end; b.hit = 3
            } else if (b.lastHit >= 0 && end >= b.lastHit + b.regenDelay) b.shield = Math.min(b.maxShield, b.shield + b.regenRate * 0.05)
            if (!alive(b)) { b.mode = 1; b.aim = 0; b.target = -1; b.ally = -1; b.status = "DISABLED"; appendLog("t" + tick + " #" + b.id + " disabled") }
        }
        tick++
        let f = 0; let e = 0; let fs = 0; let es = 0
        for (let b of bots) if (alive(b)) {
            let value = (b.hp + b.shield) / (b.maxHp + b.maxShield)
            if (b.side == 0) { f++; fs += value } else { e++; es += value }
        }
        if (f == 0 || e == 0) finish(f == 0 ? (e == 0 ? "DRAW" : "LOSS") : "WIN")
        else if (tick >= 900) finish(f == e ? (Math.abs(fs - es) < 0.000001 ? "DRAW" : fs > es ? "WIN" : "LOSS") : f > e ? "WIN" : "LOSS")
    }
    function setupMatch(): void {
        if (isReferenceDemo) scrimmage = true
        bots = []; walls = []; tick = 0; log = []; inspected = 0; outcome = ""; resultPaid = false
        if (battle == 3) walls = [[72, 48, 80, 69]]
        if (battle == 4) walls = [[56, 20, 62, 58], [98, 74, 104, 112]]
        if (battle == 5) walls = [[64, 20, 70, 58], [90, 74, 96, 112]]
        let count = battle == 0 ? 1 : 2
        for (let i = 0; i < count; i++) bots.push(new Bot(i + 1, 0, battle == 0 ? 1 : bayClasses[i], friendlySpawns[battle][i][0], friendlySpawns[battle][i][1], battle == 0 ? -1 : bayModules[i]))
        for (let i = 0; i < battleEnemies[battle].length; i++) bots.push(new Bot(i + 3, 1, battleEnemies[battle][i], enemySpawns[battle][i][0], enemySpawns[battle][i][1], -1))
        countdown = 30; go("COUNTDOWN")
    }
    function finish(value: string): void {
        if (resultPaid) return
        resultPaid = true; outcome = value; resultGrant = 0; resultFirst = false
        if (!scrimmage) {
            if (value == "WIN") {
                wins[battle] = Math.min(9999, wins[battle] + 1)
                lastOutcomes[battle] = 1
                resultFirst = battle == highestCleared
                resultGrant = resultFirst ? 35 + battle * 5 : 10
                if (resultFirst) highestCleared++
            } else if (value == "LOSS") { losses[battle] = Math.min(9999, losses[battle] + 1); lastOutcomes[battle] = 2; resultGrant = 8 }
            else { draws[battle] = Math.min(9999, draws[battle] + 1); lastOutcomes[battle] = 3; resultGrant = 5 }
            wallet = Math.min(9999, wallet + resultGrant)
            save()
        }
        appendLog(value + " +" + resultGrant + "c")
        go("RESULT")
    }
    function defaults(): void {
        highestCleared = 0; wallet = 45; moduleRanks = [0, 0, 0, 0]
        bayClasses = [1, 0]; bayModules = [-1, -1]
        wins = [0, 0, 0, 0, 0, 0]; losses = [0, 0, 0, 0, 0, 0]
        draws = [0, 0, 0, 0, 0, 0]; lastOutcomes = [0, 0, 0, 0, 0, 0]
    }
    function checksum(s: string): number {
        let value = 173
        for (let i = 0; i < s.length; i++) value = (value * 31 + s.charCodeAt(i)) % 1000000007
        return value
    }
    function encode(): string {
        let fields = [2, saveSequence, highestCleared, wallet, resetEpoch]
        for (let r of moduleRanks) fields.push(r)
        for (let c of bayClasses) fields.push(c)
        for (let m of bayModules) fields.push(m)
        for (let i = 0; i < 6; i++) { fields.push(wins[i]); fields.push(losses[i]); fields.push(draws[i]); fields.push(lastOutcomes[i]) }
        let body = "RA2|" + fields.join("|")
        return body + "|" + checksum(body)
    }
    function decode(record: string): number[] {
        if (!record) return []
        let bits = record.split("|")
        if (bits.length != 39 || bits[0] != "RA2") return []
        let body = "RA2"
        let values: number[] = []
        for (let i = 1; i < bits.length - 1; i++) {
            let n = parseInt(bits[i])
            if (n != n || n != Math.floor(n) || "" + n != bits[i]) return []
            values.push(n); body += "|" + bits[i]
        }
        if (checksum(body) != parseInt(bits[bits.length - 1])) return []
        if (values[0] != 2 || values[1] < 0 || values[1] > 999999999 || values[2] < 0 || values[2] > 6 || values[3] < 0 || values[3] > 9999 || values[4] < 0) return []
        let prefix = values[2]
        for (let i = 5; i < 9; i++) if (values[i] < 0 || values[i] > 2 || (values[i] > 0 && prefix < 2) || (values[i] == 2 && prefix < 3)) return []
        for (let i = 9; i < 11; i++) {
            let c = values[i]
            if (c < 0 || c > 3 || (c == 2 && prefix < 1) || (c == 3 && prefix < 4)) return []
        }
        if (values[9] == values[10]) return []
        for (let i = 11; i < 13; i++) if (values[i] < -1 || values[i] > 3 || (values[i] >= 0 && values[5 + values[i]] == 0)) return []
        if (values[11] >= 0 && values[11] == values[12]) return []
        for (let i = 0; i < 6; i++) {
            let p = 13 + i * 4
            for (let j = 0; j < 3; j++) if (values[p + j] < 0 || values[p + j] > 9999) return []
            if (values[p + 3] < 0 || values[p + 3] > 3) return []
            if (i < prefix && values[p] < 1) return []
            if (i >= prefix && values[p] > 0) return []
            if (i > prefix && values[p] + values[p + 1] + values[p + 2] > 0) return []
        }
        return values
    }
    function applySave(v: number[]): void {
        saveSequence = v[1]; highestCleared = v[2]; wallet = v[3]; resetEpoch = v[4]
        for (let i = 0; i < 4; i++) moduleRanks[i] = v[5 + i]
        for (let i = 0; i < 2; i++) { bayClasses[i] = v[9 + i]; bayModules[i] = v[11 + i] }
        for (let i = 0; i < 6; i++) { let p = 13 + i * 4; wins[i] = v[p]; losses[i] = v[p + 1]; draws[i] = v[p + 2]; lastOutcomes[i] = v[p + 3] }
    }
    function load(): void {
        if (isReferenceDemo) {
            defaults(); bayClasses = [3, 0]; lesson = 6; policyTarget = 6; battle = 5; scrimmage = true; screenId = "WELCOME"
            return
        }
        let a = settings.readString("robot-arena-v2-a")
        let b = settings.readString("robot-arena-v2-b")
        let va = decode(a); let vb = decode(b)
        if (va.length || vb.length) {
            applySave(!vb.length || (va.length && va[1] >= vb[1]) ? va : vb)
            screenId = "HUB"
            if ((a && !va.length) || (b && !vb.length)) { saveWarning = "Damaged save. Valid backup loaded."; screenId = "SAVE_WARNING" }
        } else {
            defaults(); screenId = "WELCOME"
            if (a || b) { saveWarning = "Both saves invalid. Fresh campaign ready."; screenId = "SAVE_WARNING" }
        }
        lesson = Math.min(6, highestCleared + 1); policyTarget = isReferenceDemo ? 6 : lesson; battle = Math.min(5, highestCleared)
    }
    function save(): void {
        if (isReferenceDemo) return
        saveSequence++
        saveDirty = true
        let record = encode()
        let key = saveSequence % 2 == 0 ? "robot-arena-v2-a" : "robot-arena-v2-b"
        settings.writeString(key, record)
        if (settings.readString(key) == record && decode(record).length > 0) { saveDirty = false; saveWarning = "" }
        else saveWarning = "Progress is UNSAVED. Retry save in Help."
    }
    function targetOrder(actor: number[], target: number): number {
        // Comparison oracle ONLY. This answer is never supplied to learner/world AI.
        if (target >= 4 && actor[2] < (target == 6 && actor[1] ? 18 : 12) && actor[3] < 50) return 3
        return target >= 2 && actor[1] ? 4 : 2
    }
    function beginTrial(): void {
        trialRows = []; trialModes = []; trialExpected = []; trialDescriptors = []
        trialTargetLabel = "Policy R0" + policyTarget + " / scene R0" + lesson
        let allMatch = true
        for (let i = 0; i < arenaData.trialStages.length; i++) if (arenaData.trialStages[i] == lesson) {
            for (let j = 0; j < arenaData.trialActors[i].length; j++) {
                let a = arenaData.trialActors[i][j]
                let actual = request(a[0], a[2], a[3], a[1] == 1)
                let expected = policyTarget == lesson ? arenaData.trialOrders[i][j] : targetOrder(a, policyTarget)
                let ok = requestDiagnostic == "ACCEPTED" && requestDuplicates == 0 && actual == expected
                if (!ok) allMatch = false
                trialRows.push(arenaData.trialIds[i] + " #" + a[0] + " " + (ok ? "MATCH" : "REVIEW") + " " + (requestDiagnostic == "ACCEPTED" ? orderNames[actual] : requestDiagnostic) + (requestDuplicates ? "+DUPLICATE" : ""))
                trialModes.push(actual); trialExpected.push(expected); trialDescriptors.push(a)
            }
        }
        trialVerdict = allMatch ? "ORDERS MATCH TARGET" : "REVIEW CURRENT ORDERS"
        if (policyTarget == lesson) behaviorProof[lesson - 1] = allMatch
        trialIndex = 0; trialAnimation = 0; go("TRAIN_RUNNING")
    }
    function availableBattle(): number { return isReferenceDemo ? 5 : Math.min(5, highestCleared) }
    function licensed(kind: number): boolean { return isReferenceDemo || kind < 2 || (kind == 2 ? highestCleared >= 1 : highestCleared >= 4) }
    function flash(s: string): void { notice = s; noticeTicks = 65 }
    function go(id: string): void { screenId = id; cursor = isReferenceDemo && id == "BATTLES" ? battle : isReferenceDemo && id == "TRAIN_SELECT" ? lesson - 1 : 0; reviewRow = 0 }
    function menuItems(): string[] {
        if (screenId == "HUB") return isReferenceDemo ? ["Reference arenas / no campaign", "Practice supplied R06 code", "Reference program info", "Team / equipment", "Shop (student campaign only)", "Reference / controls / help", "Free sandbox arenas", "Reset reference session"] : ["Practice current code", "Battles / replay", "Current lesson", "Team / equipment", "Shop", "Progress / controls / save", highestCleared == 6 ? "Free scrimmage" : "Scrimmage (finish B06)", "Reset campaign"]
        if (screenId == "TRAIN_SELECT") { let a: string[] = []; for (let i = 1; i <= (isReferenceDemo ? 6 : Math.min(6, highestCleared + 1)); i++) a.push("R0" + i + " controlled scenes"); return a }
        if (screenId == "TRAIN_PREVIEW") { let items = ["Run all with current code", "Review most recent results", "Policy target: R0" + policyTarget + "  < >"]; if (lesson == 6) { items.push("Guard15: limit18 duty=true"); items.push("Guard15: limit12 duty=true"); items.push("Guard20: limit18 duty=true"); items.push("Guard20: limit18 duty=false") }; return items }
        if (screenId == "TRAIN_RESULT") return ["Retry / change target", "Details of actual orders", "Return to lessons"]
        if (screenId == "BATTLES") { let a: string[] = []; for (let i = 0; i <= availableBattle(); i++) a.push("B0" + (i + 1) + " " + battleNames[i] + (isReferenceDemo ? " [reference]" : i < highestCleared ? " [cleared]" : " [next]")); return a }
        if (screenId == "PREVIEW" || screenId == "SCRIM_PREVIEW") return ["Fight using current code", "Change team / equipment", "Practice R0" + (battle + 1) + " current code"]
        if (screenId == "GARAGE") return ["Bay " + (bay + 1) + " class: " + classNames[bayClasses[bay]], isReferenceDemo ? "Base stats (modules in campaign)" : "Bay " + (bay + 1) + " module: " + (bayModules[bay] < 0 ? "None" : moduleNames[bayModules[bay]]), "Change bay  < >"]
        if (screenId == "CLASS_PICK") { let a: string[] = []; for (let i = 0; i < 4; i++) a.push(classNames[i] + (licensed(i) ? "" : i == 2 ? " (after B01)" : " (after B04)")); return a }
        if (screenId == "EQUIP_PICK") { let a = ["None"]; for (let i = 0; i < 4; i++) a.push(moduleNames[i] + " rank " + moduleRanks[i] + (moduleRanks[i] == 0 ? " (unowned)" : "")); return a }
        if (screenId == "SHOP") {
            let a: string[] = []
            for (let i = 0; i < 4; i++) a.push(moduleNames[i] + " " + (moduleRanks[i] == 2 ? "MAX" : moduleRanks[i] == 0 ? "I " + [35, 40, 45, 40][i] + "c" : "II " + [60, 65, 70, 65][i] + "c"))
            return a
        }
        if (screenId == "PAUSED") return ["Resume", "Inspect robots", "Abort (no reward)"]
        if (screenId == "RESULT") { let a = ["Retry / preview", "Change team", "Battle log", "Return to base"]; if (highestCleared == 6) a.push("Course complete / continue"); return a }
        if (screenId == "RESET") return ["Cancel", isReferenceDemo ? "Reset reference session..." : "Reset campaign..."]
        if (screenId == "RESET_FINAL") return isReferenceDemo ? ["Keep reference session", "Confirm reference reset"] : ["Keep my campaign", "Confirm reset (code stays)"]
        if (screenId == "COMPLETION") return ["Replay battles", "Free scrimmage", "Return to base"]
        if (screenId == "SCRIMMAGE") { let a: string[] = []; for (let i = 0; i < 6; i++) a.push("Free B0" + (i + 1) + " arena (no payout)"); return a }
        return []
    }
    function moveCursor(delta: number): void {
        if (screenId == "TRAIN_REVIEW" || screenId == "RESULT_LOG" || screenId == "RECORD_HELP") {
            let length = screenId == "TRAIN_REVIEW" ? trialModes.length : screenId == "RESULT_LOG" ? log.length : helpLines().length
            reviewRow = Math.constrain(reviewRow + delta, 0, Math.max(0, length - 1)); return
        }
        let list = menuItems()
        if (list.length) cursor = (cursor + delta + list.length) % list.length
    }
    function horizontal(delta: number): void {
        if (screenId == "LIVE" || screenId == "PAUSE_DETAILS") { inspected = (inspected + delta + bots.length) % bots.length; return }
        if (screenId == "GARAGE") { if (!isReferenceDemo && highestCleared < 1) flash("Win B01 to open the second bay."); else bay = 1 - bay; return }
        if (screenId == "TRAIN_PREVIEW") { policyTarget = (policyTarget - 1 + delta + 6) % 6 + 1; return }
    }
    function confirm(): void {
        if (screenId == "WELCOME" || screenId == "RECIPE_INFO") { go("HUB"); return }
        if (screenId == "SAVE_WARNING") { save(); go("HUB"); return }
        if (screenId == "HUB") {
            if (cursor == 0) { if (isReferenceDemo) { scrimmage = true; go("BATTLES") } else go("TRAIN_SELECT") }
            else if (cursor == 1) { if (isReferenceDemo) go("TRAIN_SELECT"); else { scrimmage = false; go("BATTLES") } }
            else if (cursor == 2) go("RECIPE_INFO")
            else if (cursor == 3) { garageBack = "HUB"; bay = 0; go("GARAGE") }
            else if (cursor == 4) { if (isReferenceDemo) flash("Shop belongs to the student campaign. Reference uses base classes."); else go("SHOP") }
            else if (cursor == 5) go("RECORD_HELP")
            else if (cursor == 6) { if (isReferenceDemo || highestCleared == 6) go("SCRIMMAGE"); else flash("First clear all six battles.") }
            else go("RESET")
            return
        }
        if (screenId == "TRAIN_SELECT") { lesson = cursor + 1; policyTarget = isReferenceDemo ? 6 : Math.min(6, highestCleared + 1); go("TRAIN_PREVIEW"); return }
        if (screenId == "TRAIN_PREVIEW") {
            if (cursor == 0) beginTrial()
            else if (cursor == 1) { trialOrigin = "TRAIN_PREVIEW"; go("TRAIN_REVIEW") }
            else if (cursor == 2) horizontal(1)
            else parameterTrial(cursor - 3)
            return
        }
        if (screenId == "TRAIN_RESULT") { if (cursor == 0) go("TRAIN_PREVIEW"); else if (cursor == 1) { trialOrigin = "TRAIN_RESULT"; go("TRAIN_REVIEW") } else go("TRAIN_SELECT"); return }
        if (screenId == "TRAIN_REVIEW") { go("TRAIN_PREVIEW"); return }
        if (screenId == "BATTLES") { battle = cursor; scrimmage = isReferenceDemo; go("PREVIEW"); return }
        if (screenId == "PREVIEW" || screenId == "SCRIM_PREVIEW") {
            if (cursor == 0) {
                if (!isReferenceDemo && !scrimmage && battle == highestCleared && !behaviorProof[battle]) { flash("Practice R0" + (battle + 1) + " with its matching target first. Prove current orders, then fight."); return }
                setupMatch()
            }
            else if (cursor == 1) { garageBack = screenId; bay = 0; go("GARAGE") }
            else { lesson = battle + 1; policyTarget = isReferenceDemo ? 6 : lesson; go("TRAIN_PREVIEW") }
            return
        }
        if (screenId == "GARAGE") {
            if (!isReferenceDemo && highestCleared == 0) { flash("B01 deploys the supplied Rifle. Win to open team choices."); return }
            if (cursor == 0) go("CLASS_PICK")
            else if (cursor == 1) { if (isReferenceDemo) flash("Reference uses base stats. Equip modules in the student campaign."); else go("EQUIP_PICK") }
            else horizontal(1)
            return
        }
        if (screenId == "CLASS_PICK") {
            if (!licensed(cursor)) { flash("License not yet available."); return }
            if (bayClasses[1 - bay] == cursor) { flash("Already deployed in the other bay."); return }
            bayClasses[bay] = cursor; save(); go("GARAGE"); return
        }
        if (screenId == "EQUIP_PICK") {
            let m = cursor - 1
            if (m >= 0 && moduleRanks[m] == 0) { flash("Buy this module in the Shop first."); return }
            if (m >= 0 && bayModules[1 - bay] == m) { flash("Unequip it from the other bay first."); return }
            bayModules[bay] = m; save(); go("GARAGE"); return
        }
        if (screenId == "SHOP") {
            let rank = moduleRanks[cursor]
            if (rank == 2) { flash("Already at maximum rank."); return }
            if (highestCleared < (rank == 0 ? 2 : 3)) { flash(rank == 0 ? "Rank I opens after B02." : "Rank II opens after B03."); return }
            let cost = rank == 0 ? [35, 40, 45, 40][cursor] : [60, 65, 70, 65][cursor]
            if (wallet < cost) { flash("Need " + (cost - wallet) + " more credits."); return }
            wallet -= cost; moduleRanks[cursor]++; save(); flash("Purchased. Equip this module in Team."); return
        }
        if (screenId == "LIVE") { inspected = (inspected + 1) % bots.length; return }
        if (screenId == "PAUSED") {
            if (cursor == 0) go("LIVE")
            else if (cursor == 1) go("PAUSE_DETAILS")
            else { bots = []; scrimmage = false; go("HUB"); flash("Battle aborted. No credits or record changed.") }
            return
        }
        if (screenId == "PAUSE_DETAILS") { go("PAUSED"); return }
        if (screenId == "RESULT") {
            if (cursor == 0) go(scrimmage ? "SCRIM_PREVIEW" : "PREVIEW")
            else if (cursor == 1) { garageBack = "RESULT"; go("GARAGE") }
            else if (cursor == 2) go("RESULT_LOG")
            else if (cursor == 3) { lesson = isReferenceDemo ? 6 : Math.min(6, highestCleared + 1); go("HUB") }
            else go("COMPLETION")
            return
        }
        if (screenId == "RESULT_LOG") { go("RESULT"); return }
        if (screenId == "RECORD_HELP") { if (saveDirty) save(); go("HUB"); return }
        if (screenId == "RESET") { go(cursor == 0 ? "HUB" : "RESET_FINAL"); return }
        if (screenId == "RESET_FINAL") {
            if (cursor == 0) { go("HUB"); return }
            resetEpoch++; defaults(); behaviorProof = [false, false, false, false, false, false]; trialVerdict = "NOT RUN"; trialRows = []; bots = []; lesson = isReferenceDemo ? 6 : 1; policyTarget = isReferenceDemo ? 6 : 1; battle = isReferenceDemo ? 5 : 0; if (isReferenceDemo) { bayClasses = [3, 0]; bay = 0; scrimmage = true }
            save(); save(); go(saveDirty ? "SAVE_WARNING" : "WELCOME"); return
        }
        if (screenId == "COMPLETION") { go(cursor == 0 ? "BATTLES" : cursor == 1 ? "SCRIMMAGE" : "HUB"); return }
        if (screenId == "SCRIMMAGE") { battle = cursor; scrimmage = true; go("SCRIM_PREVIEW"); return }
    }
    function back(): void {
        if (screenId == "LIVE") { go("PAUSED"); return }
        if (screenId == "PAUSED") { go("LIVE"); return }
        if (screenId == "PAUSE_DETAILS") { go("PAUSED"); return }
        if (screenId == "COUNTDOWN" || screenId == "TRAIN_RUNNING") return
        if (screenId == "TRAIN_PREVIEW" || screenId == "TRAIN_RESULT") { go("TRAIN_SELECT"); return }
        if (screenId == "TRAIN_REVIEW") { go(trialOrigin); return }
        if (screenId == "PREVIEW") { go("BATTLES"); return }
        if (screenId == "SCRIM_PREVIEW") { go("SCRIMMAGE"); return }
        if (screenId == "CLASS_PICK" || screenId == "EQUIP_PICK") { go("GARAGE"); return }
        if (screenId == "GARAGE") { go(garageBack); return }
        if (screenId == "RESULT_LOG") { go("RESULT"); return }
        if (screenId == "HUB") { flash("Edit Functions in MakeCode, then restart to run that code."); return }
        go("HUB")
    }
    function parameterTrial(variant: number): void {
        let shield = variant < 2 ? 15 : 20
        let expected = [3, 4, 4, 2][variant]
        let label = ["Guard15 limit18 duty=true", "Guard15 limit12 duty=true", "Guard20 limit18 duty=true", "Guard20 limit18 duty=false"][variant]
        let actual = request(2, shield, 25, true)
        let ok = requestDiagnostic == "ACCEPTED" && requestDuplicates == 0 && actual == expected
        trialRows = [label, "#2 " + requestDiagnostic + " " + orderNames[actual] + (requestDuplicates ? "+DUPLICATE" : "")]
        // One frozen request. Label appears on the result; no injected arguments.
        trialTargetLabel = label
        trialRows = [label + ": " + (ok ? "MATCH" : "REVIEW") + " " + requestDiagnostic + (requestDuplicates ? "+DUPLICATE" : "")]
        trialModes = [actual]; trialExpected = [expected]; trialDescriptors = [[2, 1, shield, 25]]
        trialVerdict = ok ? "ORDERS MATCH TARGET" : "REVIEW CURRENT ORDERS"
        trialIndex = 0; trialAnimation = 0; go("TRAIN_RUNNING")
    }
    function text(s: string, x: number, y: number, color: number): void { screen.print(s, x, y, color, image.font8) }
    function small(s: string, x: number, y: number, color: number): void { screen.print(s, x, y, color, image.font5) }
    function wrapped(s: string, x: number, y: number, color: number, chars: number): number {
        let words = s.split(" ")
        let line = ""
        for (let word of words) {
            if (line.length && line.length + word.length + 1 > chars) { text(line, x, y, color); y += 12; line = word }
            else line += (line.length ? " " : "") + word
        }
        if (line.length) { text(line, x, y, color); y += 12 }
        return y
    }
    function bar(x: number, y: number, w: number, value: number, maximum: number, color: number): void {
        screen.fillRect(x, y, w, 3, 15)
        if (maximum > 0) screen.fillRect(x, y, Math.round(w * Math.constrain(value / maximum, 0, 1)), 3, color)
    }
    function drawBot(b: Bot, selected: boolean): void {
        let x = Math.round(b.x * 2); let y = Math.round(b.y * 2)
        if (!alive(b)) {
            screen.drawLine(x - 7, y - 7, x + 7, y + 7, 13); screen.drawLine(x + 7, y - 7, x - 7, y + 7, 13)
            small("#" + b.id, x - 5, y + 9, 13); return
        }
        let color = b.side == 0 ? 9 : 2
        screen.fillRect(x - 10, y - 7, 4, 14, 13); screen.fillRect(x + 6, y - 7, 4, 14, 13)
        if (b.kind == 0) screen.fillCircle(x, y, 8, color)
        else if (b.kind == 2) { screen.fillRect(x - 8, y - 8, 16, 16, color); screen.drawRect(x - 10, y - 10, 20, 20, 1) }
        else { screen.fillRect(x - 7, y - 7, 14, 14, color); screen.drawRect(x - 8, y - 8, 16, 16, 1) }
        let target = byId(b.target)
        if (alive(target)) {
            let d = distance(b.x, b.y, target.x, target.y)
            if (d > 0) {
                let tx = x + Math.round((target.x - b.x) / d * (b.kind == 3 ? 18 : 12))
                let ty = y + Math.round((target.y - b.y) / d * (b.kind == 3 ? 18 : 12))
                screen.drawLine(x, y, tx, ty, b.aim > 0 ? 5 : 1)
                if (b.shot > 0) { screen.drawLine(tx, ty, Math.round(target.x * 2), Math.round(target.y * 2), 5); screen.fillCircle(tx, ty, 3, 1) }
            }
        }
        if (b.hit > 0) { screen.drawLine(x - 12, y - 12, x - 6, y - 6, 1); screen.drawLine(x + 12, y - 12, x + 6, y - 6, 5) }
        if (b.mode == 3) { screen.drawLine(x - 5, y + 4, x, y + 9, 1); screen.drawLine(x, y + 9, x + 5, y + 4, 1) }
        if (b.mode == 4) { screen.drawLine(x - 5, y - 4, x, y - 8, 1); screen.drawLine(x, y - 8, x + 5, y - 4, 1) }
        text(classNames[b.kind].substr(0, 1), x - 3, y - 3, 15)
        small("#" + b.id, x - 5, y - 18, 1)
        bar(x - 12, y + 11, 24, b.hp, b.maxHp, 7)
        bar(x - 12, y + 15, 24, b.shield, b.maxShield, 9)
        if (selected) { screen.drawCircle(x, y, 14, 5); if (b.aim > 0) bar(x - 12, y + 19, 24, b.aim, b.aimTicks, 5) }
    }
    function drawArena(): void {
        screen.fill(15)
        screen.fillRect(6, 37, 308, 201, 11)
        for (let x = 16; x < 307; x += 16) for (let y = 40; y < 232; y += 16) screen.setPixel(x, y, 13)
        screen.drawRect(6, 37, 308, 201, 13)
        for (let r of walls) { screen.fillRect(r[0] * 2, r[1] * 2, (r[2] - r[0]) * 2 + 1, (r[3] - r[1]) * 2 + 1, 13); screen.drawRect(r[0] * 2, r[1] * 2, (r[2] - r[0]) * 2 + 1, (r[3] - r[1]) * 2 + 1, 1) }
        for (let i = 0; i < bots.length; i++) drawBot(bots[i], i == inspected)
        screen.fillRect(0, 0, 320, 36, 8)
        text((isReferenceDemo ? "DEMO " : "") + "B0" + (battle + 1) + "  " + Math.max(0, 45 - Math.idiv(tick, 20)) + "s  " + (scrimmage ? "FREE" : "ELIMINATE ENEMIES"), 5, 2, 1)
        let b = bots[inspected]
        if (b) {
            let diag = b.side == 1 ? "enemy" : b.diagnostic == "ACCEPTED" ? (b.duplicates ? "DUPLICATE" : "valid") : b.diagnostic
            small("#" + b.id + " " + classNames[b.kind] + " " + orderNames[b.mode] + " " + b.status + " " + diag, 5, 14, b.side == 0 && (b.diagnostic != "ACCEPTED" || b.duplicates > 0) ? 2 : 1)
            small("HP " + Math.round(b.hp) + "/" + b.maxHp + " SH " + Math.round(b.shield) + "/" + b.maxShield + " aim " + b.aim + "/" + b.aimTicks + " target #" + b.target, 5, 21, 1)
        }
        small("A/Z or < > inspect  B/X pause  CURRENT CODE", 5, 29, 1)
        if (screenId == "COUNTDOWN") {
            screen.fillRect(38, 91, 244, 53, 8); screen.drawRect(38, 91, 244, 53, 1)
            text("CURRENT CODE DEPLOYING", 59, 104, 1); text("Starting in " + Math.max(1, Math.ceil(countdown / 20)), 100, 123, 5)
        }
    }
    function drawTrial(): void {
        let a = trialDescriptors[trialIndex]
        screen.fill(15)
        text("FROZEN TRIAL - CURRENT CODE", 10, 10, 1)
        text(trialTargetLabel, 10, 27, 9)
        if (!a) return
        let mode = trialModes[trialIndex]
        text("#" + a[0] + (a[1] ? " Guard" : " Scout") + " shield " + a[2] + " gap " + a[3], 10, 49, 1)
        text("Actual " + orderNames[mode], 10, 70, 5)
        text("Target " + orderNames[trialExpected[trialIndex]], 10, 86, 9)
        let t = Math.min(24, trialAnimation)
        let x = mode == 2 ? 60 + t * 2 : mode == 3 ? 100 - t * 2 : mode == 4 ? 90 + t : 70
        let y = 146
        screen.fillCircle(x, y, 10, 9); text(a[1] ? "G" : "S", x - 3, y - 3, 15)
        small("#" + a[0], x - 8, y + 16, 1)
        screen.drawCircle(240, y, 10, 2); small("test target", 217, y + 16, 1)
        if (mode == 4) { screen.drawRect(137, y - 8, 16, 16, 7); small("support ally", 123, y + 16, 1) }
        if (mode == 2 && t > 15) screen.drawLine(x + 10, y, 230, y, 5)
        small("Illustrative order motion; sensors stay frozen.", 10, 188, 1)
        small("Current callback invoked once per actor. No grade.", 10, 200, 1)
        text("Decision " + (trialIndex + 1) + "/" + trialModes.length, 10, 218, 9)
    }
    function heading(): string {
        if (screenId == "HUB") return isReferenceDemo ? "REFERENCE DEMO / ROBOT FUNCTIONS" : "ROBOT FUNCTIONS / BASE"
        if (screenId == "WELCOME") return isReferenceDemo ? "REFERENCE SANDBOX" : "BUILD A ROBOT TEAM"
        if (screenId == "RECIPE_INFO") return "YOUR NEXT FUNCTION"
        if (screenId == "TRAIN_SELECT") return isReferenceDemo ? "PRACTICE SUPPLIED R06 CODE" : "PRACTICE YOUR CURRENT CODE"
        if (screenId == "TRAIN_PREVIEW") return "R0" + lesson + " CONTROLLED SCENES"
        if (screenId == "TRAIN_RESULT") return "CURRENT CODE / TRIAL RESULTS"
        if (screenId == "TRAIN_REVIEW") return "ACTUAL ORDER DETAILS"
        if (screenId == "BATTLES") return "BATTLES / FREE RETRIES"
        if (screenId == "PREVIEW" || screenId == "SCRIM_PREVIEW") return "B0" + (battle + 1) + " " + battleNames[battle]
        if (screenId == "GARAGE") return "TEAM / BAY " + (bay + 1)
        if (screenId == "CLASS_PICK") return "CHOOSE A ROBOT CLASS"
        if (screenId == "EQUIP_PICK") return "ONE MODULE PER BAY"
        if (screenId == "SHOP") return "OPTIONAL MODULE SHOP"
        if (screenId == "PAUSED" || screenId == "PAUSE_DETAILS") return "PAUSED - CLOCK FROZEN"
        if (screenId == "RESULT") return isReferenceDemo ? "REFERENCE RESULT / " + outcome : outcome + (resultFirst ? " - FIRST CLEAR!" : " - BATTLE RESULT")
        if (screenId == "RESULT_LOG") return "LAST BATTLE / ACTUAL EVENTS"
        if (screenId == "RECORD_HELP") return "PROGRESS / CONTROLS / HELP"
        if (screenId == "SAVE_WARNING") return "SAVE RECOVERY"
        if (screenId == "RESET" || screenId == "RESET_FINAL") return isReferenceDemo ? "RESET REFERENCE SESSION?" : "RESET CAMPAIGN?"
        if (screenId == "COMPLETION") return "SIX BATTLES COMPLETE"
        if (screenId == "SCRIMMAGE") return "FREE SCRIMMAGE / CURRENT CODE"
        return screenId
    }
    function helpLines(): string[] {
        if (isReferenceDemo) return ["REFERENCE SANDBOX / supplied R06 Functions", "All six arenas and all four classes available.", "Every reference fight uses real code/physics.", "No campaign changes, credits or W/L/D records.", "No tutorial work or Function mastery verified.", "Default: B06, Lancer TOP and Scout BOTTOM.", "B01 always uses its preset single Rifle.", "A/Z confirm. B/X back or pause. Arrows choose.", "Team choices are temporary this session.", "Shop belongs to the student campaign.", "Student saved progress is never loaded or changed.", "Reset restarts only this reference session.", "A/Z or B/X returns to reference base."]
        let rows = ["CLEARED " + highestCleared + "/6   WALLET " + wallet + "c", "A/Z: confirm. B/X: back or pause.", "Arrows: menu. Left/right: marked options.", "Edit Functions in the MakeCode editor.", "Restart simulator to run edited code.", "Game progress persists; code is yours.", "Practice calls your current callback.", "Order matches do not prove Function use.", "Battles test real movement and combat.", "A correct Function can lose a battle.", "HOLD is a valid intentional order.", "NO ORDER means no submitted command.", "PROTECT moves and fires near an ally.", "PROTECT does not heal or block bullets.", "Lancer cannot fire inside 32 pixels.", "All retries and equipment changes free.", "Green bar: HP. Blue: shield. Gold: aim.", saveDirty ? "A/Z: retry saving, then return." : "Progress saved. A/Z or B/X: return."]
        for (let i = 0; i < 6; i++) rows.push("B0" + (i + 1) + "  W" + wins[i] + " L" + losses[i] + " D" + draws[i])
        return rows
    }
    function drawDetails(): void {
        if (screenId == "PAUSE_DETAILS") {
            let b = bots[inspected]
            if (!b) return
            let rows = ["< > choose actor #" + b.id + " " + classNames[b.kind], "Order: " + orderNames[b.mode], "Request: " + b.diagnostic, "Duplicates: " + b.duplicates, "Action: " + b.status, "HP " + Math.round(b.hp) + "/" + b.maxHp + " Shield " + Math.round(b.shield) + "/" + b.maxShield, "Target #" + b.target + " Ally #" + b.ally, "Aim " + b.aim + "/" + b.aimTicks + " Next shot tick " + b.nextShot]
            for (let i = 0; i < rows.length; i++) text(rows[i], 10, 57 + i * 16, 1)
            return
        }
        if (screenId == "TRAIN_REVIEW") {
            if (!trialModes.length) { text("No run yet. A/Z: return to practice.", 10, 65, 1); return }
            let i = Math.min(reviewRow, trialModes.length - 1)
            let a = trialDescriptors[i]
            wrapped(trialRows[i], 10, 58, 1, 37)
            text("Frozen actor #" + a[0] + (a[1] ? " Guard" : " Scout"), 10, 100, 1)
            text("Shield " + a[2] + "  enemy gap " + a[3], 10, 118, 1)
            text("Actual: " + orderNames[trialModes[i]], 10, 140, 5)
            text("Target: " + orderNames[trialExpected[i]], 10, 158, 9)
            text("Orders only; Function use ungraded.", 10, 182, 1)
            small("UP/DOWN decisions  " + (i + 1) + "/" + trialModes.length, 10, 201, 1)
            return
        }
        let rows = screenId == "RESULT_LOG" ? log : helpLines()
        for (let n = 0; n < 10 && reviewRow + n < rows.length; n++) {
            let s = rows[reviewRow + n]
            if (s.length > 48) s = s.substr(0, 48)
            screen.print(s, 10, 57 + n * 14, 1, image.font5)
        }
        small("UP/DOWN scroll " + (reviewRow + 1) + "/" + rows.length, 10, 205, 9)
    }
    function drawMenu(): void {
        screen.fill(15)
        screen.fillRect(0, 0, 320, 36, 8)
        text(heading().substr(0, 38), 8, 7, 1)
        small(isReferenceDemo ? "REFERENCE / NO CAMPAIGN CHANGES  45c" : "CLEARED " + highestCleared + "/6  " + wallet + "c  " + (saveDirty ? "UNSAVED" : "SAVED"), 8, 23, saveDirty ? 2 : 9)
        let menuY = 60
        if (screenId == "WELCOME") {
            wrapped(isReferenceDemo ? "The six reference Functions are supplied. Every arena and class is available. Start with B06: Lancer top, Scout bottom." : "Give your robot a plan. Build and call your first attack Function in the tutorial, test your code, then face the Scout in B01.", 12, 58, 1, 36)
            wrapped(isReferenceDemo ? "Fights run real R06 code and physics. No campaign changes, payouts or tutorial work verified. Reference team changes last this session." : "The world moves and aims. Your Functions choose its orders. No order means it holds still.", 12, 129, 9, 36)
            text("A/Z: enter base", 12, 190, 5)
        } else if (screenId == "RECIPE_INFO") {
            text(isReferenceDemo ? "Completed R06 reference code supplied" : "Available lesson: R0" + Math.min(6, highestCleared + 1), 12, 57, 9)
            wrapped(isReferenceDemo ? "This reference player demonstrates all six Functions. Practice scenes use explicit target R06. No tutorial work or learning is verified." : ["Create attack(robot) and call it from the planning event.", "Create protect(robot); select it for Guards.", "Move action selection into planRobot(robot).", "Add retreat(robot) for low shield AND a near enemy.", "Return a Boolean answer from inDanger(robot, shieldLimit).", "Reuse chooseAction with different limit and guardDuty inputs."][Math.min(5, highestCleared)], 12, 82, 1, 36)
            wrapped(isReferenceDemo ? "Use Practice to inspect current orders, then battle or replay. Build your own Functions in the separate student tutorial." : "Use the tutorial's next lesson link in the same MakeCode project. Keep your earlier Functions. Restart to run edits, then Practice before battle.", 12, 139, 9, 36)
        } else if (screenId == "SAVE_WARNING") {
            wrapped(saveWarning, 12, 65, 1, 36); wrapped("A/Z retries save and enters base. B/X continues. Your editable code is separate from this campaign save.", 12, 116, 9, 36)
        } else if (screenId == "TRAIN_REVIEW" || screenId == "RESULT_LOG" || screenId == "RECORD_HELP" || screenId == "PAUSE_DETAILS") drawDetails()
        else {
            if (screenId == "HUB") { text(isReferenceDemo ? "Sandbox: choose any arena; no campaign changes." : highestCleared == 6 ? "All six cleared. Replay and experiment." : "Goal: test your code, then win B0" + Math.min(6, highestCleared + 1), 10, 46, 9); menuY = 65 }
            if (screenId == "TRAIN_PREVIEW") {
                text("Current code / scene R0" + lesson + " / target R0" + policyTarget, 10, 46, 9)
                text("< > target. Your code stays current.", 10, 60, 1)
                menuY = 81
            }
            if (screenId == "TRAIN_RESULT") {
                text(trialVerdict, 10, 52, 5)
                text(trialTargetLabel, 10, 69, 1)
                text("Function use is not auto-graded.", 10, 82, 9)
                text("Later code can change earlier orders.", 10, 95, 9)
                menuY = 114
            }
            if (screenId == "PREVIEW" || screenId == "SCRIM_PREVIEW") {
                let names = ""
                for (let kind of battleEnemies[battle]) names += (names.length ? " + " : "") + classNames[kind]
                text("Enemies: " + names, 10, 52, 2)
                text("45s. Eliminate or win survivor tiebreak.", 10, 70, 1)
                text(battle == 0 ? "CENTER bay1: supplied Rifle" : "TOP bay1: " + classNames[bayClasses[0]] + " / BOTTOM bay2: " + classNames[bayClasses[1]], 10, 88, 9)
                text(isReferenceDemo ? "Reference: no campaign changes." : scrimmage ? "Free practice. No credits or record." : "First WIN " + (35 + battle * 5) + "c; retry is free.", 10, 106, 5)
                text(battle == 3 ? "Try Scout top; close inside32." : battle == 5 ? "Try Lancer top + Scout bottom." : "Valid orders can lose. Retry is free.", 10, 125, 1)
                small(isReferenceDemo ? "REFERENCE: no campaign changes or tutorial proof." : scrimmage || battle < highestCleared ? "Replay: current code; no new proof required." : "Current-run order proof: " + (behaviorProof[battle] ? "MATCHED" : "Practice R0" + (battle + 1) + " first"), 10, 137, 9)
                menuY = 146
            }
            if (screenId == "GARAGE") {
                text("< > bay. A/Z choose; B/X return.", 10, 47, 1)
                small("Bay1 " + classNames[bayClasses[0]] + "  Bay2 " + (isReferenceDemo || highestCleared ? classNames[bayClasses[1]] : "LOCKED until B01"), 10, 60, 9)
                menuY = 84
            }
            if (screenId == "SHOP") {
                text("I after B02. II after B03. Team equips.", 10, 47, 1)
                menuY = 68
            }
            if (screenId == "RESULT") {
                text(isReferenceDemo ? "Reference fight: no campaign changes." : "+" + resultGrant + " credits. Wallet " + wallet + "c.", 10, 49, 5)
                text(outcome == "LOSS" ? "Tactical loss: inspect, edit or re-equip." : outcome == "WIN" ? "Battle WIN is not a Function grade." : "Draw: inspect and retry for free.", 10, 66, 1)
                if (resultFirst) {
                    let unlock = ["Guard + second bay; lesson R02", "Rank I shop; lesson R03", "Rank II shop; lesson R04", "Lancer license; lesson R05", "Lesson R06", "Course complete + free scrimmage"][battle]
                    small("Unlocked: " + unlock, 10, 80, 9)
                }
                menuY = 101
            }
            if (screenId == "RESET" || screenId == "RESET_FINAL") { wrapped(isReferenceDemo ? "Resets only this reference session. Student campaign saves and your editable Functions stay unchanged." : "Clears game progress, wallet and equipment. Your MakeCode Functions stay in your project.", 10, 51, 1, 36); menuY = 113 }
            if (screenId == "COMPLETION") { wrapped("Your current Functions command the team. Keep experimenting: change a call, test its consequence, and replay any arena.", 10, 52, 9, 36); menuY = 119 }
            if (screenId == "CLASS_PICK") {
                text("Choose class; inspect base profile.", 10, 47, 1)
                menuY = 76
            }
            let list = menuItems()
            let visible = Math.max(1, Math.idiv(210 - menuY, 19))
            let first = Math.max(0, cursor - visible + 1)
            for (let i = first; i < list.length && i < first + visible; i++) {
                let y = menuY + (i - first) * 19
                if (i == cursor) { screen.fillRect(7, y - 4, 306, 18, 8); text(">", 10, y, 5) }
                text(list[i].substr(0, 35), 26, y, i == cursor ? 1 : 13)
            }
            if (list.length > visible) small((cursor + 1) + "/" + list.length + "  UP/DOWN: more choices", 10, 208, 9)
            if (screenId == "CLASS_PICK") {
                text("BASE " + classNames[cursor] + "  HP" + baseHp[cursor] + " SH" + baseShield[cursor], 10, 160, 9)
                text("Speed" + baseSpeed[cursor] + "px/s Range" + (cursor == 3 ? 32 : 0) + "-" + maxRanges[cursor] + "px", 10, 172, 1)
                text("Aim" + (baseAimTicks[cursor] * 50) + "ms Cooldown" + (cooldowns[cursor] * 50) + "ms", 10, 184, 1)
                text("Damage" + damage[cursor] + "/hit; one instant shot", 10, 196, 1)
                text("Base only; modules adjust battles.", 10, 208, 9)
            }
            if (screenId == "SHOP") {
                let effects = ["I: HP+22 speed-3 / II: HP+36 speed-5", "I: speed+6 shield-8 / II: speed+10 shield-14", "I: aim-2 speed-3 / II: aim-3 speed-5", "I: shield+16 delay2.5s / II:+28 delay2s regen8"]
                small(effects[cursor], 10, 165, 9)
            }
        }
        screen.fillRect(0, 222, 320, 18, 8)
        text("ARROWS choose  A/Z select  B/X back", 7, 226, 1)
        if (noticeTicks > 0) {
            screen.fillRect(5, 179, 310, 40, 8); screen.drawRect(5, 179, 310, 40, 5)
            wrapped(notice, 11, 185, 1, 36)
        } else if (saveDirty && screenId != "SAVE_WARNING") small("UNSAVED - Help: retry saving", 8, 215, 2)
    }
    //% blockHidden=true
    export function debugState(): string {
        let actors: string[] = []
        for (let b of bots) actors.push("{\"id\":" + b.id + ",\"side\":" + b.side + ",\"class\":\"" + classNames[b.kind] + "\",\"x\":" + b.x + ",\"y\":" + b.y + ",\"hp\":" + b.hp + ",\"shield\":" + b.shield + ",\"mode\":" + b.mode + ",\"target\":" + b.target + ",\"aim\":" + b.aim + ",\"diagnostic\":\"" + b.diagnostic + "\",\"duplicates\":" + b.duplicates + ",\"status\":\"" + b.status + "\"}")
        return "{\"screen\":\"" + screenId + "\",\"lesson\":" + lesson + ",\"policyTarget\":" + policyTarget + ",\"battle\":" + (battle + 1) + ",\"highestCleared\":" + highestCleared + ",\"wallet\":" + wallet + ",\"tick\":" + tick + ",\"trialVerdict\":\"" + trialVerdict + "\",\"outcome\":\"" + outcome + "\",\"saveDirty\":" + saveDirty + ",\"requestSerial\":" + requestSerial + ",\"actors\":[" + actors.join(",") + "]}"
    }
    //% blockHidden=true
    export function start(referenceDemo: boolean = false): void {
        if (started) return
        started = true
        isReferenceDemo = referenceDemo
        load()
        controller.up.onEvent(ControllerButtonEvent.Pressed, function () { moveCursor(-1) })
        controller.down.onEvent(ControllerButtonEvent.Pressed, function () { moveCursor(1) })
        controller.left.onEvent(ControllerButtonEvent.Pressed, function () { horizontal(-1) })
        controller.right.onEvent(ControllerButtonEvent.Pressed, function () { horizontal(1) })
        controller.A.onEvent(ControllerButtonEvent.Pressed, function () { confirm() })
        controller.B.onEvent(ControllerButtonEvent.Pressed, function () { back() })
        game.onUpdateInterval(50, function () {
            if (noticeTicks > 0) noticeTicks--
            if (screenId == "LIVE") physicsStep()
            else if (screenId == "COUNTDOWN") { countdown--; if (countdown <= 0) go("LIVE") }
            else if (screenId == "TRAIN_RUNNING") {
                trialAnimation++
                if (trialAnimation >= 30) { trialAnimation = 0; trialIndex++; if (trialIndex >= trialModes.length) go("TRAIN_RESULT") }
            }
        })
        game.onPaint(function () {
            if (screenId == "LIVE" || screenId == "COUNTDOWN") drawArena()
            else if (screenId == "TRAIN_RUNNING") drawTrial()
            else drawMenu()
        })
    }
}














