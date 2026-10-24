import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'

// items are { file, path } with path relative to the upload target,
// folders are relative paths that have to exist (also empty ones)
export function useUpload(server, onDone) {
  const { t } = useI18n()
  const toast = inject('toast')

  const uploading = ref(false)
  const uploadState = ref(null)

  async function prepareFolders(basePath, folders) {
    uploadState.value = { state: 'create folders' }
    const toCreate = new Set()
    const exist = new Set()
    for (const folder of folders) {
      const filePath = [basePath, folder].join('/')
      if (toCreate.has(filePath) || exist.has(filePath)) continue
      const type = await server.fileExists(filePath)

      if (!type) toCreate.add(filePath)
      if (type === 'folder') exist.add(filePath)
      if (type === 'file') throw `${filePath} exists as file`
    }

    for (let path of toCreate) {
      await server.createFolder(path)
    }
  }

  function onUploadProgress(event) {
    const i = uploadState.value.current
    const file = uploadState.value.files[i]
    file.progress = Math.min(event.loaded, file.size)
  }

  // collect may be async, it runs while the "preparing" state is shown
  async function upload(basePath, collect) {
    uploadState.value = { state: 'preparing' }
    uploading.value = true
    let failed = false
    try {
      const { files, folders = [] } = await collect()
      const needed = new Set(folders)
      files.forEach(f => {
        const parent = f.path.split('/')
        parent.pop()
        if (parent.length > 0) needed.add(parent.join('/'))
      })
      if (needed.size > 0) await prepareFolders(basePath, needed)
      uploadState.value = {
        state: 'upload files',
        current: 0,
        total: files.length,
        files: []
      }
      for (let i = 0; i < files.length; i++) {
        uploadState.value.files[i + 1] = {
          name: files[i].path,
          size: files[i].file.size,
          progress: 0
        }
      }
      for (let i = 0; i < files.length; i++) {
        uploadState.value.current = i + 1
        await server.uploadFile(`${basePath}/${files[i].path}`, files[i].file, onUploadProgress)
      }
    } catch(e) {
      failed = true
      console.error('file upload failed', e)
      toast.error(t('files.UploadFailed'))
    } finally {
      if (!failed) toast.success(t('files.UploadSuccess'))
      if (onDone) onDone()
      uploading.value = false
      uploadState.value = null
    }
  }

  return { uploading, uploadState, upload }
}

function readAllEntries(reader) {
  // readEntries returns the folder contents in batches until it returns an empty one
  return new Promise((resolve, reject) => {
    const all = []
    const next = () => reader.readEntries(batch => {
      if (batch.length === 0) return resolve(all)
      all.push(...batch)
      next()
    }, reject)
    next()
  })
}

async function walkEntry(entry, prefix, files, folders) {
  const path = prefix + entry.name
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject))
    files.push({ file, path })
  } else if (entry.isDirectory) {
    folders.push(path)
    const children = await readAllEntries(entry.createReader())
    for (const child of children) {
      await walkEntry(child, path + '/', files, folders)
    }
  }
}

// must be called synchronously in the drop handler, the browser clears
// dataTransfer once the handler returns
export function collectDropped(dataTransfer) {
  const entries = Array.from(dataTransfer.items || [])
    .filter(i => i.kind === 'file' && i.webkitGetAsEntry)
    .map(i => i.webkitGetAsEntry())
    .filter(e => e)
  const plain = Array.from(dataTransfer.files || [])

  return async () => {
    const files = []
    const folders = []
    if (entries.length === 0) {
      // no entry api, folders cannot be read and are skipped
      plain.filter(f => f.size > 0 || f.type).forEach(file => files.push({ file, path: file.name }))
      return { files, folders }
    }
    for (const entry of entries) {
      await walkEntry(entry, '', files, folders)
    }
    return { files, folders }
  }
}
