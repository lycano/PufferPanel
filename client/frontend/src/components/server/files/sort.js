import { computed, ref } from 'vue'

export function useFileSort(files) {
  const sortKey = ref('name')
  const sortAsc = ref(true)

  const sortedFiles = computed(() => {
    if (!Array.isArray(files.value)) return files.value
    return [...files.value].sort(sortFiles)
  })

  function compareNames(a, b) {
    const nameA = a.name.toLowerCase()
    const nameB = b.name.toLowerCase()
    if (nameA === nameB) return 0
    return nameA < nameB ? -1 : 1
  }

  // '..' first, then folders, then files
  function sortFiles(a, b) {
    if (a.name === '..') return -1
    if (b.name === '..') return 1
    if (a.isFile && !b.isFile) return 1
    if (!a.isFile && b.isFile) return -1
    let res = 0
    if (sortKey.value === 'size') res = (a.size || 0) - (b.size || 0)
    if (sortKey.value === 'modified') res = (a.modifyTime || 0) - (b.modifyTime || 0)
    if (res === 0) res = compareNames(a, b)
    return sortAsc.value ? res : -res
  }

  function setSort(key) {
    if (sortKey.value === key) {
      sortAsc.value = !sortAsc.value
    } else {
      sortKey.value = key
      sortAsc.value = true
    }
  }

  function sortClasses(key) {
    return ['sort', `sort-${key}`, sortKey.value === key ? 'active' : '']
  }

  function sortIcon() {
    return sortAsc.value ? 'up' : 'down'
  }

  function ariaSort(key) {
    if (sortKey.value !== key) return 'none'
    return sortAsc.value ? 'ascending' : 'descending'
  }

  return { sortKey, sortedFiles, setSort, sortClasses, sortIcon, ariaSort }
}
