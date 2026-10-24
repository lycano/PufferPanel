import { ref } from 'vue'

// the user preference wins over the panel default, the toggle only lasts until the view is left
export function useViewMode(events, config, userSettings) {
  let viewModeToggled = false
  let unbindSettings

  function defaultViewMode() {
    const preferred = userSettings.get('fileView')
    if (preferred === 'list' || preferred === 'grid') return preferred
    return config.defaultFileView === 'list' ? 'list' : 'grid'
  }

  const viewMode = ref(defaultViewMode())

  function otherViewMode() {
    return viewMode.value === 'grid' ? 'list' : 'grid'
  }

  function toggleViewMode() {
    viewModeToggled = true
    viewMode.value = otherViewMode()
  }

  // user settings load in the background on a fresh page load
  function registerViewModeReload() {
    unbindSettings = events.on('userSettingsReloaded', () => {
      if (!viewModeToggled) viewMode.value = defaultViewMode()
    })
  }

  function deregisterViewModeReload() {
    if (unbindSettings) unbindSettings()
  }

  return { viewMode, otherViewMode, toggleViewMode, registerViewModeReload, deregisterViewModeReload }
}
