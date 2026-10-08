interface GoogleCredentialResponse {
  credential: string
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    use_fedcm_for_prompt?: boolean
  }): void
  renderButton(
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      width?: number
    },
  ): void
  disableAutoSelect(): void
}

interface YGWidgetEvents {
  onFetchDone?: (event: { query: string; totalResult: number }) => void
  onVideoChange?: (event: { video: string; trackNumber: number }) => void
  onError?: (event: { code: number }) => void
}

interface YGWidget {
  fetch(query: string, lang: string, accent?: string): void
  close(): void
  next(): void
  previous(): void
  replay(): void
}

interface Window {
  google?: { accounts: { id: GoogleAccountsId } }
  YG?: {
    Widget: new (
      id: string,
      options: {
        width?: number
        height?: number
        autoStart?: number
        components?: number
        backgroundColor?: string
        events?: YGWidgetEvents
      },
    ) => YGWidget
    setPartnerKey?: (key: string) => void
  }
  onYouglishAPIReady?: () => void
}
