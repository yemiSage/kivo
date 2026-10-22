import type { SVGAttributes } from "react";
import {
  Add,
  ArrowDown2,
  ArrowLeft2,
  ArrowRight2,
  ArrowUp2,
  Bookmark,
  ClipboardText,
  CloseCircle,
  DocumentText,
  Edit2,
  Element4,
  ExportSquare,
  Folder2,
  FolderAdd,
  Gallery,
  Hashtag,
  Home2,
  InfoCircle,
  Link21,
  LogoutCurve,
  MagicStar,
  MessageText,
  Mobile,
  More,
  Refresh2,
  RowVertical,
  SearchNormal1,
  Setting2,
  Share,
  ShieldTick,
  SidebarLeft,
  TickCircle,
  Trash,
  User,
  UserAdd,
  VideoPlay,
  Warning2,
  Wifi,
  type Icon as IconsaxIcon,
} from "iconsax-reactjs";

/*
 * Single icon family for the whole app: Iconsax, Bulk variant.
 * Wrapped so every icon inherits currentColor and a consistent default size.
 */
export type IconProps = Omit<SVGAttributes<SVGElement>, "width" | "height"> & {
  size?: number;
  width?: number;
  height?: number;
  variant?: "Bulk" | "Bold" | "Linear";
};

function bulk(Icon: IconsaxIcon) {
  function Wrapped({ size, width, height, variant = "Bulk", ...rest }: IconProps) {
    return <Icon variant={variant} color="currentColor" size={size ?? width ?? height ?? 20} aria-hidden {...rest} />;
  }
  Wrapped.displayName = `Bulk(${Icon.displayName ?? "Icon"})`;
  return Wrapped;
}

export const HomeIcon = bulk(Home2);
export const FolderIcon = bulk(Folder2);
export const FolderAddIcon = bulk(FolderAdd);
export const PlusIcon = bulk(Add);
export const SearchIcon = bulk(SearchNormal1);
export const SettingsIcon = bulk(Setting2);
export const UserIcon = bulk(User);
export const UserAddIcon = bulk(UserAdd);
export const LinkIcon = bulk(Link21);
export const ImageIcon = bulk(Gallery);
export const VideoIcon = bulk(VideoPlay);
export const ArticleIcon = bulk(DocumentText);
export const PostIcon = bulk(MessageText);
export const ClipboardIcon = bulk(ClipboardText);
export const CheckIcon = bulk(TickCircle);
export const XIcon = bulk(CloseCircle);
export const TrashIcon = bulk(Trash);
export const ExternalIcon = bulk(ExportSquare);
export const ChevronLeftIcon = bulk(ArrowLeft2);
export const ChevronRightIcon = bulk(ArrowRight2);
export const ChevronDownIcon = bulk(ArrowDown2);
export const ChevronUpIcon = bulk(ArrowUp2);
export const RefreshIcon = bulk(Refresh2);
export const ShareIcon = bulk(Share);
export const SparkleIcon = bulk(MagicStar);
export const BookmarkIcon = bulk(Bookmark);
export const HashIcon = bulk(Hashtag);
export const LogoutIcon = bulk(LogoutCurve);
export const MobileIcon = bulk(Mobile);
export const ShieldIcon = bulk(ShieldTick);
export const SidebarIcon = bulk(SidebarLeft);
export const MoreIcon = bulk(More);
export const InfoIcon = bulk(InfoCircle);
export const WarningIcon = bulk(Warning2);
export const OfflineIcon = bulk(Wifi);
export const GridIcon = bulk(Element4);
export const ListIcon = bulk(RowVertical);
export const EditIcon = bulk(Edit2);

/** Platform-style share: arrow leaving a tray. */
export function ShareExportIcon({ size = 20, className }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M12 15V3m-4 4 4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>;
}
