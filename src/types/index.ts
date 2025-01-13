import React from 'react';
import { ReactHTMLElement } from 'react';

type HTMLElement = ReactHTMLElement<any>;

export type HTMLElementClickHandler = (e: React.MouseEvent<HTMLElement>) => void;

export interface HTMLAccessibilityProps {
	ariaHidden?: boolean;
	ariaLabel?: string;
	title?: string;
	role?: string;
	tabIndex?: number;
}

export type FetchNextPage = (nextPage: number) => Promise<void>;
