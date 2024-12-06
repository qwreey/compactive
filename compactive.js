// const
const w = window
const REFS = w.REFS = {}
const KassignedElements = "assignedElements"
const KstartsWith = "startsWith"
const KquerySelector = "querySelector"
const KquerySelectorAll = KquerySelector+"All"
const KshadowRoot = "shadowRoot"
const KobservedAttributes = "observedAttributes"
const KgetAttribute = "getAttribute"
const Kslice = "slice"
const Kslots = "%s"
const KtemplateContent = "%t"
const Kattrs = "%a"
const KtemplateStyle = "%c"
const Kinited = "%i"
const Kdata_ = "data-"
const KcloneNode = "cloneNode"
const Kappend = "append"
const NULL = null
const defaultShadowMode = { mode: 'open' }

// Reference utilitys
const ranbuf = new Uint8Array(12), CreateRefId = ()=>{
    crypto.getRandomValues(ranbuf)
    return "r:"+ranbuf.toHex()
}

// parseAttr, toAttr
const parseAttr = w.parseAttr = (raw) => {
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
const toAttr = w.toAttr = (raw) => {
    let ty = typeof raw, refid
    if (raw === NULL) return ""
    if (ty == "string") return "s:"+raw
    if (ty == "number") return (Number.isInteger(raw) ? 'i:' : 'f:') + raw
    if (ty == "boolean") return raw+[]
    REFS[refid = CreateRefId()] = raw
    return refid
}

// Parse css/html to content
const contentParser = new DOMParser(), html = w.html = (contents) => {
    return contentParser.parseFromString(`<body>${contents.join()}</body>`,"text/html")
}
w.css = (contents) => {
    return html([`<style>${contents.join()}</style>`])
}

// Create new WebComponent
w.Init=($,factory)=>{
    let tag,name,elementUpdater = {
        // Define custom attr
        attr(...names) {
            for (name of names) {
                let key = Kdata_ + name
                Object.defineProperty($.prototype, name, {
                    get(){
                        return parseAttr(this[KgetAttribute](key))
                    },
                    set(val){
                        this.setAttribute(key, toAttr(val))
                    }
                });
                $[KobservedAttributes].push(key)
            }
            return elementUpdater
        },
        tag(newtag) {
            tag = newtag
            return elementUpdater
        },
        // Define custom content
        content(content) {
            $[KtemplateContent] = content[KquerySelector]('body>*')
            return elementUpdater
        },
        style(style) {
            $[KtemplateStyle] = style[KquerySelector]('style')
            return elementUpdater
        },
    }
    $[KobservedAttributes] = []
    factory(elementUpdater)
    $[KtemplateContent] ??= document[KquerySelector]("template#"+tag).content
    if ($[KtemplateStyle]) $[KtemplateContent][Kappend]($[KtemplateStyle])
    w.customElements.define(tag, $)
}
let globalElement
let overrideElement

w.BaseElement = class extends HTMLElement {
    // $ = this
    // $[slots] = slot list
    // $[attrs] = old attr values

    constructor(newattrs) {
        super()
        let item,firstElementChild,slotName,$=this,this_constructor=$.constructor,content=this_constructor[KtemplateContent]
        if (!this_constructor[Kinited]) {
            this_constructor[Kinited] = true
            firstElementChild = content.firstElementChild
            for (item of globalElement ??= document[KquerySelectorAll]("[-global]")) content.insertBefore(item[KcloneNode](true),firstElementChild)
            for (item of overrideElement ??= document[KquerySelectorAll]("[-override]")) content[Kappend](item[KcloneNode](true))
        }

        // Add shadow node
        $.attachShadow(defaultShadowMode)
            [Kappend](content[KcloneNode](true))

        // Get -ref items
        for (item of $[KshadowRoot][KquerySelectorAll]("[-ref]")) {
            $[item[KgetAttribute]("-ref")] = item
        }

        $[Kattrs] = {} // old attrs
        $[Kslots] = {} // slots

        // Add slot change handler
        for (item of $[KshadowRoot][KquerySelectorAll]("slot")) {
            $[Kslots][slotName = item.name || "default"] = item
            let handle = $[slotName+"Slot"]
            if (handle) item.onslotchange = e => handle.call($, item[KassignedElements](), e)
        }

        // apply new attrs
        if (newattrs) for (item in newattrs) $[item] = newattrs[item]
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
            handle = $[name+"Attr"]
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
}
