import type { ChildrenProps } from '@chanooda/libs-react';

interface FolderGridLayoutProps extends ChildrenProps {}

export const FolderGridLayout = ({ children }: FolderGridLayoutProps) => {
	return <div className='grid h-full w-full grid-cols-3 grid-rows-3 gap-2'>{children}</div>;
};
