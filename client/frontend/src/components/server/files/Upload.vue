<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Btn from '@/components/ui/Btn.vue'
import Icon from '@/components/ui/Icon.vue'
import UploadProgress from './UploadProgress.vue'
import { useUpload } from './upload.js'

const { t } = useI18n()

const props = defineProps({
  server: { type: Object, required: true },
  folder: { type: Boolean, default: () => false },
  hotkey: { type: String, default: () => undefined },
  path: { type: String, required: true }
})

const emit = defineEmits(['uploaded'])

const input = ref(null)
const { uploading, uploadState, upload } = useUpload(props.server, () => emit('uploaded'))

function trigger() {
  input.value.click()
}

function uploadFiles(event) {
  const files = Array.from(event.target.files).map(file => {
    return { file, path: file.webkitRelativePath || file.name }
  })
  upload(props.path, () => ({ files }))
}
</script>

<template>
  <div>
    <btn v-hotkey="hotkey" variant="icon" :tooltip="t(folder ? 'files.UploadFolder' : 'files.UploadFile')" @click="trigger()">
      <icon :name="folder ? 'folder-upload' : 'file-upload'" />
    </btn>
    <input ref="input" type="file" multiple :webkitdirectory="folder" @change="uploadFiles" />
    <upload-progress :uploading="uploading" :upload-state="uploadState" />
  </div>
</template>
