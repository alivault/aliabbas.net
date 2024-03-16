'use client'

import Giscus from '@giscus/react'

export default function Comments() {
  return (
    <Giscus
      id="comments"
      repo="alivault/comments"
      repoId="R_kgDOLhC2kQ"
      category="General"
      categoryId="DIC_kwDOLhC2kc4CeApm"
      mapping="title"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="bottom"
      theme="preferred_color_scheme"
      lang="en"
      loading="lazy"
    />
  )
}
