import type { KeyboardEvent } from 'react';
import { useToast } from './ToastContext';
import { AnimatePresence, motion } from 'framer-motion';

const toastStyles = {
	success: 'bg-green-600',
	error: 'bg-red-600',
	warning: 'bg-yellow-500',
	info: 'bg-blue-600',
} as const;

export default function ToastContainer() {
	const { toasts, removeToast } = useToast();

	return (
		<div
			className="fixed top-5 right-5 z-50 flex flex-col gap-3"
			role="region"
			aria-label="Notifications"
		>
			<AnimatePresence>
				{toasts.map((toast) => (
					<motion.div
						key={toast.id}
						initial={{ opacity: 0, y: -20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, x: 20, scale: 0.95 }}
						transition={{ duration: 0.2 }}
						role="alert"
						aria-live="polite"
						className={`
                            px-4 py-3 rounded-xl shadow-lg text-white 
                            cursor-pointer hover:shadow-xl transition-shadow
                            ${toastStyles[toast.type]}
                        `}
						onClick={() => removeToast(toast.id)}
						onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								removeToast(toast.id);
							}
						}}
						tabIndex={0}
					>
						<div className="flex items-center justify-between gap-3">
							<span>{toast.message}</span>
							<button
								className="opacity-70 hover:opacity-100 text-lg leading-none"
								aria-label="Close notification"
							>
								×
							</button>
						</div>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}
