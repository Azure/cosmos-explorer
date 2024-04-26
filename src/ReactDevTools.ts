if (window.parent !== window) {
  try {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = (window.parent as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  } catch {
    // No-op. We can throw here if the parent is not the same origin (such as in the Azure portal).
  }
}
