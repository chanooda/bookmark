import { useRef, useState } from 'react';

function GlobeIcon({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden='true'
			className={className}
			fill='none'
			stroke='currentColor'
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={1.5}
			viewBox='0 0 24 24'
		>
			<circle cx='12' cy='12' r='10' />
			<path d='M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' />
		</svg>
	);
}

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
	if (error) return <GlobeIcon className={globeClassName} />;
	return <img alt='' className={imgClassName} onError={() => setError(true)} src={src} />;
}
