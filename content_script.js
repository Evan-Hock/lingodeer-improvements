"use strict"

const PLACEHOLDER = "Enter text."

function isMainCourseElement(node) {
    return node instanceof Element && node.classList.contains("mainCourse")
}

class TextFocusFeatureProvider {
    constructor(placeholder, mainCourse) {
        this.placeholder = placeholder

        const mainContent = mainCourse.querySelector(".mainContent")
        this.textareaObserver = new MutationObserver(() => {
            const textarea = mainContent.querySelector("textarea")
            if (textarea) {
                this.patchTextArea(textarea)
            } else if (this.tabFocusEventListener) {
                this.tabFocusEventListener.unregister()
            }
        })

        this.textareaObserver.observe(mainContent, {
            childList: true,
            subtree: true
        })
    }

    static isDialogue(mainCourse) {
        return mainCourse.classList.contains("dialogMode")
    }

    static inject(mainCourse) {
        return TextFocusFeatureProvider.isDialogue(mainCourse) ? null : new TextFocusFeatureProvider(PLACEHOLDER, mainCourse)
    }

    patchTextArea(textarea) {
        textarea.placeholder = this.placeholder
        textarea.focus()
        this.registerTabFocus(textarea)
    }

    registerTabFocus(textarea) {
        this.tabFocusEventListener?.unregister()

        this.tabFocusEventListener = kbEvent => {
            if (kbEvent.key === "Tab") {
                textarea.focus()
            }
        }

        this.tabFocusEventListener.unregister = () => {
            document.body.removeEventListener("keydown", this.tabFocusEventListener)
            delete this.tabFocusEventListener
        }

        document.body.addEventListener("keydown", this.tabFocusEventListener)
    }

    cleanup() {
        this.textareaObserver.disconnect()
        this.tabFocusEventListener?.unregister()
    }
}


const app = document.getElementById("app")

if (!app)
    throw new Error("lingodeer improvements: app not found!")

let outstandingObserver = null

const appObserver = new MutationObserver(records => {
    if (outstandingObserver) {
        if (records.some(record => Array.prototype.some.call(record.removedNodes, isMainCourseElement))) {
            outstandingObserver.cleanup()
            outstandingObserver = null
        }
    } else {
        for (const record of records) {
            const mainCourse = Array.prototype.find.call(record.addedNodes, isMainCourseElement)
            if (!mainCourse) continue
            outstandingObserver = TextFocusFeatureProvider.inject(mainCourse)
            return
        }
    }
})

appObserver.observe(app, {
    childList: true
})