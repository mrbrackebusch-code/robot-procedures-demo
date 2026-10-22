// Complete Robot Functions reference; P02 teaching design adapted for this native project.
// Same persistent MakeCode project; no world source is learner-authored.

function attack(robot: number) {
    arenaLab.issueOrder(robot, arenaLab.OrderMode.Engage)
}

function retreat(robot: number) {
    arenaLab.issueOrder(robot, arenaLab.OrderMode.Withdraw)
}

function protect(robot: number) {
    arenaLab.issueOrder(robot, arenaLab.OrderMode.Protect)
}

function inDanger(robot: number, shieldLimit: number): boolean {
    return arenaLab.shieldPoints(robot) < shieldLimit && arenaLab.enemyDistance(robot) < 50
}

function chooseAction(robot: number, shieldLimit: number, guardDuty: boolean) {
    if (inDanger(robot, shieldLimit)) {
        retreat(robot)
    } else if (guardDuty) {
        protect(robot)
    } else {
        attack(robot)
    }
}

function planRobot(robot: number) {
    if (arenaLab.isGuard(robot)) {
        chooseAction(robot, 18, true)
    } else {
        chooseAction(robot, 12, false)
    }
}

arenaLab.onPlan(function (robot: number) {
    planRobot(robot)
})
