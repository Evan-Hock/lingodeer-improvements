"use strict"

/** The placeholder text that textareas should now have. */
const PLACEHOLDER = "Enter text."

/** Determines whether or not a node is a LingoDeer course element.
 * Used to check whether or not we are doing a lesson.
 * @param {*} node
 * @returns {boolean}
 */
function isMainCourseElement(node) {
    return node instanceof Element && node.classList.contains("mainCourse")
}

/**
 * Class that provides the textarea improvement features, namely:
 * 
 * * During non-dialogue lessons, textareas are automatically focused.
 * * The placeholder text for textareas is now shorter.
 * * The Tab key automatically focus textareas while they are on screen.
 */
class TextFocusFeatureProvider {
    /**
     * Sets up the provision of the QoL improvements this class provides.
     * @param {string} placeholder - The string to replace the placeholder text of textareas with
     * @param {Element} mainCourse - The course element to inject into
     */
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

    /**
     * Determines whether or not the lesson is a dialogue lesson.
     * @param {Element} mainCourse - The mainCourse element of the lesson
     * @returns {boolean}
     */
    static isDialogue(mainCourse) {
        return mainCourse.classList.contains("dialogMode")
    }

    /**
     * Injects the functionality of this class in the provided course element.
     * @param {Element} mainCourse
     * @returns {TextFocusFeatureProvider}
     */
    static inject(mainCourse) {
        return TextFocusFeatureProvider.isDialogue(mainCourse) ? null : new TextFocusFeatureProvider(PLACEHOLDER, mainCourse)
    }

    /**
     * Modifies the placeholder text of the provided textarea,
     * focuses it, and sets up the event listener for the Tab
     * shortcut focus.
     * @param {HTMLTextAreaElement} textarea
     */
    patchTextArea(textarea) {
        textarea.placeholder = this.placeholder
        textarea.focus()
        this.registerTabFocus(textarea)
    }

    /**
     * Sets up the event listener for the Tab focus feature.
     * @param {HTMLTextAreaElement} textarea 
     */
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

    /** Frees all resources used by this class. */
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