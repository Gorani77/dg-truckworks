import { Component } from 'react'
import type { ReactNode } from 'react'

type SceneBoundaryProps = { children: ReactNode; fallback: ReactNode }

export class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
