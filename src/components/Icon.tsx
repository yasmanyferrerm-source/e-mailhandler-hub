import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'mail' | 'plus' | 'search' | 'archive' | 'trash' | 'back' | 'send' | 'pen' | 'sparkle'
  | 'refresh' | 'dot' | 'unread' | 'reply' | 'close' | 'users' | 'paperclip';

const paths: Record<IconName, (c: string) => React.ReactNode> = {
  mail: () => (<><Rect x="3" y="5" width="18" height="14" rx="3" /><Path d="M4 7l8 6 8-6" /></>),
  plus: () => <Path d="M12 5v14M5 12h14" />,
  search: () => (<><Circle cx="11" cy="11" r="7" /><Path d="M20 20l-3.5-3.5" /></>),
  archive: () => (<><Rect x="3" y="4" width="18" height="5" rx="1.5" /><Path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" /></>),
  trash: () => <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  back: () => <Path d="M15 18l-6-6 6-6" />,
  send: () => <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />,
  pen: () => (<><Path d="M12 20h9" /><Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
  sparkle: () => <Path d="M12 3l2.2 5.6L20 11l-5.8 2.4L12 19l-2.2-5.6L4 11l5.8-2.4z" />,
  refresh: () => <Path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />,
  dot: (c) => <Circle cx="12" cy="12" r="5" fill={c} />,
  unread: () => (<><Rect x="3" y="5" width="18" height="14" rx="3" /><Circle cx="18" cy="6" r="3" /></>),
  reply: () => <Path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 5 5v6" />,
  close: () => <Path d="M6 6l12 12M18 6L6 18" />,
  users: () => (<><Circle cx="9" cy="8" r="4" /><Path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 9M22 21a7 7 0 0 0-4-6.3" /></>),
  paperclip: () => <Path d="M21 11l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" />,
};

export function Icon({ name, size = 18, color = '#14171F', strokeWidth = 2 }: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {paths[name](color)}
    </Svg>
  );
}
