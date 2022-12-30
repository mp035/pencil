function OpenClipartPane() {
    BaseTemplatedWidget.call(this);
    var thiz = this;
    this.backend = new OpenClipartSearch();
    this.apiTokenTutorial = "https://openclipart.org/api/tutorial";
    function injectSvgInfo (svg) {
        try {
            var g = Dom.parseToNode(svg);
            g.setAttributeNS(PencilNamespaces.p, "p:ImageSource", "OpenClipart.org");
            return Controller.serializer.serializeToString(g);
        } catch (e) {
            Console.dumpError(e);
        }
    }
    this.shapeList.addEventListener("dragstart", function (event) {
        nsDragAndDrop.dragStart(event);
        var n = Dom.findUpwardForNodeWithData(Dom.getTarget(event), "_def");
        var def = n._def;
        if (def._svg) {
            var svg = injectSvgInfo(def._svg);
            event.dataTransfer.setData("image/svg+xml", svg);
            nsDragAndDrop.setData("image/svg+xml", svg);
        } else {
            event.dataTransfer.setData("pencil/png", def.src);
            nsDragAndDrop.setData("pencil/png", def.src);
        }

        event.dataTransfer.setData("text/html", "");
        nsDragAndDrop.setData("text/html", "");
        event.dataTransfer.setDragImage(thiz.dndImage, 8, 8);
        event.target.collection = def;
    });

    this.dndImage = new Image();
    this.dndImage.src = "css/bullet.png";

    this.searchInput.addEventListener("keyup", function (event) {
        if (event.keyCode == DOM_VK_RETURN) {
            thiz.searchOptions.page = 1;
            thiz.search();
        }
    }, false);

    UICommandManager.register({
        key: "searchFocusCommand",
        shortcut: "Ctrl+F",
        run: function () {
            thiz.searchInput.focus();
            thiz.searchInput.select();
        }
    });

    this.bind("click", function (event) {
        Config.set("clipartbrowser.scale", this.scaleImageCheckbox.checked);
    }, this.scaleImageCheckbox);

    this.scaleImageCheckbox.checked = Config.get("clipartbrowser.scale") == true;
    this.searchOptions = {
        page: 1,
        limit: 50
    };
    this.rq = [];

    this.apiTokenTutorialLink.href = this.apiTokenTutorial;
    this.invalidateUI();
    this.bind("click", function (event) {
        Dialog.prompt("OpenClipart API token:", "", "Save", function(token) {
            if (!token) return;
            thiz.loader.style.display = "";
            Config.set("openclipart.search.api_key_token", token);
            thiz.searchAborted = true;
            Dom.empty(thiz.shapeList);
            thiz.backend.search("", thiz.searchOptions, function (result) {
                thiz.loader.style.display = "none";
                NotificationPopup.show("OpenClipart API token added");
            }, function(e) {
                thiz.loader.style.display = "none";
                Dialog.error("OpenClipart API token is invalid. Please try another one.");
                Config.set("openclipart.search.api_key_token", "");
            });
        }, "Cancel");
    }, this.setupTokenNowButton);

    window.globalEventBus.listen("config-change", function (data) {
        if (data.name == "openclipart.search.api_key_token") {
            thiz.invalidateUI();
        }
    }.bind(this));
}
__extend(BaseTemplatedWidget, OpenClipartPane);

OpenClipartPane.prototype.getTitle = function() {
	return "Clipart";
};
OpenClipartPane.prototype.invalidateUI = function() {
    var token = Config.get("openclipart.search.api_key_token", "");
    Dom.toggleClass(this.contentPane, "Active", token);
    Dom.toggleClass(this.tokenSetupBox, "Active", !token);
}
OpenClipartPane.prototype.getIconName = function() {
	return "photo";
};
OpenClipartPane.prototype.search = function () {
    var thiz = this;
    var token = Config.get("openclipart.search.api_key_token", "");
    if (!token) {
        Dialog.error("OpenClipart API token is need setup before searching.", "Visit '" + this.apiTokenTutorial +"' for more details.", function() {
            window.open(thiz.apiTokenTutorial, "_blank");
        });
        return;
    }
    if (this.node().offsetWidth <= 0) return;

    Dom.empty(this.shapeList);

    for (var i = 0; i < this.rq.length; i++) {
        if (this.rq[i]) {
            this.rq[i].abort();
            this.rq[i].onreadystatechange = null;
        }
    }
    this.searchAborted = true;

    var thiz = this;
    this.loader.style.display = "";
    this.backend.search(this.searchInput.value, this.searchOptions, function (result) {
        thiz.renderResult(result);
        thiz.loader.style.display = "none";
    });
};
OpenClipartPane.prototype.renderResult = function (result) {
    console.log("SEARCH RESULT", result);
    this.searchAborted = false;
    var shapeDefs = result;
    for (var i = 0; i < shapeDefs.length; i ++) {
        var def = shapeDefs[i];
        var holder = {};

        var node = Dom.newDOMElement({
            _name: "li",
            "type": "ShapeDef",
            "title": def.name,
            _children: [
                {
                    _name: "div",
                    "class": "Shape",
                    draggable: "true",
                    _children: [
                        {
                            _name: "div",
                            "class": "Icon",
                            _children: [
                                {
                                    _name: "img",
                                    _id: "iconImage",
                                    src: def.thumb
                                }
                            ]
                        },
                        {
                            _name: "span",
                            _text: def.name
                        }
                    ]
                }
            ]
        }, null, holder);

        node._def = def;

        this.shapeList.appendChild(node);

        var thiz = this;
        holder.iconImage.onload = function () {
            if (thiz.searchAborted) return;
        };

        // Util.setupImage(holder.iconImage, def.thumb, "center-inside", null, function () {
        //     return thiz.searchAborted;
        // });
        this.getSVG(node._def);
    }
};

OpenClipartPane.prototype.getSVG = function (item) {
    var loaded = 1;
    var thiz = this;
    WebUtil.get(item.src, function(svg) {
        if (!svg || thiz.searchAborted) return;
        try {
            item._svg = svg;
        } catch (e) {
            error(e);
        }

    }, this.rq);
};
