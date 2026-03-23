import { Globe } from 'lucide-react';
import { useRef, useState } from 'react';

interface FaviconImgProps {
	src: string;
	imgClassName?: string;
	globeClassName?: string;
}

export function FaviconImg({ src, imgClassName, globeClassName }: FaviconImgProps) {
	const [error, setError] = useState(false);
	const prevSrc = useRef(src);
	if (prevSrc.current !== src) {
		prevSrc.current = src;
		setError(false);
	}
	if (error) return <Globe aria-hidden='true' className={globeClassName} strokeWidth={1.5} />;
	return <img alt='' className={imgClassName} onError={() => setError(true)} src={src} />;
}
