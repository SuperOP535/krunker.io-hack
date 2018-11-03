// ==UserScript==
// @name         Krunker.io Public ESP Hack
// @description  Krunker.io ESP Hack
// @updateURL    https://github.com/xF4b3r/krunker/raw/master/userscript.user.js
// @downloadURL  https://github.com/xF4b3r/krunker/raw/master/userscript.user.js
// @version      1.8
// @author       Faber, collaborators: William Thomson, Tehchy
// @match        *://krunker.io/*
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

window.stop()
document.innerHTML = ""

class Hack {
    constructor() {
        this.camera = null
        this.inputs = null
        this.game = null
        this.fps = 0
        this.fpsTimes = []
        this.fpsCounter = null
        this.canvas = null
        this.ctx = null
        this.hooks = {
            entities: [],
            world: null,
            context: null,
            config: null
        }
        this.active = {}
        this.settings = {
            bhop: false,
            fpsCounter: true,
            autoAim: true,
            autoAimToggle: false,
            autoAimMode: 3,
            autoAimUseWeaponRange: true,
            autoAimWalls: false,
            aimSettings: true,
        }
        this.aimbot = {initialized: false}
        this.onLoad()
    }

    getDistance3D(x1, y1, z1, x2, y2, z2) {
        const dx = x1 - x2
        const dy = y1 - y2
        const dz = z1 - z2
        return Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    createCanvas() {
        const hookedCanvas = document.createElement("canvas")
        hookedCanvas.width = innerWidth
        hookedCanvas.height = innerHeight
        window.onresize = () => {
            hookedCanvas.width = innerWidth
            hookedCanvas.height = innerHeight
        }
        this.canvas = hookedCanvas
        this.ctx = hookedCanvas.getContext("2d")
        const hookedUI = document.getElementById("inGameUI")
        hookedUI.insertAdjacentElement("beforeend", hookedCanvas)
        requestAnimationFrame(this.render.bind(this))
    }

    createFPSCounter() {
        if (!this.settings.fpsCounter) return
        const el = document.createElement("div")
        el.id = "fpsCounter"
        el.style.position = "absolute"
        el.style.color = "white"
        el.style.top = "0px"
        el.style.left = "20px"
        el.style.fontSize = "smaller"
        el.innerHTML = `Fps: ${this.fps}`
        this.fpsCounter = el
        const ui = document.getElementById("gameUI")
        ui.appendChild(el, ui)
    }

    drawText(txt, font, color, x, y) {
        this.ctx.save()
        this.ctx.translate(x, y)
        this.ctx.beginPath()
        this.ctx.fillStyle = color
        this.ctx.font = font
        this.ctx.fillText(txt, 0, 0)
        this.ctx.closePath()
        this.ctx.restore()
    }

    getMyself() {
        return this.hooks.entities.find(x => x.isYou)
    }

    randFloat(t, e) {
        return t + Math.random() * (e - t)
    }

    getDirection(t, e, n, r) {
        return Math.atan2(e - r, t - n)
    }

    getXDir(e, n, r, i, a, s) {
        const o = Math.abs(n - a)
        const c = this.getDistance3D(e, n, r, i, a, s)
        return Math.asin(o / c) * (n > a ? -1 : 1)
    }

    getTarget() {
        let target = null
        let bestDist = this.getRange()
        for (const player of this.hooks.entities.filter(x => !x.isYou)) {
            if ((player.notObstructed || this.settings.autoAimWalls) && player.active) {
                if (this.me.team && this.me.team === player.team) continue
                let dist = this.getDistance3D(this.me.x, this.me.y, this.me.z, player.x, player.y, player.z)
                if (dist < bestDist) {
                    bestDist = dist
                    target = player
                }
            }
        }
        return target
    }

    getDistFromPlayer(player) {
        return Math.floor(this.me ? this.getDistance3D(this.me.x, this.me.y, this.me.z, player.x, player.y, player.z) : 0)
    }

    getRange() {
        if (this.settings.autoAimUseWeaponRange && this.me.weapon.range) return this.me.weapon.range + 25
        return 9999
    }

    drawESP() {
        for (const entity of this.hooks.entities.filter(x => !x.isYou)) {
            if (entity.active) {
                const me = this.hooks.world.camera.getWorldPosition()
                const target = entity.objInstances.position.clone()
                const dist = 1 - this.getDistance3D(me.x, me.y, me.z, target.x, target.y, target.z) / 600
                if (20 * dist >= 1 && this.hooks.world.frustum.containsPoint(target)) {
                    const scale = Math.max(.1, 1 - this.getDistance3D(me.x, me.y, me.z, target.x, target.y, target.z) / 600)
                    const targetX = entity.hookedX
                    const targetY = entity.hookedY + 60 * scale
                    const offsetX = 80
                    const offsetY = 180

                    this.ctx.save()
                    this.ctx.translate(targetX - (offsetX * scale / 2) - (40 * scale / 2), targetY - (offsetY * scale / 2))
                    this.ctx.beginPath()
                    this.ctx.fillStyle = "red"
                    this.ctx.rect(0, 0, 20 * scale, offsetY * scale)
                    this.ctx.stroke()
                    this.ctx.closePath()
                    this.ctx.restore()

                    this.ctx.save()
                    this.ctx.translate(targetX - (offsetX * scale / 2) - (40 * scale / 2), targetY - (offsetY * scale / 2))
                    this.ctx.beginPath()
                    this.ctx.fillStyle = "green"
                    this.ctx.rect(0, 0, 20 * scale, offsetY * scale)
                    this.ctx.fill()
                    this.ctx.closePath()
                    this.ctx.restore()

                    this.ctx.save()
                    this.ctx.translate(targetX - (offsetX * scale / 2) - (40 * scale / 2), targetY - (offsetY * scale / 2))
                    this.ctx.beginPath()
                    this.ctx.fillStyle = "red"
                    this.ctx.rect(0, 0, 20 * scale, (entity.maxHealth - entity.health) / entity.maxHealth * offsetY * scale)
                    this.ctx.fill()
                    this.ctx.closePath()
                    this.ctx.restore()

                    this.ctx.save()
                    this.ctx.translate(targetX - (offsetX * scale / 2), targetY - (offsetY * scale / 2))
                    this.ctx.beginPath()
                    this.ctx.fillStyle = "red"
                    this.ctx.rect(0, 0, offsetX * scale, offsetY * scale)
                    this.ctx.stroke()
                    this.ctx.closePath()
                    this.ctx.restore()

                    const fontSize = 26 * scale > 13 ? 13 : 26 * scale
                    this.drawText(`Name: ${entity.name}`, `${fontSize}px`, "green", targetX + (offsetX * scale / 2), targetY - (offsetY * scale / 2))
                    this.drawText(`Distance: ${~~this.getDistance3D(me.x, me.y, me.z, target.x, target.y, target.z)}`, `${fontSize}px`, "green", targetX + (offsetX * scale / 2), targetY - (offsetY * scale / 2) + 10)
                    this.drawText(`Health: ${entity.health}/${entity.maxHealth}`, `${fontSize}px`, "green", targetX + (offsetX * scale / 2), targetY - (offsetY * scale / 2) + 20)
                    this.drawText(`Weapon: ${entity.weapon.name}`, `${fontSize}px`, "green", targetX + (offsetX * scale / 2), targetY - (offsetY * scale / 2) + 30)
                    this.drawText(`Ammo: ${entity.ammos[0]}`, `${fontSize}px`, "green", targetX + (offsetX * scale / 2), targetY - (offsetY * scale / 2) + 40)

                    this.ctx.save()
                    this.ctx.lineWidth = 2
                    this.ctx.strokeStyle = entity.team === null ? "red" : this.getMyself().team === entity.team ? "green" : "red"
                    this.ctx.moveTo(innerWidth / 2, innerHeight - 1)
                    this.ctx.lineTo(targetX, targetY)
                    this.ctx.stroke()
                    this.ctx.restore()
                }
            }
        }
    }

    drawFPS() {
        const now = performance.now()
        for (; this.fpsTimes.length > 0 && this.fpsTimes[0] <= now - 1e3;) this.fpsTimes.shift()
        this.fpsTimes.push(now)
        this.fps = this.fpsTimes.length
        this.fpsCounter.innerHTML = `Fps: ${this.fps}`
    }

    bhop() {
        if (!this.settings.bhop) return
        if (this.camera.keys && this.camera.moveDir !== null) this.camera.keys[this.camera.jumpKey] = !this.camera.keys[this.camera.jumpKey]
    }

    initAimbot() {
        let self = this
        this.initialized = true
        this.changeSettings()
        this.camera.camLookAt = function(x, y, z) {
            if (!x) return void(this.aimTarget = null)
            const a = self.getXDir(this.object.position.x, this.object.position.y, this.object.position.z, x, y, z)
            const h = self.getDirection(this.object.position.z, this.object.position.x, z, x)
            this.aimTarget = {
                xD: a,
                yD: h,
                x: x + self.hooks.config.camChaseDst * Math.sin(h) * Math.cos(a),
                y: y - self.hooks.config.camChaseDst * Math.sin(a),
                z: z + self.hooks.config.camChaseDst * Math.cos(h) * Math.cos(a)
            }
        }
        this.camera.updateOld = this.camera.update
        this.camera.update = function() {
            if (!this.target && this.aimTarget) {
                if (self.settings.autoAim) {
                    this.object.rotation.y = this.aimTarget.yD
                    this.pitchObject.rotation.x = this.aimTarget.xD
                }
                const c = Math.PI / 2
                this.pitchObject.rotation.x = Math.max(-c, Math.min(c, this.pitchObject.rotation.x))
                this.yDr = (this.pitchObject.rotation.x % Math.PI2).round(3)
                this.xDr = (this.object.rotation.y % Math.PI2).round(3)
            }
            let ret = this.updateOld(...arguments)
            return ret
        }
        this.camera.resetOld = this.camera.reset
        this.camera.reset = function() {
            this.aimTarget = null
            let ret = this.resetOld(...arguments)
            return ret
        }
    }

    updateAimbot() {
        if (!this.settings.autoAim) {
            if (!this.active.autoAim) return
            this.active.autoAim = !true
            return
        }
        if (!this.initialized) this.initAimbot()
        this.active.autoAim = true
        const target = this.getTarget()
        if (target) {
            if (this.settings.autoAimMode === 3 && this.me.aimVal === 1) return void this.camera.camLookAt(null)
            target.y -= (this.me.recoilAnimY * this.hooks.config.recoilMlt) * 25
            this.camera.camLookAt(target.x, target.y + target.height - ((this.hooks.config.headScale / 3) * 2) - (this.hooks.config.crouchDst * target.crouchVal), target.z)
            if (this.settings.autoAimMode === 1) {
                if (this.camera.mouseDownR !== 1) {
                    this.camera.mouseDownR = 1
                } else {
                    this.camera.mouseDownL = this.camera.mouseDownL === 1 ? 0 : 1
                }
            } else if (this.settings.autoAimMode === 2) {
                this.camera.mouseDownR = 1
                if (this.me.aimVal === 0) {
                    if (this.camera.mouseDownL === 0) {
                        this.camera.mouseDownL = 1
                    } else {
                        this.camera.mouseDownR = 0
                        this.camera.mouseDownL = 0
                    }
                }
            }
        } else {
            this.camera.camLookAt(null)
            if (this.settings.autoAimMode === 1) {
                this.camera.mouseDownL = 0
                if (this.camera.mouseDownR !== 0) {
                    this.camera.mouseDownR = 0
                }
            } else if (this.settings.autoAimMode === 2) {
                this.camera.mouseDownR = 0
                this.camera.mouseDownL = 0
            }
        }
    }

    changeSettings() {
        if (this.settings.aimSettings) {
            this.hooks.config.camChaseTrn = 0.05
            this.hooks.config.camChaseSpd = 15000000
            this.hooks.config.camChaseSen = 15000000
            this.hooks.config.camChaseDst = 0
        } else {
            this.hooks.config.camChaseTrn = .0022
            this.hooks.config.camChaseSpd = .0012
            this.hooks.config.camChaseSen = .2
            this.hooks.config.camChaseDst = 24
        }
    }

    render() {
        this.ctx.clearRect(0, 0, innerWidth, innerHeight)
        this.drawESP()
        this.drawFPS()
        requestAnimationFrame(this.render.bind(this))
    }

    loop(camera, me, inputs, game, socket = null, u = null) {
        this.me = me
        this.camera = camera
        this.game = game
        this.inputs = inputs
        this.bhop()
        this.updateAimbot()
    }

    onLoad() {
        this.active = this.settings
        window.playerInfos.style.width = "0%"
        this.createCanvas()
        this.createFPSCounter()
    }
}

GM_xmlhttpRequest({
    method: "GET",
    url: "https://krunker.io/js/game.js",
    onload: res => {
        let code = res.responseText
        code = code.replace(/String\.prototype\.escape=function\(\){(.*)\)},(Number\.)/, "$2")
            .replace(/if\(\w+\.notObstructed\){/, "")
            .replace(/}else \w+\.style\.display="none"/, "")
            .replace(/(\bthis\.list\b)/g, "window.hack.hooks.entities")
            .replace(/\w+\.players\.list/g, "window.hack.hooks.entities")
            .replace(/(function\(\w+,(\w+),\w+,\w+,\w+,\w+,\w+\){var \w+,\w+,\w+;window\.hack\.hooks\.entities=\[\])/, "$1;window.hack.hooks.world=$2")
            .replace(/(\w+\.style\.left=)100\*(\w+\.\w+)\+"%",/, '$1$2*innerWidth+"px",window.hack.hooks.entities[i].hookedX=$2*innerWidth,')
            .replace(/(\w+\.style\.top=)100\*\(1-(\w+\.\w+)\)\+"%",/, '$1(1-$2)*innerHeight+"px",window.hack.hooks.entities[i].hookedY=(1-$2)*innerHeight,')
            .replace(/"mousemove",function\((\w+)\){if\((\w+)\.enabled/, '"mousemove",function($1){window.hack.hooks.context = $2;if($2.enabled')
            .replace(/(\w+).processInput\((\w+),(\w+)\),(\w+).moveCam/, 'window.hack.loop($4, $1, $2, $3), $1.processInput($2,$3),$4.moveCam')
            .replace(/(\w+).exports\.ambientVal/, 'window.hack.hooks.config = $1.exports, $1.exports.ambientVal')

        GM_xmlhttpRequest({
            method: "GET",
            url: "https://krunker.io/",
            onload: res => {
                let html = res.responseText
                html = html.replace(' src="js/game.js">', `>${Hack.toString()}\nwindow.hack = new Hack()\n${code.toString()}`)
                document.open()
                document.write(html)
                document.close()
            }
        })
    }
})
