import { computed, ref } from 'vue'

// range and toggle selection on top of the file manager's selection, selectAll and deselectAll
export function useFileSelection(files, sortedFiles, selection, selectAll, deselectAll) {
  const selectionAnchor = ref(null)

  const selectableCount = computed(() => {
    return (files.value || []).filter(f => f.name !== '..').length
  })

  const allSelected = computed(() => {
    return selectableCount.value > 0 && selection.value.length === selectableCount.value
  })

  function anchorIndex() {
    return sortedFiles.value.findIndex(e => e.name === selectionAnchor.value)
  }

  function selectRange(a, b) {
    const list = sortedFiles.value
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
      if (list[i].name !== '..') list[i].isSelected = true
    }
  }

  // shift selects everything between the last toggled file and this one,
  // otherwise only this file is toggled
  function selectFile(event, f) {
    if (f.name === '..') return
    const anchor = anchorIndex()
    if (event.shiftKey && anchor !== -1) {
      selectRange(anchor, sortedFiles.value.indexOf(f))
      window.getSelection()?.removeAllRanges()
    } else {
      f.isSelected = !f.isSelected
    }
    selectionAnchor.value = f.name
  }

  // shift + keyboard navigation, the file at index becomes the anchor if there is none yet
  function extendSelection(index, target) {
    let anchor = anchorIndex()
    if (anchor === -1) {
      anchor = index
      selectionAnchor.value = sortedFiles.value[index].name
    }
    selectRange(anchor, target)
  }

  function toggleSelectAll() {
    if (allSelected.value) deselectAll()
    else selectAll()
  }

  return { selectableCount, allSelected, selectFile, extendSelection, toggleSelectAll }
}
