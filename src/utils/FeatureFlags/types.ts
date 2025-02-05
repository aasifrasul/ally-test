// types.ts
interface FeatureFlag {
	name: string;
	enabled: boolean;
	value?: any;
	rules?: {
		userGroups?: string[];
		percentage?: number;
	};
}
