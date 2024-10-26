# Web-**COM**ponent based **COM_PACT** re**ACT**ive library

## WHY??

Many reactive libraries require downloading at least 16kB. comppact uses the Web-Component to minimize the size, and hit 1.43kB (!!!)

## Example

```html
<!-- In head... you should embed comppact.js or comppact.min.js -->
<template id="my-switch">
    <button id="btn"><slot></slot></button>
<style>
    button.activate {
        background-color: red;
    }
</style>
</template>
<script>
    class MY_Switch extends BaseElement {
        static { this
            .init("my-switch")
            .attr("activate")
            .finalize()
        }
        constructor() {
            super()
            this.btn = this.shadowRoot.getElementById('btn')
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
