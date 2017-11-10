/*
 * JQuery zTree excheck v3.5.17-beta.2
 * http://zTree.me/
 *
 * Copyright (c) 2010 Hunter.z
 *
 * Licensed same as jquery - MIT License
 * http://www.opensource.org/licenses/mit-license.php
 *
 * email: hunter.z@263.net
 * Date: 2014-05-08
 */
(function(m) {
	var p, q, r, o = {
			event: {
				CHECK: "ztree_check"
			},
			id: {
				CHECK: "_check"
			},
			checkbox: {
				STYLE: "checkbox",
				DEFAULT: "chk",
				DISABLED: "disable",
				FALSE: "false",
				TRUE: "true",
				FULL: "full",
				PART: "part",
				FOCUS: "focus"
			},
			radio: {
				STYLE: "radio",
				TYPE_ALL: "all",
				TYPE_LEVEL: "level"
			}
		},
		v = {
			check: {
				enable: !1,
				autoCheckTrigger: !1,
				chkStyle: o.checkbox.STYLE,
				nocheckInherit: !1,
				chkDisabledInherit: !1,
				radioType: o.radio.TYPE_LEVEL,
				chkboxType: {
					Y: "ps",
					N: "ps"
				}
			},
			data: {
				key: {
					checked: "checked"
				}
			},
			callback: {
				beforeCheck: null,
				onCheck: null
			}
		};
	p = function(c,
		a) {
		if (a.chkDisabled === !0) return !1;
		var b = f.getSetting(c.data.treeId),
			d = b.data.key.checked;
		if (k.apply(b.callback.beforeCheck, [b.treeId, a], !0) == !1) return !0;
		a[d] = !a[d];
		e.checkNodeRelation(b, a);
		d = n(a, j.id.CHECK, b);
		e.setChkClass(b, d, a);
		e.repairParentChkClassWithSelf(b, a);
		b.treeObj.trigger(j.event.CHECK, [c, b.treeId, a]);
		return !0
	};
	q = function(c, a) {
		if (a.chkDisabled === !0) return !1;
		var b = f.getSetting(c.data.treeId),
			d = n(a, j.id.CHECK, b);
		a.check_Focus = !0;
		e.setChkClass(b, d, a);
		return !0
	};
	r = function(c, a) {
		if (a.chkDisabled ===
			!0) return !1;
		var b = f.getSetting(c.data.treeId),
			d = n(a, j.id.CHECK, b);
		a.check_Focus = !1;
		e.setChkClass(b, d, a);
		return !0
	};
	m.extend(!0, m.fn.zTree.consts, o);
	m.extend(!0, m.fn.zTree._z, {
		tools: {},
		view: {
			checkNodeRelation: function(c, a) {
				var b, d, h, i = c.data.key.children,
					l = c.data.key.checked;
				b = j.radio;
				if (c.check.chkStyle == b.STYLE) {
					var g = f.getRadioCheckedList(c);
					if (a[l])
						if (c.check.radioType == b.TYPE_ALL) {
							for (d = g.length - 1; d >= 0; d--) b = g[d], b[l] && b != a && (b[l] = !1, g.splice(d, 1), e.setChkClass(c, n(b, j.id.CHECK, c), b), b.parentTId !=
								a.parentTId && e.repairParentChkClassWithSelf(c, b));
							g.push(a)
						} else {
							g = a.parentTId ? a.getParentNode() : f.getRoot(c);
							for (d = 0, h = g[i].length; d < h; d++) b = g[i][d], b[l] && b != a && (b[l] = !1, e.setChkClass(c, n(b, j.id.CHECK, c), b))
						}
					else if (c.check.radioType == b.TYPE_ALL)
						for (d = 0, h = g.length; d < h; d++)
							if (a == g[d]) {
								g.splice(d, 1);
								break
							}
				} else a[l] && (!a[i] || a[i].length == 0 || c.check.chkboxType.Y.indexOf("s") > -1) && e.setSonNodeCheckBox(c, a, !0), !a[l] && (!a[i] || a[i].length == 0 || c.check.chkboxType.N.indexOf("s") > -1) && e.setSonNodeCheckBox(c,
					a, !1), a[l] && c.check.chkboxType.Y.indexOf("p") > -1 && e.setParentNodeCheckBox(c, a, !0), !a[l] && c.check.chkboxType.N.indexOf("p") > -1 && e.setParentNodeCheckBox(c, a, !1)
			},
			makeChkClass: function(c, a) {
				var b = c.data.key.checked,
					d = j.checkbox,
					h = j.radio,
					i = "",
					i = a.chkDisabled === !0 ? d.DISABLED : a.halfCheck ? d.PART : c.check.chkStyle == h.STYLE ? a.check_Child_State < 1 ? d.FULL : d.PART : a[b] ? a.check_Child_State === 2 || a.check_Child_State === -1 ? d.FULL : d.PART : a.check_Child_State < 1 ? d.FULL : d.PART,
					b = c.check.chkStyle + "_" + (a[b] ? d.TRUE : d.FALSE) +
					"_" + i,
					b = a.check_Focus && a.chkDisabled !== !0 ? b + "_" + d.FOCUS : b;
				return j.className.BUTTON + " " + d.DEFAULT + " " + b
			},
			repairAllChk: function(c, a) {
				if (c.check.enable && c.check.chkStyle === j.checkbox.STYLE)
					for (var b = c.data.key.checked, d = c.data.key.children, h = f.getRoot(c), i = 0, l = h[d].length; i < l; i++) {
						var g = h[d][i];
						g.nocheck !== !0 && g.chkDisabled !== !0 && (g[b] = a);
						e.setSonNodeCheckBox(c, g, a)
					}
			},
			repairChkClass: function(c, a) {
				if (a && (f.makeChkFlag(c, a), a.nocheck !== !0)) {
					var b = n(a, j.id.CHECK, c);
					e.setChkClass(c, b, a)
				}
			},
			repairParentChkClass: function(c,
				a) {
				if (a && a.parentTId) {
					var b = a.getParentNode();
					e.repairChkClass(c, b);
					e.repairParentChkClass(c, b)
				}
			},
			repairParentChkClassWithSelf: function(c, a) {
				if (a) {
					var b = c.data.key.children;
					a[b] && a[b].length > 0 ? e.repairParentChkClass(c, a[b][0]) : e.repairParentChkClass(c, a)
				}
			},
			repairSonChkDisabled: function(c, a, b, d) {
				if (a) {
					var h = c.data.key.children;
					if (a.chkDisabled != b) a.chkDisabled = b;
					e.repairChkClass(c, a);
					if (a[h] && d)
						for (var i = 0, l = a[h].length; i < l; i++) e.repairSonChkDisabled(c, a[h][i], b, d)
				}
			},
			repairParentChkDisabled: function(c,
				a, b, d) {
				if (a) {
					if (a.chkDisabled != b && d) a.chkDisabled = b;
					e.repairChkClass(c, a);
					e.repairParentChkDisabled(c, a.getParentNode(), b, d)
				}
			},
			setChkClass: function(c, a, b) {
				a && (b.nocheck === !0 ? a.hide() : a.show(), a.attr("class", e.makeChkClass(c, b)),((a.attr('class') && a.attr('class').indexOf("true") >=0) ? a.parent().addClass('curSelectedNodeP') : a.parent().removeClass('curSelectedNodeP')))
			},
			setParentNodeCheckBox: function(c, a, b, d) {
				var h = c.data.key.children,
					i = c.data.key.checked,
					l = n(a, j.id.CHECK, c);
				d || (d = a);
				f.makeChkFlag(c, a);
				a.nocheck !== !0 && a.chkDisabled !== !0 && (a[i] = b, e.setChkClass(c, l, a), c.check.autoCheckTrigger && a != d && c.treeObj.trigger(j.event.CHECK, [null, c.treeId,
					a
				]));
				if (a.parentTId) {
					l = !0;
					if (!b)
						for (var h = a.getParentNode()[h], g = 0, k = h.length; g < k; g++)
							if (h[g].nocheck !== !0 && h[g].chkDisabled !== !0 && h[g][i] || (h[g].nocheck === !0 || h[g].chkDisabled === !0) && h[g].check_Child_State > 0) {
								l = !1;
								break
							}
					l && e.setParentNodeCheckBox(c, a.getParentNode(), b, d)
				}
			},
			setSonNodeCheckBox: function(c, a, b, d) {
				if (a) {
					var h = c.data.key.children,
						i = c.data.key.checked,
						l = n(a, j.id.CHECK, c);
					d || (d = a);
					var g = !1;
					if (a[h])
						for (var k = 0, m = a[h].length; k < m && a.chkDisabled !== !0; k++) {
							var o = a[h][k];
							e.setSonNodeCheckBox(c,
								o, b, d);
							o.chkDisabled === !0 && (g = !0)
						}
					if (a != f.getRoot(c) && a.chkDisabled !== !0) {
						g && a.nocheck !== !0 && f.makeChkFlag(c, a);
						if (a.nocheck !== !0 && a.chkDisabled !== !0) {
							if (a[i] = b, !g) a.check_Child_State = a[h] && a[h].length > 0 ? b ? 2 : 0 : -1
						} else a.check_Child_State = -1;
						e.setChkClass(c, l, a);
						c.check.autoCheckTrigger && a != d && a.nocheck !== !0 && a.chkDisabled !== !0 && c.treeObj.trigger(j.event.CHECK, [null, c.treeId, a])
					}
				}
			}
		},
		event: {},
		data: {
			getRadioCheckedList: function(c) {
				for (var a = f.getRoot(c).radioCheckedList, b = 0, d = a.length; b < d; b++) f.getNodeCache(c,
					a[b].tId) || (a.splice(b, 1), b--, d--);
				return a
			},
			getCheckStatus: function(c, a) {
				if (!c.check.enable || a.nocheck || a.chkDisabled) return null;
				var b = c.data.key.checked;
				return {
					checked: a[b],
					half: a.halfCheck ? a.halfCheck : c.check.chkStyle == j.radio.STYLE ? a.check_Child_State === 2 : a[b] ? a.check_Child_State > -1 && a.check_Child_State < 2 : a.check_Child_State > 0
				}
			},
			getTreeCheckedNodes: function(c, a, b, d) {
				if (!a) return [];
				for (var h = c.data.key.children, i = c.data.key.checked, e = b && c.check.chkStyle == j.radio.STYLE && c.check.radioType == j.radio.TYPE_ALL,
						d = !d ? [] : d, g = 0, k = a.length; g < k; g++) {
					if (a[g].nocheck !== !0 && a[g].chkDisabled !== !0 && a[g][i] == b && (d.push(a[g]), e)) break;
					f.getTreeCheckedNodes(c, a[g][h], b, d);
					if (e && d.length > 0) break
				}
				return d
			},
			getTreeCheckedNodesNotChildren: function(c, a, b, d) {
				if (!a) return [];
				for (var h = c.data.key.children, i = c.data.key.checked, e = b && c.check.chkStyle == j.radio.STYLE && c.check.radioType == j.radio.TYPE_ALL,
						d = !d ? [] : d, g = 0, k = a.length; g < k; g++) {
					if (a[g].nocheck !== !0 && a[g].chkDisabled !== !0 && a[g][i] == b && (d.push($.extend(true,[],a[g],{children:null})), e)) break;
					f.getTreeCheckedNodesNotChildren(c, a[g][h], b, d);
					if (e && d.length > 0) break
				}
				return d
			},
			getTreeChangeCheckedNodes: function(c, a, b) {
				if (!a) return [];
				for (var d = c.data.key.children, h = c.data.key.checked, b = !b ? [] : b, i = 0, e = a.length; i < e; i++) a[i].nocheck !== !0 && a[i].chkDisabled !== !0 && a[i][h] != a[i].checkedOld && b.push(a[i]), f.getTreeChangeCheckedNodes(c, a[i][d], b);
				return b
			},
			makeChkFlag: function(c, a) {
				if (a) {
					var b = c.data.key.children,
						d = c.data.key.checked,
						h = -1;
					if (a[b])
						for (var i = 0, e = a[b].length; i < e; i++) {
							var g = a[b][i],
								f = -1;
							if (c.check.chkStyle == j.radio.STYLE)
								if (f = g.nocheck === !0 || g.chkDisabled === !0 ? g.check_Child_State : g.halfCheck === !0 ? 2 : g[d] ? 2 : g.check_Child_State > 0 ? 2 : 0, f == 2) {
									h = 2;
									break
								} else f == 0 && (h = 0);
							else if (c.check.chkStyle == j.checkbox.STYLE)
								if (f = g.nocheck === !0 || g.chkDisabled === !0 ? g.check_Child_State : g.halfCheck === !0 ? 1 : g[d] ? g.check_Child_State === -1 || g.check_Child_State === 2 ? 2 : 1 : g.check_Child_State > 0 ? 1 : 0, f === 1) {
									h = 1;
									break
								} else if (f ===
								2 && h > -1 && i > 0 && f !== h) {
								h = 1;
								break
							} else if (h === 2 && f > -1 && f < 2) {
								h = 1;
								break
							} else f > -1 && (h = f)
						}
					a.check_Child_State = h
				}
			}
		}
	});
	var m = m.fn.zTree,
		k = m._z.tools,
		j = m.consts,
		e = m._z.view,
		f = m._z.data,
		n = k.$;
	f.exSetting(v);
	f.addInitBind(function(c) {
		c.treeObj.bind(j.event.CHECK, function(a, b, d, h) {
			a.srcEvent = b;
			k.apply(c.callback.onCheck, [a, d, h])
		})
	});
	f.addInitUnBind(function(c) {
		c.treeObj.unbind(j.event.CHECK)
	});
	f.addInitCache(function() {});
	f.addInitNode(function(c, a, b, d) {
		if (b) {
			a = c.data.key.checked;
			typeof b[a] == "string" && (b[a] =
				k.eqs(b[a], "true"));
			b[a] = !!b[a];
			b.checkedOld = b[a];
			if (typeof b.nocheck == "string") b.nocheck = k.eqs(b.nocheck, "true");
			b.nocheck = !!b.nocheck || c.check.nocheckInherit && d && !!d.nocheck;
			if (typeof b.chkDisabled == "string") b.chkDisabled = k.eqs(b.chkDisabled, "true");
			b.chkDisabled = !!b.chkDisabled || c.check.chkDisabledInherit && d && !!d.chkDisabled;
			if (typeof b.halfCheck == "string") b.halfCheck = k.eqs(b.halfCheck, "true");
			b.halfCheck = !!b.halfCheck;
			b.check_Child_State = -1;
			b.check_Focus = !1;
			b.getCheckStatus = function() {
				return f.getCheckStatus(c,
					b)
			};
			c.check.chkStyle == j.radio.STYLE && c.check.radioType == j.radio.TYPE_ALL && b[a] && f.getRoot(c).radioCheckedList.push(b)
		}
	});
	f.addInitProxy(function(c) {
		var a = c.target,
			b = f.getSetting(c.data.treeId),
			d = "",
			h = null,
			e = "",
			l = null;
		if (k.eqs(c.type, "mouseover")) {
			if (b.check.enable && k.eqs(a.tagName, "span") && a.getAttribute("treeNode" + j.id.CHECK) !== null) d = k.getNodeMainDom(a).id, e = "mouseoverCheck"
		} else if (k.eqs(c.type, "mouseout")) {
			if (b.check.enable && k.eqs(a.tagName, "span") && a.getAttribute("treeNode" + j.id.CHECK) !== null) d =
				k.getNodeMainDom(a).id, e = "mouseoutCheck"
		} else if (k.eqs(c.type, "click") && b.check.enable && k.eqs(a.tagName, "span") && a.getAttribute("treeNode" + j.id.CHECK) !== null) d = k.getNodeMainDom(a).id, e = "checkNode";
		if (d.length > 0) switch (h = f.getNodeCache(b, d), e) {
			case "checkNode":
				l = p;
				break;
			case "mouseoverCheck":
				l = q;
				break;
			case "mouseoutCheck":
				l = r
		}
		return {
			stop: e === "checkNode",
			node: h,
			nodeEventType: e,
			nodeEventCallback: l,
			treeEventType: "",
			treeEventCallback: null
		}
	}, !0);
	f.addInitRoot(function(c) {
		f.getRoot(c).radioCheckedList = []
	});
	f.addBeforeA(function(c, a, b) {
		c.check.enable && (f.makeChkFlag(c, a), b.push("<span ID='", a.tId, j.id.CHECK, "' class='", e.makeChkClass(c, a), "' treeNode", j.id.CHECK, a.nocheck === !0 ? " style='display:none;'" : "", "></span>"))
	});
	f.addZTreeTools(function(c, a) {
		a.checkNode = function(a, b, c, f) {
			var g = this.setting.data.key.checked;
			if (a.chkDisabled !== !0 && (b !== !0 && b !== !1 && (b = !a[g]), f = !!f, (a[g] !== b || c) && !(f && k.apply(this.setting.callback.beforeCheck, [this.setting.treeId, a], !0) == !1) && k.uCanDo(this.setting) && this.setting.check.enable &&
					a.nocheck !== !0)) a[g] = b, b = n(a, j.id.CHECK, this.setting), (c || this.setting.check.chkStyle === j.radio.STYLE) && e.checkNodeRelation(this.setting, a), e.setChkClass(this.setting, b, a), e.repairParentChkClassWithSelf(this.setting, a), f && this.setting.treeObj.trigger(j.event.CHECK, [null, this.setting.treeId, a])
		};
		a.checkAllNodes = function(a) {
			e.repairAllChk(this.setting, !!a)
		};
		a.getCheckedNodes = function(a) {
			var b = this.setting.data.key.children;
			return f.getTreeCheckedNodes(this.setting, f.getRoot(this.setting)[b], a !== !1)
		};
		a.getCheckedNodesNotChildren = function(a){
			var b = this.setting.data.key.children;
			return f.getTreeCheckedNodesNotChildren(this.setting, f.getRoot(this.setting)[b], a !== !1);
		};
		a.getChangeCheckedNodes = function() {
			var a = this.setting.data.key.children;
			return f.getTreeChangeCheckedNodes(this.setting, f.getRoot(this.setting)[a])
		};
		a.setChkDisabled = function(a, b, c, f) {
			b = !!b;
			c = !!c;
			e.repairSonChkDisabled(this.setting, a, b, !!f);
			e.repairParentChkDisabled(this.setting, a.getParentNode(), b, c)
		};
		var b = a.updateNode;
		a.updateNode = function(c, f) {
			b && b.apply(a, arguments);
			if (c && this.setting.check.enable && n(c, this.setting).get(0) && k.uCanDo(this.setting)) {
				var i = n(c, j.id.CHECK, this.setting);
				(f == !0 || this.setting.check.chkStyle ===
					j.radio.STYLE) && e.checkNodeRelation(this.setting, c);
				e.setChkClass(this.setting, i, c);
				e.repairParentChkClassWithSelf(this.setting, c)
			}
		}
	});
	var s = e.createNodes;
	e.createNodes = function(c, a, b, d) {
		s && s.apply(e, arguments);
		b && e.repairParentChkClassWithSelf(c, d)
	};
	var t = e.removeNode;
	e.removeNode = function(c, a) {
		var b = a.getParentNode();
		t && t.apply(e, arguments);
		a && b && (e.repairChkClass(c, b), e.repairParentChkClass(c, b))
	};
	var u = e.appendNodes;
	e.appendNodes = function(c, a, b, d, h, i) {
		var j = "";
		u && (j = u.apply(e, arguments));
		d && f.makeChkFlag(c,
			d);
		return j
	}
})(jQuery);