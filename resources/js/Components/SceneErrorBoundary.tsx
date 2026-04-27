import { Component, ErrorInfo, ReactNode } from 'react';

type Props = {
    children: ReactNode;
    fallbackTitle?: string;
};

type State = {
    error: Error | null;
};

/**
 * Catches errors thrown inside a React Three Fiber canvas (model load
 * failures, WebGL context lost, etc.) so the page doesn't go blank.
 */
export class SceneErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // eslint-disable-next-line no-console
        console.error('Scene error:', error, info);
    }

    handleReset = () => {
        this.setState({ error: null });
    };

    render() {
        if (this.state.error) {
            return (
                <div className="flex h-full items-center justify-center bg-gray-50 p-6">
                    <div className="max-w-md text-center">
                        <h2 className="text-base font-semibold text-gray-900">
                            {this.props.fallbackTitle ??
                                "Couldn't render this tour"}
                        </h2>
                        <p className="mt-2 text-sm text-gray-700">
                            {this.state.error.message ||
                                'The 3D scene failed to load.'}
                        </p>
                        <p className="mt-3 text-xs text-gray-500">
                            Common causes: corrupt or unsupported model file,
                            missing texture assets, or browser WebGL issue.
                            Open the browser devtools console for details.
                        </p>
                        <button
                            type="button"
                            onClick={this.handleReset}
                            className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
