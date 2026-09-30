import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** フォールバック表示で使う領域名 (例: "日本地図") */
  label: string;
  /** この値が変わるとエラー状態を解除して再描画を試みる (例: 選択中の県や指標) */
  resetKey?: unknown;
  /** true ならページ全体を覆うフォールバックを表示する */
  fullPage?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
  resetKey: unknown;
}

/**
 * ウィジェット単位のエラーバウンダリ。
 * 1 つのパネルの描画エラーでダッシュボード全体が真っ白になるのを防ぐ。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: ErrorBoundaryState): Partial<ErrorBoundaryState> | null {
    // 入力が変わったら自動的に復帰を試みる
    return Object.is(props.resetKey, state.resetKey) ? null : { error: null, resetKey: props.resetKey };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label}]`, error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { label, fullPage } = this.props;
    return (
      <div
        role="alert"
        className={`${fullPage ? 'min-h-screen' : 'h-full min-h-[160px] rounded-2xl'} flex flex-col items-center justify-center gap-3 p-6 text-center bg-white/80 dark:bg-slate-900/80 border border-red-200/60 dark:border-red-900/40`}
      >
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">「{label}」の表示中にエラーが発生しました</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm break-words">{error.message}</p>
        <button
          type="button"
          onClick={fullPage ? () => window.location.reload() : this.reset}
          className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors"
        >
          {fullPage ? '再読み込み' : '再試行'}
        </button>
      </div>
    );
  }
}
