import { FC, ReactNode } from 'react';
import { Spinner, SpinnerPlacement } from '../Spinner';
import styles from './styles.module.css';

interface LoadingBoundaryProps {
	loading?: boolean;
	children: ReactNode;
	fallback?: ReactNode;
	overlay?: boolean;
}

export const LoadingBoundary: FC<LoadingBoundaryProps> = ({
	loading = false,
	children,
	fallback,
	overlay = false,
}) => {
	if (!loading) {
		return <>{children}</>;
	}

	if (!overlay) {
		return fallback ?? <Spinner placement={SpinnerPlacement.CENTER} size={32} />;
	}

	return (
		<div className={styles['rc-loading-boundary']}>
			{children}
			<div className={styles['rc-loading-overlay']}>
				{fallback ?? <Spinner size={28} />}
			</div>
		</div>
	);
};
