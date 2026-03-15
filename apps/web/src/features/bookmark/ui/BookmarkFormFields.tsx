import type { Folder, Tag } from '@repo/types';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { useMemo } from 'react';
import { getFaviconUrl } from '@/shared/lib/url';
import { FaviconImg, FolderSelect } from '@/shared/ui';
import { TagSelector } from './TagSelector';

interface BookmarkFormFieldsProps {
	url: string;
	title: string;
	defaultDescription?: string;
	folderId: string | undefined;
	selectedTagIds: string[];
	folders: Folder[];
	tags: Tag[];
	onUrlChange: (url: string) => void;
	onTitleChange: (title: string, isManual: boolean) => void;
	onFolderChange: (id: string | undefined) => void;
	onTagToggle: (id: string) => void;
}

export function BookmarkFormFields({
	url,
	title,
	defaultDescription,
	folderId,
	selectedTagIds,
	folders,
	tags,
	onUrlChange,
	onTitleChange,
	onFolderChange,
	onTagToggle,
}: BookmarkFormFieldsProps) {
	const faviconUrl = useMemo(() => getFaviconUrl(url), [url]);

	return (
		<>
			<div className='flex flex-col gap-1.5'>
				<Label htmlFor='url'>URL *</Label>
				<div className='flex items-center gap-2'>
					{faviconUrl && (
						<FaviconImg
							globeClassName='h-5 w-5 text-muted-foreground/60'
							imgClassName='h-5 w-5 shrink-0 rounded'
							src={faviconUrl}
						/>
					)}
					<Input
						className='flex-1'
						id='url'
						onChange={(e) => onUrlChange(e.target.value)}
						placeholder='https://example.com'
						required
						type='url'
						value={url}
					/>
				</div>
			</div>
			<div className='flex flex-col gap-1.5'>
				<Label htmlFor='title'>제목 *</Label>
				<Input
					id='title'
					onChange={(e) => onTitleChange(e.target.value, true)}
					placeholder='제목'
					required
					value={title}
				/>
			</div>
			<div className='flex flex-col gap-1.5'>
				<Label htmlFor='description'>설명</Label>
				<Input
					defaultValue={defaultDescription}
					id='description'
					name='description'
					placeholder='설명 (선택)'
				/>
			</div>
			<div className='flex flex-col gap-1.5'>
				<Label>폴더</Label>
				<FolderSelect folders={folders} onChange={onFolderChange} value={folderId} />
			</div>
			{tags.length > 0 && (
				<div className='flex flex-col gap-1.5'>
					<Label>태그</Label>
					<TagSelector onToggle={onTagToggle} selectedTagIds={selectedTagIds} tags={tags} />
				</div>
			)}
		</>
	);
}
