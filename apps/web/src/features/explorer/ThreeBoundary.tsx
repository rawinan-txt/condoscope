import { Component, type ReactNode } from 'react';

/** Catches 3D failures (chunk 404 after a redeploy, HDRI load error, GPU refusal) so the page falls back instead of going blank. */
export default class ThreeBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onError(): void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
