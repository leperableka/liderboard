import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  /** Called when the user clicks "Назад" — use to navigate to a safe screen. */
  onReset?: () => void;
  /** Passed as key so the boundary auto-resets when the screen changes. */
  screenKey?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console so it appears in Telegram WebView debug tools
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg)',
          gap: 16,
          padding: '0 32px',
          textAlign: 'center',
        }}
        role="alert"
      >
        <span style={{ fontSize: 48 }} aria-hidden="true">⚠️</span>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Что-то пошло не так
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
          Произошла непредвиденная ошибка. Попробуйте вернуться назад.
        </p>
        <button
          onClick={this.handleReset}
          style={{
            marginTop: 8,
            padding: '14px 32px',
            borderRadius: 14,
            border: 'none',
            background: 'var(--gold-grad)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            boxShadow: '0 4px 16px rgba(245,166,35,0.35)',
          }}
        >
          Назад
        </button>
      </div>
    );
  }
}
