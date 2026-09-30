export const getBreadcrumb = (url: string): { title: string }[] => {
  const location = url.split('/').filter((item) => item.length)
  const res: { title: string }[] = []
  location.forEach((item) => {
    switch (item) {
      case 'appearance':
        res.push({ title: '系统' })
        res.push({ title: '外观' })
        break
    }
  })
  return res
}
