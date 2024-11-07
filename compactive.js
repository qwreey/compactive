// const
const w = window
const REFS = w.REFS = {}
const KassignedElements = "assignedElements"
const KstartsWith = "startsWith"
const KquerySelector = "querySelector"
const KquerySelectorAll = KquerySelector+"All"
const KshadowRoot = "shadowRoot"
const KobservedAttributes = "observedAttributes"
const KparseFromString = "parseFromString"
const Kslice = "slice"
const Kslots = "%"
const KtemplateContent = Kslots+1
const Kattrs = Kslots+2
const KtemplateStyle = Kslots+3
const Kdata_ = "data-"
const Khtml = "text/html"
const NULL = null
const contentParser = new DOMParser()
const defaultShadowMode = { mode: 'open' }

// Reference utilitys
const ranbuf = new Uint8Array(12), CreateRefId = w.CreateRefId = ()=>{
    crypto.getRandomValues(ranbuf)
    return "r:"+ranbuf.toHex()
}

// parseAttr, toAttr
const parseAttr = (raw) => {
    if (raw === NULL) return NULL
    if (raw == "true") return true
    if (raw == "false") return false
    let ty = raw.match(/^(.):/)?.[1],data
    if (ty == "r") return REFS[raw]
    data = raw[Kslice](2)
    if (ty == "s") return data
    if (ty == "e") return eval(data)
    if (ty == "i" || ty == "f") return +data
}
const toAttr = (raw) => {
    let ty = typeof raw, refid
    if (raw === NULL) return ""
    if (ty == "string") return "s:"+raw
    if (ty == "number") return (Number.isInteger(raw) ? 'i:' : 'f:') + raw
    if (ty == "boolean") return raw+[]
    REFS[refid = CreateRefId()] = raw
    return refid
}

// Parse css/html to content
const html = w.html = (contents,...exps) => {
    return contentParser[KparseFromString](contents.join(),Khtml)
}
w.css = (contents) => {
    return html(`<style>${contents.join()}</style>`)
}

// Class utility
w.IsInstance = (obj, constructor) => {
    return Object.getPrototypeOf(obj)?.constructor == constructor
}

w.BaseElement = class extends HTMLElement {
    // $ = this
    // $[slots] = slot list
    // $[attrs] = old attr values

    constructor(newattrs) {
        super()
        let slot,slotName,$=this,key,ref

        // Add shadow node
        $.attachShadow(defaultShadowMode)
            .append($.constructor[KtemplateContent].cloneNode(true))

        for (ref of $[KshadowRoot][KquerySelectorAll]`[-ref]`) {
            $[ref["-ref"]] = ref
            delete ref["-ref"]
        }
        $[Kslots] = {} // slots
        $[Kattrs] = {} // old attrs

        // Add slot change handler
        for (slot of $[KshadowRoot][KquerySelectorAll]`slot`) {
            $[Kslots][slotName = slot.name || "default"] = slot
            let handle = $[slotName+"Slot"]
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
                return elementUpdater
            },
            style(style) {
                $[KtemplateStyle] = style
                return elementUpdater
            },
            finalize() {
                w.customElements.define(tag, $)
                $[KtemplateContent] ??= document[KquerySelector](`template#${tag}`).content
                if ($[KtemplateStyle]) $[KtemplateContent].append($[KtemplateStyle])
                $.create = newattrs=>new $(newattrs)
            }
        }
        $[KobservedAttributes] = []
        return elementUpdater
    }
}
