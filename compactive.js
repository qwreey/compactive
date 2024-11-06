// const
let w = window
let REFS = w.REFS = {}
let KassignedElements = "assignedElements"
let KstartsWith = "startsWith"
let KquerySelector = "querySelector"
let KquerySelectorAll = KquerySelector+"All"
let KshadowRoot = "shadowRoot"
let KobservedAttributes = "observedAttributes"
let Kslice = "slice"
let Kslots = "%"
let KtemplateContent = Kslots+1
let Kattrs = Kslots+2
let Kdata_ = "data-"
let NULL = null
let contentParser = new DOMParser()
let defaultShadowMode = { mode: 'open' }

// Class utility
let IsInstance = w.IsInstance = (obj, constructor) => {
    return Object.getPrototypeOf(obj)?.constructor == constructor
}

// Reference utilitys
let CreateRefId = w.CreateRefId = _=>{
    let id = "r:"+(Math.random()).toString(36)[Kslice](2)+(_??"");
    return id in REFS ? CreateRefId(id) : id
}

// parseAttr, toAttr
let ty, data, parseAttr = (raw) => {
    if (raw === NULL) return NULL
    if (raw == "true") return true
    if (raw == "false") return false
    ty = raw.match(/^(.):/)?.[1]
    if (ty == "r") return REFS[raw]
    data = raw[Kslice](2)
    if (ty == "s") return data
    if (ty == "e") return eval(data)
    if (ty == "i" || ty == "f") return +data
}
let refid, toAttr = (raw) => {
    ty = typeof raw
    if (raw === NULL) return ""
    if (ty == "string") return "s:"+raw
    if (ty == "number") return (Number.isInteger(raw) ? 'i:' : 'f:') + raw
    if (ty == "boolean") return raw+[]
    REFS[refid = CreateRefId()] = raw
    return refid
}

w.ClassFilter = (constructor) => {
    return (e) => IsInstance(e, constructor)
}
w.CreateContent = (content) => {
    return contentParser.parseFromString(content,"text/html")
}

w.BaseElement = class BaseElement extends HTMLElement {
    // $ = this
    // $[slots] = slot list
    // $[attrs] = old attr values

    constructor(newattrs) {
        super()
        let slot,slotName,$=this,key

        // Add shadow node
        $.attachShadow(defaultShadowMode)
            .append($.constructor[KtemplateContent].cloneNode(true))

        $[Kslots] = {} // slots
        $[Kattrs] = {} // old attrs

        // Add slot change handler
        for (slot of $[KshadowRoot][KquerySelectorAll]('slot')) {
            $[Kslots][slotName = slot.name || "default"] = slot
            let handle = $[`${slotName}Slot`]
            if (handle) slot.onslotchange = e => handle.call($, slot[KassignedElements](), e)
        }

        // apply new attrs
        if (newattrs) for (key in newattrs) $[key] = newattrs[key]
    }
    attributeChangedCallback(name, old, raw) {
        let $=this,handle,value

        // If attribute name starts with data-
        if (name[KstartsWith](Kdata_)){
            // Get non `data-` prefixed attribute name
            name = name[Kslice](5)

            // Remove old ref datas
            if (old?.[KstartsWith]("r:")) delete REFS[old]

            // Parse new value
            value = parseAttr(raw)

            // Get attribute update handle / execute
            handle = $[`${name}Attr`]
            if (handle) handle.call($, value, $[Kattrs][name])

            // Save as Old attribute value
            $[Kattrs][name] = value
        }
    }
    // Get slot content
    slot(name) {
        return this[Kslots][name][KassignedElements]()
    }
    // Emit custom event
    emit(name, data) {
        this.dispatchEvent(new CustomEvent(name, data))
    }
    // Create new WebComponent
    static init(tag) {
        let $=this,name,elementUpdater = {
            // Define custom attr
            attr(...names) {
                for (name of names) {
                    let key = Kdata_ + name
                    Object.defineProperty($.prototype, name, {
                        get: function(){
                            return parseAttr(this.getAttribute(key))
                        },
                        set: function(val){
                            this.setAttribute(key, toAttr(val))
                        }
                    });
                    $[KobservedAttributes].push(key)
                }
                return elementUpdater
            },
            // Define custom content
            content(content) {
                $[KtemplateContent] = content
            },
            finalize() {
                w.customElements.define(tag, $)
                $[KtemplateContent] ??= document[KquerySelector](`template#${tag}`).content
                $.create = newattrs=>new $(newattrs)
            }
        }
        $[KobservedAttributes] = []
        return elementUpdater
    }
}
