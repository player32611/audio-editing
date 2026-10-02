declare module '@ffmpeg-installer/ffmpeg' {
  const installer: {
    path: string
    version: string
    url: string
  }
  export default installer
}

declare module '@ffprobe-installer/ffprobe' {
  const installer: {
    path: string
    version: string
    url: string
  }
  export default installer
}
