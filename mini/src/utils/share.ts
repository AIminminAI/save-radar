export function shareToFriend(title: string, path: string = '/pages/index/index') {
  return { title, path, imageUrl: '/static/share-image.png' }
}

export function shareToTimeline(title: string) {
  return { title, imageUrl: '/static/share-image.png' }
}
