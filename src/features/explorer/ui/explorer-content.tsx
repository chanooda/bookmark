import { ExplorerContentHeader } from './explorer-content-header';

export const ExplorerContent = () => {
	return (
		<div className='flex h-full w-full flex-col overflow-auto'>
			<ExplorerContentHeader />
		</div>
	);
};
