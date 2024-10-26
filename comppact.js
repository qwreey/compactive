let w = window
let REFS = w.REFS = {}
let assignedElements = "assignedElements"
let startsWith = "startsWith"
let querySelector = "querySelector"
let querySelectorAll = querySelector+"All"
let shadowRoot = "shadowRoot"
let observedAttributes = "observedAttributes"
let slice = "slice"
let slots = "%"
let templateContent = slots+1
let attrs = slots+2
let NULL = null
let data_ = "data-"
let IsInstance = w.IsInstance = (obj, constructor) => {
    return Object.getPrototypeOf(obj)?.constructor == constructor
}
let ClassFilter = w.ClassFilter = (constructor) => {
    return (e) => IsInstance(e, constructor)
}
let CreateRefId = w.CreateRefId = _=>{
    let id = "r:"+(Math.random()).toString(36)[slice](2);
    return id in REFS ? CreateRefId() : id
}
let parseSlotName = (name) => {
    return name == "" ? "default" : name
}
let ty
let data, parseAttr = (raw) => {
    if (raw === NULL) return NULL
    if (raw == "true") return true
    if (raw == "false") return false
    ty = raw.match(/^(.):/)?.[1]
    if (ty == "r") return REFS[raw]
    data = raw[slice](2)
    if (ty == "s") return data
    if (ty == "e") return eval(data)
    if (ty == "i" || ty == "f") return +data
}
let key,toAttr = (raw) => {
    if (raw === NULL) return ""
    if (ty == "string") return "s:"+raw
    if (ty == "number") return (Number.isInteger(raw) ? 'i:' : 'f:') + raw
    if (ty == "boolean") return raw+[]
    REFS[key = CreateRefId()] = raw
    return key
}
w.BaseElement = class extends HTMLElement {
    constructor() {
        super()
        let slot,slotName,$=this
        $.attachShadow({ mode: 'open' })
            .append($.constructor[templateContent].cloneNode(true))
        $[slots] = {}
        $[attrs] = {}
        for (slot of $[shadowRoot][querySelectorAll]('slot')) {
            slotName = parseSlotName(slot.name)
            $[slots][slotName] = slot
            let handle = $[`${slotName}Slot`]
            if (handle) slot.onslotchange = () => handle.call($, slot[assignedElements]())
        }
    }
    attributeChangedCallback(name, old, raw) {
        let $=this
        if (name[startsWith](data_)){
            name = name[slice](5)
            if (old?.[startsWith]("r:")) delete REFS[old]
            let handle = $[`${name}Attr`]
            let value = parseAttr(raw)
            if (handle) handle.call($, value, $[attrs][name])
            $[attrs][name] = value
        }
    }
    slot(name) {
        return this[slots][assignedElements]()
    }
    emit(name, data) {
        this.dispatchEvent(new CustomEvent(name, data))
    }
    static init(tag) {
        let $=this,name,elementUpdater = {
            attr(...names) {
                for (name of names) {
                    let key = data_ + name
                    Object.defineProperty($.prototype, name, {
                        get: function(){
                            return parseAttr(this.getAttribute(key))
                        },
                        set: function(val){
                            this.setAttribute(key, toAttr(val))
                        }
                    });
                    $[observedAttributes].push(key)
                }
                return elementUpdater
            },
            finalize() {
                w.customElements.define(tag, $)
            }
        }
        $[templateContent] = document[querySelector](`template#${tag}`).content
        $.create = _=>new $()
        $[observedAttributes] = []
        return elementUpdater
    }
}
