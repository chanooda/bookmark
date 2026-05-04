import type { ChildrenProps } from '@chanooda/libs-react';

interface TopGridLayoutProps extends ChildrenProps {}

export const TopGridLayout = ({ children }: TopGridLayoutProps) => {
	return (
		<div className='grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
			{children}
		</div>
	);
};
