const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 115;

export default function ImageSkeleton({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  style = {},
  loading = 'lazy',
  ...imgProps
}) {
  const { React } = window;
  const [loaded, setLoaded] = React.useState(false);

  if (!src) {
    return null;
  }

  const wrapperStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  const h = React.createElement;
  return h(
    'div',
    {
      className: `image-skeleton-wrapper ${loaded ? 'is-loaded' : ''} ${className}`.trim(),
      style: wrapperStyle,
    },
    h('div', { className: 'image-skeleton', 'aria-hidden': 'true' }),
    h('img', {
      className: `image-skeleton-img ${imgClassName}`.trim(),
      src,
      alt,
      loading,
      onLoad: () => setLoaded(true),
      ...imgProps,
    }),
  );
}
