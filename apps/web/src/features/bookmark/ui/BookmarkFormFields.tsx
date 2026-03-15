import type { Folder, Tag } from '@bookmark/types';
import { Input } from '@bookmark/ui/components/input';
import { Label } from '@bookmark/ui/components/label';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();

	return (
		<>
			<div className='flex flex-col gap-1.5'>
				<Label htmlFor='url'>{t('bookmark.url')} *</Label>
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
				<Label htmlFor='title'>{t('bookmark.title')} *</Label>
				<Input
					id='title'
					onChange={(e) => onTitleChange(e.target.value, true)}
					placeholder={t('bookmark.titlePlaceholder')}
					required
					value={title}
				/>
			</div>
			<div className='flex flex-col gap-1.5'>
				<Label htmlFor='description'>{t('bookmark.description')}</Label>
				<Input
					defaultValue={defaultDescription}
					id='description'
					name='description'
					placeholder={t('bookmark.descriptionPlaceholder')}
				/>
			</div>
			<div className='flex flex-col gap-1.5'>
				<Label>{t('bookmark.folder')}</Label>
				<FolderSelect folders={folders} onChange={onFolderChange} value={folderId} />
			</div>
			{tags.length > 0 && (
				<div className='flex flex-col gap-1.5'>
					<Label>{t('bookmark.tag')}</Label>
					<TagSelector onToggle={onTagToggle} selectedTagIds={selectedTagIds} tags={tags} />
				</div>
			)}
		</>
	);
}
