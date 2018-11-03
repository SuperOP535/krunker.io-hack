// ==UserScript==
// @name         Krunker.io Public ESP Hack
// @description  Krunker.io ESP Hack
// @updateURL    https://github.com/xF4b3r/krunker/raw/master/userscript.user.js
// @downloadURL  https://github.com/xF4b3r/krunker/raw/master/userscript.user.js
// @version      1.6
// @author       Faber
// @match        *://krunker.io/*
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

stop()
document.innerHTML = ""
function setHooks(hack) {
    hack = {
		//me: null,
		camera: null, inputs: null, game: null,
		fps: 0,
		fpsTimes: [],
		fpsCounter: null,
        canvas: null,
        ctx: null,
        hooks: {
            entities: [],
            world: null,
			context: null,
			config: null
        },
		active: {},
		settings: {
			bhop: true,
			fpsCounter: true,
			autoAim: true, //false
			autoAimToggle: false,
			autoAimMode: 3, //0
			autoAimUseWeaponRange: true, //false
			autoAimWalls: false,
			aimSettings: true, //false
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
		createFPSCounter() {
			if (!this.settings.fpsCounter) return;
			var e = document.createElement("div");
			e.id = "fpsCounter",
			e.style.position = "absolute",
			e.style.color = "white",
			e.style.top = "0px",
			e.style.left = "20px",
			e.style.fontSize = "smaller",
			e.innerHTML = "Fps: " + this.fps;
			this.fpsCounter = e;
			var n = document.getElementById("gameUI");
			n.appendChild(e, n);
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
		drawFPS() {
			const t = performance.now();
			for (; this.fpsTimes.length > 0 && this.fpsTimes[0] <= t - 1e3; )
				this.fpsTimes.shift();
			this.fpsTimes.push(t),
			this.fps = this.fpsTimes.length,
			this.fpsCounter.innerHTML = "Fps: " + this.fps;
		},
		bhop() {
			if (!this.settings.bhop) return;
			if (this.camera.keys && this.camera.moveDir != null) {
				this.camera.keys[this.camera.jumpKey] = !this.camera.keys[this.camera.jumpKey];
			}
		},
		AutoAim: {
			initialized: false,
			
			init: function()
			{
				this.initialized = true;
				this.changeSettings();
				hack.camera.camLookAt = function (x, y, z) {
					if (!x)
						this.aimTarget = null;
					else {
						var a = hack.AutoAim.getXDir(this["object"].position.x, this["object"].position.y, this["object"]["position"].z, x, y, z),
						h = hack.AutoAim.getDirection(this["object"].position.z, this["object"].position.x, z, x);
						this.aimTarget = {
							xD: a,
							yD: h,				
							x: x + hack.hooks.config.camChaseDst * Math.sin(h) * Math.cos(a),
							y: y - hack.hooks.config.camChaseDst * Math.sin(a),
							z: z + hack.hooks.config.camChaseDst * Math.cos(h) * Math.cos(a)
						}
					}
				};
				hack.camera.updateOld = hack.camera.update;
				hack.camera.update = function () {
					if (!this["target"] && this["aimTarget"]) {
						if (hack.settings.autoAim) {
							this["object"].rotation.y = this["aimTarget"].yD;
							this["pitchObject"].rotation.x = this["aimTarget"].xD
						}
						var c = Math.PI / 2;
						this["pitchObject"].rotation.x = Math.max(-c, Math.min(c, this["pitchObject"].rotation.x));
						this.yDr = (this["pitchObject"].rotation.x % Math.PI2).round(3);
						this.xDr = (this["object"].rotation.y % Math.PI2)["round"](3)
					}
					let ret = this.updateOld.apply(this, arguments);
					return ret
				};
				hack.camera.resetOld = hack.camera.reset;
				hack.camera.reset = function () {
					this.aimTarget = null;
					let ret = this.resetOld.apply(this, arguments);
					return ret
				}
			},
			
			loop: function()
			{
				if (!hack.settings.autoAim)
				{
					return this.disable();
				}
				
				if (!this.initialized) 
				{
					this.init();
				}
				
				hack.active.autoAim = true;
				
				const target = this.getTarget();
				
				if (target) {
					if (hack.settings.autoAimMode == 3 && hack.me.aimVal == 1)
					{
						hack.camera.camLookAt(null);
						return;
					}
					target.y -= (hack.me.recoilAnimY * hack.hooks.config.recoilMlt) * 25;
					hack.camera.camLookAt(
						target.x,
						target.y + target.height - ((hack.hooks.config.headScale / 3) * 2) - (hack.hooks.config.crouchDst * target.crouchVal),
						//target.y + hack.hooks.config.playerHeight - ((hack.hooks.config.headScale / 3) * 2) - hack.hooks.config.crouchDst * target.crouchVal,
						target.z)//,
						//target.x2 - target.x1 - hack.me.xVel, target.y2 - target.y1 - hack.me.yVel, target.z2 - target.z1 - hack.me.zVel);
						
					if (hack.settings.autoAimMode == 1) //TriggerBot
					{
						if (hack.camera.mouseDownR != 1) 
						{
							//hack.camera.mouseDownL = !hack.camera.mouseDownL;
							hack.camera.mouseDownR = 1;
						} 
						else 
						{
							hack.camera.mouseDownL = hack.camera.mouseDownL == 1 ? 0 : 1;//!hack.camera.mouseDownL;
						}
					} 
					else if (hack.settings.autoAimMode == 2)//Auto Quickscope
					{
						hack.camera.mouseDownR = 1
						if (hack.me.aimVal === 0) {
							if (hack.camera.mouseDownL === 0) {
								hack.camera.mouseDownL = 1 // quickscope
							} else {
								hack.camera.mouseDownR = 0
								hack.camera.mouseDownL = 0
							}
						}
					}
				} else {
					hack.camera.camLookAt(null);

					if (hack.settings.autoAimMode == 1) 
					{
						hack.camera.mouseDownL = 0;
						if (hack.camera.mouseDownR != 0) 
						{
							hack.camera.mouseDownR = 0;
						}
					} 
					else if (hack.settings.autoAimMode == 2) 
					{
						hack.camera.mouseDownR = 0
						hack.camera.mouseDownL = 0
					}
				}
			}, 
			
			changeSettings: function()
			{
				if (hack.settings.aimSettings)
				{
					hack.hooks.config.camChaseTrn = 0.05
					hack.hooks.config.camChaseSpd = 15000000
					hack.hooks.config.camChaseSen = 15000000
					hack.hooks.config.camChaseDst = 0
				}
				else
				{
					hack.hooks.config.camChaseTrn = .0022
					hack.hooks.config.camChaseSpd = .0012
					hack.hooks.config.camChaseSen = .2
					hack.hooks.config.camChaseDst = 24
				}
			},
			
			getDistance3D: function(x1, y1, z1, x2, y2, z2)
			{
				var dx = x1 - x2
				var dy = y1 - y2
				var dz = z1 - z2
				return Math.sqrt(dx * dx + dy * dy + dz * dz)
			},
			
			randFloat: function (t, e) 
			{
				return t + Math.random() * (e - t)
			},
			
			getDirection: function (t, e, n, r) 
			{
				return Math.atan2(e - r, t - n)
			},
			
			getXDir: function (e, n, r, i, a, s) 
			{
				var o = Math.abs(n - a),
				c = this.getDistance3D(e, n, r, i, a, s);
				return Math.asin(o / c) * (n > a ? -1 : 1)
			},

			getTarget: function()
			{
				let target = null;
				let bestDist = this.getRange();
				for (const player of hack.hooks.entities.filter(x => !x.isYou)) {
					if ((player.notObstructed || hack.settings.autoAimWalls) && player.active) 
					{
						if (hack.me.team && hack.me.team == player.team) 
						{
							continue;
						}

						let dist = this.getDistance3D(hack.me.x, hack.me.y, hack.me.z, player.x, player.y, player.z);
						if (dist < bestDist) 
						{
							bestDist = dist;
							target = player;
						}
					}
				}
				
				return target;
			},
			
			getDistFromPlayer: function(player)
			{
				return Math.floor(hack.me ? this.getDistance3D(hack.me.x, hack.me.y, hack.me.z, player.x, player.y, player.z) : 0);
			},

			getMyself: function() 
			{
				return hack.getMyself()
			},
			
			getRange: function()
			{
				if (hack.settings.autoAimUseWeaponRange && hack.me.weapon.range)
				{
					return hack.me.weapon.range + 25;
				}
				
				return 9999;
			},
			
			disable: function()
			{
				if (!hack.active.autoAim)
				{
					return;
				}
				
				hack.active.autoAim = !true;
			}
		},
        render() {
            this.ctx.clearRect(0, 0, innerWidth, innerHeight)
            this.drawESP()
			this.drawFPS()
            requestAnimationFrame(this.render.bind(this))
        },
		loop(camera, me, inputs, game, socket = null, u = null) {
			this.me = me; //later
			this.camera = camera;
			this.game = game;
			this.inputs = inputs;
			//this.u = u; //later
			
			this.bhop();
			this.AutoAim.loop();
		},
        onLoad() {
			this.active = this.settings;
            window.playerInfos.style.width = "0%"
            hack.createCanvas()
			hack.createFPSCounter()
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
			.replace(/"mousemove",function\((\w+)\){if\((\w+)\.enabled/, '"mousemove",function($1){window.hack.hooks.context = $2;if($2.enabled')
			.replace(/(\w+).processInput\((\w+),(\w+)\),(\w+).moveCam/, 'window.hack.loop($4, $1, $2, $3), $1.processInput($2,$3),$4.moveCam')
			.replace(/(\w+).exports\.ambientVal/, 'window.hack.hooks.config = $1.exports, $1.exports.ambientVal')
		
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
