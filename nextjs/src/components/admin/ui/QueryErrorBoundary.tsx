'use client';

import { Component, type ReactNode } from 'react';

type Props = {
	children: ReactNode;
	/** Shows the children again when it changes, such as on another user or search */
	resetKey?: unknown;
	/** Stays above the error, such as the section's heading */
	heading?: ReactNode;
	/** Replaces the error's default padding */
	className?: string;
};

type State = { error: Error | null; resetKey: unknown };

/**
 * Shows the error of a failed query in place of its section. Convex's `useQuery` throws it while
 * rendering, which would otherwise take down the whole dashboard.
 */
export default class QueryErrorBoundary extends Component<Props, State> {
	state: State = { error: null, resetKey: this.props.resetKey };

	static getDerivedStateFromError(error: unknown): Partial<State> {
		return { error: error instanceof Error ? error : new Error(String(error)) };
	}

	static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
		return Object.is(props.resetKey, state.resetKey)
			? null
			: { error: null, resetKey: props.resetKey };
	}

	render() {
		const { error } = this.state;
		if (!error) return this.props.children;
		return (
			<>
				{this.props.heading}
				<div
					className={`text-error-600-400 flex flex-wrap items-center gap-3 text-sm ${this.props.className ?? 'p-4'}`}
					role="alert"
				>
					<span>{error.message}</span>
					<button
						type="button"
						className="btn btn-sm preset-tonal"
						onClick={() => this.setState({ error: null })}
					>
						Try again
					</button>
				</div>
			</>
		);
	}
}
