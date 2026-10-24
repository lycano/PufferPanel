// any overlay: editor, create dialogs, confirmations, upload progress, loader
export function dialogOpen() {
  return !!document.querySelector('.overlay-backdrop')
}

// event.target can be a text node without closest()
export function closestTo(event, selector) {
  return event.target.closest ? event.target.closest(selector) : null
}
