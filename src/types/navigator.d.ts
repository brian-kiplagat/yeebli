interface Navigator {
  getAutoplayPolicy(
    type: 'mediaelement' | 'audiocontext'
  ): 'allowed' | 'disallowed' | 'allowed-muted';
}
