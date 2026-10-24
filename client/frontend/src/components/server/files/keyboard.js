import { nextTick } from 'vue'
import { dialogOpen } from './dom.js'

export function useFileKeyboard(fileListEl, sortedFiles, viewMode, ltr, currentPath, openFile, extendSelection) {
  let focusFirstAfterLoad = false

  // rows in display order, same order as sortedFiles
  function fileRows() {
    if (!fileListEl.value) return []
    return [...fileListEl.value.querySelectorAll(':scope > .file')]
  }

  function fileListHotkey() {
    fileRows()[0]?.focus()
  }

  // called after a folder was loaded, keeps keyboard focus in the list when it was opened by key
  async function focusFirstIfRequested() {
    if (!focusFirstAfterLoad) return
    focusFirstAfterLoad = false
    await nextTick()
    fileListHotkey()
  }

  // number of files per row, 1 in list view and in the narrow grid layout
  function gridColumns(els) {
    if (viewMode.value === 'list' || els.length === 0) return 1
    const n = els.findIndex(e => e.offsetTop !== els[0].offsetTop)
    return n === -1 ? els.length : n
  }

  // arrow keys (up/down in list, left/right in grid) start keyboard navigation when no file has focus yet
  function focusListOnArrow(event) {
    const keys = viewMode.value === 'grid' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowDown', 'ArrowUp']
    if (!keys.includes(event.key)) return
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    if (!fileListEl.value || fileListEl.value.contains(document.activeElement)) return
    // all server tabs stay mounted, only act while the files tab is shown
    if (fileListEl.value.getClientRects().length === 0) return
    const active = document.activeElement
    if (active && (active.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName))) return
    if (dialogOpen() || document.querySelector('.context-menu')) return
    if (fileRows().length === 0) return
    event.preventDefault()
    fileListHotkey()
  }

  function registerFocusOnArrow() {
    window.addEventListener('keydown', focusListOnArrow)
  }

  function deregisterFocusOnArrow() {
    window.removeEventListener('keydown', focusListOnArrow)
  }

  function onFileKeydown(event, index) {
    const list = sortedFiles.value
    const f = list[index]
    const els = fileRows()
    const forward = ltr.value ? 'ArrowRight' : 'ArrowLeft'
    const backward = ltr.value ? 'ArrowLeft' : 'ArrowRight'
    let target
    switch (event.key) {
      case 'ArrowDown': target = index + gridColumns(els); break
      case 'ArrowUp': target = index - gridColumns(els); break
      case forward: if (viewMode.value === 'grid') target = index + 1; break
      case backward: if (viewMode.value === 'grid') target = index - 1; break
      case 'Home': target = 0; break
      case 'End': target = list.length - 1; break
      case 'Enter':
        if (!f.isFile) focusFirstAfterLoad = true
        openFile(f)
        return
      case 'Backspace':
        event.preventDefault()
        if (currentPath.value.length === 0) return
        focusFirstAfterLoad = true
        currentPath.value.pop()
        return
    }
    if (target === undefined) return
    event.preventDefault()
    target = Math.max(0, Math.min(list.length - 1, target))
    if (event.shiftKey) extendSelection(index, target)
    els[target]?.focus()
  }

  return { fileListHotkey, focusFirstIfRequested, onFileKeydown, registerFocusOnArrow, deregisterFocusOnArrow }
}
