# Web-**COMP**onent based **COMPACT** re**ACTIVE** library

## WHY??

Many reactive libraries require downloading at least 16kB. compactive uses the Web-Component to minimize the size, and hit 1.7kB (!!!)

## Example

```html
<!-- In head... you should embed compactive.js or compactive.min.js -->
<script>
class MY_Switch extends BaseElement {
    static { Init(this,_=>_
        .tag("my-switch")
        .content(html`
            <button -ref="btn"><slot></slot></button>
        `)
        .style(css`
            button.activate {
                background-color: red;
            }
        `)
        .attr("activate")
    )}
    constructor() {
        super()
        this.btn.onclick = () => { this.activate = !this.activate }
    }
    activateAttr(val) {
        if (val) this.btn.classList.add("activate")
        else this.btn.classList.remove("activate")
    }
}
</script>
<!-- In body... -->
<my-switch data-activate="true">
    Hello world
</my-switch>
```
