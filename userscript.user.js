// ==UserScript==
// @name         Krunker.io Public ESP Hack
// @description  Krunker.io ESP Hack
// @updateURL    https://github.com/xF4b3r/krunker/raw/master/userscript.user.js
// @downloadURL  https://github.com/xF4b3r/krunker/raw/master/userscript.user.js
// @version      1.4
// @author       Faber
// @match        *://krunker.io/*
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

stop()
document.innerHTML = ""
function setHooks(hack) {
    hack = {
        canvas: null,
        ctx: null,
        hooks: {
            entities: [],
            world: null
        },
        getDistance3D(x1, y1, z1, x2, y2, z2) {
            const dx = x1 - x2
            const dy = y1 - y2
            const dz = z1 - z2
            return Math.sqrt(dx * dx + dy * dy + dz * dz)
        },
        createCanvas() {
            const hookedCanvas = document.createElement("canvas")
            hookedCanvas.id = "hookedcv"
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
        },
        drawText(txt, font, color, x, y) {
            this.ctx.save()
            this.ctx.translate(x, y)
            this.ctx.beginPath()
            this.ctx.fillStyle = color
            this.ctx.font = font
            this.ctx.fillText(txt, 0, 0)
            this.ctx.closePath()
            this.ctx.restore()
        },
        getMyself() {
            return this.hooks.entities.find(x => x.isYou)
        },
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
        },
        render() {
            this.ctx.clearRect(0, 0, innerWidth, innerHeight)
            this.drawESP()
            requestAnimationFrame(this.render.bind(this))
        },
        onLoad() {
            window.playerInfos.style.width = "0%"
            hack.createCanvas()
        }
    }
    hack.onLoad()
    return hack
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
            .replace(/(function\(\w+,(\w+),\w+,\w+,\w+,\w+,\w+\){var \w+,\w+,\w+;window\.hack\.hooks\.entities=\[\];)/, "$1window.hack.hooks.world=$2;")
            .replace(/(\w+\.style\.left=)100\*(\w+\.\w+)\+"%",/, '$1$2*innerWidth+"px",window.hack.hooks.entities[i].hookedX=$2*innerWidth,')
            .replace(/(\w+\.style\.top=)100\*\(1-(\w+\.\w+)\)\+"%",/, '$1(1-$2)*innerHeight+"px",window.hack.hooks.entities[i].hookedY=(1-$2)*innerHeight,')
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://krunker.io/",
            onload: res => {
                let html = res.responseText
                html = html.replace(' src="js/game.js">', `>${setHooks.toString()}\nwindow.hack = setHooks({})\n${code.toString()}`);
                document.open()
                document.write(html)
                document.close()
            }
        });
    }
});
