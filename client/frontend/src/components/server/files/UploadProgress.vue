<script setup>
import { useI18n } from 'vue-i18n'
import Overlay from '@/components/ui/Overlay.vue'

const { t } = useI18n()

defineProps({
  uploading: { type: Boolean, required: true },
  uploadState: { type: Object, default: () => null }
})
</script>

<template>
  <overlay :model-value="uploading" class="file-upload-progress" :title="t('files.UploadProgress')">
    <div v-if="uploadState.state === 'preparing'">
      <div class="progress">
        <span v-text="t('files.PreparingUpload')" />
        <progress />
      </div>
    </div>
    <div v-if="uploadState.state === 'create folders'">
      <div class="progress">
        <span v-text="t('files.CreatingFolders')" />
        <progress />
      </div>
    </div>
    <div v-if="uploadState.state === 'upload files'">
      <div class="upload-file-count" v-text="t('files.CurrentlyUploading', { current: uploadState.current, total: uploadState.total })" />
      <div class="upload-file-name" v-text="uploadState.files[uploadState.current].name" />
      <div class="progress">
        <span v-text="t('files.Current')" />
        <progress
          :max="uploadState.files[uploadState.current].size"
          :value="uploadState.files[uploadState.current].progress"
        />
      </div>
      <div class="progress">
        <span v-text="t('files.Total')" />
        <progress
          :max="uploadState.files.reduce((a, b) => a + b.size, 0)"
          :value="uploadState.files.reduce((a, b) => a + b.progress, 0)"
        />
      </div>
    </div>
  </overlay>
</template>
