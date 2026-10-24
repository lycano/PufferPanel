import { computed, ref } from 'vue'
import { closestTo, dialogOpen } from './dom.js'
import { useUpload, collectDropped } from './upload.js'

// drag and drop upload: onto a folder row into that folder, anywhere else into the current folder
export function useFileDrop(server, canEdit, currentPath, getCurrentPath, onUploaded) {
  const { uploading: dropUploading, uploadState: dropUploadState, upload } = useUpload(server, onUploaded)
  // counts dragenter/dragleave pairs, those also fire when moving between child elements
  const dragDepth = ref(0)
  const dropFolder = ref(null)
  const dropOnIcon = ref(false)

  const dropPath = computed(() => {
    if (dropFolder.value === '..') return currentPath.value.slice(0, -1).map(e => e.name).join('/')
    if (dropFolder.value) return `${getCurrentPath()}/${dropFolder.value}`
    return getCurrentPath()
  })

  function isDragging() {
    return dragDepth.value > 0
  }

  function isDropTarget(file) {
    return isDragging() && dropFolder.value === file.name
  }

  function fileManagerClasses() {
    return ['file-manager', isDragging() ? 'dragging' : '']
  }

  function uploadClasses() {
    return ['upload-files', isDragging() ? 'drop-target' : '', isDragging() && dropOnIcon.value ? 'active' : '']
  }

  // only folders are drop targets, see folderAt()
  function dropFolderAttr(file) {
    return file.isFile ? undefined : file.name
  }

  function isFileDrag(event) {
    if (!canEdit || dialogOpen()) return false
    return Array.from(event.dataTransfer?.types || []).includes('Files')
  }

  function folderAt(event) {
    const row = closestTo(event, '[data-folder]')
    return row ? row.dataset.folder : null
  }

  function resetDrag() {
    dragDepth.value = 0
    dropFolder.value = null
    dropOnIcon.value = false
  }

  function onDragEnter(event) {
    if (!isFileDrag(event)) return
    event.preventDefault()
    dragDepth.value++
  }

  function onDragOver(event) {
    if (!isFileDrag(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    dropFolder.value = folderAt(event)
    dropOnIcon.value = !!closestTo(event, '.upload-files')
  }

  function onDragLeave(event) {
    if (!isFileDrag(event)) return
    if (dragDepth.value <= 1) resetDrag()
    else dragDepth.value--
  }

  function onDrop(event) {
    if (!isFileDrag(event)) return
    event.preventDefault()
    const target = dropPath.value
    resetDrag()
    upload(target, collectDropped(event.dataTransfer))
  }

  return {
    dropUploading,
    dropUploadState,
    isDropTarget,
    fileManagerClasses,
    uploadClasses,
    dropFolderAttr,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop
  }
}
